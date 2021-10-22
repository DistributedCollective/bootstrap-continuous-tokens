import { DeployFunction } from "hardhat-deploy/types";
import { initialize } from "../deploy/initialize";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const thisNetwork = hre.network.name;
  const sConfig = JSON.stringify(hre.network.config);
  const config = JSON.parse(sConfig);
  const { deployTokens, mockPresale } = config;

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

  if (deployTokens) {
    contractsToDeploy.push("CollateralToken","BondedToken");
  }

  //all contracts have to be deployed in a same deployments.run() because otherwise the tests don't work well and can't find deployments(hardhat-deploy issue)
  await deployments.run(contractsToDeploy, { writeDeploymentsToFiles: true });

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;
deployFunc.tags = ["everything"];
deployFunc.id = "deployed_system"; // id required to prevent reexecution
