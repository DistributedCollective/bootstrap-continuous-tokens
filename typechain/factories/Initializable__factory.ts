/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Initializable, InitializableInterface } from "../Initializable";

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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5061011d806100206000396000f30060806040526004361060485763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630803fac08114604d5780638b3dd749146073575b600080fd5b348015605857600080fd5b50605f6097565b604080519115158252519081900360200190f35b348015607e57600080fd5b50608560bb565b60408051918252519081900360200190f35b60008060a060bb565b9050801580159060b557508060b260e9565b10155b91505090565b600060e47febb05b386a8d34882b8711d156f463690983dc47815980fb82aeeff1aa43579e60ed565b905090565b4390565b54905600a165627a7a72305820394ff2aac52741494e42c37ee34bf85d0fbac22068c54f36e272eeda71a2c0a00029";

export class Initializable__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Initializable> {
    return super.deploy(overrides || {}) as Promise<Initializable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Initializable {
    return super.attach(address) as Initializable;
  }
  connect(signer: Signer): Initializable__factory {
    return super.connect(signer) as Initializable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): InitializableInterface {
    return new utils.Interface(_abi) as InitializableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Initializable {
    return new Contract(address, _abi, signerOrProvider) as Initializable;
  }
}
