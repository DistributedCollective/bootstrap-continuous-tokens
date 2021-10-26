pragma solidity 0.4.24;

interface IMarketMaker {
    // solhint-disable-next-line
  function getCollateralToken(address _collateral) external view returns (bool, uint256, uint256, uint32, uint256);
}
