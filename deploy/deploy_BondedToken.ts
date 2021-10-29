import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const deployed = await deploy("BondedToken", {
    from: deployer,
    contract: "MockedContinuousToken",
    args: ["Bonded Token", "BOND", 18, 0],
  });
  if (deployed.newlyDeployed) {
    console.log(`BondedToken deployed at ${deployed.address}`);
  }
};
export default deployFunc;
deployFunc.tags = ["BondedToken"];
