// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMynt {
    function burn(address _account, uint256 _amount) external;
}

/**
 * @title FixedRateConverter
 * @dev Standalone contract for sunsetting (by converting the MYNT to SOV at a fixed rate)
 */
contract FixedRateConverter {
    address public admin;
    address public immutable myntContractAddress;
    address public immutable sovContractAddress;
    uint256 public immutable conversionFixedRate;

    event SetAdmin(address indexed sender, address indexed oldAdmin, address indexed newAdmin);
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

        myntContractAddress = _myntContractAddress;
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
     * @dev function to convert MYNT to SOV
     *
     * @param _myntAmount MYNT amount that will be converted.
     */
    function convert(uint256 _myntAmount) external {
        require(_myntAmount > 0, "Error: amount must be > 0");

        uint256 senderMyntBalance = IERC20(myntContractAddress).balanceOf(msg.sender);
        require(senderMyntBalance >= _myntAmount, "Error: amount exceeds MYNT balance");

        uint256 totalConvertedSov = convertAmount(_myntAmount);

        bool success = IERC20(myntContractAddress).transferFrom(msg.sender, address(this), _myntAmount);
        require(success, "MYNT Token transfer was not successful");

        success = IERC20(sovContractAddress).transfer(msg.sender, totalConvertedSov);
        require(success, "SOV Token transfer was not successful");

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
        bool success = IERC20(sovContractAddress).transfer(recipient, sovBalance);
        require(success, "SOV Token transfer was not successful");

        emit SovWithdrawn(recipient, sovBalance);
    }

    function _setAdmin(address _newAdmin) internal {
        require(_newAdmin != address(0), "Invalid address");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit SetAdmin(msg.sender, oldAdmin, admin);
    }
}
