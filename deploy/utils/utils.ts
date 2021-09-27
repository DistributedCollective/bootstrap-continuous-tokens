import { ContractTransaction, ContractReceipt } from "ethers";
export const GAS_LIMIT_PATCH = 6800000;

export const waitForTxConfirmation = async (
  tx: Promise<ContractTransaction>,
  confirmations: number = 1,
): Promise<ContractReceipt> => {
  return (await tx).wait(confirmations);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const deployFunc = () => {};

export default deployFunc;
deployFunc.id = "utils"; // id required to prevent reexecution
deployFunc.skip = () => Promise.resolve(true);
