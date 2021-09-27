import * as fs from 'fs';
import path from 'path';
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction, DeploymentsExtension, DeployOptions, DeployResult } from "hardhat-deploy/types";
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

type FundrasingApps = {
  reserve: Reserve;
  presale: BalanceRedirectPresale;
  marketMaker: MarketMaker;
  tap: TapDisabled;
  controller: Controller;
  bondedTokenManager: TokenManager;
};


// Taken from https://github.com/aragon/aragonOS/blob/master/scripts/deploy-daofactory.js
const createDAO = async (deployments:DeploymentsExtension, deployer:string): Promise<string> => {
  const kernelDeployment = await deployments.get('Kernel');
  const aclDeployment = await deployments.get('ACL');
  const daoFactoryDeployment = await deployments.get('DAOFactory');


  const kernel = Kernel__factory.connect(kernelDeployment.address, ethers.provider.getSigner());
  await kernel.initialize(aclDeployment.address, deployer);


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
  return daoAddress;
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

const setupFundraisingPermission = async (
  deployer: string,
  fundraisingApps: FundrasingApps,
  daoAddress: Address,
) => {
  const { marketMaker, presale } = fundraisingApps;
  const dao = Kernel__factory.connect(daoAddress, await ethers.getSigner(deployer));
  const acl = ACL__factory.connect(await dao.acl(), await ethers.getSigner(deployer));

  const ANY_ENTITY = await acl.ANY_ENTITY();

  const owner = deployer;

  await createPermissions(
    acl,
    [marketMaker.address, presale.address],
    fundraisingApps.bondedTokenManager.address,
    await fundraisingApps.bondedTokenManager.MINT_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.marketMaker.address,
    fundraisingApps.bondedTokenManager.address,
    await fundraisingApps.bondedTokenManager.BURN_ROLE(),
    owner,
  );
  // reserve
  await createPermission(
    acl,
    owner,
    fundraisingApps.reserve.address,
    await fundraisingApps.reserve.SAFE_EXECUTE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.reserve.address,
    await fundraisingApps.reserve.ADD_PROTECTED_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.marketMaker.address,
    fundraisingApps.reserve.address,
    await fundraisingApps.reserve.TRANSFER_ROLE(),
    owner,
  );
  // presale
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.presale.address,
    await fundraisingApps.presale.OPEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.presale.address,
    await fundraisingApps.presale.REDUCE_BENEFICIARY_PCT_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.presale.address,
    await fundraisingApps.presale.CONTRIBUTE_ROLE(),
    owner,
  );
  // market maker
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.OPEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.UPDATE_BENEFICIARY_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.UPDATE_FEES_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.ADD_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.REMOVE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.UPDATE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.OPEN_BUY_ORDER_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    await fundraisingApps.marketMaker.OPEN_SELL_ORDER_ROLE(),
    owner,
  );
  // controller
  await createPermission(
    acl,
    owner,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.UPDATE_BENEFICIARY_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.UPDATE_FEES_ROLE(),
    owner,
  );
  // ADD_COLLATERAL_TOKEN_ROLE is handled later [after collaterals have been added]
  await createPermission(
    acl,
    owner,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.REMOVE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.UPDATE_COLLATERAL_TOKEN_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    owner,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.OPEN_PRESALE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    fundraisingApps.presale.address,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.OPEN_TRADING_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.CONTRIBUTE_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.OPEN_BUY_ORDER_ROLE(),
    owner,
  );
  await createPermission(
    acl,
    ANY_ENTITY,
    fundraisingApps.controller.address,
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
    fundraisingApps.controller.address,
    await fundraisingApps.controller.ADD_COLLATERAL_TOKEN_ROLE(),
    deployer,
  );

  await fundraisingApps.controller.addCollateralToken(collateralTokenAddress, 0, 0, reserveRatio, slippage, 0, 0);
};

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy} = deployments;
  const thisNetwork = hre.network.name;
  console.log(`deployer address: ${deployer}`);
  console.log(`deploying at network: ${thisNetwork}`);

  let sovAddress;
  let zeroAddress;

  if (thisNetwork == "hardhat" || thisNetwork == "localhost"){
    
    await deployments.run([
      "CollateralToken",
      "BondedToken",
      "BancorFormula", 
      "BalanceRedirectPresale",
      "MarketMaker",
      "Reserve",
      "TapDisabled",
      "Controller",
      "TokenManager",
      "Kernel",
      "ACL",
      "EVMScriptRegistryFactory",
      "DAOFactory"
    ],
    {writeDeploymentsToFiles: true},
    );
  

    sovAddress =  (await deployments.get('CollateralToken')).address;
    zeroAddress = (await deployments.get('BondedToken')).address;

   }
  else {
    const contractsFile = fs.readFileSync(path.resolve(__dirname,`../scripts/contractInteractions/${thisNetwork}_contracts.json`))
    const contracts = JSON.parse(contractsFile.toString());
    sovAddress = contracts.SOV;
    zeroAddress = contracts.ZERO;
    console.log(`reusing collateral token at address ${sovAddress}`);
    console.log(`reusing bondend token at address ${zeroAddress}`);

    await deployments.run(
      [
      "BancorFormula", 
      "BalanceRedirectPresale",
      "MarketMaker",
      "Reserve",
      "TapDisabled",
      "Controller",
      "TokenManager",
      "Kernel",
      "ACL",
      "EVMScriptRegistryFactory",
      "DAOFactory"
    ], 
    {writeDeploymentsToFiles: true},
    );
  }

  // Setup DAO and ACL
  const daoAddress = await createDAO(deployments,deployer);

  // Setup fundraisingApps
  
  const bancorFormulaDeployment = await deployments.get('BancorFormula')
  const reserveDeployment = await deployments.get('Reserve');
  const presaleDeployment = await deployments.get('BalanceRedirectPresale');
  const marketMakerDeployment = await deployments.get('MarketMaker');
  const tapDisabledDeployment = await deployments.get('TapDisabled');
  const controllerDeployment = await deployments.get('Controller');
  const tokenManagerDeployment = await deployments.get('TokenManager');
  const fundraisingApps:FundrasingApps = {
    reserve: await Reserve__factory.connect(reserveDeployment.address, ethers.provider.getSigner()),
    presale: await BalanceRedirectPresale__factory.connect(presaleDeployment.address, ethers.provider.getSigner()),
    marketMaker: await MarketMaker__factory.connect(marketMakerDeployment.address, ethers.provider.getSigner()),
    tap: await TapDisabled__factory.connect(tapDisabledDeployment.address, ethers.provider.getSigner()),
    controller: await Controller__factory.connect(controllerDeployment.address, ethers.provider.getSigner()),
    bondedTokenManager: await TokenManager__factory.connect(
        tokenManagerDeployment.address,
        ethers.provider.getSigner()),
  }

  const bondedToken = await MiniMeToken__factory.connect(zeroAddress, ethers.provider.getSigner());
  await bondedToken.changeController(tokenManagerDeployment.address);

  console.log(`BondedToken at ${bondedToken.address} controller changed to ${tokenManagerDeployment.address}`);

  const tokenManager = await TokenManager__factory.connect(tokenManagerDeployment.address, ethers.provider.getSigner());
  await tokenManager.initialize(daoAddress, zeroAddress, true, 0);

  console.log(`TokenManager at ${tokenManager.address} initialized`);


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
    daoAddress,
    fundraisingApps.controller.address,
    fundraisingApps.marketMaker.address,
    fundraisingApps.bondedTokenManager.address,
    fundraisingApps.reserve.address,
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
    fundraisingApps.controller.address,
    fundraisingApps.bondedTokenManager.address,
    bancorFormulaDeployment.address,
    fundraisingApps.reserve.address,
    params.owner,
    params.batchBlocks,
    0,
    0,
  );

  console.log(`MarketMaker initialized`);

  await fundraisingApps.controller.initialize(
    daoAddress,
    fundraisingApps.presale.address,
    fundraisingApps.marketMaker.address,
    fundraisingApps.reserve.address,
    fundraisingApps.tap.address,
    [],
  );

  console.log(`Controller initialized`);

  await fundraisingApps.reserve.initialize(daoAddress);

  console.log(`Reserve initialized`);

  await setupFundraisingPermission(deployer, fundraisingApps, daoAddress);

  console.log("Setup fundraising permission done");

  await setupCollateral(deployer, fundraisingApps, daoAddress, sovAddress, params.reserveRatio, params.slippage);

  console.log("Setup collateral done");

  const guiConfig = {
    BANCOR_FORMULA: bancorFormulaDeployment.address,
    BONDING_CURVE_TREASURY: fundraisingApps.reserve.address,
    FUNDRAISING: fundraisingApps.controller.address,
    MARKET_MAKER: fundraisingApps.marketMaker.address,
    TOKEN_ANT: sovAddress,
    TOKEN_ANJ: zeroAddress,
  };
  console.log(JSON.stringify(guiConfig, null, 2));

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;
deployFunc.tags = ['everything'];
deployFunc.id = "deployed_system"; // id required to prevent reexecution

/*deployFunc.dependencies = [
  'CollateralToken',
  'BondedToken'
];*/
