import { addMilliseconds } from "date-fns";
import { Signer } from "ethers";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { task, types } from "hardhat/config";
import { HardhatEthersHelpers } from "hardhat/types";
import ms from "ms";
import { waitForTxConfirmation } from "../deploy/utils";
import {
  BalanceRedirectPresale__factory,
  Controller__factory,
  MiniMeToken__factory,
  MockedBalancedRedirectPresale__factory,
} from "../typechain";

const getSigner = (ethers: typeof import("ethers/lib/ethers") & HardhatEthersHelpers) => ethers.provider.getSigner();

const getController = async (deployments: DeploymentsExtension, signer: Signer) => {
  const controller = await deployments.get("Controller");
  return Controller__factory.connect(controller.address, signer);
};

const getPresale = async (deployments: DeploymentsExtension, signer: Signer) => {
  const presale = await deployments.get("MockedBalancedRedirectPresale");
  return BalanceRedirectPresale__factory.connect(presale.address, signer);
};

const getCollateralToken = async (deployments: DeploymentsExtension, signer: Signer) => {
  const collateralToken = await deployments.get("CollateralToken");
  return MiniMeToken__factory.connect(collateralToken.address, signer);
};

const getBondedToken = async (deployments: DeploymentsExtension, signer: Signer) => {
  const bondedToken = await deployments.get("BondedToken");
  return MiniMeToken__factory.connect(bondedToken.address, signer);
};

task(
  "update-presale-date",
  "Testing command that updates the mocked presale date to a specific value so state can be changed",
)
  .addParam("span", "Time span ('1w' '2 days' and any ms valid format) ", "1 day", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const delta = ms(taskArgs.span as string);
    const newDate = addMilliseconds(new Date(), delta);
    console.log(`Setting date to ${newDate}`);

    const presaleDeployment = await deployments.get("MockedBalancedRedirectPresale");
    const presale = await MockedBalancedRedirectPresale__factory.connect(
      presaleDeployment.address,
      ethers.provider.getSigner(),
    );

    const newTimestampInSeconds = ethers.BigNumber.from(newDate.getTime()).div(1000);
    await waitForTxConfirmation(presale.setTimestamp(newTimestampInSeconds));
    console.log("Timestamp", await presale.timestamp());
    console.log("Open date", await presale.openDate());
    console.log("Period", await presale.period());
  });

task("open-presale", "starts the presale").setAction(async (_taskArgs, hre) => {
  const { deployments, ethers } = hre;
  console.log("Opening presale");
  const Controller = await getController(deployments, getSigner(ethers));
  await waitForTxConfirmation(Controller.openPresale());
});

task("close-presale", "closes the presale and let's people to start trading").setAction(async (_taskArgs, hre) => {
  const { deployments, ethers } = hre;
  console.log("Closing presale");
  const Controller = await getController(deployments, getSigner(ethers));
  await waitForTxConfirmation(Controller.closePresale());
});

task("get-state", "returns presale current state").setAction(async (_taskArgs, hre) => {
  const { deployments, ethers } = hre;
  const Presale = await getPresale(deployments, getSigner(ethers));
  console.log(await Presale.state());
});

task("mint-collateral", "mints some collateral tokens (SOV) and sends them to the recipient address")
  .addParam("recipient", "Recipient address", "", types.string)
  .addParam("amount", "Amount of tokens to mint", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const CollateralToken = await getCollateralToken(deployments, getSigner(ethers));
    await waitForTxConfirmation(CollateralToken.generateTokens(taskArgs.recipient, taskArgs.amount));
  });

task("contribute", "buys (during the presale period) some bonded tokens and sends them to the recipient")
  .addParam("recipient", "Recipient address", "", types.string)
  .addParam("amount", "Amount of tokens to mint", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);
    const signerAddress = await signer.getAddress();

    const CollateralToken = await getCollateralToken(deployments, signer);
    const BondedToken = await getBondedToken(deployments, signer);
    const Presale = await getPresale(deployments, signer);

    console.log("Generating tokens");
    await waitForTxConfirmation(CollateralToken.generateTokens(signerAddress, taskArgs.amount));
    console.log("Approving transactions");
    await waitForTxConfirmation(CollateralToken.approve(Presale.address, 0));
    await waitForTxConfirmation(CollateralToken.approve(Presale.address, taskArgs.amount));
    console.log("Contribute");
    await waitForTxConfirmation(Presale.contribute(signerAddress, taskArgs.amount));
    console.log("Transfer tokens");
    console.log(await BondedToken.balanceOf(await signerAddress));
    if (taskArgs.recipient !== signerAddress) {
      await BondedToken.transfer(taskArgs.recipient, await BondedToken.balanceOf(await signerAddress));
      console.log("transferring tokens");
    }
  });
