import { expect } from "chai";
import { ethers } from "hardhat";
import { Greeter } from "../typechain";

describe("Feature: Greeter", () => {
  describe("Scenario: Should return the new greeting once it's changed", () => {
    let greeter: Greeter;
    it("GIVEN a deployed Greeter contract", async () => {
      const factory = await ethers.getContractFactory("Greeter");
      greeter = <Greeter>await factory.deploy("Hello, world!");
      expect(await greeter.greet()).to.equal("Hello, world!");
    });
    it("WHEN greeting message changed", async () => {
      await greeter.setGreeting("Hola, mundo!");
    });
    it("THEN greet returns new greeting message", async () => {
      expect(await greeter.greet()).to.equal("Hola, mundo!");
    });
  });
});
