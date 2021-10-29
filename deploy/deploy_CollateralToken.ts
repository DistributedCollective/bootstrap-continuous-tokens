import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const deployed = await deploy("CollateralToken", {
    from: deployer,
    contract: "ContinuousToken",
    args: ["Collateral Token", "COLL", 18, 0],
  });
  if (deployed.newlyDeployed) {
    console.log(`CollateralToken deployed at ${deployed.address}`);
  }
};

export default deployFunc;
deployFunc.tags = ["CollateralToken"];
deployFunc.dependencies = ["MiniMeTokenFactory"];
