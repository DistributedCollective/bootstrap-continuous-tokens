pragma solidity 0.8.19;

contract StaticPriceFormula {
    // SOV_BALANCE_SNAPSHOT is the bonding curve reserve's SOV balance
    uint256 public constant SOV_BALANCE_SNAPSHOT = 231727313599607376661098;

    // MYNT_SUPPLY_SNAPSHOT is the total supply of mynt token
    uint256 public constant MYNT_SUPPLY_SNAPSHOT = 49057867925919878933673404;

    /**
     * Calculate purchase return amount that always return 0 value.
     * Will accept 4 parameters to support backward compatibility with bancor formula.
     * https://github.com/AragonBlack/fundraising/blob/master/apps/bancor-formula/contracts/BancorFormula.sol
     * @param _supply              token total supply
     * @param _connectorBalance    total connector balance
     * @param _connectorWeight     connector weight, represented in ppm, 1-1000000
     * @param _depositAmount       deposit amount, in connector token
     *
     * @return static 0 value.
     */
    function calculatePurchaseReturn(
        uint256 _supply,
        uint256 _connectorBalance,
        uint32 _connectorWeight,
        uint256 _depositAmount
    ) public pure returns (uint256) {
        return 0;
    }

    /**
     * Calculate sale return amount based on the Current MYNT supply.
     * Will accept 4 parameters to support backward compatibility with bancor formula.
     *
     * https://github.com/AragonBlack/fundraising/blob/master/apps/bancor-formula/contracts/BancorFormula.sol
     * @param _supply              token total supply
     * @param _connectorBalance    total connector balance
     * @param _connectorWeight     connector weight, represented in ppm, 1-1000000
     * @param _sellAmount       sell amount, in the token itself
     *
     * @return formula = _sellAmount * SOV_BALANCE_SNAPSHOT / MYNT_SUPPLY_SNAPSHOT
     */
    function calculateSaleReturn(
        uint256 _supply,
        uint256 _connectorBalance,
        uint32 _connectorWeight,
        uint256 _sellAmount
    ) public pure returns (uint256) {
        return (_sellAmount * SOV_BALANCE_SNAPSHOT) / MYNT_SUPPLY_SNAPSHOT;
    }
}
