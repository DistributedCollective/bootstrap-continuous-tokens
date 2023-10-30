// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMynt {
    function burn(address _account, uint256 _amount) external;
}

/**
 * @title FixedRateConverter
 * @dev Standalone contract for sunsetting (by converting the MYNT to SOV at a fixed rate)
 */
contract FixedRateConverter {
    using SafeERC20 for IERC20;

    address public admin;
    address public myntContractAddress;
    address public sovContractAddress;
    uint256 public immutable conversionFixedRate;

    event SetAdmin(address indexed sender, address indexed oldAdmin, address indexed newAdmin);
    event SetMyntContractAddress(
        address indexed sender,
        address indexed oldMyntContractAddress,
        address indexed newMyntContractAddreess
    );
    event SovWithdrawn(address indexed recipient, uint256 amountWithdrawn);
    event Convert(address indexed sender, uint256 myntSent, uint256 sovReceived);

    /// @dev TODO: Check for restrictions in this contract.
    modifier onlyAdmin() {
        require(msg.sender == admin, "unauthorized");
        _;
    }

    constructor(
        address _myntContractAddress,
        address _sovContractAddress,
        uint256 _conversionFixedRate
    ) {
        _setAdmin(msg.sender);
        setMyntContractAddress(_myntContractAddress);

        sovContractAddress = _sovContractAddress;
        conversionFixedRate = _conversionFixedRate;
    }

    /**
     * @notice Public function to set admin account.
     *
     * @param _newAdmin new admin address.
     * only admin can perform this action.
     */
    function setAdmin(address _newAdmin) public onlyAdmin {
        _setAdmin(_newAdmin);
    }

    /**
     * @notice Set the MYNT contract address.
     *
     * only admin can perform this action.
     *
     * @param _newMyntContractAddress The new MYNT contract address.
     * */
    function setMyntContractAddress(address _newMyntContractAddress) public onlyAdmin {
        emit SetMyntContractAddress(msg.sender, myntContractAddress, _newMyntContractAddress);
        myntContractAddress = _newMyntContractAddress;
        
    }

    /**
     * @dev function to convert MYNT to SOV
     *
     * @param _myntAmount MYNT amount that will be converted.
     */
    function convert(uint256 _myntAmount) external {
        require(_myntAmount > 0, "Error: amount must be > 0");

        uint256 senderMyntBalance = IERC20(myntContractAddress).balanceOf(msg.sender);
        require(senderMyntBalance >= _myntAmount, "Error: amount exceeds MYNT balance");

        uint256 totalConvertedSov = convertAmount(_myntAmount);

        IERC20(myntContractAddress).safeTransferFrom(msg.sender, address(this), _myntAmount);
        IERC20(sovContractAddress).safeTransfer(msg.sender, totalConvertedSov);

        IMynt(myntContractAddress).burn(address(this), _myntAmount);

        emit Convert(msg.sender, _myntAmount, totalConvertedSov);
    }

    /**
     * @dev external function to calculate how many SOV will be converted with the given MYNT amount
     *
     * @param _myntAmount total MYNT to be converted to SOV.
     * @return converted SOV amount.
     */
    function convertAmount(uint256 _myntAmount) public view returns (uint256) {
        return (_myntAmount * conversionFixedRate) / 1e18;
    }

    /**
     * @dev external function to calculate how many MYNT that can be converted based on the current contract's SOV Balance
     *
     * @return max amount of MYNT that can be converted.
     */
    function convertMax() external view returns (uint256) {
        uint256 sovBalance = IERC20(sovContractAddress).balanceOf(address(this));
        return (sovBalance * 1e18) / conversionFixedRate;
    }

    /**
     * @dev withdraw the whole SOV balance of this contract
     * The whole SOV will be withdrawn to the admin account.
     * only admin can perform this action.
     *
     */
    function withdrawSov() external onlyAdmin {
        uint256 sovBalance = IERC20(sovContractAddress).balanceOf(address(this));
        address recipient = msg.sender;
        IERC20(sovContractAddress).safeTransfer(recipient, sovBalance);

        emit SovWithdrawn(recipient, sovBalance);
    }

    /** Internal function */
    /**
     * @dev internal function set the admin account.
     * @param _newAdmin new admin address
     */
    function _setAdmin(address _newAdmin) internal {
        require(_newAdmin != address(0), "Invalid address");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit SetAdmin(msg.sender, oldAdmin, admin);
    }
}
