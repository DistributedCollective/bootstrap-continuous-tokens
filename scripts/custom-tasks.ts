import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import { addMilliseconds } from "date-fns";
import { BigNumberish, BigNumber, Signer } from "ethers";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ms from "ms";
import { initialize } from "../deploy/initialize";
import { waitForTxConfirmation, getProperConfig } from "../deploy/utils";
import {
  ACL__factory,
  BalanceRedirectPresale__factory,
  Controller__factory,
  Kernel__factory,
  MarketMaker__factory,
  MockedBalancedRedirectPresale__factory,
  MockedContinuousToken__factory,
  Reserve__factory,
} from "../typechain";

const getSigner = (ethers: typeof import("ethers/lib/ethers") & HardhatEthersHelpers) => ethers.provider.getSigner();

const getController = async (deployments: DeploymentsExtension, signer: Signer) => {
  const controller = await deployments.get("Controller");
  return Controller__factory.connect(controller.address, signer);
};

const getMarketMaker = async (deployments: DeploymentsExtension, signer: Signer) => {
  const marketMaker = await deployments.get("MarketMaker");
  return MarketMaker__factory.connect(marketMaker.address, signer);
};

const getPresale = async (deployments: DeploymentsExtension, signer: Signer, hre: HardhatRuntimeEnvironment) => {
  const { mockPresale } = getProperConfig(hre);

  const presaleToDeploy = mockPresale ? "MockedBalancedRedirectPresale" : "BalanceRedirectPresale";

  const presale = await deployments.get(presaleToDeploy);
  return BalanceRedirectPresale__factory.connect(presale.address, signer);
};

const getTokenAddress =
  (token: "BondedToken" | "CollateralToken") =>
  async (hre: HardhatRuntimeEnvironment, deployments: DeploymentsExtension, signer: Signer) => {
    const config = getProperConfig(hre);
    const configAddress =
      token === "CollateralToken" ? config.parameters.collateralTokenAddress : config.parameters.bondedTokenAddress;
    return MockedContinuousToken__factory.connect(configAddress || (await deployments.get(token)).address, signer);
  };

const getCollateralToken = async (hre: HardhatRuntimeEnvironment, deployments: DeploymentsExtension, signer: Signer) =>
  getTokenAddress("CollateralToken")(hre, deployments, signer);

const getBondedToken = async (hre: HardhatRuntimeEnvironment, deployments: DeploymentsExtension, signer: Signer) =>
  getTokenAddress("BondedToken")(hre, deployments, signer);

task("initialize", "initialize bonding curve contracts and set permissions").setAction(async (_taskArgs, hre) => {
  console.log("Initializing contracts");
  await initialize(hre);
});

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
  const Presale = await getPresale(deployments, getSigner(ethers), hre);
  console.log(await Presale.state());
});

task("mint-collateral", "mints some collateral tokens (SOV) and sends them to the recipient address")
  .addParam("recipient", "Recipient address", "", types.string)
  .addParam("amount", "Amount of tokens to mint", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const CollateralToken = await getCollateralToken(hre, deployments, getSigner(ethers));
    await waitForTxConfirmation(CollateralToken.mint(taskArgs.recipient, taskArgs.amount));
  });

task("contribute", "buys (during the presale period) some bonded tokens and sends them to the recipient")
  .addParam("recipient", "Recipient address", "", types.string)
  .addParam("amount", "Amount of tokens to mint", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);
    const signerAddress = await signer.getAddress();

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const BondedToken = await getBondedToken(hre, deployments, signer);
    const Presale = await getPresale(deployments, signer, hre);

    console.log("Generating tokens");
    await waitForTxConfirmation(CollateralToken.mint(signerAddress, taskArgs.amount));
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

task("open-buy-order", "open a buy order of bonded tokens after presale period")
  .addParam("amount", "", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const Controller = await getController(deployments, getSigner(ethers));
    const MarketMaker = await getMarketMaker(deployments, getSigner(ethers));

    console.log("Opening a buy order");
    await waitForTxConfirmation(CollateralToken.approve(MarketMaker.address, 0));
    await waitForTxConfirmation(CollateralToken.approve(MarketMaker.address, taskArgs.amount));
    const tx = await waitForTxConfirmation(Controller.openBuyOrder(CollateralToken.address, taskArgs.amount));

    const buyOrder = tx.logs
      .map((log: any) => {
        if (log.address === MarketMaker.address) {
          const parsed = MarketMaker.interface.parseLog(log);
          return parsed;
        }
      })
      .find((event: any) => event?.name === "OpenBuyOrder");
    console.log("BatchId : ", (buyOrder?.args.batchId).toString());
  });

task("claim-buy-order", "claim a buy order of bonded tokens")
  .addParam("batch", "", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);
    const signerAddress = await signer.getAddress();

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const Controller = await getController(deployments, getSigner(ethers));

    console.log("Claiming a buy order");
    await waitForTxConfirmation(Controller.claimBuyOrder(signerAddress, taskArgs.batch, CollateralToken.address));
  });

task("open-sell-order", "open a sell order of bonded tokens after presale period")
  .addParam("amount", "", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const Controller = await getController(deployments, getSigner(ethers));
    const MarketMaker = await getMarketMaker(deployments, getSigner(ethers));

    console.log("Opening a sell order");
    const tx = await waitForTxConfirmation(Controller.openSellOrder(CollateralToken.address, taskArgs.amount));

    const sellOrder = tx.logs
      .map((log: any) => {
        if (log.address === MarketMaker.address) {
          const parsed = MarketMaker.interface.parseLog(log);
          return parsed;
        }
      })
      .find((event: any) => event?.name === "OpenSellOrder");
    console.log("BatchId : ", (sellOrder?.args.batchId).toString());
  });

task("claim-sell-order", "claim a sell order of bonded tokens")
  .addParam("batch", "", "1", types.string)
  .setAction(async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const signer = getSigner(ethers);
    const signerAddress = await signer.getAddress();

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const Controller = await getController(deployments, getSigner(ethers));

    console.log("Claiming a sell order");
    await waitForTxConfirmation(Controller.claimSellOrder(signerAddress, taskArgs.batch, CollateralToken.address));
  });

task("emergency-remove-from-reserve", "Recovers the funds from the reserve").setAction(async (taskArgs, hre) => {
  const { deployments, ethers } = hre;
  const reserve = await deployments.get("Reserve");

  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || "", ethers.provider);
  const signer = wallet;
  const governanceAddress = await signer.getAddress();

  console.log(`Governance address is ${governanceAddress}`);

  const Reserve = await Reserve__factory.connect(reserve.address, signer);

  const controller = await deployments.get("Controller");
  const Controller = await Controller__factory.connect(controller.address, signer);

  const Kernel = await Kernel__factory.connect(await Controller.kernel(), signer);
  const aclAddress = await Kernel.acl();
  const ACL = await ACL__factory.connect(aclAddress, signer);

  const CollateralToken = await getCollateralToken(hre, deployments, signer);
  console.log(Reserve.address);

  const reserveBalanceBefore = await CollateralToken.balanceOf(Reserve.address);
  console.log("Reserve balance before emergency stop: ", reserveBalanceBefore.toString());
  const governanceBalanceBefore = await CollateralToken.balanceOf(governanceAddress);
  console.log("Governance balance before emergency stop: ", governanceBalanceBefore.toString());

  await waitForTxConfirmation(
    ACL.grantPermission(
      governanceAddress,
      Reserve.address,
      await Reserve.TRANSFER_ROLE(),
      {
        gasLimit: 3400000,
      },
    ),
  );

  console.log("Permission granted");

  await waitForTxConfirmation(
    Reserve.transfer(CollateralToken.address, governanceAddress, reserveBalanceBefore, { gasLimit: 3400000 }),
  );
  const reserveBalanceAfter = await CollateralToken.balanceOf(Reserve.address);
  console.log("Reserve balance after emergency stop: ", reserveBalanceAfter.toString());
  const governanceBalanceAfter = await CollateralToken.balanceOf(governanceAddress);
  console.log("Governance balance after emergency stop: ", governanceBalanceAfter.toString());
});

task("print-system-info", "prints system useful data to montior the presale and the bonding curve status").setAction(
  async (taskArgs, hre) => {
    const { deployments, ethers } = hre;
    const config = getProperConfig(hre);
    const signer = getSigner(ethers);

    const CollateralToken = await getCollateralToken(hre, deployments, signer);
    const BondedToken = await getBondedToken(hre, deployments, signer);
    const Presale = await getPresale(deployments, signer, hre);
    const reserve = await deployments.get("Reserve");

    const formatUnits = ethers.utils.formatUnits;
    const formatValue = (value: BigNumberish) => formatUnits(value, 18);

    const [
      totalRaised,
      totalSold,
      isPresaleClosed,
      presaleOpenTime,
      presaleDuration,
      contributorsCount,
      reserveFunds,
      beneficiaryContributionTokens,
      beneficiaryBondedTokens,
    ] = await Promise.all([
      Presale.totalRaised().then(formatValue),
      Presale.totalSold().then(formatValue),
      Presale.isClosed(),
      Presale.openDate().then((openDate: BigNumber) => new Date(openDate.toNumber() * 1000).toISOString()),
      Presale.period().then((period: BigNumber) => ms(period.toNumber() * 1000)),
      Presale.contributorsCounter().then(formatValue),
      CollateralToken.balanceOf(reserve.address).then(formatValue),
      CollateralToken.balanceOf(config.parameters.beneficiaryAddress).then(formatValue),
      BondedToken.balanceOf(config.parameters.beneficiaryAddress).then(formatValue),
    ]);

    console.table([
      {
        Key: "Total Raised",
        Value: totalRaised.toString(),
      },
      {
        Key: "Total Sold",
        Value: totalSold.toString(),
      },
      {
        Key: "Is Presale closed?",
        Value: isPresaleClosed,
      },
      {
        Key: "Presale Open Time (UTC)",
        Value: presaleOpenTime,
      },
      {
        Key: "Presale duration",
        Value: presaleDuration,
      },
      {
        Key: "Contributors Count",
        Value: contributorsCount,
      },
      {
        Key: "Reserve funds",
        Value: reserveFunds,
      },
      {
        Key: "Beneficiary Holdings (Collateral Tokens)",
        Value: beneficiaryContributionTokens,
      },
      {
        Key: "Beneficiary Holdings (Bonded Tokens)",
        Value: beneficiaryBondedTokens,
      },
    ]);
  },
);
