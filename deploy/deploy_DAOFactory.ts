import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const kernelDeployment = await deployments.get("Kernel");
  const aclDeployment = await deployments.get("ACL");
  const evmScriptRegistryFactoryDeployment = await deployments.get("EVMScriptRegistryFactory");
  const deployed = await deploy("DAOFactory", {
    from: deployer,
    args: [kernelDeployment.address, aclDeployment.address, evmScriptRegistryFactoryDeployment.address],
  });
  if (deployed.newlyDeployed) {
    console.log(`DAOFactory deployed at ${deployed.address}`);
  }
};
export default deployFunc;
deployFunc.tags = ["DAOFactory"];
deployFunc.dependencies = ["Kernel", "ACL", "EVMScriptRegistryFactory"];
