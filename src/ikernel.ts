// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable } from 'phosphor-disposable';

import { ISignal, Signal } from 'phosphor-signaling';


export
interface IKernelOptions {
  name: string;
  baseUrl: string;
  wsUrl?: string;
  username?: string;
  clientId?: string;
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
  channel: string;
  buffers: (ArrayBuffer | ArrayBufferView)[]
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
 * Contents of a 'complete_request' message.
 */
export
interface ICompleteRequest {
  code: string;
  cursor_pos: number;
}


/**
 * Contents of a 'complete_reply' message.
 */
export 
interface ICompleteReply {
  matches: string[];
  cursor_start: number;
  cursor_end: number;
  metadata: any;
  status: string;
}


/**
 * Contents of an 'inspect_request' message.
 */
export
interface IInspectRequest {
  code: string;
  cursor_pos: number;
  detail_level: number;
}


/**
 * Contents of an 'inspect_reply' message.
 */
export
interface IInspectReply {
  status: string;
  data: any;
  metadata: any;
}


/**
 * Contents of an 'is_complete_request' message.
 */
export 
interface IIsCompleteRequest {
  code: string;
}


/**
 * Contents of an 'is_complete_reply' message.
 */
export 
interface IIsCompleteReply {
  status: string;
  indent: string;
}


/**
 * Contents of an 'execute_request' message.
 */
export
interface IExecuteRequest {
  code: string;
  silent?: boolean;
  store_history?: boolean;
  user_expressions?: any;
  allow_stdin?: boolean;
  stop_on_error?: boolean;
}


/**
 * Contents of an 'execute_reply' message.
 */
export
interface IExecuteReply {
  execution_count: number;
  data: any;
  metadata: any;
}


/**
 * Contents of an 'input_reply' message.
 */
export
interface IInputReply {
  value: string;
}


/**
 * Contents of a 'comm_info_request' message.
 */
export
interface ICommInfoRequest {
  target?: string;
}


/**
 * Contents of `comm_info_reply` message.
 */
export
interface ICommInfoReply {
  /**
   * Mapping of comm ids to target names.
   */
  comms: { [id: string]: string };
}


/**
 * Contents of a `comm_open` message.
 */
export
interface ICommOpen {
  comm_id: string;
  target_name: string;
  data: any;
  target_module?: string;
}


/**
 * Contents of a `comm_msg` message.
 */
export
interface ICommMsg {
  comm_id: string;
  data: any;
}


/**
 * Contents of a `comm_close` message.
 */
export
interface ICommClose {
  comm_id: string;
  data: any;
}


/**
 * Options for an IKernelMessage.
 */
export
interface IKernelMessageOptions {
  msgType: string;
  channel: string;
  session: string;
  username?: string;
  msgId?: string;
}


/**
 * Interface of a kernel object.
 */
export 
interface IKernel {
  /**
   * The status changed signal for the kernel.
   */
  statusChanged: ISignal<IKernel, KernelStatus>;

  /**
   * The unhandled message signal for the kernel.
   */
  unhandledMessage: ISignal<IKernel, IKernelMessage>;

  /**
   * An unhandled comm_open message received from the client.
   */
  commOpened: ISignal<IKernel, ICommOpen>;

  /**
   * The id of the server-side kernel.
   */
  id: string;

  /**
   * The name of the server-side kernel.
   */
  name: string;

  /**
   * The client username.
   *
   * Read-only
   */
   username: string;

  /**
   * The client unique id.
   *
   * Read-only
   */
  clientId: string;

  /**
   * The current status of the kernel.
   *
   * Read-only
   */
  status: KernelStatus;

  /**
   * Send a shell message to the kernel.
   *
   * The future object will yield the result when available.
   */
  sendShellMessage(msg: IKernelMessage, expectReply: boolean): IKernelFuture;

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
   * If the given kernel id corresponds to an Kernel object, that
   * object is disposed and its websocket connection is cleared.
   *
   * Any further calls to `sendMessage` for that Kernel will throw
   * an exception.
   */
  shutdown(): Promise<void>;

  /**
   * Send a "kernel_info_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
   */
  kernelInfo(): Promise<IKernelInfo>;

  /**
   * Send a "complete_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#completion
   */
  complete(contents: ICompleteRequest): Promise<ICompleteReply>;

  /**
   * Send an "inspect_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#introspection
   */
  inspect(contents: IInspectRequest): Promise<IInspectReply>;

  /**
   * Send an "execute_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#execute
   */
  execute(contents: IExecuteRequest): IKernelFuture;

  /**
   * Send an "is_complete_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#code-completeness
   */
  isComplete(contents: IIsCompleteRequest): Promise<IIsCompleteReply>;

  /**
   * Send a 'comm_info_request', and return the contents of the
   * 'comm_info_reply'.
   */
  commInfo(contents: ICommInfoRequest): Promise<ICommInfoReply>;

  /**
   * Send an "input_reply" message.
   *
   * https://ipython.org/ipython-doc/dev/development/messaging.html#messages-on-the-stdin-router-dealer-sockets
   */
  sendInputReply(contents: IInputReply): void;

  /**
   * Connect to a comm, or create a new one.
   *
   * If a client-side comm already exists, it is returned.
   */
  connectToComm(targetName: string, commId?: string): IComm;

}


/**
 * Object providing a Future interface for message callbacks.
 *
 * The future will self-dispose after `isDone` is
 * set and the registered `onDone` handler is called.
 *
 * If a `reply is expected, the Future is considered done when 
 * both a `reply` message and a an `idle` iopub status message have 
 * been received.  Otherwise, it is considered done when the `idle` status is
 * received.
 */
export
interface IKernelFuture extends IDisposable {
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
   * The stdin handler for the kernel future.
   */
  onStdin: (msg: IKernelMessage) => void;

  /**
   * The iopub handler for the kernel future.
   */
  onIOPub: (msg: IKernelMessage) => void;

  /**
   * The done handler for the kernel future.
   */
  onDone: (msg: IKernelMessage) => void;
}


/**
 * KernelSpec help link interface.
 */
export 
interface IKernelSpecHelpLink {
  text: string;
  url: string;
}


/**
 * KernelSpec interface.
 */
export
interface IKernelSpec {
  language: string;
  argv: string[];
  display_name: string;
  env: any;
  codemirror_mode?: string;
  help_links?: IKernelSpecHelpLink[];
}


/**
 * KernelSpecId interface.
 */
export
interface IKernelSpecId {
  name: string;
  spec: IKernelSpec;
  resources: { [key: string]: string; };
}


/**
 * KernelSpecInfo interface
 */
export 
interface IKernelSpecIds {
  default: string;
  kernelspecs: { [key: string]: IKernelSpecId };
}


/**
 * A client side Comm interface.
 */
export
interface IComm {
  /**
   * The uuid for the comm channel.
   *
   * Read-only
   */
  commId: string;

  /** 
   * The target name for the comm channel.
   *
   * Read-only
   */
  targetName: string;

  /**
   * The onClose handler.
   */
  onClose: (data?: any) => void;

  /**
   * The onMsg handler.
   */
  onMsg: (data: any) => void;

  /**
   * Open a comm with optional data.
   */
  open(data?: any, metadata?: any): IKernelFuture;

  /**
   * Send a comm message to the kernel.
   */
  send(data: any, metadata?: any, buffers?: (ArrayBuffer | ArrayBufferView)[]): IKernelFuture;

  /**
   * Close the comm.
   */
  close(data?: any, metadata?: any): IKernelFuture;
}
