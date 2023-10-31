import { AddressZero } from "@ethersproject/constants";
import { ethers } from "hardhat";
import { BigNumber, utils, Signer } from "ethers";
import {
  MockedContinuousToken,
  MockedContinuousToken__factory,
  FixedRateConverter,
  FixedRateConverter__factory,
} from "../typechain";
import { expect } from "chai";

const toWei = (amt: string) => {
  return utils.parseEther(amt);
}

describe("FixedRateConverter", () => {
  let fixedRateConverter: FixedRateConverter;
  let sovToken: MockedContinuousToken;
  let myntToken: MockedContinuousToken;
  let conversionFeeRate = BigNumber.from(4723550439442834); // 0.004723550439442834
  let initialSovAmount = toWei("1000000");
  let initialMyntAmount = toWei("10000000000");
  let tokenFactory: MockedContinuousToken__factory;
  let fixedRateConverterFactory: FixedRateConverter__factory;
  let accounts: Signer[];
  let owner: Signer;

  beforeEach("before all", async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    tokenFactory = await ethers.getContractFactory("MockedContinuousToken");
    fixedRateConverterFactory = await  ethers.getContractFactory("FixedRateConverter");
    sovToken = await tokenFactory.deploy("SOV", "SOV", 18, 0)
    myntToken = await tokenFactory.deploy("MYNT Token", "MYNT", 18, 0);
    fixedRateConverter = await fixedRateConverterFactory.deploy(myntToken.address, sovToken.address, conversionFeeRate);

    /** Mint SOV & MYNT */
    await sovToken.mint(await owner.getAddress(), initialSovAmount);
    await myntToken.mint(await owner.getAddress(), initialMyntAmount);

    /** Supply SOV to the converter contract */
    await sovToken.transfer(fixedRateConverter.address, initialSovAmount);
  });

  describe("initialize", async () => {
    context("should succeed", async () => {
      it("should initialized successfully", async () => {
        const admin = await fixedRateConverter.admin();
        const sovTokenAddress = await fixedRateConverter.sovContractAddress();
        const myntTokenAddress = await fixedRateConverter.myntContractAddress();

        expect(admin).to.equal(await owner.getAddress());
        expect(sovTokenAddress).to.equal(sovToken.address);
        expect(myntTokenAddress).to.equal(myntToken.address);
      });

      it("setAdmin should set the admin successfully", async () => {
        let admin = await fixedRateConverter.admin();
        expect(admin).to.equal(await owner.getAddress());
        const newAdmin = await accounts[3].getAddress();
        await fixedRateConverter.setAdmin(newAdmin);
        admin = await fixedRateConverter.admin();

        expect(admin).to.equal(newAdmin);
      });
    });

    context("should revert", async () => {
      it("setAdmin should revert if set zero address", async () => {
        let admin = await fixedRateConverter.admin();
        expect(admin).to.equal(await owner.getAddress());
        const newAdmin = AddressZero;
        await expect(fixedRateConverter.setAdmin(newAdmin)).to.be.revertedWith("Invalid address");
      });

      it("setAdmin should revert if set by non-admin address", async () => {;
        const newAdmin = await accounts[3].getAddress();
        await expect(fixedRateConverter.connect(accounts[3]).setAdmin(newAdmin)).to.be.revertedWith("unauthorized");
      });
    });
  });

  describe("convert", async () => {
    context("should success", async () => {
      it("convertAmount should return correct value", async () => {
        const myntAmount = toWei("100");
        const precision = BigNumber.from(toWei("1"));
        const convertedSovAmount = await fixedRateConverter.convertAmount(myntAmount);
        expect(convertedSovAmount.toString()).to.equal(BigNumber.from(myntAmount.toString()).mul(conversionFeeRate).div(precision));
      })

      it("convertMax should return correct value", async () => {
        const sovBalanceOfConverter = await sovToken.balanceOf(fixedRateConverter.address);
        const precision = BigNumber.from(toWei("1"));
        const maxConvertedMynt = await fixedRateConverter.convertMax();
        expect(maxConvertedMynt.toString()).to.equal(sovBalanceOfConverter.mul(precision).div(conversionFeeRate));
      })

      it("should successfully do conversion", async () => {
        const sender = accounts[0];
        const previousSenderMyntBalance = await myntToken.balanceOf(await sender.getAddress());
        const previousSenderSovBalance = await sovToken.balanceOf(await sender.getAddress());

        const previousConverterMyntBalance = await myntToken.balanceOf(fixedRateConverter.address);
        const previousConverterSovBalance = await sovToken.balanceOf(fixedRateConverter.address);

        const myntToConvert = toWei("100");
        const expectedSov = await fixedRateConverter.convertAmount(myntToConvert);
        await myntToken.approve(fixedRateConverter.address, myntToConvert);
        await fixedRateConverter.connect(sender).convert(myntToConvert);

        const latestSenderMyntBalance = await myntToken.balanceOf(await sender.getAddress());
        const latestSenderSovBalance = await sovToken.balanceOf(await sender.getAddress());

        const latestConverterMyntBalance = await myntToken.balanceOf(fixedRateConverter.address);
        const latestConverterSovBalance = await sovToken.balanceOf(fixedRateConverter.address);
        
        expect(latestSenderSovBalance.sub(previousSenderSovBalance)).to.equal(expectedSov);
        expect(previousSenderMyntBalance.sub(latestSenderMyntBalance)).to.equal(myntToConvert);

        expect(previousConverterSovBalance.sub(latestConverterSovBalance)).to.equal(expectedSov);
        expect(previousConverterMyntBalance.sub(latestConverterMyntBalance)).to.equal(0);
      })
    })

    context("should revert", async () => {
      it("should revert to convert if sov balance does not sufficient in converter contract", async () => {
        const sender = accounts[0];
        const myntToConvert = initialMyntAmount;
        await myntToken.approve(fixedRateConverter.address, myntToConvert);
        await expect(fixedRateConverter.connect(sender).convert(myntToConvert)).to.be.revertedWith("invalid transfer");
      })

      it("should revert to convert if sov balance does not sufficient in converter contract", async () => {
        const sender = accounts[0];
        const myntToConvert = initialMyntAmount;
        await myntToken.approve(fixedRateConverter.address, myntToConvert);
        await expect(fixedRateConverter.connect(sender).convert(myntToConvert)).to.be.revertedWith("invalid transfer");
      })

      it("should revert if try to convert 0 mynt", async () => {
        const sender = accounts[0];
        const myntToConvert = 0;
        await myntToken.approve(fixedRateConverter.address, myntToConvert);
        await expect(fixedRateConverter.connect(sender).convert(myntToConvert)).to.be.revertedWith("Error: amount must be > 0");
      })

      it("should revert if try to convert mynt amount > the sender balance", async () => {
        const sender = accounts[0];
        const myntToConvert = BigNumber.from(initialMyntAmount).add(BigNumber.from(1));
        await myntToken.approve(fixedRateConverter.address, myntToConvert);
        await expect(fixedRateConverter.connect(sender).convert(myntToConvert)).to.be.revertedWith("Error: amount exceeds MYNT balance");
      })
    })
  })

  describe("withdrawSov", async () => {
    context("should success", async () => {
      it("should successfully withdrawSov", async () => {
        const admin = accounts[0];
        const previousConverterSovBalance = await sovToken.balanceOf(fixedRateConverter.address);
        const previousSenderSovBalance = await sovToken.balanceOf(await admin.getAddress());
        await fixedRateConverter.connect(admin).withdrawSov()

        const latestConverterSovBalance = await sovToken.balanceOf(fixedRateConverter.address);
        const latestSenderSovBalance = await sovToken.balanceOf(await admin.getAddress());

        expect(latestSenderSovBalance.sub(previousSenderSovBalance)).to.equal(previousConverterSovBalance);
        expect(latestConverterSovBalance).to.equal(0);
      })
    })

    context("should revert", async () => {
      it("should revert if withdrawSov called by non-admin contract", async () => {
        const nonAdmin = accounts[1];
        await expect(fixedRateConverter.connect(nonAdmin).withdrawSov()).to.be.revertedWith("unauthorized");
      })
    })
  })
});
