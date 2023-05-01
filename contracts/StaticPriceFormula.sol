pragma solidity 0.8.19;

contract StaticPriceFormula {
  uint256 public constant PRECISION = 1e18;
  uint256 public constant STATIC_PRICE = 49057867925919878933673404;

  function calculatePurchaseReturn(uint256 _supply, uint256 _connectorBalance, uint32 _connectorWeight, uint256 _depositAmount) public pure returns (uint256) {
    return 0;
  }

  function calculateSaleReturn(uint256 _supply, uint256 _connectorBalance, uint32 _connectorWeight, uint256 _sellAmount) public pure returns (uint256) {
    return _sellAmount * STATIC_PRICE / PRECISION;
  }
}