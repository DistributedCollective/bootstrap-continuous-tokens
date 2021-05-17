import { ethers, deployments } from "hardhat";
import { Greeter } from "../typechain";

export async function fixtureDeployedGreeter(): Promise<Greeter> {
  await deployments.fixture();
  const deployedContract = await deployments.getOrNull("Greeter");
  if (deployedContract == undefined) throw new Error("No greeter deployed. Something weird happened");
  const greeter = await ethers.getContractAt("Greeter", deployedContract.address);
  return greeter as Greeter;
}
