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
  IAjaxSettings
} from 'jupyter-js-utils';

import {
  JSONObject, JSONPrimitive, JSONValue
} from './json';


/**
 * A namespace for kernel types, interfaces, and type checker functions.
 */
export namespace kernel {
  /**
   * Kernel model specification.
   */
  export
  interface IModel {

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
   * Kernel message header content.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#general-message-format).
   *
   * **See also:** [[IMessage]]
   */
  export
  interface IMessageHeader {
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
    header: IMessageHeader;
    parent_header: IMessageHeader | {};
    metadata: JSONObject;
    content: JSONObject;
    channel: string;
    buffers: (ArrayBuffer | ArrayBufferView)[];
  }

  /**
   * IOPub stream kernel message specification.
   *
   * See [Streams](http://jupyter-client.readthedocs.org/en/latest/messaging.html#streams-stdout-stderr-etc).
   */
  export
  interface IIOPubStreamMessage extends IMessage {
    content: {
      [ key: string ]: string;
      name: string;
      text: string;
    };
  }

  /**
   * Check if a kernel message is an iopub stream message.
   */
  export
  function isStreamMessage(msg: IMessage): msg is IIOPubStreamMessage {
    return msg.header.msg_type === 'stream';
  }

  /**
   * IOPub display_data kernel message specification.
   *
   * See [Display data](http://jupyter-client.readthedocs.org/en/latest/messaging.html#display-data).
   */
  export
  interface IIOPubDisplayDataMessage extends IMessage {
    content: {
      [ key: string ]: JSONValue;
      source: string;
      data: { [key: string]: string };
      metadata: JSONObject;
    };
  }

  /**
   * Check if a kernel message is an iopub display_data message.
   */
  export
  function isDisplayDataMessage(msg: IMessage): msg is IIOPubDisplayDataMessage {
    return msg.header.msg_type === 'display_data';
  }

  /**
   * IOPub execute_input kernel message specification.
   *
   * See [Code inputs](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-inputs).
   */
  export
  interface IIOPubExecuteInputMessage extends IMessage {
    content: {
      [ key: string ]: JSONPrimitive;
      code: string;
      execution_count: number;
    };
  }

  /**
   * Check if a kernel message is an iopub execute_input message.
   */
  export
  function isExecuteInputMessage(msg: IMessage): msg is IIOPubExecuteInputMessage {
    return msg.header.msg_type === 'execute_input';
  }

  /**
   * IOPub execute_result kernel message specification.
   *
   * See [Execution results](http://jupyter-client.readthedocs.org/en/latest/messaging.html#id4).
   */
  export
  interface IIOPubExecuteResultMessage extends IMessage {
    content: {
      [ key: string ]: JSONValue;
      execution_count: number;
      data: { [key: string]: string };
      metadata: JSONObject;
    };
  }

  /**
   * Check if a kernel message is an iopub execute_result message.
   */
  export
  function isExecuteResultMessage(msg: IMessage): msg is IIOPubExecuteResultMessage {
    return msg.header.msg_type === 'execute_result';
  }

  /**
   * IOPub error kernel message specification.
   *
   * See [Execution errors](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execution-errors).
   */
  export
  interface IIOPubErrorMessage extends IMessage {
    content: {
      [ key: string ]: JSONValue;
      execution_count: number;
      ename: string;
      evalue: string;
      traceback: string[];
    };
  }

  /**
   * Check if a kernel message is an iopub error message.
   */
  export
  function isErrorMessage(msg: IMessage): msg is IIOPubErrorMessage {
    return msg.header.msg_type === 'error';
  }

  /**
   * IOPub kernel status message specification.
   *
   * See [Kernel status](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-status).
   */
  export
  interface IIOPubStatusMessage extends IMessage {
    content: {
      [ key: string ]: string;
      execution_state: string;
    };
  }

  /**
   * Check if a kernel message is an iopub status message.
   */
  export
  function isStatusMessage(msg: IMessage): msg is IIOPubStatusMessage {
    return msg.header.msg_type === 'status';
  }

  /**
   * IOPub clear_output kernel message specification.
   *
   * See [Clear output](http://jupyter-client.readthedocs.org/en/latest/messaging.html#clear-output).
   */
  export
  interface IIOPubClearOutputMessage extends IMessage {
    content: {
      [ key: string ]: boolean;
      wait: boolean;
    };
  }

  /**
   * Check if a kernel message is an iopub clear_output message.
   */
  export
  function isClearOutputMessage(msg: IMessage): msg is IIOPubClearOutputMessage {
    return msg.header.msg_type === 'clear_output';
  }

  /**
   * IOPub comm_open kernel message specification.
   *
   * See [Comm open](http://jupyter-client.readthedocs.org/en/latest/messaging.html#opening-a-comm).
   */
  export
  interface IIOPubCommOpenMessage extends IMessage {
    content: ICommOpen;
  }

  /**
   * Check if a kernel message is an iopub comm_open message.
   */
  export
  function isCommOpenMessage(msg: IMessage): msg is IIOPubCommOpenMessage {
    return msg.header.msg_type === 'comm_open';
  }

  /**
   * Kernel information specification.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   */
  export
  interface IInfo {
    protocol_version: string;
    implementation: string;
    implementation_version: string;
    language_info: ILanguageInfo;
    banner: string;
    help_links: { [key: string]: string; };
  }

  /**
   * Kernel language information specification.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   */
  export
  interface ILanguageInfo {
    name: string;
    version: string;
    mimetype: string;
    file_extension: string;
    pygments_lexer?: string;
    codemirror_mode?: string | JSONObject;
    nbconverter_exporter?: string;
  }

  /**
   * The  valid Kernel status states.
   */
  export
  type Status = 'unknown' | 'starting' | 'reconnecting' | 'idle' | 'busy' | 'restarting' | 'dead';

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
    metadata: JSONObject;
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
    found: boolean;
    data: JSONObject;
    metadata: JSONObject;
  }

  /**
   * Contents of an `history_request` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * **See also:** [[IHistoryReply]], [[[IKernel.history]]]
   */
  export
  interface IHistoryRequest {
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
   * Contents of an `history_reply` message.
   *
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * **See also:** [[IHistoryRequest]], [[IKernel.history]]
   */
  export
  interface IHistoryReply {
    history: JSONValue[];
  }

  /**
   * The history access settings.
   */
  export
  type HistAccess = 'range' | 'tail' | 'search';

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
    user_expressions?: JSONObject;
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
    data: JSONObject;
    metadata: JSONObject;
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
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm-info).
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
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#comm-info).
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
    [ key: string ]: JSONValue;
    comm_id: string;
    target_name: string;
    data: JSONObject;
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
    [ key: string ]: JSONValue;
    comm_id: string;
    data: JSONObject;
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
    [ key: string ]: JSONValue;
    comm_id: string;
    data: JSONObject;
  }

  /**
   * Options for an `IMessage`.
   *
   * **See also:** [[IMessage]]
   */
  export
  interface IMessageOptions {
    msgType: string;
    channel: string;
    session: string;
    username?: string;
    msgId?: string;
  }

  /**
   * The options object used to initialize a kernel.
   */
  export
  interface IOptions {
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
    statusChanged: ISignal<IKernel, Status>;

    /**
     * A signal emitted for iopub kernel messages.
     */
    iopubMessage: ISignal<IKernel, IMessage>;

    /**
     * A signal emitted for unhandled kernel message.
     */
    unhandledMessage: ISignal<IKernel, IMessage>;

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
    status: Status;

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
    sendShellMessage(msg: IMessage, expectReply?: boolean, disposeOnDone?: boolean): IFuture;

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
    kernelInfo(): Promise<IInfo>;

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
     * Send a `history_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
     *
     * Fulfills with the `history_reply` content when the shell reply is
     * received and validated.
     */
    history(contents: IHistoryRequest): Promise<IHistoryReply>;

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
    execute(contents: IExecuteRequest, disposeOnDone?: boolean): IFuture;

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
    registerCommTarget(targetName: string, callback: (comm: IComm, msg: IIOPubCommOpenMessage) => void): IDisposable;

    /**
     * Get the kernel spec associated with the kernel.
     */
    getKernelSpec(): Promise<ISpecModel>;

    /**
     * Optional default settings for ajax requests, if applicable.
     */
    ajaxSettings?: IAjaxSettings;
  }

  /**
   * Object which manages kernel instances.
   */
  export
  interface IManager {
    /**
     * Get the available kernel specs.
     */
    getSpecs(options?: IOptions): Promise<ISpecModels>;

    /**
     * Get a list of running kernels.
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
    msg: IMessage;

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
    onReply: (msg: IMessage) => void;

    /**
     * The stdin handler for the kernel future.
     */
    onStdin: (msg: IMessage) => void;

    /**
     * The iopub handler for the kernel future.
     */
    onIOPub: (msg: IMessage) => void;

    /**
     * The done handler for the kernel future.
     */
    onDone: (msg: IMessage) => void;
  }

  /**
   * Kernel Spec help link interface.
   */
  export
  interface ISpecHelpLink {
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
  interface ISpec {
    language: string;
    argv: string[];
    display_name: string;
    env: JSONObject;
    codemirror_mode?: string;
    help_links?: ISpecHelpLink[];
  }

  /**
   * KernelSpec model interface.
   */
  export
  interface ISpecModel {
    name: string;
    spec: ISpec;
    resources: { [key: string]: string; };
  }

  /**
   * KernelSpecInfo interface
   */
  export
  interface ISpecModels {
    default: string;
    kernelspecs: { [key: string]: ISpecModel };
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
     *
     * **See also:** [[ICommClose]], [[close]]
     */
    onClose: (msg: IMessage) => void;

    /**
     * Callback for a comm message received event.
     *
     * **See also:** [[ICommMsg]]
     */
    onMsg: (msg: IMessage) => void;

    /**
     * Open a comm with optional data and metadata.
     *
     * #### Notes
     * This sends a `comm_open` message to the server.
     *
     * **See also:** [[ICommOpen]]
     */
    open(data?: JSONObject, metadata?: JSONObject): IFuture;

    /**
     * Send a `comm_msg` message to the kernel.
     *
     * #### Notes
     * This is a no-op if the comm has been closed.
     *
     * **See also:** [[ICommMsg]]
     */
    send(data: JSONObject, metadata?: JSONObject, buffers?: (ArrayBuffer | ArrayBufferView)[], disposeOnDone?: boolean): IFuture;

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
    close(data?: JSONObject, metadata?: JSONObject): IFuture;
  }
}
