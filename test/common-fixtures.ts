import { deployments, ethers } from "hardhat";
import {
  Controller, MarketMaker
} from "../typechain";


type FundrasingApps = {
  //reserve: Reserve;
  //presale: BalanceRedirectPresale;
  marketMaker: MarketMaker;
  //tap: TapDisabled;
  controller: Controller;
};

export async function fixtureDeployedController(): Promise<FundrasingApps> {
  await deployments.fixture();
  const deployedContract = await deployments.getOrNull("Controller");
  if (deployedContract == undefined) throw new Error("No Controller deployed. Something weird happened");
  return {
    controller: <Controller>await ethers.getContractAt("Controller", deployedContract.address),
    marketMaker: <MarketMaker>await ethers.getContractAt("MarketMaker", deployedContract.address),
  };
}

export async function fixtureDeployedMarketMaker(): Promise<MarketMaker> {
  await deployments.fixture();
  const deployedContract = await deployments.getOrNull("MarketMaker");
  if (deployedContract == undefined) throw new Error("No MarketMaker deployed. Something weird happened");
  const marketMaker = await ethers.getContractAt("MarketMaker", deployedContract.address);
  return marketMaker as MarketMaker;
}
