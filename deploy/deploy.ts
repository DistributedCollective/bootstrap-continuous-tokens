import { ethers } from "hardhat";
import { DeployFunction, DeployOptions, DeployResult } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  ACL__factory,
  BalanceRedirectPresale__factory,
  Controller__factory,
  MarketMaker__factory,
  MiniMeToken__factory,
  TokenManager__factory,
  Kernel__factory,
} from "../typechain";
import { DAOFactory__factory } from "../typechain/factories/DAOFactory__factory";

const PPM = 1e6;
const PCT_BASE = 1e18;
const DAYS = 24 * 3600;
const MONTHS = 30 * DAYS;
const START_DATE = new Date().getTime() + MONTHS;
const BENEFICIARY_PCT = 200000;
const PRESALE_PERIOD = 14 * DAYS;
const PRESALE_EXCHANGE_RATE = 1 * PPM;
const RESERVE_RATIOS = [(PPM * 10) / 100, (PPM * 1) / 100];
const BATCH_BLOCKS = 10;
const SLIPPAGES = [10 * PCT_BASE, 15 * PCT_BASE];

type Deploy = (name: string, options: DeployOptions) => Promise<DeployResult>;

type TokenConfig = {
  factoryAddress: string;
  name: string;
  symbol: string;
};

const deployContract = async (deploy: Deploy, deployer: string, artifactName: string) => {
  const deployed = await deploy(artifactName, {
    from: deployer,
  });
  console.log(`${artifactName} deployed at ${deployed.address}`);
  return deployed;
};

const deployERC20Token = async (deploy: Deploy, deployer: string, config: TokenConfig) => {
  const token = await deploy("MiniMeToken", {
    from: deployer,
    args: [config.factoryAddress, ethers.constants.AddressZero, 0, config.name, 18, config.symbol, true],
  });
  console.log(`MiniMetoken ${config.name} deployed at ${token.address}`);
  return token;
};

// Taken from https://github.com/aragon/aragonOS/blob/master/scripts/deploy-daofactory.js
const deployDAO = async (deploy: Deploy, deployer: string) => {
  const kernelDeployment = await deploy("Kernel", {
    from: deployer,
    args: [false],
  });
  const aclDeployment = await deployContract(deploy, deployer, "ACL");
  const evmScriptRegistryFactoryDeployment = await deployContract(deploy, deployer, "EVMScriptRegistryFactory");

  const kernel = Kernel__factory.connect(kernelDeployment.address, ethers.provider.getSigner());
  await kernel.initialize(aclDeployment.address, deployer);

  //const ACL = ACL__factory.connect(aclDeployment.address, ethers.provider.getSigner());
  //ACL.initialize(deployer);
  const daoFactoryDeployment = await deploy("DAOFactory", {
    from: deployer,
    args: [kernelDeployment.address, aclDeployment.address, evmScriptRegistryFactoryDeployment.address],
  });
  console.log(`DAO Factory deployed at ${daoFactoryDeployment.address}`);

  const daoFactory = DAOFactory__factory.connect(daoFactoryDeployment.address, ethers.provider.getSigner());
  const newDaoTx = await (await daoFactory.newDAO(deployer)).wait();

  const daoAddress = newDaoTx.logs
    .map(log => {
      if (log.address === daoFactoryDeployment.address) {
        const parsed = daoFactory.interface.parseLog(log);
        return parsed.args.dao;
      }
    })
    .find(dao => dao !== undefined);
  return daoAddress;
};

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const daoAddress = await deployDAO(deploy, deployer);

  const bancorFormulaDeployment = await deployContract(deploy, deployer, "BancorFormula");
  const presaleDeployment = await deployContract(deploy, deployer, "BalanceRedirectPresale");
  const marketMakerDeployment = await deployContract(deploy, deployer, "MarketMaker");
  const reserveDeployment = await deployContract(deploy, deployer, "Reserve");
  const tapDisabledDeployment = await deployContract(deploy, deployer, "TapDisabled");
  const controllerDeployment = await deployContract(deploy, deployer, "Controller");
  const tokenManagerDeployment = await deployContract(deploy, deployer, "TokenManager");

  const tokenFactory = await deployContract(deploy, deployer, "MiniMeTokenFactory");
  const collateralToken = await deployERC20Token(deploy, deployer, {
    factoryAddress: tokenFactory.address,
    name: "Collateral Token",
    symbol: "COLL",
  });
  const bondedTokenDeployment = await deployERC20Token(deploy, deployer, {
    factoryAddress: tokenFactory.address,
    name: "Bonded Token",
    symbol: "BOND",
  });

  const bondedToken = await MiniMeToken__factory.connect(bondedTokenDeployment.address, ethers.provider.getSigner());
  await bondedToken.changeController(tokenManagerDeployment.address);

  const tokenManager = await TokenManager__factory.connect(tokenManagerDeployment.address, ethers.provider.getSigner());
  await tokenManager.initialize(bondedTokenDeployment.address, true, 0);

  const params = {
    owner: deployer,
    collateralToken: collateralToken.address,
    bondedToken: bondedTokenDeployment.address,
    period: PRESALE_PERIOD,
    openDate: START_DATE,
    exchangeRate: PRESALE_EXCHANGE_RATE,
    mintingForBeneficiaryPct: BENEFICIARY_PCT,
    reserveRatio: RESERVE_RATIOS,
    batchBlocks: BATCH_BLOCKS,
    slippage: SLIPPAGES,
  };

  const presale = BalanceRedirectPresale__factory.connect(presaleDeployment.address, await ethers.getSigner(deployer));
  await presale.initialize(
    controllerDeployment.address,
    marketMakerDeployment.address,
    tokenManagerDeployment.address,
    reserveDeployment.address,
    params.owner,
    params.collateralToken,
    params.period,
    params.exchangeRate,
    params.mintingForBeneficiaryPct,
    params.openDate,
  );

  console.log(`Presale initialized`);

  const marketMaker = MarketMaker__factory.connect(marketMakerDeployment.address, await ethers.getSigner(deployer));
  await marketMaker.initialize(
    daoAddress,
    controllerDeployment.address,
    tokenManagerDeployment.address,
    bancorFormulaDeployment.address,
    reserveDeployment.address,
    params.owner,
    params.batchBlocks,
    0,
    0,
  );

  console.log(`MarketMaker initialized`);

  const controller = Controller__factory.connect(controllerDeployment.address, await ethers.getSigner(deployer));
  await controller.initialize(
    daoAddress,
    presaleDeployment.address,
    marketMakerDeployment.address,
    reserveDeployment.address,
    tapDisabledDeployment.address,
    [],
  );

  console.log(`Controller initialized`);

  // TODO: Permissions

  const dao = Kernel__factory.connect(daoAddress, await ethers.getSigner(deployer));
  const ACL = ACL__factory.connect(await dao.acl(), await ethers.getSigner(deployer));
  ACL.getPermissionManager(marketMakerDeployment, tokenManager.MINT_ROLE())
  await ACL.grantPermission(
    marketMakerDeployment.address,
    bondedTokenDeployment.address,
    await tokenManager.MINT_ROLE(),
  );

  // ACL.revokePermission(address(this), _app, _permission);
  // ACL.setPermissionManager(_manager, _app, _permission);

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_system"; // id required to prevent reexecution
