/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface VaultInterface extends ethers.utils.Interface {
  functions: {
    "hasInitialized()": FunctionFragment;
    "TRANSFER_ROLE()": FunctionFragment;
    "getEVMScriptExecutor(bytes)": FunctionFragment;
    "getRecoveryVault()": FunctionFragment;
    "deposit(address,uint256)": FunctionFragment;
    "isDepositable()": FunctionFragment;
    "allowRecoverability(address)": FunctionFragment;
    "appId()": FunctionFragment;
    "getInitializationBlock()": FunctionFragment;
    "transferToVault(address)": FunctionFragment;
    "canPerform(address,bytes32,uint256[])": FunctionFragment;
    "getEVMScriptRegistry()": FunctionFragment;
    "transfer(address,address,uint256)": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "kernel()": FunctionFragment;
    "isPetrified()": FunctionFragment;
    "balance(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "hasInitialized",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "TRANSFER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getEVMScriptExecutor",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRecoveryVault",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isDepositable",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allowRecoverability",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "appId", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getInitializationBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferToVault",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "canPerform",
    values: [string, BytesLike, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getEVMScriptRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transfer",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "initialize", values: [string]): string;
  encodeFunctionData(functionFragment: "kernel", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "isPetrified",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "balance", values: [string]): string;

  decodeFunctionResult(
    functionFragment: "hasInitialized",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "TRANSFER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEVMScriptExecutor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRecoveryVault",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isDepositable",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "allowRecoverability",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "appId", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getInitializationBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferToVault",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "canPerform", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getEVMScriptRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "kernel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isPetrified",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "balance", data: BytesLike): Result;

  events: {
    "VaultTransfer(address,address,uint256)": EventFragment;
    "VaultDeposit(address,address,uint256)": EventFragment;
    "ScriptResult(address,bytes,bytes,bytes)": EventFragment;
    "RecoverToVault(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "VaultTransfer"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "VaultDeposit"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ScriptResult"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RecoverToVault"): EventFragment;
}

export class Vault extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: VaultInterface;

  functions: {
    hasInitialized(overrides?: CallOverrides): Promise<[boolean]>;

    TRANSFER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    getEVMScriptExecutor(
      _script: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getRecoveryVault(overrides?: CallOverrides): Promise<[string]>;

    deposit(
      _token: string,
      _value: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    isDepositable(overrides?: CallOverrides): Promise<[boolean]>;

    allowRecoverability(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    appId(overrides?: CallOverrides): Promise<[string]>;

    getInitializationBlock(overrides?: CallOverrides): Promise<[BigNumber]>;

    transferToVault(
      _token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    canPerform(
      _sender: string,
      _role: BytesLike,
      _params: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    getEVMScriptRegistry(overrides?: CallOverrides): Promise<[string]>;

    transfer(
      _token: string,
      _to: string,
      _value: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    initialize(
      _kernel: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    kernel(overrides?: CallOverrides): Promise<[string]>;

    isPetrified(overrides?: CallOverrides): Promise<[boolean]>;

    balance(_token: string, overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  hasInitialized(overrides?: CallOverrides): Promise<boolean>;

  TRANSFER_ROLE(overrides?: CallOverrides): Promise<string>;

  getEVMScriptExecutor(
    _script: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  getRecoveryVault(overrides?: CallOverrides): Promise<string>;

  deposit(
    _token: string,
    _value: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  isDepositable(overrides?: CallOverrides): Promise<boolean>;

  allowRecoverability(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  appId(overrides?: CallOverrides): Promise<string>;

  getInitializationBlock(overrides?: CallOverrides): Promise<BigNumber>;

  transferToVault(
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  canPerform(
    _sender: string,
    _role: BytesLike,
    _params: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<boolean>;

  getEVMScriptRegistry(overrides?: CallOverrides): Promise<string>;

  transfer(
    _token: string,
    _to: string,
    _value: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  initialize(
    _kernel: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  kernel(overrides?: CallOverrides): Promise<string>;

  isPetrified(overrides?: CallOverrides): Promise<boolean>;

  balance(_token: string, overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    hasInitialized(overrides?: CallOverrides): Promise<boolean>;

    TRANSFER_ROLE(overrides?: CallOverrides): Promise<string>;

    getEVMScriptExecutor(
      _script: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    getRecoveryVault(overrides?: CallOverrides): Promise<string>;

    deposit(
      _token: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    isDepositable(overrides?: CallOverrides): Promise<boolean>;

    allowRecoverability(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    appId(overrides?: CallOverrides): Promise<string>;

    getInitializationBlock(overrides?: CallOverrides): Promise<BigNumber>;

    transferToVault(_token: string, overrides?: CallOverrides): Promise<void>;

    canPerform(
      _sender: string,
      _role: BytesLike,
      _params: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<boolean>;

    getEVMScriptRegistry(overrides?: CallOverrides): Promise<string>;

    transfer(
      _token: string,
      _to: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    initialize(_kernel: string, overrides?: CallOverrides): Promise<void>;

    kernel(overrides?: CallOverrides): Promise<string>;

    isPetrified(overrides?: CallOverrides): Promise<boolean>;

    balance(_token: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    VaultTransfer(
      token?: string | null,
      to?: string | null,
      amount?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { token: string; to: string; amount: BigNumber }
    >;

    VaultDeposit(
      token?: string | null,
      sender?: string | null,
      amount?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { token: string; sender: string; amount: BigNumber }
    >;

    ScriptResult(
      executor?: string | null,
      script?: null,
      input?: null,
      returnData?: null
    ): TypedEventFilter<
      [string, string, string, string],
      { executor: string; script: string; input: string; returnData: string }
    >;

    RecoverToVault(
      vault?: string | null,
      token?: string | null,
      amount?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { vault: string; token: string; amount: BigNumber }
    >;
  };

  estimateGas: {
    hasInitialized(overrides?: CallOverrides): Promise<BigNumber>;

    TRANSFER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    getEVMScriptExecutor(
      _script: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRecoveryVault(overrides?: CallOverrides): Promise<BigNumber>;

    deposit(
      _token: string,
      _value: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    isDepositable(overrides?: CallOverrides): Promise<BigNumber>;

    allowRecoverability(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    appId(overrides?: CallOverrides): Promise<BigNumber>;

    getInitializationBlock(overrides?: CallOverrides): Promise<BigNumber>;

    transferToVault(
      _token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    canPerform(
      _sender: string,
      _role: BytesLike,
      _params: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEVMScriptRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      _token: string,
      _to: string,
      _value: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    initialize(
      _kernel: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    kernel(overrides?: CallOverrides): Promise<BigNumber>;

    isPetrified(overrides?: CallOverrides): Promise<BigNumber>;

    balance(_token: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    hasInitialized(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    TRANSFER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getEVMScriptExecutor(
      _script: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRecoveryVault(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    deposit(
      _token: string,
      _value: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    isDepositable(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    allowRecoverability(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    appId(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getInitializationBlock(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    transferToVault(
      _token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    canPerform(
      _sender: string,
      _role: BytesLike,
      _params: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEVMScriptRegistry(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    transfer(
      _token: string,
      _to: string,
      _value: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    initialize(
      _kernel: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    kernel(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isPetrified(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balance(
      _token: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}