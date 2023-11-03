import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy, get } = deployments;
  const deployedMynt = await get("Mynt");
  const deployedSov = await get("Sov");
  const multisig = await get("Multisig");
  const deployed = await deploy("FixedRateConverter", {
    from: deployer,
    log: true,
    args: [
      deployedMynt.address,
      deployedSov.address,
      4723550439442834 // sov rate per 1 Mynt; 0.004723550439442834
    ],
  });
  if (deployed.newlyDeployed) {
    console.log(`FixedRateConverter deployed at ${deployed.address}`);

    console.log(`Set the Exchequer Multisig as Admin`);
    const fixedRateConverterContract = await ethers.getContractAt("FixedRateConverter", deployed.address);
    await fixedRateConverterContract.setAdmin(multisig.address);
  }
};

deployFunc.tags = ["FixedRateConverter"];
export default deployFunc;