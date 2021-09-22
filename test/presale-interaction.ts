import { deployments, ethers, getNamedAccounts } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "@ethersproject/bignumber";
import { BalanceRedirectPresale__factory, MiniMeToken__factory, Controller__factory } from "../typechain";

const setupTest = deployments.createFixture(async ({ deployments }) => {
  await deployments.fixture(); // ensure you start from a fresh deployments
});

const State = {
  Pending: 0, // presale is idle and pending to be started
  Funding: 1, // presale has started and contributors can purchase tokens
  Finished: 2, // presale period is over, but it hasn't been closed yet
  Closed: 3, // presale has been closed and trading has been open
};

describe("Presale Interaction", () => {
  let Presale: any, Controller: any, ZEROToken: any, SOVToken: any;
  let tokens = BigNumber.from(10000);
  let contributionAmount = BigNumber.from(10);
  let deployer: string;
  before(async () => {
    await setupTest();

    ({ deployer } = await getNamedAccounts());

    const zeroToken = await deployments.get("Bonded Token");
    ZEROToken = MiniMeToken__factory.connect(zeroToken.address, ethers.provider.getSigner());

    const sovToken = await deployments.get("Collateral Token");
    SOVToken = MiniMeToken__factory.connect(sovToken.address, ethers.provider.getSigner());
    await SOVToken.generateTokens(deployer, tokens);

    expect(await SOVToken.balanceOf(deployer)).to.eq(tokens);

    const presale = await deployments.get("BalanceRedirectPresale");
    Presale = await BalanceRedirectPresale__factory.connect(presale.address, ethers.provider.getSigner());
    await SOVToken.approve(Presale.address, tokens);

    const controller = await deployments.get("Controller");
    Controller = await Controller__factory.connect(controller.address, ethers.provider.getSigner());
  });

  it("Should revert if presale is not open", async () => {
  await expect(Presale.contribute(deployer, contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
  });

  it("Should open presale and allow to contribute", async () => {
    expect(await Presale.state()).to.eq(State.Pending);
    await Controller.openPresale();
    expect(await Presale.state()).to.eq(State.Funding);
    await Presale.contribute(deployer, contributionAmount);
  });

  it("A user can query how many project tokens would be obtained for a given amount of contribution tokens", async () => {
    const reportedAmount = await Presale.contributionToTokens(contributionAmount);
    const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
    expect(expectedAmount).to.eq(reportedAmount);
  });

  it("Mints the correct amount of project tokens", async () => {
    const totalSupply = await ZEROToken.totalSupply();
    const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
    expect(expectedAmount).to.eq(totalSupply);
  });

  it("Reduces user contribution token balance", async () => {
    const userBalance = await SOVToken.balanceOf(deployer);
    const expectedBalance = tokens.sub(contributionAmount);
    expect(expectedBalance).to.eq(userBalance);
  });

  it("Increases presale contribution token balance", async () => {
    const appBalance = await SOVToken.balanceOf(Presale.address);
    expect(appBalance).to.eq(contributionAmount);
  });

  it("Vested tokens are assigned to the buyer", async () => {
    const userBalance = await ZEROToken.balanceOf(deployer);
    const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
    expect(expectedAmount).to.eq(userBalance);
  });

  it("Keeps track of total tokens raised", async () => {
    const raised = await Presale.totalRaised();
    expect(raised).to.eq(contributionAmount);
  });

  /*it("Should close presale", async () => {
    expect(await Presale.state()).to.eq(State.Funding);
    await Controller.closePresale();
    expect(await Presale.state()).to.eq(State.Close);
    await Presale.contribute(deployer, contributionAmount);
  });*/
});
