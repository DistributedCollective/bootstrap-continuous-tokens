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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface AppProxyFactoryInterface extends ethers.utils.Interface {
  functions: {
    "newAppProxyPinned(address,bytes32,bytes)": FunctionFragment;
    "newAppProxy(address,bytes32)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "newAppProxyPinned",
    values: [string, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "newAppProxy",
    values: [string, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "newAppProxyPinned",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newAppProxy",
    data: BytesLike
  ): Result;

  events: {
    "NewAppProxy(address,bool,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "NewAppProxy"): EventFragment;
}

export class AppProxyFactory extends BaseContract {
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

  interface: AppProxyFactoryInterface;

  functions: {
    "newAppProxyPinned(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "newAppProxyPinned(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "newAppProxy(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "newAppProxy(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  "newAppProxyPinned(address,bytes32,bytes)"(
    _kernel: string,
    _appId: BytesLike,
    _initializePayload: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "newAppProxyPinned(address,bytes32)"(
    _kernel: string,
    _appId: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "newAppProxy(address,bytes32)"(
    _kernel: string,
    _appId: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "newAppProxy(address,bytes32,bytes)"(
    _kernel: string,
    _appId: BytesLike,
    _initializePayload: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    "newAppProxyPinned(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "newAppProxyPinned(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "newAppProxy(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "newAppProxy(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    NewAppProxy(
      proxy?: null,
      isUpgradeable?: null,
      appId?: null
    ): TypedEventFilter<
      [string, boolean, string],
      { proxy: string; isUpgradeable: boolean; appId: string }
    >;
  };

  estimateGas: {
    "newAppProxyPinned(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "newAppProxyPinned(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "newAppProxy(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "newAppProxy(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    "newAppProxyPinned(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "newAppProxyPinned(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "newAppProxy(address,bytes32)"(
      _kernel: string,
      _appId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "newAppProxy(address,bytes32,bytes)"(
      _kernel: string,
      _appId: BytesLike,
      _initializePayload: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
