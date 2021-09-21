import {deployments, getNamedAccounts } from "hardhat";

import { expect } from "chai";

import { BigNumber } from "@ethersproject/bignumber";

import {
  FundrasingApps,
  deployContract,
  createDAO,
  deployContracts,
  getSOVAddress,
  getZeroAddress,
  setupFundraisingPermission,
  setupCollateral,
} from "../deploy/deploy";

describe("Bonding Curve", () => {
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

  let tokenFactory;
  let sovAddress: Address;
  let zeroAddress: Address;
  let fundraisingApps: FundrasingApps;

  let daoAddress: Address;
  //let bancorFormulaAddress:Address;

  before(async () => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    tokenFactory = await deployContract(deploy, deployer, "MiniMeTokenFactory");
    sovAddress = await getSOVAddress(deploy, deployer, tokenFactory.address);
    zeroAddress = await getZeroAddress(deploy, deployer, tokenFactory.address);

    // Setup DAO and ACL
    [daoAddress] = await createDAO(deploy, deployer);
    // Setup fundraisingApps
    const { address: bancorFormulaAddress } = await deployContract(deploy, deployer, "BancorFormula");
    fundraisingApps = await deployContracts(deploy, deployer, zeroAddress);

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
  });

  it("should initialize contracts", async () => {
    expect(await fundraisingApps.controller.hasInitialized());
    expect(await fundraisingApps.marketMaker.hasInitialized());
    expect(await fundraisingApps.reserve.hasInitialized());
    expect(await fundraisingApps.presale.hasInitialized());
    console.log(daoAddress);
  });

  it("should have same dao", async () => {
    const daoController = await fundraisingApps.controller.kernel();
    const daoMarketMaker = await fundraisingApps.marketMaker.kernel();
    const daoReserve = await fundraisingApps.reserve.kernel();
    expect(daoAddress).equal(daoController);
    expect(daoAddress).equal(daoMarketMaker);
    expect(daoAddress).equal(daoReserve);
  });

  it("should get collateral token", async () => {
    const [
      whitelister,
      virtualSupply,
      virtualBalance,
      reserveRatio,
      slippage,
    ] = await fundraisingApps.marketMaker.getCollateralToken(sovAddress);
    expect(whitelister);
    expect(reserveRatio).equal(RESERVE_RATIO);
    expect(virtualSupply).equal(0);
    expect(virtualBalance).equal(0);
    expect(slippage).equal(SLIPPAGE);
  });
});
