import { deployments, ethers, getNamedAccounts } from "hardhat";
import hre from "hardhat";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { initialize } from "../deploy/initialize";
import { getProperConfig } from "../deploy/utils";
import { MockedContinuousToken, MockedContinuousToken__factory, StaticPriceFormula, StaticPriceFormula__factory } from "../typechain";

const setupTest = deployments.createFixture(async ({ deployments }) => {
  await deployments.fixture("everything"); // ensure you start from a fresh deployments
  //initialize contracts
  await initialize(hre);
});

describe("Static Formula Price", () => {
  let deployer: string;
  let account1: Signer;
  let StaticPriceFormula: StaticPriceFormula;
  let ZEROToken: MockedContinuousToken;
  let STATIC_PRICE: BigNumber;
  let PRECISION: BigNumber;
  const MYNT_SUPPLY = "49057867925919878933673404"

  beforeEach(async () => {
    await setupTest();

    ({ deployer } = await getNamedAccounts());
    [, account1] = await ethers.getSigners();

    const staticPriceFormula = await deployments.get("StaticPriceFormula");
    StaticPriceFormula = await StaticPriceFormula__factory.connect(staticPriceFormula.address, ethers.provider.getSigner());

    const zeroToken = await deployments.get("BondedToken");
    ZEROToken = MockedContinuousToken__factory.connect(zeroToken.address, ethers.provider.getSigner());

    STATIC_PRICE = await StaticPriceFormula.STATIC_PRICE();
    PRECISION = await StaticPriceFormula.PRECISION();

    expect(STATIC_PRICE).to.eq(BigNumber.from(MYNT_SUPPLY));
    expect(PRECISION).to.eq(BigNumber.from(1e18.toString()));
  })

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
    )

    expect(purchasePrice.toString()).to.eq('0');
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
    )

    expect(saleReturn.toString()).to.eq(amount.mul(STATIC_PRICE).div(PRECISION).toString());
  });
})