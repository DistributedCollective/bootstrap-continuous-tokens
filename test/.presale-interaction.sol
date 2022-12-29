import { deployments, ethers, getNamedAccounts } from "hardhat";
import hre from "hardhat";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import {
  BalanceRedirectPresale__factory,
  Controller__factory,
  MarketMaker__factory,
  BancorFormula__factory,
  MockedContinuousToken__factory,
  Kernel__factory,
  ACL__factory,
  Reserve__factory,
  Kernel,
  ACL,
  Controller,
  BalanceRedirectPresale,
  MockedContinuousToken,
  BancorFormula,
  MarketMaker,
  Reserve,
} from "../typechain";

import { initialize } from "../deploy/initialize";
import { getProperConfig } from "../deploy/utils";

const setupTest = deployments.createFixture(async ({ deployments }) => {
  await deployments.fixture("everything"); // ensure you start from a fresh deployments
  //initialize contracts
  await initialize(hre);
});

const State = {
  Pending: 0, // presale is idle and pending to be started
  Funding: 1, // presale has started and contributors can purchase tokens
  Finished: 2, // presale period is over, but it hasn't been closed yet
  Closed: 3, // presale has been closed and trading has been open
};

const PPM = BigNumber.from(1e6);
let reserveRatio: BigNumber;
let slippage: BigNumber;
let presaleEchangeRate: BigNumber;
let governance: Signer;

describe("Bonding Curve", () => {
  let Presale: BalanceRedirectPresale;
  let Controller: Controller;
  let MarketMaker: MarketMaker;
  let Reserve: Reserve;
  let Kernel: Kernel;
  let ACL: ACL;
  let ZEROToken: MockedContinuousToken;
  let SOVToken: MockedContinuousToken;
  let BancorFormula: BancorFormula;
  const tokens = BigNumber.from(1000000);
  const contributionAmount = BigNumber.from(100000);
  let deployer: string;
  let beneficiary: string;
  let batchBlock: number;
  let mintingBeneficiaryPCT: BigNumber;
  let buyFeePCT: BigNumber;
  let sellFeePCT: BigNumber;
  let account1: Signer;

  beforeEach(async () => {
    await setupTest();

    ({ deployer } = await getNamedAccounts());
    [, account1] = await ethers.getSigners();

    const { parameters, mockPresale } = getProperConfig(hre);
    parameters.governanceAddress ??= deployer;
    beneficiary = parameters.beneficiaryAddress;
    batchBlock = parameters.batchBlock;
    reserveRatio = parameters.reserveRatio;
    slippage = parameters.slippage;
    presaleEchangeRate = parameters.presaleEchangeRate;
    mintingBeneficiaryPCT = parameters.mintingBeneficiaryPCT;
    buyFeePCT = parameters.buyFee;
    sellFeePCT = parameters.selFee;

    // Load the user with RBTC so he can pay for transactions
    const rBTCAmount = (await ethers.provider.getSigner().getBalance()).div(2);
    await ethers.provider.getSigner().sendTransaction({
      to: parameters.governanceAddress,
      value: rBTCAmount,
    });

    // Impersonate governance account to send transactions
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [parameters.governanceAddress],
    });
    governance = await ethers.getSigner(parameters.governanceAddress);

    const presaleToDeploy = mockPresale ? "MockedBalancedRedirectPresale" : "BalanceRedirectPresale";

    const controller = await deployments.get("Controller");
    Controller = await Controller__factory.connect(controller.address, ethers.provider.getSigner());

    Kernel = await Kernel__factory.connect(await Controller.kernel(), ethers.provider.getSigner());

    const aclAddress = await Kernel.acl();
    ACL = await ACL__factory.connect(aclAddress, ethers.provider.getSigner());

    const marketMaker = await deployments.get("MarketMaker");
    MarketMaker = await MarketMaker__factory.connect(marketMaker.address, ethers.provider.getSigner());

    const reserve = await deployments.get("Reserve");
    Reserve = await Reserve__factory.connect(reserve.address, ethers.provider.getSigner());

    const bancorFormula = await deployments.get("BancorFormula");
    BancorFormula = await BancorFormula__factory.connect(bancorFormula.address, ethers.provider.getSigner());

    const zeroToken = await deployments.get("BondedToken");
    ZEROToken = MockedContinuousToken__factory.connect(zeroToken.address, ethers.provider.getSigner());

    const sovToken = await deployments.get("CollateralToken");
    SOVToken = MockedContinuousToken__factory.connect(sovToken.address, ethers.provider.getSigner());
    await SOVToken.mint(deployer, tokens);
    await SOVToken.mint(await account1.getAddress(), tokens);

    expect(await SOVToken.balanceOf(deployer)).to.eq(tokens);

    const presale = await deployments.get(presaleToDeploy);
    Presale = await BalanceRedirectPresale__factory.connect(presale.address, ethers.provider.getSigner());
    await SOVToken.approve(Presale.address, tokens);
    await SOVToken.approve(MarketMaker.address, tokens);

    await SOVToken.connect(account1).approve(Presale.address, tokens);
    await SOVToken.connect(account1).approve(MarketMaker.address, tokens);
  });

  describe("Initialization", async () => {
    it("Should initialize contracts", async () => {
      expect(await Controller.hasInitialized());
      expect(await MarketMaker.hasInitialized());
      expect(await Reserve.hasInitialized());
      expect(await Presale.hasInitialized());
    });
    it("Should have same dao", async () => {
      const daoController = await Controller.kernel();
      const daoMarketMaker = await MarketMaker.kernel();
      const daoReserve = await Reserve.kernel();
      expect(daoController).equal(daoMarketMaker);
      expect(daoMarketMaker).equal(daoReserve);
    });
    it("Should initialize presale with correct parameters", async () => {
      expect(await Presale.controller()).equal(Controller.address);
      expect(await Presale.marketMaker()).equal(MarketMaker.address);
      expect(await Presale.bondedToken()).equal(ZEROToken.address);
      expect(await Presale.reserve()).equal(Reserve.address);
      expect(await Presale.beneficiary()).equal(beneficiary);
      expect(await Presale.contributionToken()).equal(SOVToken.address);
      expect(await Presale.exchangeRate()).equal(presaleEchangeRate);
      expect(await Presale.mintingForBeneficiaryPct()).equal(mintingBeneficiaryPCT);
    });
    it("Should initialize market maker with correct parameters", async () => {
      expect(await MarketMaker.controller()).equal(Controller.address);
      expect(await MarketMaker.bondedToken()).equal(ZEROToken.address);
      expect(await MarketMaker.formula()).equal(BancorFormula.address);
      expect(await MarketMaker.reserve()).equal(Reserve.address);
      expect(await MarketMaker.beneficiary()).equal(beneficiary);
      expect(await MarketMaker.batchBlocks()).equal(batchBlock);
      expect(await MarketMaker.buyFeePct()).equal(buyFeePCT);
      expect(await MarketMaker.sellFeePct()).equal(sellFeePCT);
    });
    it("Should initialize controller with correct parameters", async () => {
      expect(await Controller.presale()).equal(Presale.address);
      expect(await Controller.marketMaker()).equal(MarketMaker.address);
      expect(await Controller.reserve()).equal(Reserve.address);
    });
    it("Should get collateral token", async () => {
      const [_whitelister, _virtualSupply, _virtualBalance, _reserveRatio, _slippage] =
        await MarketMaker.getCollateralToken(SOVToken.address);
      expect(_whitelister);
      expect(_reserveRatio).equal(reserveRatio);
      expect(_virtualSupply).equal(0);
      expect(_virtualBalance).equal(0);
      expect(_slippage).equal(slippage);
    });
    it("Should get presale bonded token and collateral token", async () => {
      const collateralToken = await Controller.contributionToken();
      const bondedToken = await Controller.token();
      expect(collateralToken).equal(SOVToken.address);
      expect(bondedToken).equal(ZEROToken.address);
    });
    it("Should get beneficiary address", async () => {
      const beneficiaryMarketMaker = await MarketMaker.beneficiary();
      const beneficiaryPresale = await Presale.beneficiary();
      expect(beneficiary).equal(beneficiaryMarketMaker);
      expect(beneficiary).equal(beneficiaryPresale);
    });
  });

  describe("Transfering Permissions", async () => {
    it("Should fail trying to create permissions from deployer", async () => {
      await expect(
        ACL.createPermission(deployer, Controller.address, await Controller.WITHDRAW_ROLE(), deployer),
      ).to.be.revertedWith("APP_AUTH_FAILED");
    });
    it("Should fail trying to grant permissions from deployer", async () => {
      await expect(
        ACL.grantPermission(
          await account1.getAddress(),
          Controller.address,
          await Controller.ADD_COLLATERAL_TOKEN_ROLE(),
        ),
      ).to.be.revertedWith("ACL_AUTH_NO_MANAGER");
    });
    it("Should create permissions from governance address", async () => {
      await ACL.connect(governance).createPermission(
        await account1.getAddress(),
        Controller.address,
        await Controller.WITHDRAW_ROLE(),
        await account1.getAddress(),
      );
    });
    it("Should grant permissions from governance", async () => {
      await ACL.connect(governance).grantPermission(
        await account1.getAddress(),
        Controller.address,
        await Controller.ADD_COLLATERAL_TOKEN_ROLE(),
      );
    });
    it("Should only allow governance to update market maker beneficiary", async () => {
      await expect(Controller.updateBeneficiary(await account1.getAddress())).to.be.revertedWith("APP_AUTH_FAILED");
      await Controller.connect(governance).updateBeneficiary(await account1.getAddress());
      const beneficiaryMarketMaker = await MarketMaker.beneficiary();
      expect(await account1.getAddress()).equal(beneficiaryMarketMaker);
    });
    it("Should only allow governance to reduce presale beneficiary pct", async () => {
      await expect(Presale.reduceBeneficiaryPct(10)).to.be.revertedWith("APP_AUTH_FAILED");
      await Presale.connect(governance).reduceBeneficiaryPct(10);
      expect(await Presale.mintingForBeneficiaryPct()).equal(10);
    });
    it("Should only allow governance to update fees", async () => {
      await expect(Controller.updateFees(10, 10)).to.be.revertedWith("APP_AUTH_FAILED");
      await Controller.connect(governance).updateFees(10, 10);
      expect(await MarketMaker.sellFeePct()).equal(10);
      expect(await MarketMaker.buyFeePct()).equal(10);
    });
    it("Should only allow governance to remove collateral token", async () => {
      await expect(Controller.removeCollateralToken(SOVToken.address)).to.be.revertedWith("APP_AUTH_FAILED");
      await Controller.connect(governance).removeCollateralToken(SOVToken.address);
      const [_whitelister, _virtualSupply, _virtualBalance, _reserveRatio, _slippage] =
        await MarketMaker.getCollateralToken(SOVToken.address);
      expect(!_whitelister);
      expect(_reserveRatio).equal(0);
      expect(_virtualSupply).equal(0);
      expect(_virtualBalance).equal(0);
      expect(_slippage).equal(0);
    });
    it("Should only allow governance to update collateral token", async () => {
      await expect(Controller.updateCollateralToken(SOVToken.address, 10, 10, 10, 10)).to.be.revertedWith(
        "APP_AUTH_FAILED",
      );
      await Controller.connect(governance).updateCollateralToken(SOVToken.address, 10, 10, 10, 10);
      const [_whitelister, _virtualSupply, _virtualBalance, _reserveRatio, _slippage] =
        await MarketMaker.getCollateralToken(SOVToken.address);
      expect(_whitelister);
      expect(_reserveRatio).equal(10);
      expect(_virtualSupply).equal(10);
      expect(_virtualBalance).equal(10);
      expect(_slippage).equal(10);
    });
  });

  describe("Presale", async () => {
    it("Should revert if presale is not open", async () => {
      await expect(Controller.contribute(contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
    });

    it("Should fail trying to open presale without permission", async () => {
      await expect(Controller.openPresale()).to.be.revertedWith("APP_AUTH_FAILED");
    });

    it("Should open presale and allow to contribute", async () => {
      expect(await Presale.state()).to.eq(State.Pending);
      await Controller.connect(governance).openPresale();
      expect(await Presale.state()).to.eq(State.Funding);
      expect(await Presale.contributorsCounter()).to.eq(0);
      await Controller.contribute(contributionAmount);
      expect(await Presale.contributorsCounter()).to.eq(1);
      expect(await Presale.contributors(deployer)).to.eq(contributionAmount);
    });

    it("Should increase contribution amount but not increase contributors counter", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      await Controller.contribute(contributionAmount);
      expect(await Presale.contributorsCounter()).to.eq(1);
      expect(await Presale.contributors(deployer)).to.eq(contributionAmount.mul(2));
    });

    it("Should increase contributors counter", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      await Controller.connect(account1).contribute(contributionAmount);
      expect(await Presale.contributorsCounter()).to.eq(2);
      expect(await Presale.contributors(deployer)).to.eq(contributionAmount);
      expect(await Presale.contributors(await account1.getAddress())).to.eq(contributionAmount);
    });

    it("A user can query how many project tokens would be obtained for a given amount of contribution tokens", async () => {
      const reportedAmount = await Presale.contributionToTokens(contributionAmount);
      const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
      expect(expectedAmount).to.eq(reportedAmount);
    });

    it("Mints the correct amount of project tokens", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      const totalSupply = await ZEROToken.totalSupply();
      const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
      expect(expectedAmount).to.eq(totalSupply);
    });

    it("Reduces user contribution token balance", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      const userBalance = await SOVToken.balanceOf(deployer);
      const expectedBalance = tokens.sub(contributionAmount);
      expect(expectedBalance).to.eq(userBalance);
    });

    it("Increases presale contribution token balance", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      const appBalance = await SOVToken.balanceOf(Presale.address);
      expect(appBalance).to.eq(contributionAmount);
    });

    it("Vested tokens are assigned to the buyer", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      const userBalance = await ZEROToken.balanceOf(deployer);
      const expectedAmount = contributionAmount.mul(await Presale.exchangeRate()).div(await Presale.PPM());
      expect(expectedAmount).to.eq(userBalance);
    });

    it("Keeps track of total tokens raised", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      const raised = await Presale.totalRaised();
      expect(raised).to.eq(contributionAmount);
    });

    it("Should revert trying to close presale", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);

      await expect(Controller.closePresale()).to.be.revertedWith("PRESALE_INVALID_STATE");
    });

    it("Should finish presale", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.increaseTime("10 weeks");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.mine("1");

      expect(await Presale.state()).to.eq(State.Finished);
      await expect(Controller.contribute(contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
    });

    it("Should close presale", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      expect(await Presale.state()).to.eq(State.Closed);
      await expect(Controller.contribute(contributionAmount)).to.be.revertedWith("PRESALE_INVALID_STATE");
    });

    it("Raised funds are transferred to the fundraising reserve and the beneficiary address", async () => {
      const zeroBalanceBeforeClosing = await ZEROToken.balanceOf(beneficiary);
      await openAndClosePresale(Controller, contributionAmount);

      expect((await SOVToken.balanceOf(Presale.address)).toNumber()).to.eq(0);

      const totalSold = await Presale.totalSold();
      const mintingForBeneficiary = await Presale.mintingForBeneficiaryPct();
      const zeroTokensForBeneficiary = totalSold.mul(mintingForBeneficiary).div(PPM.sub(mintingForBeneficiary));
      expect(await ZEROToken.balanceOf(beneficiary)).to.eq(
        zeroBalanceBeforeClosing.add(zeroTokensForBeneficiary)
        // zeroBalanceBeforeClosing.add(zeroTokensForBeneficiary.mul(presaleEchangeRate).div(PPM)),
      );

      const totalRaised = await Presale.totalRaised();

      const aux = totalRaised.mul(PPM).div(PPM.sub(mintingForBeneficiary));
      const sovTokensForReserve = aux.mul(reserveRatio).div(PPM);
      const sovTokensForBeneficiary = totalRaised.sub(sovTokensForReserve);
      const reserve = await Presale.reserve();

      expect(await SOVToken.balanceOf(beneficiary)).to.eq(sovTokensForBeneficiary);
      expect(await SOVToken.balanceOf(reserve)).to.eq(sovTokensForReserve);
    });
  });

  describe("Market Maker", async () => {
    it("Market maker should not be open", async () => {
      await Controller.connect(governance).openPresale();
      await Controller.contribute(contributionAmount);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.increaseTime("10 weeks");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.mine("1");

      expect(await Presale.state()).to.eq(State.Finished);
      expect(!(await MarketMaker.isOpen()));
    });

    it("Market maker should be open", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      expect(await MarketMaker.isOpen());
    });

    it("Should open a buy order", async () => {
      const amount = BigNumber.from(100);
      await openAndClosePresale(Controller, contributionAmount);

      const zeroSupplyBefore = await ZEROToken.totalSupply();
      const reserve = await Controller.reserve();
      const sovReserveBalanceBefore = await SOVToken.balanceOf(reserve);
      const tx1 = await (await Controller.openBuyOrder(SOVToken.address, amount)).wait();
      const newBatch1 = tx1.logs
        .map((log: any) => {
          if (log.address === MarketMaker.address) {
            const parsed = MarketMaker.interface.parseLog(log);
            return parsed;
          }
        })
        .find((event: any) => event?.name === "NewBatch");

      const tokensTobeMinted = await MarketMaker.tokensToBeMinted();
      const purchaseReturn = await BancorFormula.calculatePurchaseReturn(
        newBatch1?.args.supply,
        newBatch1?.args.balance,
        newBatch1?.args.reserveRatio,
        amount,
      );

      expect(tokensTobeMinted).to.eq(purchaseReturn);
      expect(await SOVToken.balanceOf(reserve)).to.eq(sovReserveBalanceBefore.add(amount));

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.mine(batchBlock);

      const tx2 = await (await Controller.openBuyOrder(SOVToken.address, amount)).wait();
      const newBatch2 = tx2.logs
        .map((log: any) => {
          if (log.address === MarketMaker.address) {
            const parsed = MarketMaker.interface.parseLog(log);
            return parsed;
          }
        })
        .find((event: any) => event?.name === "NewBatch");

      expect(newBatch2?.args.supply).to.eq(tokensTobeMinted.add(await ZEROToken.totalSupply()));
      expect(newBatch2?.args.supply).to.eq(tokensTobeMinted.add(newBatch1?.args.supply));
      expect(newBatch2?.args.balance).to.eq(newBatch1?.args.balance.add(amount));

      const zeroBalanceBefore = await ZEROToken.balanceOf(deployer);
      await Controller.claimBuyOrder(deployer, newBatch1?.args.id, SOVToken.address);
      expect(await ZEROToken.totalSupply()).to.eq(zeroSupplyBefore.add(tokensTobeMinted));
      expect(await ZEROToken.balanceOf(deployer)).to.eq(zeroBalanceBefore.add(purchaseReturn));
    });

    it("Should open a sell order", async () => {
      const amount = BigNumber.from(1000);
      await openAndClosePresale(Controller, contributionAmount);

      await Controller.openBuyOrder(SOVToken.address, amount);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.mine(batchBlock);

      const zeroSupplyBefore = await ZEROToken.totalSupply();
      const zeroBalanceBefore = await ZEROToken.balanceOf(deployer);
      const sovBalanceBefore = await SOVToken.balanceOf(deployer);

      const tx1 = await (await Controller.openSellOrder(SOVToken.address, amount)).wait();
      const newBatch1 = tx1.logs
        .map((log: any) => {
          if (log.address === MarketMaker.address) {
            const parsed = MarketMaker.interface.parseLog(log);
            return parsed;
          }
        })
        .find((event: any) => event?.name === "NewBatch");

      expect(zeroSupplyBefore).to.eq((await ZEROToken.totalSupply()).add(amount));
      expect(zeroBalanceBefore).to.eq((await ZEROToken.balanceOf(deployer)).add(amount));

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await hre.timeAndMine.mine(batchBlock);

      const collateralsToBeClaimed = await MarketMaker.collateralsToBeClaimed(SOVToken.address);

      await Controller.claimSellOrder(deployer, newBatch1?.args.id, SOVToken.address);

      expect(await SOVToken.balanceOf(deployer)).to.eq(sovBalanceBefore.add(collateralsToBeClaimed));
    });
  });
  describe("Closing Bonding Curve", async () => {
    it("Should fail trying to open a buy order after revoke permissions", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      const amount = BigNumber.from(100);
      //check permissions previously
      expect(await ACL["hasPermission(address,address,bytes32)"](deployer, Controller.address, await Controller.OPEN_BUY_ORDER_ROLE())).eq(true);
      expect(await ACL["hasPermission(address,address,bytes32)"](await account1.getAddress(), Controller.address, await Controller.OPEN_BUY_ORDER_ROLE())).eq(true);

      //revoke buy order permissions
      await ACL.connect(governance).revokePermission(
        await ACL.ANY_ENTITY(),
        Controller.address,
        await Controller.OPEN_BUY_ORDER_ROLE(),
      );

      expect(await ACL["hasPermission(address,address,bytes32)"](deployer, Controller.address, await Controller.OPEN_BUY_ORDER_ROLE())).eq(false);
      expect(await ACL["hasPermission(address,address,bytes32)"](await account1.getAddress(), Controller.address, await Controller.OPEN_BUY_ORDER_ROLE())).eq(false);

      await expect(Controller.openBuyOrder(SOVToken.address, amount)).to.be.revertedWith("APP_AUTH_FAILED");;
      await expect(Controller.connect(account1).openBuyOrder(SOVToken.address, amount)).to.be.revertedWith("APP_AUTH_FAILED");
    });
    it("Should fail trying to open a sell order after revoke permissions", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      const amount = BigNumber.from(100);
      //check permissions previously
      expect(await ACL["hasPermission(address,address,bytes32)"](deployer, Controller.address, await Controller.OPEN_SELL_ORDER_ROLE())).eq(true);
      expect(await ACL["hasPermission(address,address,bytes32)"](await account1.getAddress(), Controller.address, await Controller.OPEN_SELL_ORDER_ROLE())).eq(true);

      //revoke sell order permissions
      await ACL.connect(governance).revokePermission(
        await ACL.ANY_ENTITY(),
        Controller.address,
        await Controller.OPEN_SELL_ORDER_ROLE(),
      );

      expect(await ACL["hasPermission(address,address,bytes32)"](deployer, Controller.address, await Controller.OPEN_SELL_ORDER_ROLE())).eq(false);
      expect(await ACL["hasPermission(address,address,bytes32)"](await account1.getAddress(), Controller.address, await Controller.OPEN_SELL_ORDER_ROLE())).eq(false);

      await expect(Controller.openSellOrder(SOVToken.address, amount)).to.be.revertedWith("APP_AUTH_FAILED");
      await expect(Controller.connect(account1).openSellOrder(SOVToken.address, amount)).to.be.revertedWith("APP_AUTH_FAILED");
    });
    it("Should fail trying deployer to transfer reserve fund", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      const reserveBalanceBefore = await SOVToken.balanceOf(Reserve.address);
      await expect(Reserve.transfer(SOVToken.address, await governance.getAddress(), reserveBalanceBefore)).to.be.revertedWith("APP_AUTH_FAILED");
    });
    it("Should allow to governance to transfer reserve funds", async () => {
      await openAndClosePresale(Controller, contributionAmount);
      await ACL.connect(governance).grantPermission(
        await governance.getAddress(),
        Reserve.address,
        await Reserve.TRANSFER_ROLE(),
      );
      const reserveBalanceBefore = await SOVToken.balanceOf(Reserve.address);
      const governanceBalanceBefore =  await SOVToken.balanceOf(await governance.getAddress());
      await Reserve.connect(governance).transfer(SOVToken.address, await governance.getAddress(), reserveBalanceBefore);
      const reserveBalanceAfter = await SOVToken.balanceOf(Reserve.address);
      const governanceBalanceAfter =  await SOVToken.balanceOf(await governance.getAddress());
      expect(reserveBalanceAfter).equal(BigNumber.from(0));
      expect(governanceBalanceAfter).equal(governanceBalanceBefore.add(reserveBalanceBefore));
    });
  });
});

async function openAndClosePresale(Controller: Controller, contributionAmount: BigNumber) {
  await Controller.connect(governance).openPresale();
  await Controller.contribute(contributionAmount);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await hre.timeAndMine.increaseTime("10 weeks");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await hre.timeAndMine.mine("1");
  await Controller.closePresale();
}
