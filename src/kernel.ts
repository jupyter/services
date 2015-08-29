// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable } from 'phosphor-disposable';


/**
 * Kernel message header content.
 */
export
interface IKernelMessagHeader {
  username: string;
  version: string;
  session: string;
  msgId: string;
  msgType: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMessge {
  header: IKernelMessagHeader;
  parentHeader: IKernelMessagHeader | {};
  metadata: any;
  content: any;
  msgId?: string;
  msgType?: string;
  channel?: string;
  buffers?: (ArrayBuffer | ArrayBufferView)[]
}


/**
 * Kernel identification specification.
 */
export
interface IKernelId {
  id: string;
  name: string;
}


/**
 * Object providing a Future interface for message callbacks.
 *
 * If `autoDispose` is set, the future will self-dispose after `isDone` is
 * set and the registered `onDone` handler is called.
 *
 * The Future is considered done when a `reply` message and a
 * an `idle` iopub status message have been received.
 */
export
interface IKernelFuture extends IDisposable {
  /**
   * Whether the future disposes itself when done.
   *
   * The default is `true`. This can be set to `false` if the consumer
   * expects addition output messages to arrive after the reply. In
   * this case, the consumer must call `dispose()` when finished.
   */
  autoDispose: boolean;

  /**
   * Test whether the future is done.
   *
   * Read-only.
   */
  isDone: boolean;

  /**
   * The reply handler for the kernel future.
   */
  onReply: (msg: IKernelMessge) => void;

  /**
   * The input handler for the kernel future.
   */
  onInput: (msg: IKernelMessge) => void;

  /**
   * The output handler for the kernel future.
   */
  onOutput: (msg: IKernelMessge) => void;

  /**
   * The done handler for the kernel future.
   */
  onDone: (msg: IKernelMessge) => void;
}


export
enum KernelStatus {
  // TBD - but tied to websocket state.
}


/**
 * A class to communicate with the server-side kernel.
 */
export
interface IKernel {
  /**
   * A signal emitted when the kernel status changes.
   */
  statusChanged: ISignal<KernelStatus>;

  /**
   * The id of the server-side kernel.
   *
   * Read-only
   */
  id: string;

  /**
   * The name of the server-side kernel.
   *
   * Read-only
   */
  name: string;

  /**
   * The current status of the kernel.
   *
   * Read-only.
   */
  status: KernelStatus;

  /**
   * Send a message to the kernel.
   *
   * The future object will yield the result when available.
   */
  sendMessage(msg: IKernelMessage): IKernelFuture;
}


export
interface IKernelOptions {
  // whatever - but *does not* include id - must be a new kernel
}


export
interface IKernelSpecs {
  // whatever
}


/**
 * Fetch the running kernels via API: GET /kernels
 */
function listRunningKernels(): Promise<IKernelId[]> {
  return null;
}


/**
 * Fetch the kernel specs via API: GET /kernelspecs
 */
function listKernelSpecs(): Promise<IKernelSpecs> {
  return null;
}


/**
 * Start a new kernel via API: POST /kernels
 *
 * Wrap the result in an IKernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
function startNewKernel(options: IKernelOptions): Promise<IKernel> {
  return null;
}


/**
 * Connect to a running kernel.
 *
 * If the kernel was already started via `startNewKernel`, the existing
 * IKernel object is used as the fulfillment value.
 *
 * Otherwise, the running kernels are fetched, and if the given id is
 * invalid, the promise is rejected. Otherwise, a new IKernel object
 * is wrapped around the id and the websocket connection is established.
 * The promise is fulfilled when the websocket is ready, or rejected if
 * it fails to become ready.
 */
function connectToKernel(id: string): Promise<IKernel> {
  return null;
}


/**
 * Interrupt a kernel via API: POST /kernels/{kernel_id}/interrupt
 */
function interruptKernel(id: string): Promise<void> {
  return null;
}


/**
 * Restart a kernel via API: POST /kernels/{kernel_id}/restart
 *
 * It is assumed that the API call does not mutate the kernel id or name.
 */
function restartKernel(id: string): Promise<void> {
  return null;
}


/**
 * Delete a kernel via API: DELETE /kernels/{kernel_id}
 *
 * If the given kernel id corresponds to an IKernel object, that
 * object is disposed and its websocket connection is cleared.
 *
 * Any further calls to `sendMessage` for that IKernel will throw
 * an exception.
 */
function deleteKernel(id: string): Promise<void> {
  return null;
}
