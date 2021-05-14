import { ethers, getNamedAccounts, deployments } from "hardhat";
import { Greeter } from "../typechain";

export async function fixtureDeployedGreeter(): Promise<Greeter> {
  await deployments.fixture();
  const { deployer } = await getNamedAccounts();
  const greeter = <unknown>await ethers.getContract("Greeter", deployer);
  return greeter as Greeter;
}
