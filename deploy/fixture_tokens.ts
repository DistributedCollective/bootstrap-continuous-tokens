import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import { BalanceRedirectPresale__factory, ContinuousToken__factory, Controller__factory } from "../typechain";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  console.log("Setting up accounts");
  const { deployments } = hre;

  // Same as deplyer so all good
  const txSender = ethers.provider.getSigner();
  // Hardcoded recipient to do some transfers
  const recipient = "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B";

  const collateralToken = await deployments.get("CollateralToken");
  const CollateralToken = ContinuousToken__factory.connect(collateralToken.address, txSender);
  const bondedToken = await deployments.get("BondedToken");
  const BondedToken = ContinuousToken__factory.connect(bondedToken.address, txSender);

  // Load the user with RBTC so he can pay for transactions
  const rBTCAmount = (await ethers.provider.getSigner().getBalance()).div(2);
  await ethers.provider.getSigner().sendTransaction({
    to: recipient,
    value: rBTCAmount,
  });

  // Mint some collateral tokens to the users
  const tokensAmount = ethers.BigNumber.from("1000000000000000000").mul(ethers.BigNumber.from("10000"));
  await CollateralToken.mint(recipient, tokensAmount);
  await CollateralToken.mint(await txSender.getAddress(), tokensAmount);

  // Buy some bonded tokens using the deployer (as we don't have access to the recipient private key but we want to test from Metamask)
  const controller = await deployments.get("Controller");
  const Controller = Controller__factory.connect(controller.address, txSender);
  await Controller.openPresale();

  const presale = await deployments.get("BalanceRedirectPresale");
  const toBuy = ethers.BigNumber.from("1000000000000000000").mul(ethers.BigNumber.from("10000"));
  await CollateralToken.approve(presale.address, toBuy);
  const Presale = BalanceRedirectPresale__factory.connect(presale.address, txSender);
  await Presale.contribute(await txSender.getAddress(), toBuy);
  // Send some tokens to the metamask wallet
  const presaleTokensAmount = await BondedToken.balanceOf(await txSender.getAddress());
  await BondedToken.transfer(recipient, presaleTokensAmount);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await hre.timeAndMine.increaseTime("10 weeks");

  console.log(`The recipient ${recipient} owns ${tokensAmount} ${bondedToken.address}`)
  console.log(`The recipient ${recipient} owns ${toBuy} ${collateralToken.address}`)

  await Controller.closePresale();

  return hre.network.live; // prevents re execution on live networks
};

export default deployFunc;
deployFunc.tags = ['fixture'];
deployFunc.id = "fixture_Tokens"; // id required to prevent reexecution
deployFunc.runAtTheEnd = true;
