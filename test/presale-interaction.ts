import { deployments, ethers, getNamedAccounts } from "hardhat";
import hre from "hardhat";
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
  const tokens = BigNumber.from(10000);
  const contributionAmount = BigNumber.from(100);
  let deployer: string;
  let zeroBalanceBeforeClosing:BigNumber;
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

  it("Should revert trying to close presale", async () => {
    await expect(Controller.closePresale()).to.be.revertedWith("PRESALE_INVALID_STATE");
  });

  it("Should finish presale", async () => {
    const DAYS = 24 * 3600;
    const MONTHS = 30 * DAYS;
    const FINISH_DATE = new Date().getTime() + MONTHS + MONTHS;

    await hre.network.provider.request({
      method: "evm_mine",
      params: [FINISH_DATE],
    });
    expect(await Presale.state()).to.eq(State.Finished);
    await expect(Presale.contribute(deployer, contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
  });

  it ("Should close presale", async() => {
    zeroBalanceBeforeClosing = await ZEROToken.balanceOf(deployer);
    await Controller.closePresale();
    expect(await Presale.state()).to.eq(State.Closed);
    await expect(Presale.contribute(deployer, contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
  });

  it('Raised funds are transferred to the fundraising reserve and the beneficiary address', async () => {
    expect((await SOVToken.balanceOf(Presale.address)).toNumber()).to.eq(0);

    const totalSold = await Presale.totalRaised();
    const mintingForBeneficiary = await Presale.mintingForBeneficiaryPct();
    const PPM = await Presale.PPM();
    const zeroTokensForBeneficiary = totalSold.mul(mintingForBeneficiary).div(PPM.sub(mintingForBeneficiary)); 
    expect(await ZEROToken.balanceOf(deployer)).to.eq(zeroBalanceBeforeClosing.add(zeroTokensForBeneficiary));
    
    
    const RESERVE_RATIO = PPM.mul(10).div(100)
    const totalRaised = await Presale.totalRaised();

    const aux = totalRaised.mul(PPM).div(PPM.sub(mintingForBeneficiary));
    const sovTokensForReserve = aux.mul(RESERVE_RATIO).div(PPM);
    const sovTokensForBeneficiary = totalRaised.sub(sovTokensForReserve);
    const reserve = await Presale.reserve()

    
    expect(await SOVToken.balanceOf(deployer)).to.eq(tokens.sub(contributionAmount).add(sovTokensForBeneficiary));
    expect(await SOVToken.balanceOf(reserve)).to.eq(sovTokensForReserve);
  })
});
