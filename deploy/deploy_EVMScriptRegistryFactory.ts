import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;
    const deployed = await deploy('EVMScriptRegistryFactory', {
        from: deployer,
      });
      if(deployed.newlyDeployed){
          console.log(`EVMScriptRegistryFactory deployed at ${deployed.address}`);
      }
  };
  export default deployFunc;
  deployFunc.tags = ['EVMScriptRegistryFactory'];