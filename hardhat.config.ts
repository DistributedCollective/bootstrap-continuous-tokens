import "@atixlabs/hardhat-time-n-mine";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
// This is done to have the new matchers from waffle,
// because despite the note in https://hardhat.org/guides/waffle-testing.html?#adapting-the-tests
// the changeEtherBalance is not added because its a newer version
import chai from "chai";
import { config as dotenvConfig } from "dotenv";
import { solidity } from "ethereum-waffle";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-docgen";
import "hardhat-gas-reporter";
import "hardhat-preprocessor";
import { removeConsoleLog } from "hardhat-preprocessor";
import "hardhat-prettier";
import { HardhatUserConfig } from "hardhat/types";
import { resolve } from "path";
import { BigNumber, Wallet } from "ethers";
import "solidity-coverage";
import "./scripts/custom-tasks";
import ms from "ms";
import { addMilliseconds } from "date-fns";

chai.use(solidity);

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  rskTestnetMocked: 31,
  rskMainnet: 30,
};

const PPM = BigNumber.from(1e6);
const PCT_BASE = BigNumber.from((1e18).toString());
const DAYS = 24 * 3600;

const startInAnHourFromNow = () => {
  const delta = ms("1 hour");
  const newDate = addMilliseconds(new Date(), delta);
  return BigNumber.from(newDate.getTime()).div(1000);
};

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

const getPrivateKey = () =>
  process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [Wallet.createRandom().privateKey];

type Parameters = {
  // the date (unixtime, ms) upon which that presale is to be open [ignored if 0]
  startDate: BigNumber;
  // the percentage of the raised funds that will be sent to beneficiary address during presale period
  mintingBeneficiaryPCT: BigNumber;
  // the amount of time, in ms, that the presale will last
  presalePeriod: number;
  // the exchangeRate [= 1/price] at which [bonded] tokens are to be purchased for that presale [in PPM]
  presaleEchangeRate: BigNumber;
  // the reserve ratio to be used for that collateral token [in PPM]
  reserveRatio: BigNumber;
  // the amount of blocks a batch will contain
  batchBlock: number;
  // the price slippage below which each batch is to be kept for that collateral token [in PCT_BASE]
  slippage: BigNumber;
  // the fee to be deducted from buy orders [in PCT_BASE]
  buyFee: BigNumber;
  // the fee to be deducted from sell orders [in PCT_BASE]
  selFee: BigNumber;
  // the address of the collateral token, only necessary. If not provided, a mock token will be deployed
  collateralTokenAddress?: string;
  // the address of the bonded token, only necessary. if not provided a mock token will be deployed.
  bondedTokenAddress?: string;
  // the address of the governance, permissions will be transfer to this address after deployment. If not provided, permissions remains to deployer address
  governanceAddress?: string;
  // the address of the beneficiary, fees will be transfer to this address.
  beneficiaryAddress: string;
};
declare module "hardhat/types/config" {
  export interface HardhatNetworkUserConfig {
    // If true it will deploy a mocked presale contract version that allow update date to close presale (for testing purposes)
    mockPresale: boolean;
    parameters: Parameters;
  }

  export interface HardhatNetworkConfig {
    mockPresale: boolean;
    parameters: Parameters;
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    otherUser: 1,
  },
  networks: {
    hardhat: {
      mockPresale: true,
      parameters: {
        startDate: BigNumber.from(new Date().getTime()).div(1000).add(DAYS),
        mintingBeneficiaryPCT: PPM.mul(35).div(100),
        presalePeriod: 14 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        beneficiaryAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
        governanceAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
      },
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    rskdev: {
      mockPresale: false,
      parameters: {
        startDate: BigNumber.from(new Date().getTime()).div(1000).add(1000),
        mintingBeneficiaryPCT: PPM.mul(35).div(100),
        presalePeriod: 14 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        beneficiaryAddress: "0xB0D1D7fad89CfC28394b0B1AB51d24c432170f5A",
      },
      url: "http://localhost:4444",
      // regtest default prefunded account
      from: "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
      gasMultiplier: 1.25,
    },
    rskTestnetMocked: {
      mockPresale: true,
      parameters: {
        startDate: BigNumber.from(new Date().getTime()).div(1000).add(1000),
        mintingBeneficiaryPCT: PPM.mul(35).div(100),
        presalePeriod: 2 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        beneficiaryAddress: "",
        governanceAddress: "",
      },
      url: "https://public-node.testnet.rsk.co",
      accounts: getPrivateKey(),
      chainId: chainIds.rskTestnetMocked,
    },
    rskTestnetMockedWithSOV: {
      mockPresale: false,
      parameters: {
        startDate: startInAnHourFromNow(),
        mintingBeneficiaryPCT: PPM.mul(35).div(100),
        presalePeriod: 1 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        collateralTokenAddress: "0x6a9A07972D07e58F0daf5122d11E069288A375fb",
        beneficiaryAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
        governanceAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
      },
      url: "https://testnet.sovryn.app/rpc",
      accounts: getPrivateKey(),
      chainId: chainIds.rskTestnetMocked,
    },
    myntRSKTestnet: {
      mockPresale: false,
      parameters: {
        startDate: startInAnHourFromNow(),
        mintingBeneficiaryPCT: PPM.mul(BigNumber.from("1575")).div(100).div(100),
        presalePeriod: 1 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        collateralTokenAddress: "0x6a9A07972D07e58F0daf5122d11E069288A375fb",
        bondedTokenAddress: "0x139483e22575826183F5b56dd242f8f2C1AEf327",
        beneficiaryAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
        governanceAddress: "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B",
      },
      url: "https://testnet.sovryn.app/rpc",
      accounts: getPrivateKey(),
      chainId: chainIds.rskTestnetMocked,
    },
    myntRSKMainnet: {
      mockPresale: false,
      parameters: {
        startDate: BigNumber.from("1636383600"), // "2021-10-11T15:00:00.000Z"
        mintingBeneficiaryPCT: PPM.mul(BigNumber.from("1575")).div(100).div(100),
        presalePeriod: 7 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        collateralTokenAddress: "0xefc78fc7d48b64958315949279ba181c2114abbd",
        bondedTokenAddress: "0x2e6B1d146064613E8f521Eb3c6e65070af964EbB",
        beneficiaryAddress: "0x924f5ad34698Fd20c90Fe5D5A8A0abd3b42dc711",
        governanceAddress: "0x924f5ad34698Fd20c90Fe5D5A8A0abd3b42dc711",
      },
      url: "https://mainnet.sovryn.app/rpc",
      accounts: getPrivateKey(),
      chainId: chainIds.rskMainnet,
      timeout: 20000 * 100
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.4.24",
    settings: {
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 21,
  },
  preprocess: {
    eachLine: removeConsoleLog(hre => !["hardhat", "localhost"].includes(hre.network.name)),
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 60000,
  },
};

config.networks;
export default config;
