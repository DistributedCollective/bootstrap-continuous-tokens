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
import { HardhatUserConfig} from "hardhat/config";
import { resolve } from "path";
import "solidity-coverage";
import "./scripts/custom-tasks";
import "./scripts/deploy-tasks";


chai.use(solidity);

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  rskTestnetMocked: 31,
};

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    deployTokens: boolean;
    mockPresale: boolean;
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
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    rskdev: {
      url: "http://localhost:4444",
      // regtest default prefunded account
      from: "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
      gasMultiplier: 1.25,
    },
    rskTestnetMocked: {
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


export default config;
