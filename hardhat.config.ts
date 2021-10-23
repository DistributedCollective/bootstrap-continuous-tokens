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
import { constants } from "ethers";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-docgen";
import "hardhat-gas-reporter";
import "hardhat-preprocessor";
import { removeConsoleLog } from "hardhat-preprocessor";
import "hardhat-prettier";
import { HardhatUserConfig } from "hardhat/types";
import { resolve } from "path";
import { BigNumber } from "ethers";
import "solidity-coverage";
import "./scripts/custom-tasks";

chai.use(solidity);

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  rskTestnetMocked: 31,
};

const PPM = BigNumber.from(1e6);
const PCT_BASE = BigNumber.from((1e18).toString());
const DAYS = 24 * 3600;

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

type Parameters = {
  startDate: BigNumber;
  beneficiaryPCT: number;
  presalePeriod: number;
  presaleEchangeRate: BigNumber;
  reserveRatio: BigNumber;
  batchBlock: number;
  slippage: BigNumber;
  buyFee: BigNumber;
  selFee: BigNumber;
  collateralTokenAddress?: string;
  bondedTokenAddress?: string;
};
declare module "hardhat/types/config" {
  export interface HardhatNetworkUserConfig {
    deployTokens: boolean;
    mockPresale: boolean;
    parameters: Parameters;
  }

  export interface HardhatNetworkConfig {
    deployTokens: boolean;
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
      deployTokens: true,
      mockPresale: true,
      parameters: {
        startDate: BigNumber.from(new Date().getTime()).div(1000).add(DAYS),
        beneficiaryPCT: 200000,
        presalePeriod: 14 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
      },
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    rskdev: {
      deployTokens: false,
      mockPresale: false,
      parameters: {
        startDate:BigNumber.from(new Date().getTime()).div(1000).add(1000),
        beneficiaryPCT: 200000,
        presalePeriod: 14 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        collateralTokenAddress: "0x61E81fFa505d5A6F11f923C2DFe705E4Bc8B7d7B",
        bondedTokenAddress: "0x49bD7a016c3D88fdcD42ba7201CCB671C816CaCe",
      },
      url: "http://localhost:4444",
      // regtest default prefunded account
      from: "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
      gasMultiplier: 1.25,
    },
    rskTestnetMocked: {
      deployTokens: false,
      mockPresale: false,
      parameters: {
        startDate: BigNumber.from(new Date().getTime()).div(1000).add(1000),
        beneficiaryPCT: 200000,
        presalePeriod: 2 * DAYS,
        presaleEchangeRate: PPM.mul(10000).div(100),
        reserveRatio: PPM.mul(40).div(100),
        batchBlock: 10,
        slippage: PCT_BASE.mul(3).div(100),
        buyFee: BigNumber.from(0),
        selFee: PCT_BASE.mul(3).div(1000),
        collateralTokenAddress: "0x6a9A07972D07e58F0daf5122d11E069288A375fb",
        bondedTokenAddress: "0x65844bfb21FCFfa7eB5e0F1AD6f11467A523e270",
      },
      url: "https://public-node.testnet.rsk.co",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || constants.AddressZero],
      chainId: chainIds.rskTestnetMocked,
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
