import { deployments, ethers, getNamedAccounts } from "hardhat";
import { expect } from "chai";
import { BalanceRedirectPresale__factory, MiniMeToken__factory } from "../typechain";

const setupTest = deployments.createFixture(async ({ deployments }) => {
  await deployments.fixture(); // ensure you start from a fresh deployments
});

describe("Presale Interaction", () => {
  it("Should allow a SOV holder to contribute", async () => {
    await setupTest();

    const { deployer } = await getNamedAccounts();
    const tokens = 10000;

    const sovToken = await deployments.get("Collateral Token");
    const SOVToken = MiniMeToken__factory.connect(sovToken.address, ethers.provider.getSigner());
    await SOVToken.generateTokens(deployer, tokens);
    expect(await SOVToken.balanceOf(deployer)).to.eq(tokens);

    const presale = await deployments.get("BalanceRedirectPresale");
    const Presale = await BalanceRedirectPresale__factory.connect(presale.address, ethers.provider.getSigner());
    await SOVToken.approve(presale.address, tokens);
    await Presale.contribute(deployer, 0);
  });
});
