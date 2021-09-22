import { BigNumber } from "ethers";
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
  Reserve,
  BalanceRedirectPresale,
  MarketMaker,
  TapDisabled,
  Controller,
  TokenManager,
  Reserve__factory,
  TapDisabled__factory,
  ACL,
} from "../typechain";
import { DAOFactory__factory } from "../typechain/factories/DAOFactory__factory";

const PPM = BigNumber.from(1e6);
const PCT_BASE = BigNumber.from("1000000000000000000");
const DAYS = 24 * 3600;
const MONTHS = 30 * DAYS;
const START_DATE = new Date().getTime() + MONTHS;
const BENEFICIARY_PCT = 200000;
const PRESALE_PERIOD = 14 * DAYS;
const PRESALE_EXCHANGE_RATE = PPM;
const RESERVE_RATIO = PPM.mul(10).div(100);
const BATCH_BLOCKS = 10;
const SLIPPAGE = PCT_BASE.mul(10);

type Address = string;
type Deploy = (name: string, options: DeployOptions) => Promise<DeployResult>;

type TokenConfig = {
  factoryAddress: Address;
  name: string;
  symbol: string;
};

export type FundrasingApps = {
  reserve: Reserve;
  reserveAddress: Address;
  presale: BalanceRedirectPresale;
  presaleAddress: Address;
  marketMaker: MarketMaker;
  marketMakerAddress: Address;
  tap: TapDisabled;
  tapAddress: Address;
  controller: Controller;
  controllerAddress: Address;
  bondedTokenManager: TokenManager;
  bondedTokenManagerAddress: Address;
};

export const deployContract = async (deploy: Deploy, deployer: string, artifactName: string) => {
  const deployed = await deploy(artifactName, {
    from: deployer,
  });
  console.log(`${artifactName} deployed at ${deployed.address}`);
  return deployed;
};

export const deployERC20Token = async (deploy: Deploy, deployer: string, config: TokenConfig) => {
  const token = await deploy(config.name, {
    from: deployer,
    contract: "MiniMeToken",
    args: [config.factoryAddress, ethers.constants.AddressZero, 0, config.name, 18, config.symbol, true],
  });
  console.log(`MiniMetoken ${config.name} deployed at ${token.address}`);
  return token;
};

// Taken from https://github.com/aragon/aragonOS/blob/master/scripts/deploy-daofactory.js
export const createDAO = async (deploy: Deploy, deployer: string): Promise<[string, string]> => {
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

  const aclAddress = await kernel.acl();

  const dao = ACL__factory.connect(aclAddress, ethers.provider.getSigner());
  await dao.createPermission(deployer, kernel.address, await kernel.APP_MANAGER_ROLE(), deployer);
  return [daoAddress, aclAddress];
};

export const deployContracts = async (
  deploy: Deploy,
  deployer: string,
  zeroAddress: Address,
): Promise<FundrasingApps> => {
  const presaleDeployment = await deployContract(deploy, deployer, "BalanceRedirectPresale");
  const marketMakerDeployment = await deployContract(deploy, deployer, "MarketMaker");
  const reserveDeployment = await deployContract(deploy, deployer, "Reserve");
  const tapDisabledDeployment = await deployContract(deploy, deployer, "TapDisabled");
  const controllerDeployment = await deployContract(deploy, deployer, "Controller");
  const tokenManagerDeployment = await deployContract(deploy, deployer, "TokenManager");

  const bondedToken = await MiniMeToken__factory.connect(zeroAddress, ethers.provider.getSigner());
  await bondedToken.changeController(tokenManagerDeployment.address);

  console.log(`BondedToken at ${bondedToken.address} controller changed to ${tokenManagerDeployment.address}`);

  const tokenManager = await TokenManager__factory.connect(tokenManagerDeployment.address, ethers.provider.getSigner());
  await tokenManager.initialize(zeroAddress, true, 0);

  console.log(`TokenManager at ${tokenManager.address} initialized`);

  return {
    reserve: await Reserve__factory.connect(reserveDeployment.address, ethers.provider.getSigner()),
    reserveAddress: reserveDeployment.address,
    presale: await BalanceRedirectPresale__factory.connect(presaleDeployment.address, ethers.provider.getSigner()),
    presaleAddress: presaleDeployment.address,
    marketMaker: await MarketMaker__factory.connect(marketMakerDeployment.address, ethers.provider.getSigner()),
    marketMakerAddress: marketMakerDeployment.address,
    tap: await TapDisabled__factory.connect(tapDisabledDeployment.address, ethers.provider.getSigner()),
    tapAddress: tapDisabledDeployment.address,
    controller: await Controller__factory.connect(controllerDeployment.address, ethers.provider.getSigner()),
    controllerAddress: controllerDeployment.address,
    bondedTokenManager: await TokenManager__factory.connect(
      tokenManagerDeployment.address,
      ethers.provider.getSigner(),
    ),
    bondedTokenManagerAddress: tokenManagerDeployment.address,
  };
};

export const getSOVAddress = async (deploy: Deploy, deployer: string, tokenFactoryAddress: Address) => {
  // FIXME: This shouldn't require a deployment
  const collateralToken = await deployERC20Token(deploy, deployer, {
    factoryAddress: tokenFactoryAddress,
    name: "Collateral Token",
    symbol: "COLL",
  });

  return collateralToken.address;
};

export const getZeroAddress = async (deploy: Deploy, deployer: string, tokenFactoryAddress: Address) => {
  // FIXME: This shouldn't require a deployment
  const bondedTokenDeployment = await deployERC20Token(deploy, deployer, {
    factoryAddress: tokenFactoryAddress,
    name: "Bonded Token",
    symbol: "BOND",
  });

  return bondedTokenDeployment.address;
};

const createPermissions = async (
  acl: ACL,
  entities: string[],
  app: string,
  role: string,
  manager: string,
): Promise<void> => {
  await acl.createPermission(entities[0], app, role, manager);
  console.log(`Permission created: entity ${entities[0]} | app ${app} | role ${role} | mananager ${manager}`);
  for (let i = 1; i < entities.length; i++) {
    await acl.grantPermission(entities[i], app, role);
    console.log(`Permission granted: entity ${entities[i]} | app ${app} | role ${role} | mananager ${manager}`);
  }
};

const createPermission = async (acl: ACL, entity: string, app: string, role: string, manager: string): Promise<void> =>
  createPermissions(acl, [entity], app, role, manager);

export const setupFundraisingPermission = async (
  deployer: string,
  fundraisingApps: FundrasingApps,
  daoAddress: Address,
) => {
  const { marketMakerAddress, presaleAddress } = fundraisingApps;
  const dao = Kernel__factory.connect(daoAddress, await ethers.getSigner(deployer));
  const acl = ACL__factory.connect(await dao.acl(), await ethers.getSigner(deployer));

  const ANY_ENTITY = await acl.ANY_ENTITY();

  const owner = deployer;

  await createPermissions(
    acl,
    [marketMakerAddress, presaleAddress],
    fundraisingApps.bondedTokenManager.address,
    await fundraisingApps.bondedTokenManager.MINT_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.marketMakerAddress,
    fundraisingApps.bondedTokenManagerAddress,
    await fundraisingApps.bondedTokenManager.BURN_ROLE(),
    owner,
  );
  // reserve
  await createPermission(
    acl,
    owner,
    fundraisingApps.reserveAddress,
    await fundraisingApps.reserve.SAFE_EXECUTE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.reserveAddress,
    await fundraisingApps.reserve.ADD_PROTECTED_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.marketMakerAddress,
    fundraisingApps.reserveAddress,
    await fundraisingApps.reserve.TRANSFER_ROLE(),
    owner,
  );
  // presale
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.presaleAddress,
    await fundraisingApps.presale.OPEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.presaleAddress,
    await fundraisingApps.presale.REDUCE_BENEFICIARY_PCT_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.presaleAddress,
    await fundraisingApps.presale.CONTRIBUTE_ROLE(),
    owner,
  );
  // market maker
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.OPEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.UPDATE_BENEFICIARY_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.UPDATE_FEES_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.ADD_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.REMOVE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.UPDATE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.OPEN_BUY_ORDER_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controllerAddress,
    fundraisingApps.marketMakerAddress,
    await fundraisingApps.marketMaker.OPEN_SELL_ORDER_ROLE(),
    owner,
  );
  // controller
  await createPermission(
    acl,
    owner,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.UPDATE_BENEFICIARY_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.UPDATE_FEES_ROLE(),
    owner,
  );
  // ADD_COLLATERAL_TOKEN_ROLE is handled later [after collaterals have been added]
  // createPermission(acl, _owner, _fundraisingApps.controllerAddress, _fundraisingApps.controller.ADD_COLLATERAL_TOKEN_ROLE(), _owner);
  await createPermission(
    acl,
    owner,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.REMOVE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.UPDATE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.OPEN_PRESALE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.presaleAddress,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.OPEN_TRADING_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.CONTRIBUTE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.OPEN_BUY_ORDER_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.OPEN_SELL_ORDER_ROLE(),
    owner,
  );
};

export const setupCollateral = async (
  deployer: string,
  fundraisingApps: FundrasingApps,
  daoAddress: Address,
  collateralTokenAddress: Address,
  reserveRatio: BigNumber,
  slippage: BigNumber,
): Promise<void> => {
  const dao = Kernel__factory.connect(daoAddress, await ethers.getSigner(deployer));
  const acl = ACL__factory.connect(await dao.acl(), await ethers.getSigner(deployer));
  await createPermission(
    acl,
    deployer,
    fundraisingApps.controllerAddress,
    await fundraisingApps.controller.ADD_COLLATERAL_TOKEN_ROLE(),
    deployer,
  );

  await fundraisingApps.controller.addCollateralToken(collateralTokenAddress, 0, 0, reserveRatio, slippage, 0, 0);
};

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  // Setup helpers
  const tokenFactory = await deployContract(deploy, deployer, "MiniMeTokenFactory");
  const sovAddress = await getSOVAddress(deploy, deployer, tokenFactory.address);
  const zeroAddress = await getZeroAddress(deploy, deployer, tokenFactory.address);

  // Setup DAO and ACL
  const [daoAddress] = await createDAO(deploy, deployer);
  // Setup fundraisingApps
  const { address: bancorFormulaAddress } = await deployContract(deploy, deployer, "BancorFormula");
  const fundraisingApps = await deployContracts(deploy, deployer, zeroAddress);

  const {
    presaleAddress,
    controllerAddress,
    marketMakerAddress,
    bondedTokenManagerAddress,
    reserveAddress,
    tapAddress,
  } = fundraisingApps;

  const params = {
    owner: deployer,
    collateralToken: sovAddress,
    bondedToken: zeroAddress,
    period: PRESALE_PERIOD,
    openDate: START_DATE,
    exchangeRate: PRESALE_EXCHANGE_RATE,
    mintingForBeneficiaryPct: BENEFICIARY_PCT,
    reserveRatio: RESERVE_RATIO,
    batchBlocks: BATCH_BLOCKS,
    slippage: SLIPPAGE,
  };

  await fundraisingApps.presale.initialize(
    controllerAddress,
    marketMakerAddress,
    bondedTokenManagerAddress,
    reserveAddress,
    params.owner,
    params.collateralToken,
    params.period,
    params.exchangeRate,
    params.mintingForBeneficiaryPct,
    params.openDate,
  );

  console.log(`Presale initialized`);

  await fundraisingApps.marketMaker.initialize(
    daoAddress,
    controllerAddress,
    bondedTokenManagerAddress,
    bancorFormulaAddress,
    reserveAddress,
    params.owner,
    params.batchBlocks,
    0,
    0,
  );

  console.log(`MarketMaker initialized`);

  await fundraisingApps.controller.initialize(
    daoAddress,
    presaleAddress,
    marketMakerAddress,
    reserveAddress,
    tapAddress,
    [],
  );

  console.log(`Controller initialized`);

  await fundraisingApps.reserve.initialize(daoAddress);

  console.log(`Reserve initialized`);

  await setupFundraisingPermission(deployer, fundraisingApps, daoAddress);

  console.log("Setup fundraising permission done");

  await setupCollateral(deployer, fundraisingApps, daoAddress, sovAddress, params.reserveRatio, params.slippage);

  console.log("Setup collateral done");

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;
deployFunc.tags = [
  "MiniMeTokenFactory",
  "MiniMeToken",
  "ACL",
  "EVMScriptRegistryFactory",
  "DAOFactory",
  "BancorFormula",
  "BalanceRedirectPresale",
  "MarketMaker",
  "Reserve",
  "TapDisabled",
  "Controller",
  "TokenManager",
  "BondedToken",
];

deployFunc.id = "deployed_system"; // id required to prevent reexecution
