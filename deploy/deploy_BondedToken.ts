import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ethers } from "hardhat";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;
    const MiniMeTokenFactory = await deployments.get('MiniMeTokenFactory');
    const deployed = await deploy('BondedToken', {
        from: deployer,
        contract: "MiniMeToken",
        args: [MiniMeTokenFactory.address, ethers.constants.AddressZero, 0, "Bonded Token", 18, "BOND", true],
      });
    if(deployed.newlyDeployed){
        console.log(`BondedToken deployed at ${deployed.address}`);
    }
  };
  export default deployFunc;
  deployFunc.tags = ['BondedToken'];
  deployFunc.dependencies = ['MiniMeTokenFactory'];