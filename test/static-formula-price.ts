import { deployments, ethers } from "hardhat";
import hre from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { initialize } from "../deploy/initialize";
import { getProperConfig } from "../deploy/utils";
import {
  MockedContinuousToken,
  MockedContinuousToken__factory,
  StaticPriceFormula,
  StaticPriceFormula__factory,
} from "../typechain";

const setupTest = deployments.createFixture(async ({ deployments }) => {
  await deployments.fixture("everything"); // ensure you start from a fresh deployments
  //initialize contracts
  await initialize(hre);
});

describe("Static Formula Price", () => {
  let StaticPriceFormula: StaticPriceFormula;
  let ZEROToken: MockedContinuousToken;
  let SOV_BALANCE_SNAPSHOT: BigNumber;
  let MYNT_SUPPLY_SNAPSHOT: BigNumber;
  const SOV_BALANCE = "231727313599607376661098";
  const MYNT_SUPPLY = "49057867925919878933673404";

  beforeEach(async () => {
    await setupTest();

    const staticPriceFormula = await deployments.get("StaticPriceFormula");
    StaticPriceFormula = await StaticPriceFormula__factory.connect(
      staticPriceFormula.address,
      ethers.provider.getSigner(),
    );

    const zeroToken = await deployments.get("BondedToken");
    ZEROToken = MockedContinuousToken__factory.connect(zeroToken.address, ethers.provider.getSigner());

    SOV_BALANCE_SNAPSHOT = await StaticPriceFormula.SOV_BALANCE_SNAPSHOT();
    MYNT_SUPPLY_SNAPSHOT = await StaticPriceFormula.MYNT_SUPPLY_SNAPSHOT();

    expect(MYNT_SUPPLY_SNAPSHOT).to.eq(BigNumber.from(MYNT_SUPPLY));
    expect(SOV_BALANCE_SNAPSHOT).to.eq(BigNumber.from(SOV_BALANCE));
  });

  it("calculatePurchaseReturn should return 0 value", async () => {
    const { parameters } = getProperConfig(hre);
    const zeroSupplyBefore = await ZEROToken.totalSupply();
    const amount = BigNumber.from(100);
    const connectorWeight = BigNumber.from(10000);
    const purchasePrice = await StaticPriceFormula.calculatePurchaseReturn(
      zeroSupplyBefore,
      connectorWeight,
      parameters.reserveRatio,
      amount,
    );

    expect(purchasePrice.toString()).to.eq("0");
  });

  it("calculateSaleReturn should return correct value", async () => {
    const { parameters } = getProperConfig(hre);
    const zeroSupplyBefore = await ZEROToken.totalSupply();
    const amount = BigNumber.from(100);
    const connectorWeight = BigNumber.from(10000);
    const saleReturn = await StaticPriceFormula.calculateSaleReturn(
      zeroSupplyBefore,
      connectorWeight,
      parameters.reserveRatio,
      amount,
    );

    expect(saleReturn.toString()).to.eq(amount.mul(SOV_BALANCE_SNAPSHOT).div(MYNT_SUPPLY_SNAPSHOT).toString());
  });
});
