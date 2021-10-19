pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/UnsafeAragonApp.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/os/contracts/lib/math/SafeMath64.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";
import "./ContinuousToken.sol";
import "@ablack/fundraising-shared-interfaces/contracts/IAragonFundraisingController.sol";

import "@ablack/fundraising-shared-interfaces/contracts/IPresale.sol";

import "./lib/IMarketMaker.sol";

contract BalanceRedirectPresale is IsContract, UnsafeAragonApp, IPresale {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using SafeMath64 for uint64;

    /**
    Hardcoded constants to save gas
    bytes32 public constant OPEN_ROLE                   = keccak256("OPEN_ROLE");
    bytes32 public constant REDUCE_BENEFICIARY_PCT_ROLE = keccak256("REDUCE_BENEFICIARY_PCT_ROLE");
    bytes32 public constant CONTRIBUTE_ROLE             = keccak256("CONTRIBUTE_ROLE");
    */
    bytes32 public constant OPEN_ROLE = 0xefa06053e2ca99a43c97c4a4f3d8a394ee3323a8ff237e625fba09fe30ceb0a4;
    bytes32 public constant REDUCE_BENEFICIARY_PCT_ROLE =
        0x2738f3f227143b7fbb9720e93e2e5b36d7a15966e130b49f1582c6432d949aa9;
    bytes32 public constant CONTRIBUTE_ROLE = 0x9ccaca4edf2127f20c425fdd86af1ba178b9e5bee280cd70d88ac5f6874c4f07;

    uint256 public constant PPM = 1000000; // 0% = 0 * 10 ** 4; 1% = 1 * 10 ** 4; 100% = 100 * 10 ** 4

    string private constant ERROR_CONTRACT_IS_EOA = "PRESALE_CONTRACT_IS_EOA";
    string private constant ERROR_INVALID_BENEFICIARY = "PRESALE_INVALID_BENEFICIARY";
    string private constant ERROR_INVALID_CONTRIBUTE_TOKEN = "PRESALE_INVALID_CONTRIBUTE_TOKEN";
    string private constant ERROR_INVALID_EXCHANGE_RATE = "PRESALE_INVALID_EXCHANGE_RATE";
    string private constant ERROR_INVALID_OPEN_DATE = "PRESALE_INVALID_OPEN_DATE";
    string private constant ERROR_TIME_PERIOD_ZERO = "PRESALE_TIME_PERIOD_ZERO";
    string private constant ERROR_INVALID_TIME_PERIOD = "PRESALE_INVALID_TIME_PERIOD";
    string private constant ERROR_INVALID_PCT = "PRESALE_INVALID_PCT";
    string private constant ERROR_INVALID_STATE = "PRESALE_INVALID_STATE";
    string private constant ERROR_INVALID_CONTRIBUTE_VALUE = "PRESALE_INVALID_CONTRIBUTE_VALUE";
    string private constant ERROR_INSUFFICIENT_BALANCE = "PRESALE_INSUFFICIENT_BALANCE";
    string private constant ERROR_INSUFFICIENT_ALLOWANCE = "PRESALE_INSUFFICIENT_ALLOWANCE";
    string private constant ERROR_TOKEN_TRANSFER_REVERTED = "PRESALE_TOKEN_TRANSFER_REVERTED";
    string private constant ERROR_NO_REFUNDS = "PRESALE_NO_REFUNDS";

    enum State {
        Pending, // presale is idle and pending to be started
        Funding, // presale has started and contributors can purchase tokens
        Finished, // presale period is over, but it hasn't been closed yet
        Closed // presale has been closed and trading has been open
    }

    IAragonFundraisingController public controller;
    IMarketMaker public marketMaker;
    ContinuousToken public bondedToken;
    address public reserve;
    address public beneficiary;
    ERC20 internal erc20ContribToken;

    uint64 public period;
    uint256 public exchangeRate;
    uint256 public mintingForBeneficiaryPct;
    uint64 public openDate;

    bool public isClosed;
    uint256 public totalRaised;
    uint256 public totalSold;

    event SetOpenDate(uint64 date);
    event ReduceBeneficiatyPct(uint256 pct);
    event Close();
    event Contribute(address indexed contributor, uint256 value, uint256 amount);

    /***** external function *****/

    /**
     * @notice Initialize presale
     * @param _controller               The address of the controller contract
     * @param _marketMaker              The address of the market maker contract
     * @param _bondedToken              The address of the bonded token
     * @param _reserve                  The address of the reserve [pool] contract
     * @param _beneficiary              The address of the beneficiary [to whom a percentage of the raised funds is be to be sent]
     * @param _erc20ContribToken        The address of the token to be used to contribute
     * @param _period                   The period within which to accept contribution for that presale
     * @param _exchangeRate             The exchangeRate [= 1/price] at which [bonded] tokens are to be purchased for that presale [in PPM]
     * @param _openDate                 The date upon which that presale is to be open [ignored if 0]
     */
    function initialize(
        IKernel _kernel,
        IAragonFundraisingController _controller,
        IMarketMaker _marketMaker,
        ContinuousToken _bondedToken,
        address _reserve,
        address _beneficiary,
        ERC20 _erc20ContribToken,
        uint64 _period,
        uint256 _exchangeRate,
        uint256 _mintingForBeneficiaryPct,
        uint64 _openDate
    ) external onlyInit {
        require(isContract(_controller), ERROR_CONTRACT_IS_EOA);
        require(isContract(_marketMaker), ERROR_CONTRACT_IS_EOA);
        require(isContract(_bondedToken), ERROR_CONTRACT_IS_EOA);
        require(isContract(_reserve), ERROR_CONTRACT_IS_EOA);
        require(_beneficiary != address(0), ERROR_INVALID_BENEFICIARY);
        require(isContract(_erc20ContribToken), ERROR_INVALID_CONTRIBUTE_TOKEN);
        require(_exchangeRate > 0, ERROR_INVALID_EXCHANGE_RATE);
        require(_mintingForBeneficiaryPct < PPM, ERROR_INVALID_PCT);

        initialized();

        controller = _controller;
        marketMaker = _marketMaker;
        bondedToken = _bondedToken;
        reserve = _reserve;
        beneficiary = _beneficiary;
        erc20ContribToken = _erc20ContribToken;
        exchangeRate = _exchangeRate;
        mintingForBeneficiaryPct = _mintingForBeneficiaryPct;

        setKernel(_kernel);

        _setPeriod(_period);

        if (_openDate != 0) {
            _setOpenDate(_openDate);
        }
    }

    /**
     * @notice Set presale open date
     * @param _date New date to be set
     */
    function setOpenDate(uint64 _date) external auth(OPEN_ROLE) {
        _setOpenDate(_date);
    }

    /**
     * @notice Set presale duration
     * @param _period New duration to be set
     */
    function setPeriod(uint64 _period) external auth(OPEN_ROLE) {
        _setPeriod(_period);
    }

    /**
     * @notice Reduce pre-minting for beneficiary percentage to `_pct`
     * @param _pct New percentage to be set
     */
    function reduceBeneficiaryPct(uint64 _pct) external auth(REDUCE_BENEFICIARY_PCT_ROLE) {
        require(_pct < mintingForBeneficiaryPct, ERROR_INVALID_PCT);

        mintingForBeneficiaryPct = _pct;

        emit ReduceBeneficiatyPct(_pct);
    }

    /**
     * @notice Open presale [enabling users to contribute]
     */
    function open() external auth(OPEN_ROLE) {
        _setOpenDate(getTimestamp64());
    }

    /**
     * @notice Contribute to the presale up to `@tokenAmount(self.erc20ContribToken(): address, _value)`
     * @param _contributor The address of the contributor
     * @param _value       The amount of contribution token to be spent
     */
    function contribute(address _contributor, uint256 _value) external payable nonReentrant auth(CONTRIBUTE_ROLE) {
        require(state() == State.Funding, ERROR_INVALID_STATE);
        require(msg.value == 0, ERROR_INVALID_CONTRIBUTE_VALUE);
        require(_value > 0, ERROR_INVALID_CONTRIBUTE_VALUE);
        require(erc20ContribToken.balanceOf(_contributor) >= _value, ERROR_INSUFFICIENT_BALANCE);
        require(erc20ContribToken.allowance(_contributor, address(this)) >= _value, ERROR_INSUFFICIENT_ALLOWANCE);

        // (contributor) ~~~> contribution tokens ~~~> (presale)
        _transfer(erc20ContribToken, _contributor, address(this), _value);

        // (mint ✨) ~~~> project tokens ~~~> (contributor)
        uint256 tokensToSell = contributionToTokens(_value);
        totalRaised = totalRaised.add(_value);
        totalSold = totalSold.add(tokensToSell);
        bondedToken.mint(_contributor, tokensToSell);

        emit Contribute(_contributor, _value, tokensToSell);
    }

    /**
     * @notice Does nothing. Interface compliance.
     */
    function refund(address, uint256) external isInitialized {
        revert(ERROR_NO_REFUNDS);
    }

    /**
     * @notice Close presale and open trading
     */
    function close() external nonReentrant isInitialized {
        require(state() == State.Finished, ERROR_INVALID_STATE);

        isClosed = true;

        // mint new tokens for beneficiary
        uint256 tokensToMint;
        if (mintingForBeneficiaryPct > 0) {
            // No need for SafeMath, already checked mintingForBeneficiaryPct < PPM
            tokensToMint = totalSold.mul(mintingForBeneficiaryPct) / (PPM - mintingForBeneficiaryPct);
            bondedToken.mint(beneficiary, tokensToMint);
        }

        // (presale) ~~~> contribution tokens ~~~> (reserve)
        (, , , uint32 reserveRatio, ) = marketMaker.getCollateralToken(address(erc20ContribToken));
        uint256 tokensForReserve = (totalRaised.mul(PPM) / (PPM - mintingForBeneficiaryPct)).mul(reserveRatio) / PPM;
        _transfer(erc20ContribToken, address(this), reserve, tokensForReserve);

        // (presale) ~~~> contribution tokens ~~~> (beneficiary)
        uint256 fundsForBeneficiary = erc20ContribToken.balanceOf(address(this));
        if (fundsForBeneficiary > 0) {
            _transfer(erc20ContribToken, address(this), beneficiary, fundsForBeneficiary);
        }

        // open trading
        controller.openTrading();

        emit Close();
    }

    function contributionToken() public view returns (address) {
        return address(erc20ContribToken);
    }

    /***** public view functions *****/

    /**
     * @notice Computes the amount of [bonded] tokens that would be purchased for `@tokenAmount(self.contributionToken(): address, _value)`
     * @param _value The amount of contribution tokens to be used in that computation
     */
    function contributionToTokens(uint256 _value) public view isInitialized returns (uint256) {
        return _value.mul(exchangeRate).div(PPM);
    }

    /**
     * @notice Returns the current state of that presale
     */
    function state() public view isInitialized returns (State) {
        if (openDate == 0 || openDate > getTimestamp64()) {
            return State.Pending;
        }

        if (isClosed) {
            return State.Closed;
        }

        if (_timeSinceOpen() >= period) {
            return State.Finished;
        }

        return State.Funding;
    }

    /***** internal functions *****/

    function _timeSinceOpen() internal view returns (uint64) {
        if (openDate == 0) {
            return 0;
        } else {
            return getTimestamp64().sub(openDate);
        }
    }

    function _setOpenDate(uint64 _date) internal {
        require(state() == State.Pending, ERROR_INVALID_STATE);
        require(_date >= getTimestamp64(), ERROR_INVALID_OPEN_DATE);

        openDate = _date;

        emit SetOpenDate(_date);
    }

    function _setPeriod(uint64 _period) internal {
        require(_period > 0, ERROR_TIME_PERIOD_ZERO);
        require(openDate == 0 || openDate.add(_period) > getTimestamp64(), ERROR_INVALID_TIME_PERIOD);
        period = _period;
    }

    function _transfer(
        ERC20 _token,
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        if (_from == address(this)) {
            require(_token.safeTransfer(_to, _amount), ERROR_TOKEN_TRANSFER_REVERTED);
        } else {
            require(_token.safeTransferFrom(_from, _to, _amount), ERROR_TOKEN_TRANSFER_REVERTED);
        }
    }
}
