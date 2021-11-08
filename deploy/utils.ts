import { ContractTransaction, ContractReceipt } from "ethers";
import { HardhatNetworkUserConfig } from "hardhat/types/config";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
export const GAS_LIMIT_PATCH = 3400000; // 6800000;

export const waitForTxConfirmation = async (
  tx: Promise<ContractTransaction>,
  confirmations: number = 1,
): Promise<ContractReceipt> => {
  console.log(`Waiting for ${(await tx).hash}`)
  return (await tx).wait(confirmations);
};

// Note that the deployments are saved as if the network name is localhost
// See https://github.com/wighawag/hardhat-deploy#flags-1
export const getProperConfig = (hre: HardhatRuntimeEnvironment): HardhatNetworkUserConfig => {
  const network = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  return hre.config.networks[network] as HardhatNetworkUserConfig;
};
