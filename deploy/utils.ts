import { ContractTransaction, ContractReceipt } from "ethers";
export const GAS_LIMIT_PATCH = 3400000 // 6800000;

export const waitForTxConfirmation = async (
  tx: Promise<ContractTransaction>,
  confirmations: number = 1,
): Promise<ContractReceipt> => {
  return (await tx).wait(confirmations);
};
