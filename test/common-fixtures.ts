import { ethers, deployments } from "hardhat";

import {
  ACL__factory,
  BalanceRedirectPresale__factory,
  Controller__factory,
  MarketMaker__factory,
  MiniMeToken__factory,
  TokenManager__factory,
  Kernel__factory,
  MarketMaker,
  Controller,
  Reserve__factory,
  TapDisabled__factory,
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
