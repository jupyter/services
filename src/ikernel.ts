// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal
} from 'phosphor-signaling';

import {
  JSONObject, JSONValue
} from './json';

import {
  IAjaxSettings
} from './utils';


/**
 * Interface of a Kernel object.
 *
 * #### Notes
 * The Kernel object is tied to the lifetime of the Kernel id, which is
 * a unique id for the Kernel session on the server.  The Kernel object
 * manages a websocket connection internally, and will auto-restart if the
 * websocket temporarily loses connection.  Restarting creates a new Kernel
 * process on the server, but preserves the Kernel id.
 */
export
interface IKernel extends IDisposable {
  /**
   * A signal emitted when the kernel status changes.
   */
  statusChanged: ISignal<IKernel, IKernel.Status>;

  /**
   * A signal emitted for iopub kernel messages.
   */
  iopubMessage: ISignal<IKernel, KernelMessage.IIOPubMessage>;

  /**
   * A signal emitted for unhandled kernel message.
   */
  unhandledMessage: ISignal<IKernel, KernelMessage.IMessage>;

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
   * The model associated with the kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  model: IKernel.IModel;

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
  status: IKernel.Status;

  /**
   * Send a shell message to the kernel.
   *
   * #### Notes
   * Send a message to the kernel's shell channel, yielding a future object
   * for accepting replies.
   *
   * If `expectReply` is given and `true`, the future is disposed when both a
   * shell reply and an idle status message are received. If `expectReply`
   * is not given or is `false`, the future is disposed when an idle status
   * message is received.
   *
   * If `disposeOnDone` is given and `false`, the Future will not be disposed
   * of when the future is done, instead relying on the caller to dispose of it.
   * This allows for the handling of out-of-order output from ill-behaved kernels.
   *
   * All replies are validated as valid kernel messages.
   *
   * If the kernel status is `Dead`, this will throw an error.
   */
  sendShellMessage(msg: KernelMessage.IShellMessage, expectReply?: boolean, disposeOnDone?: boolean): IKernel.IFuture;

  /**
   * Interrupt a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the
   * request fails or the response is invalid.
   */
  interrupt(): Promise<void>;

  /**
   * Restart a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
   *
   * Any existing Future or Comm objects are cleared.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the
   * request fails or the response is invalid.
   */
  restart(): Promise<void>;

  /**
   * Reconnect to a disconnected kernel. This is not actually a
   * standard HTTP request, but useful function nonetheless for
   * reconnecting to the kernel if the connection is somehow lost.
   */
  reconnect(): Promise<void>;

  /**
   * Shutdown a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * On a valid response, closes the websocket and disposes of the kernel
   * object, and fulfills the promise.
   *
   * The promise will be rejected if the kernel status is `Dead` or if the
   * request fails or the response is invalid.
   */
  shutdown(): Promise<void>;

  /**
   * Send a `kernel_info_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   *
   * Fulfills with the `kernel_info_response` content when the shell reply is
   * received and validated.
   */
  kernelInfo(): Promise<KernelMessage.IInfoReplyMsg>;

  /**
   * Send a `complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
   *
   * Fulfills with the `complete_reply` content when the shell reply is
   * received and validated.
   */
  complete(content: KernelMessage.ICompleteRequest): Promise<KernelMessage.ICompleteReplyMsg>;

  /**
   * Send an `inspect_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
   *
   * Fulfills with the `inspect_reply` content when the shell reply is
   * received and validated.
   */
  inspect(content: KernelMessage.IInspectRequest): Promise<KernelMessage.IInspectReplyMsg>;

  /**
   * Send a `history_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * Fulfills with the `history_reply` content when the shell reply is
   * received and validated.
   */
  history(content: KernelMessage.IHistoryRequest): Promise<KernelMessage.IHistoryReplyMsg>;

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
  execute(content: KernelMessage.IExecuteRequest, disposeOnDone?: boolean): IKernel.IFuture;

  /**
   * Send an `is_complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
   *
   * Fulfills with the `is_complete_response` content when the shell reply is
   * received and validated.
   */
  isComplete(content: KernelMessage.IIsCompleteRequest): Promise<KernelMessage.IIsCompleteReplyMsg>;

  /**
   * Send a `comm_info_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm_info).
   *
   * Fulfills with the `comm_info_reply` content when the shell reply is
   * received and validated.
   */
  commInfo(content: KernelMessage.ICommInfoRequest): Promise<KernelMessage.ICommInfoReplyMsg>;

  /**
   * Send an `input_reply` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   */
  sendInputReply(content: KernelMessage.IInputReply): void;

  /**
   * Connect to a comm, or create a new one.
   *
   * #### Notes
   * If a client-side comm already exists, it is returned.
   */
  connectToComm(targetName: string, commId?: string): IKernel.IComm;

  /**
   * Register a comm target handler.
   *
   * @param targetName - The name of the comm target.
   *
   * @param callback - The callback invoked for a comm open message.
   *
   * @returns A disposable used to unregister the comm target.
   *
   * #### Notes
   * Only one comm target can be registered at a time, an existing
   * callback will be overidden.  A registered comm target handler will take
   * precedence over a comm which specifies a `target_module`.
   */
  registerCommTarget(targetName: string, callback: (comm: IKernel.IComm, msg: KernelMessage.ICommOpenMsg) => void): IDisposable;

  /**
   * Register an IOPub message hook.
   *
   * @param msg_id - The parent_header message id in messages the hook should intercept.
   *
   * @param hook - The callback invoked for the message.
   *
   * @returns A disposable used to unregister the message hook.
   *
   * #### Notes
   * The IOPub hook system allows you to preempt the handlers for IOPub messages with a
   * given parent_header message id. The most recently registered hook is run first.
   * If the hook returns false, any later hooks and the future's onIOPub handler will not run.
   * If a hook throws an error, the error is logged to the console and the next hook is run.
   * If a hook is registered during the hook processing, it won't run until the next message.
   * If a hook is disposed during the hook processing, it will be deactivated immediately.
   *
   * See also [[IFuture.registerMessageHook]].
   */
  registerMessageHook(msg_id: string, hook: (msg: KernelMessage.IIOPubMessage) => boolean): IDisposable;

  /**
   * Get the kernel spec associated with the kernel.
   */
  getKernelSpec(): Promise<IKernel.ISpec>;

  /**
   * Optional default settings for ajax requests, if applicable.
   */
  ajaxSettings?: IAjaxSettings;
}

/**
 * A namespace for kernel types, interfaces, and type checker functions.
 */
export
namespace IKernel {
  /**
   * The options object used to initialize a kernel.
   */
  export
  interface IOptions extends JSONObject {
    /**
     * The kernel type (e.g. python3).
     */
    name?: string;

    /**
     * The root url of the kernel server.
     * Default is location.origin in browsers, notebook-server default otherwise.
     */
    baseUrl?: string;

    /**
     * The url to access websockets, if different from baseUrl.
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

    /**
     * The default ajax settings to use for the kernel.
     */
    ajaxSettings?: IAjaxSettings;
  }

  /**
   * Object which manages kernel instances.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the specs change.
     */
    specsChanged: ISignal<IManager, ISpecModels>;

    /**
     * A signal emitted when the running kernels change.
     */
    runningChanged: ISignal<IManager, IModel[]>;

    /**
     * Get the available kernel specs.
     *
     * #### Notes
     * This will emit a [[specsChanged]] signal if the value
     * has changed since the last fetch.
     */
    getSpecs(options?: IOptions): Promise<ISpecModels>;

    /**
     * Get a list of running kernels.
     *
     * #### Notes
     * This will emit a [[runningChanged]] signal if the value
     * has changed since the last fetch.
     */
    listRunning(options?: IOptions): Promise<IModel[]>;

    /**
     * Start a new kernel.
     */
    startNew(options?: IOptions): Promise<IKernel>;

    /**
     * Find a kernel by id.
     */
    findById(id: string, options?: IOptions): Promise<IModel>;

    /**
     * Connect to an existing kernel.
     */
    connectTo(id: string, options?: IOptions): Promise<IKernel>;

    /**
     * Shut down a kernel by id.
     */
    shutdown(id: string, options?: IOptions): Promise<void>;
  }

  /**
   * Object providing a Future interface for message callbacks.
   *
   * The future will self-dispose after `isDone` is
   * set and the registered `onDone` handler is called.
   *
   * If a `reply` is expected, the Future is considered done when
   * both a `reply` message and an `idle` iopub status message have
   * been received.  Otherwise, it is considered done when the `idle` status is
   * received.
   */
  export
  interface IFuture extends IDisposable {
    /**
     * The original outgoing message.
     */
    msg: KernelMessage.IShellMessage;

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
    onReply: (msg: KernelMessage.IShellMessage) => void;

    /**
     * The stdin handler for the kernel future.
     */
    onStdin: (msg: KernelMessage.IStdinMessage) => void;

    /**
     * The iopub handler for the kernel future.
     */
    onIOPub: (msg: KernelMessage.IIOPubMessage) => void;

    /**
     * The done handler for the kernel future.
     */
    onDone: () => void;

    /**
     * Register hook for IOPub messages.
     *
     * @param hook - The callback invoked for an IOPub message.
     *
     * #### Notes
     * The IOPub hook system allows you to preempt the handlers for IOPub messages handled
     * by the future. The most recently registered hook is run first.
     * If the hook returns false, any later hooks and the future's onIOPub handler will not run.
     * If a hook throws an error, the error is logged to the console and the next hook is run.
     * If a hook is registered during the hook processing, it won't run until the next message.
     * If a hook is removed during the hook processing, it will be deactivated immediately.
     */
    registerMessageHook(hook: (msg: KernelMessage.IIOPubMessage) => boolean): void;

    /**
     * Remove a hook for IOPub messages.
     *
     * @param hook - The hook to remove.
     *
     * #### Notes
     * If a hook is removed during the hook processing, it will be deactivated immediately.
     */
    removeMessageHook(hook: (msg: KernelMessage.IIOPubMessage) => boolean): void;
  }

  /**
   * A client side Comm interface.
   */
  export
  interface IComm extends IDisposable {
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
     */
    onClose: (msg: KernelMessage.ICommCloseMsg) => void;

    /**
     * Callback for a comm message received event.
     */
    onMsg: (msg: KernelMessage.ICommMsgMsg) => void;

    /**
     * Open a comm with optional data and metadata.
     *
     * #### Notes
     * This sends a `comm_open` message to the server.
     */
    open(data?: JSONValue, metadata?: JSONObject): IFuture;

    /**
     * Send a `comm_msg` message to the kernel.
     *
     * #### Notes
     * This is a no-op if the comm has been closed.
     */
    send(data: JSONValue, metadata?: JSONObject, buffers?: (ArrayBuffer | ArrayBufferView)[], disposeOnDone?: boolean): IFuture;

    /**
     * Close the comm.
     *
     * #### Notes
     * This will send a `comm_close` message to the kernel, and call the
     * `onClose` callback if set.
     *
     * This is a no-op if the comm is already closed.
     */
    close(data?: JSONValue, metadata?: JSONObject): IFuture;
  }

  /**
   * The valid Kernel status states.
   */
  export
  type Status = 'unknown' | 'starting' | 'reconnecting' | 'idle' | 'busy' | 'restarting' | 'dead';

  /**
   * The kernel model provided by the server.
   *
   * #### Notes
   * See the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels).
   */
  export
  interface IModel extends JSONObject {
    /**
     * Unique identifier of the kernel server session.
     */
    id?: string;

    /**
     * The name of the kernel.
     */
    name?: string;
  }

  /**
   * Kernel Spec help link interface.
   */
  export
  interface ISpecHelpLink extends JSONObject {
    text: string;
    url: string;
  }

  /**
   * Kernel Spec interface.
   *
   * #### Notes
   * See [Kernel specs](http://jupyter-client.readthedocs.io/en/latest/kernels.html#kernelspecs).
   */
  export
  interface ISpec extends JSONObject {
    language: string;
    argv: string[];
    display_name: string;
    env: JSONObject;
    codemirror_mode?: string;
    help_links?: ISpecHelpLink[];
  }

  /**
   * KernelSpec model provided by the server for a specific kernel.
   *
   * #### Notes
   * See the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
   */
  export
  interface ISpecModel extends JSONObject {
    name: string;
    spec: ISpec;
    resources: { [key: string]: string; };
  }

  /**
   * KernelSpec model provided by the server for all kernels.
   *
   * #### Notes
   * See the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
   */
  export
  interface ISpecModels extends JSONObject {
    default: string;
    kernelspecs: { [key: string]: ISpecModel };
  }
}


/**
 * A namespace for kernel messages.
 */
export
namespace KernelMessage {
  /**
   * Kernel message header content.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#general-message-format).
   *
   * **See also:** [[IMessage]]
   */
  export
  interface IHeader extends JSONObject {
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
  interface IMessage {
    header: IHeader;
    parent_header: IHeader | {};
    metadata: JSONObject;
    content: JSONObject;
    channel: Channel;
    buffers: (ArrayBuffer | ArrayBufferView)[];
  }

  /**
   * The valid channel names.
   */
  export
  type Channel = 'shell' | 'iopub' | 'stdin';

  /**
   * A kernel message on the `'shell'` channel.
   */
  export
  interface IShellMessage extends IMessage {
    channel: 'shell';
  }

  /**
   * A kernel message on the `'iopub'` channel.
   */
  export
  interface IIOPubMessage extends IMessage {
    channel: 'iopub';
  }

  /**
   * A kernel message on the `'stdin'` channel.
   */
  export
  interface IStdinMessage extends IMessage {
    channel: 'stdin';
  }

  /**
   * A `'stream'` message on the `'iopub'` channel.
   *
   * See [Streams](http://jupyter-client.readthedocs.org/en/latest/messaging.html#streams-stdout-stderr-etc).
   */
  export
  interface IStreamMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      name: 'stdout' | 'stderr';
      text: string;
    };
  }

  /**
   * Test whether a kernel message is a `'stream'` message.
   */
  export
  function isStreamMsg(msg: IMessage): msg is IStreamMsg {
    return msg.header.msg_type === 'stream';
  }

  /**
   * A `'display_data'` message on the `'iopub'` channel.
   *
   * See [Display data](http://jupyter-client.readthedocs.org/en/latest/messaging.html#display-data).
   */
  export
  interface IDisplayDataMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      source: string;
      data: { [key: string]: string };
      metadata: JSONObject;
    };
  }

  /**
   * Test whether a kernel message is an `'display_data'` message.
   */
  export
  function isDisplayDataMsg(msg: IMessage): msg is IDisplayDataMsg {
    return msg.header.msg_type === 'display_data';
  }

  /**
   * An `'execute_input'` message on the `'iopub'` channel.
   *
   * See [Code inputs](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-inputs).
   */
  export
  interface IExecuteInputMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      code: string;
      execution_count: number;
    };
  }

  /**
   * Test whether a kernel message is an `'execute_input'` message.
   */
  export
  function isExecuteInputMsg(msg: IMessage): msg is IExecuteInputMsg {
    return msg.header.msg_type === 'execute_input';
  }

  /**
   * An `'execute_result'` message on the `'iopub'` channel.
   *
   * See [Execution results](http://jupyter-client.readthedocs.org/en/latest/messaging.html#id4).
   */
  export
  interface IExecuteResultMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      execution_count: number;
      data: { [key: string]: string };
      metadata: JSONObject;
    };
  }

  /**
   * Test whether a kernel message is an `'execute_result'` message.
   */
  export
  function isExecuteResultMsg(msg: IMessage): msg is IExecuteResultMsg {
    return msg.header.msg_type === 'execute_result';
  }

  /**
   * A `'error'` message on the `'iopub'` channel.
   *
   * See [Execution errors](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execution-errors).
   */
  export
  interface IErrorMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      execution_count: number;
      ename: string;
      evalue: string;
      traceback: string[];
    };
  }

  /**
   * Test whether a kernel message is an `'error'` message.
   */
  export
  function isErrorMsg(msg: IMessage): msg is IErrorMsg {
    return msg.header.msg_type === 'error';
  }

  /**
   * A `'status'` message on the `'iopub'` channel.
   *
   * See [Kernel status](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-status).
   */
  export
  interface IStatusMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      execution_state: IKernel.Status;
    };
  }

  /**
   * Test whether a kernel message is a `'status'` message.
   */
  export
  function isStatusMsg(msg: IMessage): msg is IStatusMsg {
    return msg.header.msg_type === 'status';
  }

  /**
   * A `'clear_output'` message on the `'iopub'` channel.
   *
   * See [Clear output](http://jupyter-client.readthedocs.org/en/latest/messaging.html#clear-output).
   */
  export
  interface IClearOutputMsg extends IIOPubMessage {
    content: {
      [ key: string ]: JSONValue;
      wait: boolean;
    };
  }

  /**
   * Test whether a kernel message is a `'clear_output'` message.
   */
  export
  function isClearOutputMsg(msg: IMessage): msg is IClearOutputMsg {
    return msg.header.msg_type === 'clear_output';
  }

  /**
   * A `'comm_open'` message on the `'iopub'` channel.
   *
   * See [Comm open](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface ICommOpenMsg extends IIOPubMessage {
    content: ICommOpen;
  }

  /**
   * The content of a `'comm_open'` message.  The message can
   * be received on the `'iopub'` channel or send on the `'shell'` channel.
   *
   * See [Comm open](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface ICommOpen extends JSONObject {
    [ key: string ]: JSONValue;
    comm_id: string;
    target_name: string;
    data: JSONValue;
    target_module?: string;
  }

  /**
   * Test whether a kernel message is a `'comm_open'` message.
   */
  export
  function isCommOpenMsg(msg: IMessage): msg is ICommOpenMsg {
    return msg.header.msg_type === 'comm_open';
  }

  /**
   * A `'comm_close'` message on the `'iopub'` channel.
   *
   * See [Comm close](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface ICommCloseMsg extends IIOPubMessage {
    content: ICommClose;
  }

  /**
   * The content of a `'comm_close'` method.  The message can
   * be received on the `'iopub'` channel or send on the `'shell'` channel.
   *
   * See [Comm close](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
   export
   interface ICommClose extends JSONObject {
      [ key: string ]: JSONValue;
      comm_id: string;
      data: JSONValue;
   }

  /**
   * Test whether a kernel message is a `'comm_close'` message.
   */
  export
  function isCommCloseMsg(msg: IMessage): msg is ICommCloseMsg {
    return msg.header.msg_type === 'comm_close';
  }

  /**
   * A `'comm_msg'` message on the `'iopub'` channel.
   *
   * See [Comm msg](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface ICommMsgMsg extends IIOPubMessage {
    content: ICommMsg;
  }

  /**
   * The content of a `'comm_msg'` message.  The message can
   * be received on the `'iopub'` channel or send on the `'shell'` channel.
   *
   * See [Comm msg](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface ICommMsg extends JSONObject {
    [ key: string ]: JSONValue;
    comm_id: string;
    data: JSONValue;
  }

  /**
   * Test whether a kernel message is a `'comm_msg'` message.
   */
  export
  function isCommMsgMsg(msg: IMessage): msg is ICommMsgMsg {
    return msg.header.msg_type === 'comm_msg';
  }

  /**
   * A `'kernel_info_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   */
  export
  interface IInfoReplyMsg extends IShellMessage {
    content: IInfoReply;
  }

  /**
   * The kernel info content.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   */
  export
  interface IInfoReply extends JSONObject {
    [ key: string ]: JSONValue;
    protocol_version: string;
    implementation: string;
    implementation_version: string;
    language_info: ILanguageInfo;
    banner: string;
    help_links: { [key: string]: string; };
  }

  /**
   * The kernel language information specification.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   */
  export
  interface ILanguageInfo {
    [ key: string ]: JSONValue;
    name: string;
    version: string;
    mimetype: string;
    file_extension: string;
    pygments_lexer?: string;
    codemirror_mode?: string | JSONObject;
    nbconverter_exporter?: string;
  }

  /**
   * The content of a  `'complete_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
   *
   * **See also:** [[ICompleteReply]], [[IKernel.complete]]
   */
  export
  interface ICompleteRequest extends JSONObject {
    [ key: string ]: JSONValue;
    code: string;
    cursor_pos: number;
  }

  /**
   * A `'complete_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
   *
   * **See also:** [[ICompleteRequest]], [[IKernel.complete]]
   */
  export
  interface ICompleteReplyMsg extends IShellMessage {
    content: {
      [ key: string ]: JSONValue;
      matches: string[];
      cursor_start: number;
      cursor_end: number;
      metadata: JSONObject;
      status: 'ok' | 'error';
    };
  }

  /**
   * The content of an `'inspect_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
   *
   * **See also:** [[IInspectReply]], [[[IKernel.inspect]]]
   */
  export
  interface IInspectRequest extends JSONObject {
    [ key: string ]: JSONValue;
    code: string;
    cursor_pos: number;
    detail_level: number;
  }

  /**
   * A `'inspect_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
   *
   * **See also:** [[IInspectRequest]], [[IKernel.inspect]]
   */
  export
  interface IInspectReplyMsg extends IShellMessage {
    content: {
      [ key: string ]: JSONValue;
      status: string;
      found: boolean;
      data: JSONObject;
      metadata: JSONObject;
    };
  }

  /**
   * The content of a `'history_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * **See also:** [[IHistoryReply]], [[[IKernel.history]]]
   */
  export
  interface IHistoryRequest extends JSONObject {
    [ key: string ]: JSONValue;
    output: boolean;
    raw: boolean;
    hist_access_type: HistAccess;
    session?: number;
    start?: number;
    stop?: number;
    n?: number;
    pattern?: string;
    unique?: boolean;
  }

  /**
   * A `'history_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * **See also:** [[IHistoryRequest]], [[IKernel.history]]
   */
  export
  interface IHistoryReplyMsg extends IShellMessage {
    content: {
      [ key: string ]: JSONValue;
      history: JSONValue[];
    };
  }

  /**
   * The history access settings.
   */
  export
  type HistAccess = 'range' | 'tail' | 'search';

  /**
   * The content of an `'is_complete_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
   *
   * **See also:** [[IIsCompleteReply]], [[IKernel.isComplete]]
   */
  export
  interface IIsCompleteRequest extends JSONObject {
    [ key: string ]: JSONValue;
    code: string;
  }

  /**
   * An `'is_complete_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
   *
   * **See also:** [[IIsCompleteRequest]], [[IKernel.isComplete]]
   */
  export
  interface IIsCompleteReplyMsg extends IShellMessage {
    content: {
      [ key: string ]: JSONValue;
      status: string;
      indent: string;
    };
  }

  /**
   * The content of an `'execute_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
   *
   * **See also:** [[IExecuteReply]], [[IKernel.execute]]
   */
  export
  interface IExecuteRequest extends IExecuteOptions {
    code: string;
  }

  /**
   * The options used to configure an execute request.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
   */
  export
  interface IExecuteOptions extends JSONObject {
    [ key: string ]: JSONValue;

    /**
     * Whether to execute the code as quietly as possible.
     * The default is `false`.
     */
    silent?: boolean;

    /**
     * Whether to store history of the execution.
     * The default `true` if silent is False.
     * It is forced to  `false ` if silent is `true`.
     */
    store_history?: boolean;

    /**
     * A mapping of names to expressions to be evaluated in the
     * kernel's interactive namespace.
     */
    user_expressions?: JSONObject;

    /**
     * Whether to allow stdin requests.
     * The default is `true`.
     */
    allow_stdin?: boolean;

    /**
     * Whether to the abort execution queue on an error.
     * The default is `false`.
     */
    stop_on_error?: boolean;
  }

  /**
   * An `'execute_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results).
   *
   * **See also:** [[IExecuteRequest]], [[IKernel.execute]]
   */
  export
  interface IExecuteReplyMsg extends IShellMessage {
    content: IExecuteReply;
  }

  /**
   * The content of an `execute-reply` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results).
   */
  export
  interface IExecuteReply extends JSONObject {
    status: 'ok' | 'error' | 'abort';
    execution_count: number;
  }

  /**
   * The `'execute_reply'` contents for an `'ok'` status.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results).
   */
  export
  interface IExecuteOkReply extends IExecuteReply {
    /**
     * A list of payload objects.
     * Payloads are considered deprecated.
     * The only requirement of each payload object is that it have a 'source'
     * key, which is a string classifying the payload (e.g. 'page').
     */
    payload?: JSONObject[];

    /**
     * Results for the user_expressions.
     */
    user_expressions: JSONObject;
  }

  /**
   * The `'execute_reply'` contents for an `'error'` status.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results).
   */
  export
  interface IExecuteErrorReply extends IExecuteReply {
    /**
     * The exception name.
     */
    ename: string;

    /**
     * The Exception value.
     */
    evalue: string;

    /**
     * A list of traceback frames.
     */
    traceback: string[];
  }

  /**
   * An `'input_request'` message on the `'stdin'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   */
  export
  interface IInputRequestMsg extends IStdinMessage {
    content: IInputRequest;
  }

  /**
   * The content of an `'input_request'` message.
   */
  export
  interface IInputRequest extends JSONObject {
    /**
     * The text to show at the prompt.
     */
    prompt: string;

    /**
     * Whether the request is for a password.
     * If so, the frontend shouldn't echo input.
     */
    password: boolean;
  };

  /**
   * Test whether a kernel message is an `'input_request'` message.
   */
  export
  function isInputRequestMsg(msg: IMessage): msg is IInputRequestMsg {
    return msg.header.msg_type === 'input_request';
  }

  /**
   * The content of an `'input_reply'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   *
   * **See also:** [[IKernel.input_reply]]
   */
  export
  interface IInputReply extends JSONObject {
    value: string;
  }

  /**
   * The content of a `'comm_info_request'` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm-info).
   *
   * **See also:** [[ICommInfoReply]], [[IKernel.commInfo]]
   */
  export
  interface ICommInfoRequest extends JSONObject {
    [ key: string ]: JSONValue;
    target?: string;
  }

  /**
   * A `'comm_info_reply'` message on the `'stream'` channel.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm-info).
   *
   * **See also:** [[ICommInfoRequest]], [[IKernel.commInfo]]
   */
  export
  interface ICommInfoReplyMsg extends IShellMessage {
    content: {
      [ key: string ]: JSONValue;
      /**
       * Mapping of comm ids to target names.
       */
      comms: { [id: string]: string };
    };
  }

  /**
   * Options for an `IMessage`.
   *
   * **See also:** [[IMessage]]
   */
  export
  interface IOptions {
    [ key: string ]: JSONValue;
    msgType: string;
    channel: Channel;
    session: string;
    username?: string;
    msgId?: string;
  }
}
