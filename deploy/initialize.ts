import { BigNumber, Signer } from "ethers";
import { DeploymentsExtension } from "hardhat-deploy/types";
import { HardhatEthersHelpers, HardhatRuntimeEnvironment } from "hardhat/types";
import {
  ACL,
  ACLConfigurator,
  ACLConfigurator__factory,
  ACL__factory,
  BalanceRedirectPresale,
  BalanceRedirectPresale__factory,
  Controller,
  Controller__factory,
  Kernel__factory,
  MarketMaker,
  MarketMaker__factory,
  Reserve,
  Reserve__factory,
  TapDisabled,
  TapDisabled__factory,
} from "../typechain";
import { DAOFactory__factory } from "../typechain/factories/DAOFactory__factory";
import { GAS_LIMIT_PATCH, getProperConfig, waitForTxConfirmation } from "./utils";

type FundrasingApps = {
  reserve: Reserve;
  presale: BalanceRedirectPresale;
  marketMaker: MarketMaker;
  tap: TapDisabled;
  controller: Controller;
  aclConfigurator: ACLConfigurator;
};

const getSigner = (ethers: typeof import("ethers/lib/ethers") & HardhatEthersHelpers) => ethers.provider.getSigner();

// Taken from https://github.com/aragon/aragonOS/blob/master/scripts/deploy-daofactory.js
const createDAO = async (deployments: DeploymentsExtension, deployer: string, signer: Signer): Promise<string> => {
  const kernelDeployment = await deployments.get("Kernel");
  const aclDeployment = await deployments.get("ACL");
  const daoFactoryDeployment = await deployments.get("DAOFactory");

  const kernel = Kernel__factory.connect(kernelDeployment.address, signer);
  await waitForTxConfirmation(kernel.initialize(aclDeployment.address, deployer));

  const daoFactory = DAOFactory__factory.connect(daoFactoryDeployment.address, signer);
  const newDaoTx = await waitForTxConfirmation(daoFactory.newDAO(deployer, { gasLimit: GAS_LIMIT_PATCH }));

  const daoAddress = newDaoTx.logs
    .map(log => {
      if (log.address === daoFactoryDeployment.address) {
        const parsed = daoFactory.interface.parseLog(log);
        return parsed.args.dao;
      }
    })
    .find(dao => dao !== undefined);

  const aclAddress = await kernel.acl();

  const dao = ACL__factory.connect(aclAddress, signer);
  await waitForTxConfirmation(
    dao.createPermission(deployer, kernel.address, await kernel.APP_MANAGER_ROLE(), deployer, {
      gasLimit: GAS_LIMIT_PATCH,
    }),
  );
  return daoAddress;
};

const createPermissions = async (
  acl: ACL,
  entities: string[],
  app: string,
  role: string,
  manager: string,
): Promise<void> => {
  await waitForTxConfirmation(acl.createPermission(entities[0], app, role, manager, { gasLimit: GAS_LIMIT_PATCH }));
  console.log(`Permission created: entity ${entities[0]} | app ${app} | role ${role} | mananager ${manager}`);
  for (let i = 1; i < entities.length; i++) {
    await waitForTxConfirmation(acl.grantPermission(entities[i], app, role, { gasLimit: GAS_LIMIT_PATCH }));
    console.log(`Permission granted: entity ${entities[i]} | app ${app} | role ${role} | mananager ${manager}`);
  }
};

const createPermission = async (acl: ACL, entity: string, app: string, role: string, manager: string): Promise<void> =>
  createPermissions(acl, [entity], app, role, manager);

const setupFundraisingPermission = async (
  deployer: string,
  fundraisingApps: FundrasingApps,
  daoAddress: string,
  signer: Signer,
) => {
  const dao = Kernel__factory.connect(daoAddress, signer);
  const acl = ACL__factory.connect(await dao.acl(), signer);

  await waitForTxConfirmation(
    acl.grantPermission(fundraisingApps.aclConfigurator.address, acl.address, await acl.CREATE_PERMISSIONS_ROLE()),
  );

  await waitForTxConfirmation(
    fundraisingApps.aclConfigurator.setupFundraisingPermissions(
      await acl.address,
      deployer,
      fundraisingApps.reserve.address,
      fundraisingApps.presale.address,
      fundraisingApps.marketMaker.address,
      fundraisingApps.controller.address,
    ),
  );
};

const setupCollateral = async (
  deployer: string,
  fundraisingApps: FundrasingApps,
  daoAddress: string,
  collateralTokenAddress: string,
  reserveRatio: BigNumber,
  slippage: BigNumber,
  signer: Signer,
): Promise<void> => {
  const dao = Kernel__factory.connect(daoAddress, signer);
  const acl = ACL__factory.connect(await dao.acl(), signer);
  await createPermission(
    acl,
    deployer,
    fundraisingApps.controller.address,
    await fundraisingApps.controller.ADD_COLLATERAL_TOKEN_ROLE(),
    deployer,
  );

  // FIXME: add fees
  await waitForTxConfirmation(
    fundraisingApps.controller.addCollateralToken(collateralTokenAddress, 0, 0, reserveRatio, slippage, 0, 0),
  );
};

export const initialize = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deployer } = await getNamedAccounts();

  const { parameters, mockPresale } = getProperConfig(hre);
  const signer = getSigner(ethers);

  const presaleToDeploy = mockPresale ? "MockedBalancedRedirectPresale" : "BalanceRedirectPresale";

  parameters.collateralTokenAddress ??= (await deployments.get("CollateralToken")).address;
  parameters.bondedTokenAddress ??= (await deployments.get("BondedToken")).address;

  console.log(`Collateral token at address ${parameters.collateralTokenAddress}`);
  console.log(`Bondend token at address ${parameters.bondedTokenAddress}`);

  console.log("Creating DAO");
  const daoAddress = await createDAO(deployments, deployer, signer);
  console.log("DAO Created");
  const bancorFormulaDeployment = await deployments.get("BancorFormula");
  const reserveDeployment = await deployments.get("Reserve");
  const presaleDeployment = await deployments.get(presaleToDeploy);
  const marketMakerDeployment = await deployments.get("MarketMaker");
  const tapDisabledDeployment = await deployments.get("TapDisabled");
  const controllerDeployment = await deployments.get("Controller");
  const aclConfiguratorDeployment = await deployments.get("ACLConfigurator");

  const fundraisingApps: FundrasingApps = {
    reserve: await Reserve__factory.connect(reserveDeployment.address, signer),
    presale: await BalanceRedirectPresale__factory.connect(presaleDeployment.address, signer),
    marketMaker: await MarketMaker__factory.connect(marketMakerDeployment.address, signer),
    tap: await TapDisabled__factory.connect(tapDisabledDeployment.address, signer),
    controller: await Controller__factory.connect(controllerDeployment.address, signer),
    aclConfigurator: await ACLConfigurator__factory.connect(aclConfiguratorDeployment.address, signer),
  };

  const params = {
    owner: deployer,
    collateralToken: parameters.collateralTokenAddress,
    bondedToken: parameters.bondedTokenAddress,
    period: parameters.presalePeriod,
    openDate: parameters.startDate,
    exchangeRate: parameters.presaleEchangeRate,
    mintingForBeneficiaryPct: parameters.beneficiaryPCT,
    reserveRatio: parameters.reserveRatio,
    batchBlocks: parameters.batchBlock,
    slippage: parameters.slippage,
    buyFee: parameters.buyFee,
    sellFee: parameters.selFee,
  };

  await waitForTxConfirmation(
    fundraisingApps.presale.initialize(
      daoAddress,
      fundraisingApps.controller.address,
      fundraisingApps.marketMaker.address,
      parameters.bondedTokenAddress,
      fundraisingApps.reserve.address,
      params.owner,
      params.collateralToken,
      params.period,
      params.exchangeRate,
      params.mintingForBeneficiaryPct,
      params.openDate,
    ),
  );

  console.log(`Presale initialized`);

  await waitForTxConfirmation(
    fundraisingApps.marketMaker.initialize(
      daoAddress,
      fundraisingApps.controller.address,
      parameters.bondedTokenAddress,
      bancorFormulaDeployment.address,
      fundraisingApps.reserve.address,
      params.owner,
      params.batchBlocks,
      params.buyFee,
      params.sellFee,
    ),
  );

  console.log(`MarketMaker initialized`);

  await waitForTxConfirmation(
    fundraisingApps.controller.initialize(
      daoAddress,
      fundraisingApps.presale.address,
      fundraisingApps.marketMaker.address,
      fundraisingApps.reserve.address,
      fundraisingApps.tap.address,
      [],
    ),
  );

  console.log(`Controller initialized`);

  await waitForTxConfirmation(fundraisingApps.reserve.initialize(daoAddress));

  console.log(`Reserve initialized`);

  await setupFundraisingPermission(deployer, fundraisingApps, daoAddress, signer);
  console.log("ACL configured");

  await setupCollateral(
    deployer,
    fundraisingApps,
    daoAddress,
    parameters.collateralTokenAddress,
    params.reserveRatio,
    params.slippage,
    signer,
  );

  console.log("Setup collateral done");
};
