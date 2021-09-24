import * as fs from 'fs';
import path from 'path';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ethers } from "hardhat";
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;
    const thisNetwork = hre.network.name;
    const MiniMeTokenFactory = await deployments.get('MiniMeTokenFactory');
    const deployed = await deploy('CollateralToken', {
        from: deployer,
        contract: "MiniMeToken",
        args: [MiniMeTokenFactory.address, ethers.constants.AddressZero, 0, "Collateral Token", 18, "COLL", true],
      });
    if(deployed.newlyDeployed){
        console.log(`CollateralToken deployed at ${deployed.address}`);    
    }
    
  };

  export default deployFunc;
  deployFunc.tags = ['CollateralToken'];
  deployFunc.dependencies = ['MiniMeTokenFactory'];