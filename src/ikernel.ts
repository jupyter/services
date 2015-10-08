// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable } from 'phosphor-disposable';

import { ISignal, Signal } from 'phosphor-signaling';

import { IAjaxOptions } from './utils';


/**
 * The options object used to initialize a kernel.
 */
export
interface IKernelOptions {
  /**
   * The kernel type (e.g. python3).
   */
  name: string;

  /**
   * The root url of the kernel server.
   */
  baseUrl: string;

  /**
   * The url to access websockets. 
   */
  wsUrl?: string;

  /**
   * The username of the kernel client. 
   */
  username?: string;

  /**
   * The unique identifier for the kernel client.
   */
  clientId?: string;
}


/**
 * Kernel identification specification.
 */
export
interface IKernelId {

  /** 
   * Unique identifier of the kernel server session.
   */
  id: string;

  /**
   * The name of the kernel. 
   */
  name: string;
}


/**
 * Kernel message header content.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#general-message-format).
 *
 * **See also:** [[IKernelMessage]]
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
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#general-message-format).
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
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
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
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
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


/**
 * Enumeration of valid Kernel status states.
 */
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
 * Contents of a `complete_request` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
 *
 * **See also:** [[ICompleteReply]], [[IKernel.complete]]
 */
export
interface ICompleteRequest {
  code: string;
  cursor_pos: number;
}


/**
 * Contents of a `complete_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
 *
 * **See also:** [[ICompleteRequest]], [[IKernel.complete]]
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
 * Contents of an `inspect_request` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
 *
 * **See also:** [[IInspectReply]], [[[IKernel.inspect]]]
 */
export
interface IInspectRequest {
  code: string;
  cursor_pos: number;
  detail_level: number;
}


/**
 * Contents of an `inspect_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
 *
 * **See also:** [[IInspectRequest]], [[IKernel.inspect]]
 */
export
interface IInspectReply {
  status: string;
  data: any;
  metadata: any;
}


/**
 * Contents of an `is_complete_request` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
 *
 * **See also:** [[IIsCompleteReply]], [[IKernel.isComplete]]
 */
export 
interface IIsCompleteRequest {
  code: string;
}


/**
 * Contents of an `is_complete_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
 *
 * **See also:** [[IIsCompleteRequest]], [[IKernel.isComplete]]
 */
export 
interface IIsCompleteReply {
  status: string;
  indent: string;
}


/**
 * Contents of an `execute_request` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
 *
 * **See also:** [[IExecuteReply]], [[IKernel.execute]]
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
 * Contents of an `execute_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
 *
 * **See also:** [[IExecuteRequest]], [[IKernel.execute]]
 */
export
interface IExecuteReply {
  execution_count: number;
  data: any;
  metadata: any;
}


/**
 * Contents of an `input_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
 *
 * **See also:** [[IKernel.input_reply]]
 */
export
interface IInputReply {
  value: string;
}


/**
 * Contents of a `comm_info_request` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm_info).
 *
 * **See also:** [[ICommInfoReply]], [[IKernel.commInfo]]
 */
export
interface ICommInfoRequest {
  target?: string;
}


/**
 * Contents of `comm_info_reply` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm_info).
 *
  * **See also:** [[ICommInfoRequest]], [[IKernel.commInfo]]
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
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
 *
 * **See also:** [[IComm.open]]
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
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm-messages).
 *
 * **See also:** [[IComm.send]]
 */
export
interface ICommMsg {
  comm_id: string;
  data: any;
}


/**
 * Contents of a `comm_close` message.
 *
 * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#tearing-down-comms).
 *
 * **See also:** [[IComm.close]]
 */
export
interface ICommClose {
  comm_id: string;
  data: any;
}


/**
 * Options for an `IKernelMessage`.
 *
 * **See also:** [[IKernelMessage]]
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
   * A signal emitted when the kernel status changes.
   */
  statusChanged: ISignal<IKernel, KernelStatus>;

  /**
   * A signal emitted for unhandled kernel message.
   */
  unhandledMessage: ISignal<IKernel, IKernelMessage>;

  /**
   * A signal emitted for unhandled comm open message.
   */
  commOpened: ISignal<IKernel, ICommOpen>;

  /**
   * The id of the server-side kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  id: string;

  /**
   * The name of the server-side kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  name: string;

  /**
   * The client username.
   *
   * #### Notes
   * This is a read-only property.
   */
   username: string;

  /**
   * The client unique id.
   *
   * #### Notes
   * This is a read-only property.
   */
  clientId: string;

  /**
   * The current status of the kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  status: KernelStatus;

  /**
   * Send a shell message to the kernel.
   *
   * #### Notes
   * Send a message to the kernel's shell channel, yielding a future object
   * for accepting replies.  
   *
   * If `expectReply` is given and `true`, the future is disposed when both a 
   * shell reply and an idle status message are received.   If `expectReply` 
   * is not given or is `false`, the future is disposed when an idle status 
   * message is received.
   * 
   * All replies are validated as valid kernel messages.
   * 
   * If the kernel status is `Dead`, this will throw an error.
   */
  sendShellMessage(msg: IKernelMessage, expectReply?: boolean): IKernelFuture;

  /**
   * Interrupt a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the 
   * request fails or the response is invalid.
   */
  interrupt(ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Restart a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the 
   * request fails or the response is invalid.
   */
  restart(ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Shutdown a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * On a valid response, closes the websocket and disposes of the kernel 
   * object, and fulfills the promise.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the 
   * request fails or the response is invalid.
   */
  shutdown(ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Send a `kernel_info_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   *
   * Fulfills with the `kernel_info_response` content when the shell reply is 
   * received and validated.
   */
  kernelInfo(): Promise<IKernelInfo>;

  /**
   * Send a `complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
   *
   * Fulfills with the `complete_reply` content when the shell reply is 
   * received and validated.
   */
  complete(contents: ICompleteRequest): Promise<ICompleteReply>;

  /**
   * Send an `inspect_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
   *
   * Fulfills with the `inspect_reply` content when the shell reply is 
   * received and validated.
   */
  inspect(contents: IInspectRequest): Promise<IInspectReply>;

  /**
   * Send an `execute_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
   *
   * Future `onReply` is called with the `execute_reply` content when the 
   * shell reply is received and validated.
   *
   * **See also:** [[IExecuteReply]]
   */
  execute(contents: IExecuteRequest): IKernelFuture;

  /**
   * Send an `is_complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
   *
   * Fulfills with the `is_complete_response` content when the shell reply is 
   * received and validated.
   */
  isComplete(contents: IIsCompleteRequest): Promise<IIsCompleteReply>;

  /**
   * Send a `comm_info_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm_info).
   *
   * Fulfills with the `comm_info_reply` content when the shell reply is 
   * received and validated.
   */
  commInfo(contents: ICommInfoRequest): Promise<ICommInfoReply>;

  /**
   * Send an `input_reply` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   */
  sendInputReply(contents: IInputReply): void;

  /**
   * Connect to a comm, or create a new one.
   *
   * #### Notes
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
 * If a `reply` is expected, the Future is considered done when 
 * both a `reply` message and a an `idle` iopub status message have 
 * been received.  Otherwise, it is considered done when the `idle` status is
 * received.
 */
export
interface IKernelFuture extends IDisposable {
  /**
   * Test whether the future is done.
   *
   * #### Notes
   * This is a read-only property.
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
   * The unique id for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  commId: string;

  /** 
   * The target name for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  targetName: string;

  /**
   * Callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[ICommClose]], [[close]]
   */
  onClose: (data?: any) => void;

  /**
   * Callback for a comm message received event.
   *
   * **See also:** [[ICommMsg]]
   */
  onMsg: (data: any) => void;

  /**
   * Open a comm with optional data and metadata.
   *
   * #### Notes
   * This sends a `comm_open` message to the server.
   *
   * **See also:** [[ICommOpen]]
   */
  open(data?: any, metadata?: any): IKernelFuture;

  /**
   * Send a `comm_msg` message to the kernel.
   *
   * #### Notes
   * This is a no-op if the comm has been closed.
   *
   * **See also:** [[ICommMsg]]
   */
  send(data: any, metadata?: any, buffers?: (ArrayBuffer | ArrayBufferView)[]): IKernelFuture;

  /**
   * Close the comm.
   *
   * #### Notes
   * This will send a `comm_close` message to the kernel, and call the
   * `onClose` callback if set.
   *
   * This is a no-op if the comm is already closed.
   *
   * **See also:** [[ICommClose]], [[onClose]]
   */
  close(data?: any, metadata?: any): IKernelFuture;
}
