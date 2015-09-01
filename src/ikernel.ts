// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable } from 'phosphor-disposable';

import { ISignal } from 'phosphor-signaling';


export
interface IKernelOptions {
  name: string;
  baseUrl: string;
  wsUrl?: string;
  username?: string;
}

export
interface IKernelSpecs {
  // whatever
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
 * Kernel message header content.
 */
export
interface IKernelMessageHeader {
  username: string;
  version: string;
  session: string;
  msg_id: string;
  msg_type: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMessage {
  header: IKernelMessageHeader;
  parent_header: IKernelMessageHeader | {};
  metadata: any;
  content: any;
  channel?: string;
  buffers?: (ArrayBuffer | ArrayBufferView)[]
}

/**
 * Kernel information specification.
 * http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
 */
export
interface IKernelInfo {
  protocol_version: string;
  implementation: string;
  implementation_version: string;
  language_info: IKernelLanguageInfo;
  banner: string;
  help_links: { [key: string]: string; };
}


/**
 * Kernel language information specification.
 */
export
interface IKernelLanguageInfo {
  name: string;
  version: string;
  mimetype: string;
  file_extension: string;
  pygments_lexer: string;
  codemirror_mode: string | {};
  nbconverter_exporter: string;
}


export
enum KernelStatus {
  Unknown,
  Starting,
  Idle,
  Busy,
  Restarting,
  Dead
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
  sendMessage(msgType: string, channel: string, content: any, metadata: any, buffers: ArrayBuffer[]): IKernelFuture;

  /**
   * Interrupt a kernel via API: POST /kernels/{kernel_id}/interrupt
   */
  interrupt(): Promise<void>;

  /**
   * Restart a kernel via API: POST /kernels/{kernel_id}/restart
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   */
  restart(): Promise<void>;

  /**
   * Delete a kernel via API: DELETE /kernels/{kernel_id}
   *
   * If the given kernel id corresponds to an IKernel object, that
   * object is disposed and its websocket connection is cleared.
   *
   * Any further calls to `sendMessage` for that IKernel will throw
   * an exception.
   */
  shutdown(): Promise<void>;
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
  onReply: (msg: IKernelMessage) => void;

  /**
   * The input handler for the kernel future.
   */
  onInput: (msg: IKernelMessage) => void;

  /**
   * The output handler for the kernel future.
   */
  onOutput: (msg: IKernelMessage) => void;

  /**
   * The done handler for the kernel future.
   */
  onDone: (msg: IKernelMessage) => void;
}
