import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getProperConfig } from "./utils";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const thisNetwork = hre.network.name;
  const { parameters, mockPresale } = getProperConfig(hre);

  console.log(`deployer address: ${deployer}`);
  console.log(`deploying at network: ${thisNetwork}`);

  const presaleToDeploy = mockPresale ? "MockedBalancedRedirectPresale" : "BalanceRedirectPresale";
  const contractsToDeploy = [
    "BancorFormula",
    presaleToDeploy,
    "MarketMaker",
    "Reserve",
    "TapDisabled",
    "Controller",
    "Kernel",
    "ACL",
    "EVMScriptRegistryFactory",
    "DAOFactory",
  ];

  if (!parameters.collateralTokenAddress) {
    contractsToDeploy.push("CollateralToken");
  }

  if (!parameters.bondedTokenAddress) {
    contractsToDeploy.push("BondedToken");
  }

  //all contracts have to be deployed in a same deployments.run() because otherwise the tests don't work well and can't find deployments(hardhat-deploy issue)
  await deployments.run(contractsToDeploy, { writeDeploymentsToFiles: true });

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;
deployFunc.tags = ["everything"];
deployFunc.id = "deployed_system"; // id required to prevent reexecution
