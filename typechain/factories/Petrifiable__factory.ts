/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Petrifiable, PetrifiableInterface } from "../Petrifiable";

const _abi = [
  {
    constant: true,
    inputs: [],
    name: "hasInitialized",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getInitializationBlock",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "isPetrified",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610160806100206000396000f3006080604052600436106100565763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630803fac0811461005b5780638b3dd74914610084578063de4796ed146100ab575b600080fd5b34801561006757600080fd5b506100706100c0565b604080519115158252519081900360200190f35b34801561009057600080fd5b506100996100e9565b60408051918252519081900360200190f35b3480156100b757600080fd5b50610070610119565b6000806100cb6100e9565b905080158015906100e35750806100e061012c565b10155b91505090565b60006101147febb05b386a8d34882b8711d156f463690983dc47815980fb82aeeff1aa43579e610130565b905090565b60006000196101266100e9565b14905090565b4390565b54905600a165627a7a723058201a8f76a58bb3de95a6948ca81bed6197110e9902b388c63763526a3aeb0efb6a0029";

export class Petrifiable__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Petrifiable> {
    return super.deploy(overrides || {}) as Promise<Petrifiable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Petrifiable {
    return super.attach(address) as Petrifiable;
  }
  connect(signer: Signer): Petrifiable__factory {
    return super.connect(signer) as Petrifiable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PetrifiableInterface {
    return new utils.Interface(_abi) as PetrifiableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Petrifiable {
    return new Contract(address, _abi, signerOrProvider) as Petrifiable;
  }
}