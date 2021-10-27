import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const deployed = await deploy("ACLConfigurator", {
    from: deployer,
  });
  if (deployed.newlyDeployed) {
    console.log(`ACLConfigurator deployed at ${deployed.address}`);
  }
};
export default deployFunc;
deployFunc.tags = ["ACLConfigurator"];
