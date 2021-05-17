import { ethers, waffle, getNamedAccounts } from "hardhat";
import { fixtureDeployedGreeter } from "./common-fixtures";
const { loadFixture } = waffle;
import { expect } from "chai";
import { Greeter } from "../typechain";
import { ContractTransaction } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";

describe("Feature: Greeter", () => {
  let greeterContract: Greeter;

  describe("GIVEN a Greeter contract", () => {
    before(async function () {
      greeterContract = await loadFixture(fixtureDeployedGreeter);
    });

    describe("WHEN it is deployed with [Hello, world] as parameter", () => {
      it("THEN a [Hello, world] message must be the greet", async () => {
        const msgResult = await greeterContract.greet();
        expect(msgResult).to.equal("Hello, world!");
      });
    });

    describe("WHEN changing the greet message", () => {
      let txResult: ContractTransaction;
      before(async function () {
        txResult = await greeterContract.setGreeting("Hola, mundo!");
      });

      it("THEN a changed message should be stored", async () => {
        const msgResult = await greeterContract.greet();
        expect(msgResult).to.equal("Hola, mundo!");
      });
      it("THEN an event should be emited with given arguments", async () => {
        await expect(txResult).to.emit(greeterContract, "GreetingChanged").withArgs("Hello, world!", "Hola, mundo!");
      });
    });

    describe("WHEN sending 1 ETH to contract", () => {
      it("THEN the balances of deployer and contract should decrease/increase 1 ETH", async () => {
        const amount = BigNumber.from("1000000000000000000");
        const txResult = await greeterContract.payToContract({ value: amount });

        // @note another way to get the signer is by position in the array.
        // For the second one (the otherUser) it should be like this:
        // const [, otherUser] = await ethers.getSigners();
        const [deployer] = await ethers.getSigners();

        const contractWithProvider = {
          getAddress: () => greeterContract.address,
          provider: greeterContract.provider,
        };

        // @note changeEtherBalance checks for one account only, changeEtherBalances checks for several
        // await expect(txResult).to.changeEtherBalances([contractWithProvider, deployer], [amount, amount.mul(-1)]);
        await expect(txResult).to.changeEtherBalance(contractWithProvider, amount);
        await expect(txResult).to.changeEtherBalance(deployer, amount.mul(-1));
      });
    });

    describe("WHEN calling setGreeting with other address than owner", () => {
      it("THEN the function must revert", async () => {
        // const { deployer, otherUser } = await getNamedAccounts();
        // await ethers.getSigner(otherUser);
        const [, noOwner] = await ethers.getSigners();
        await expect(greeterContract.connect(noOwner).setGreeting("Oh no!")).to.be.revertedWith(
          "Sender must be the owner",
        );
      });
    });
    describe("WHEN calling setGreeting with other address than owner 2", () => {
      it("THEN the function must revert", async () => {
        const { otherUser } = await getNamedAccounts();
        const noOwner = await ethers.getSigner(otherUser);
        await expect(greeterContract.connect(noOwner).setGreeting("Oh no!")).to.be.revertedWith(
          "Sender must be the owner",
        );
      });
    });
  });
  describe("GIVEN a blockchain is running", () => {
    const greeting = "Hola mundo!";
    describe(`WHEN a signers tries to deploy a Greeter contract with ${greeting}`, () => {
      let greeter: Greeter;
      before(async () => {
        const factory = await ethers.getContractFactory("Greeter");
        greeter = (await factory.deploy(greeting)) as Greeter;
      });
      it("THEN the Greeter has that greet right away", async () => {
        return expect(await greeter.greeting()).to.equal(greeting);
      });
    });
  });
});
