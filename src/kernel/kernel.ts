// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JSONObject, JSONValue
} from 'phosphor/lib/algorithm/json';

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  ISignal
} from 'phosphor/lib/core/signaling';

import {
  IAjaxSettings
} from '../utils';

import {
  DefaultKernel
} from './default';

import {
  KernelMessage
} from './messages';


/**
 * A namespace for kernel types, interfaces, and type checker functions.
 */
export
namespace Kernel {
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
    statusChanged: ISignal<IKernel, Kernel.Status>;

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
     */
    readonly id: string;

    /**
     * The name of the server-side kernel.
     */
    readonly name: string;

    /**
     * The model associated with the kernel.
     */
    readonly model: Kernel.IModel;

    /**
     * The client username.
     */
    readonly username: string;

    /**
     * The client unique id.
     */
    readonly clientId: string;

    /**
     * The current status of the kernel.
     */
    readonly status: Kernel.Status;

    /**
     * The cached info for the kernel.
     *
     * #### Notes
     * If `null`, call [[kernelInfo]] to get the value,
     * which will populate this value.
     */
    readonly info: KernelMessage.IInfoReply;

    /**
     * The cached spec for the kernel.
     *
     * #### Notes
     * If `null`, call [[getKernelSpecs]] to get the value,
     * which will populate this value.
     */
    readonly spec: Kernel.ISpec;

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
    sendShellMessage(msg: KernelMessage.IShellMessage, expectReply?: boolean, disposeOnDone?: boolean): Kernel.IFuture;

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
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#kernel-info).
     *
     * Fulfills with the `kernel_info_response` content when the shell reply is
     * received and validated.
     */
    kernelInfo(): Promise<KernelMessage.IInfoReplyMsg>;

    /**
     * Send a `complete_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#completion).
     *
     * Fulfills with the `complete_reply` content when the shell reply is
     * received and validated.
     */
    complete(content: KernelMessage.ICompleteRequest): Promise<KernelMessage.ICompleteReplyMsg>;

    /**
     * Send an `inspect_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#introspection).
     *
     * Fulfills with the `inspect_reply` content when the shell reply is
     * received and validated.
     */
    inspect(content: KernelMessage.IInspectRequest): Promise<KernelMessage.IInspectReplyMsg>;

    /**
     * Send a `history_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#history).
     *
     * Fulfills with the `history_reply` content when the shell reply is
     * received and validated.
     */
    history(content: KernelMessage.IHistoryRequest): Promise<KernelMessage.IHistoryReplyMsg>;

    /**
     * Send an `execute_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#execute).
     *
     * Future `onReply` is called with the `execute_reply` content when the
     * shell reply is received and validated.
     *
     * **See also:** [[IExecuteReply]]
     */
    execute(content: KernelMessage.IExecuteRequest, disposeOnDone?: boolean): Kernel.IFuture;

    /**
     * Send an `is_complete_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#code-completeness).
     *
     * Fulfills with the `is_complete_response` content when the shell reply is
     * received and validated.
     */
    isComplete(content: KernelMessage.IIsCompleteRequest): Promise<KernelMessage.IIsCompleteReplyMsg>;

    /**
     * Send a `comm_info_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#comm_info).
     *
     * Fulfills with the `comm_info_reply` content when the shell reply is
     * received and validated.
     */
    commInfo(content: KernelMessage.ICommInfoRequest): Promise<KernelMessage.ICommInfoReplyMsg>;

    /**
     * Send an `input_reply` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](https://jupyter-client.readthedocs.io/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
     */
    sendInputReply(content: KernelMessage.IInputReply): void;

    /**
     * Connect to a comm, or create a new one.
     *
     * #### Notes
     * If a client-side comm already exists, it is returned.
     */
    connectToComm(targetName: string, commId?: string): Kernel.IComm;

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
    registerCommTarget(targetName: string, callback: (comm: Kernel.IComm, msg: KernelMessage.ICommOpenMsg) => void): IDisposable;

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
    registerMessageHook(msgId: string, hook: (msg: KernelMessage.IIOPubMessage) => boolean): IDisposable;

    /**
     * Get the kernel spec associated with the kernel.
     */
    getSpec(): Promise<Kernel.ISpec>;

    /**
     * Optional default settings for ajax requests, if applicable.
     */
    ajaxSettings?: IAjaxSettings;
  }

  /**
   * Find a kernel by id.
   *
   * #### Notes
   * If the kernel was already started via `startNewKernel`, we return its
   * `Kernel.IModel`.
   *
   * Otherwise, if `options` are given, we attempt to find to the existing
   * kernel.
   * The promise is fulfilled when the kernel is found,
   * otherwise the promise is rejected.
   */
  export
  function findById(id: string, options?: IOptions): Promise<IModel> {
    return DefaultKernel.findById(id, options);
  }

  /**
   * Fetch all of the kernel specs.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
   */
  export
  function getSpecs(options: Kernel.IOptions = {}): Promise<Kernel.ISpecModels> {
    return DefaultKernel.getSpecs(options);
  }

  /**
   * Fetch the running kernels.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  export
  function listRunning(options: Kernel.IOptions = {}): Promise<Kernel.IModel[]> {
    return DefaultKernel.listRunning(options);
  }

  /**
   * Start a new kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
   *
   * If no options are given or the kernel name is not given, the
   * default kernel will by started by the server.
   *
   * Wraps the result in a Kernel object. The promise is fulfilled
   * when the kernel is started by the server, otherwise the promise is rejected.
   */
  export
  function startNew(options?: Kernel.IOptions): Promise<IKernel> {
    options = options || {};
    return DefaultKernel.startNew(options);
  }

  /**
   * Connect to a running kernel.
   *
   * #### Notes
   * If the kernel was already started via `startNewKernel`, the existing
   * Kernel object info is used to create another instance.
   *
   * Otherwise, if `options` are given, we attempt to connect to the existing
   * kernel found by calling `listRunningKernels`.
   * The promise is fulfilled when the kernel is running on the server,
   * otherwise the promise is rejected.
   *
   * If the kernel was not already started and no `options` are given,
   * the promise is rejected.
   */
  export
  function connectTo(id: string, options?: Kernel.IOptions): Promise<IKernel> {
    return DefaultKernel.connectTo(id, options);
  }

  /**
   * Shut down a kernel by id.
   */
  export
  function shutdown(id: string, options: Kernel.IOptions = {}): Promise<void> {
    return DefaultKernel.shutdown(id, options);
  }

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
    readonly msg: KernelMessage.IShellMessage;

    /**
     * Whether the future is done.
     */
    readonly isDone: boolean;

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
     */
    readonly commId: string;

    /**
     * The target name for the comm channel.
     */
    readonly targetName: string;

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
    readonly id?: string;

    /**
     * The name of the kernel.
     */
    readonly name?: string;
  }

  /**
   * Kernel Spec help link interface.
   */
  export
  interface ISpecHelpLink extends JSONObject {
    readonly text: string;
    readonly url: string;
  }

  /**
   * Kernel Spec interface.
   *
   * #### Notes
   * See [Kernel specs](https://jupyter-client.readthedocs.io/en/latest/kernels.html#kernelspecs).
   */
  export
  interface ISpec extends JSONObject {
    readonly language: string;
    readonly argv: string[];
    readonly display_name: string;
    readonly env: JSONObject;
    readonly codemirror_mode?: string;
    readonly help_links?: ISpecHelpLink[];
  }

  /**
   * KernelSpec model provided by the server for a specific kernel.
   *
   * #### Notes
   * See the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
   */
  export
  interface ISpecModel extends JSONObject {
    readonly name: string;
    readonly spec: ISpec;
    readonly resources: { [key: string]: string; };
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
    readonly kernelspecs: { [key: string]: ISpecModel };
  }
}
