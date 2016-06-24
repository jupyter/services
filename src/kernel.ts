// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils
  from 'jupyter-js-utils';

import {
  DisposableDelegate, IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  JSONObject
} from './json';

import {
  KernelFutureHandler
} from './kernelfuture';

import * as serialize
  from './serialize';

import * as validate
  from './validate';


/**
 * The url for the kernel service.
 */
const KERNEL_SERVICE_URL = 'api/kernels';

/**
 * The url for the kernelspec service.
 */
const KERNELSPEC_SERVICE_URL = 'api/kernelspecs';


/**
 * An implementation of a kernel manager.
 */
export
class KernelManager implements IKernel.IManager {
  /**
   * Construct a new kernel manager.
   *
   * @param options - The default options for kernel.
   */
   constructor(options?: IKernel.IOptions) {
     this._options = utils.copy(options || {});
   }

  /**
   * Get the kernel specs.  See also [[getKernelSpecs]].
   *
   * @param options - Overrides for the default options.
   */
  getSpecs(options?: IKernel.IOptions): Promise<IKernel.ISpecModels> {
    return getKernelSpecs(this._getOptions(options));
  }

  /**
   * List the running kernels.  See also [[listRunningKernels]].
   *
   * @param options - Overrides for the default options.
   */
  listRunning(options?: IKernel.IOptions): Promise<IKernel.IModel[]> {
    return listRunningKernels(this._getOptions(options));
  }

  /**
   * Start a new kernel.  See also [[startNewKernel]].
   *
   * @param options - Overrides for the default options.
   */
  startNew(options?: IKernel.IOptions): Promise<IKernel> {
    return startNewKernel(this._getOptions(options));
  }

  /**
   * Find a kernel by id.
   *
   * @param options - Overrides for the default options.
   */
  findById(id: string, options?: IKernel.IOptions): Promise<IKernel.IModel> {
    return findKernelById(id, this._getOptions(options));
  }

  /**
   * Connect to a running kernel.  See also [[connectToKernel]].
   *
   * @param options - Overrides for the default options.
   */
  connectTo(id: string, options?: IKernel.IOptions): Promise<IKernel> {
    if (options) {
      options = this._getOptions(options);
    } else {
      options = utils.copy(this._options);
    }
    return connectToKernel(id, options);
  }

  /**
   * Get optionally overidden options.
   */
  private _getOptions(options: IKernel.IOptions): IKernel.IOptions {
    if (options) {
      options = utils.extend(utils.copy(this._options), options);
    } else {
      options = this._options;
    }
    return options;
  }

  private _options: IKernel.IOptions = null;

}


/**
 * Find a kernel by id.
 *
 * #### Notes
 * If the kernel was already started via `startNewKernel`, we return its
 * `IKernel.IModel`.
 *
 * Otherwise, if `options` are given, we attempt to find to the existing
 * kernel.
 * The promise is fulfilled when the kernel is found,
 * otherwise the promise is rejected.
 */
export
function findKernelById(id: string, options?: IKernel.IOptions): Promise<IKernel.IModel> {
  let kernels = Private.runningKernels;
  for (let clientId in kernels) {
    let kernel = kernels[clientId];
    if (kernel.id === id) {
      let result = { id: kernel.id, name: kernel.name };
      return Promise.resolve(result);
    }
  }
  return Private.getKernelId(id, options).catch(() => {
    return Private.typedThrow<IKernel.IModel>(`No running kernel with id: ${id}`);
  });
}


/**
 * Fetch the kernel specs.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
 */
export
function getKernelSpecs(options?: IKernel.IOptions): Promise<IKernel.ISpecModels> {
  options = options || {};
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(baseUrl, KERNELSPEC_SERVICE_URL);
  let ajaxSettings = utils.copy(options.ajaxSettings) || {};
  ajaxSettings.method = 'GET';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    let err = new Error('Invalid KernelSpecs Model');
    if (success.xhr.status !== 200) {
      throw new Error('Invalid Response: ' + success.xhr.status);
    }
    let data = success.data;
    if (!data.hasOwnProperty('default') ||
        typeof data.default !== 'string') {
      throw err;
    }
    if (!data.hasOwnProperty('kernelspecs')) {
      throw err;
    }
    if (!data.kernelspecs.hasOwnProperty(data.default)) {
      throw err;
    }
    let keys = Object.keys(data.kernelspecs);
    for (let i = 0; i < keys.length; i++) {
      let ks = data.kernelspecs[keys[i]];
      validate.validateKernelSpecModel(ks);
    }
    return data;
  });
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
function listRunningKernels(options?: IKernel.IOptions): Promise<IKernel.IModel[]> {
  options = options || {};
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
  let ajaxSettings = utils.copy(options.ajaxSettings) || {};
  ajaxSettings.method = 'GET';
  ajaxSettings.dataType = 'json';
  ajaxSettings.cache = false;

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    if (!Array.isArray(success.data)) {
      throw Error('Invalid kernel list');
    }
    for (let i = 0; i < success.data.length; i++) {
      validate.validateKernelModel(success.data[i]);
    }
    return success.data as IKernel.IModel[];
  }, Private.onKernelError);
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
function startNewKernel(options?: IKernel.IOptions): Promise<IKernel> {
  options = options || {};
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
  let ajaxSettings = utils.copy(options.ajaxSettings) || {};
  ajaxSettings.method = 'POST';
  ajaxSettings.data = JSON.stringify({ name: options.name });
  ajaxSettings.dataType = 'json';
  ajaxSettings.contentType = 'application/json';
  ajaxSettings.cache = false;

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 201) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelModel(success.data);
    return new Kernel(options, success.data.id);
  }, Private.onKernelError);
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
function connectToKernel(id: string, options?: IKernel.IOptions): Promise<IKernel> {
  for (let clientId in Private.runningKernels) {
    let kernel = Private.runningKernels[clientId];
    if (kernel.id === id) {
      return Promise.resolve(kernel.clone());
    }
  }
  return Private.getKernelId(id, options).then(kernelId => {
    return new Kernel(options, id);
  }).catch(() => {
    return Private.typedThrow<IKernel.IModel>(`No running kernel with id: ${id}`);
  });
}


/**
 * Create a well-formed Kernel Message.
 */
export
function createKernelMessage(options: KernelMessage.IOptions, content: JSONObject = {}, metadata: JSONObject = {}, buffers: (ArrayBuffer | ArrayBufferView)[] = []) : KernelMessage.IMessage {
  return {
    header: {
      username: options.username || '',
      version: '5.0',
      session: options.session,
      msg_id: options.msgId || utils.uuid(),
      msg_type: options.msgType
    },
    parent_header: { },
    channel: options.channel,
    content: content,
    metadata: metadata,
    buffers: buffers
  };
}


/**
 * Implementation of the Kernel object
 */
class Kernel implements IKernel {
  /**
   * Construct a kernel object.
   */
  constructor(options: IKernel.IOptions, id: string) {
    this.ajaxSettings = options.ajaxSettings || {};
    this._name = options.name;
    this._id = id;
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._clientId = options.clientId || utils.uuid();
    this._username = options.username || '';
    this._futures = new Map<string, KernelFutureHandler>();
    this._commPromises = new Map<string, Promise<IKernel.IComm>>();
    this._comms = new Map<string, IKernel.IComm>();
    this._createSocket();
    Private.runningKernels[this._clientId] = this;
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<IKernel, IKernel.Status> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for iopub kernel messages.
   */
  get iopubMessage(): ISignal<IKernel, KernelMessage.IIOPubMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for unhandled kernel message.
   */
  get unhandledMessage(): ISignal<IKernel, KernelMessage.IMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * The id of the server-side kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get id(): string {
    return this._id;
  }

  /**
   * The name of the server-side kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
  }

  /**
   * The client username.
   *
   * #### Notes
   * This is a read-only property.
   */
   get username(): string {
     return this._username;
   }

  /**
   * The client unique id.
   *
   * #### Notes
   * This is a read-only property.
   */
  get clientId(): string {
    return this._clientId;
  }

  /**
   * The current status of the kernel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get status(): IKernel.Status {
    return this._status;
  }

  /**
   * Get a copy of the default ajax settings for the kernel.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the kernel.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Test whether the kernel has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return this._futures === null;
  }

  /**
   * Clone the current kernel with a new clientId.
   */
  clone(): IKernel {
    let options = {
      baseUrl: this._baseUrl,
      wsUrl: this._wsUrl,
      name: this._name,
      username: this._username,
      ajaxSettings: this.ajaxSettings
    };
    return new Kernel(options, this._id);
  }

  /**
   * Dispose of the resources held by the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._status = 'dead';
    if (this._ws !== null) {
      this._ws.close();
    }
    this._ws = null;
    this._futures.forEach((future, key) => {
      future.dispose();
    });
    this._comms.forEach((comm, key) => {
      comm.dispose();
    });
    this._futures = null;
    this._commPromises = null;
    this._comms = null;
    this._status = 'dead';
    this._targetRegistry = null;
    clearSignalData(this);
    delete Private.runningKernels[this._clientId];
  }

  /**
   * Send a shell message to the kernel.
   *
   * #### Notes
   * Send a message to the kernel's shell channel, yielding a future object
   * for accepting replies.
   *
   * If `expectReply` is given and `true`, the future is disposed when both a
   * shell reply and an idle status message are received. If `expectReply`
   * is not given or is `false`, the future is resolved when an idle status
   * message is received.
   * If `disposeOnDone` is not given or is `true`, the Future is disposed at this point.
   * If `disposeOnDone` is given and `false`, it is up to the caller to dispose of the Future.
   *
   * All replies are validated as valid kernel messages.
   *
   * If the kernel status is `Dead`, this will throw an error.
   */
  sendShellMessage(msg: KernelMessage.IShellMessage, expectReply=false, disposeOnDone=true): IKernel.IFuture {
    if (this.status === 'dead') {
      throw new Error('Kernel is dead');
    }
    if (!this._isReady) {
      this._pendingMessages.push(msg);
    } else {
      this._ws.send(serialize.serialize(msg));
    }
    let future = new KernelFutureHandler(() => {
      this._futures.delete(msg.header.msg_id);
    }, msg, expectReply, disposeOnDone);
    this._futures.set(msg.header.msg_id, future);
    return future;
  }

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
  interrupt(): Promise<void> {
    return Private.interruptKernel(this, this._baseUrl, this.ajaxSettings);
  }

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
   * The promise will be rejected if the request fails or the response is
   * invalid.
   */
  restart(): Promise<void> {
    this._clearState();
    this._updateStatus('restarting');
    return Private.restartKernel(this, this._baseUrl, this.ajaxSettings);
  }

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
  shutdown(): Promise<void> {
    this._clearState();
    return Private.shutdownKernel(this, this._baseUrl, this.ajaxSettings)
    .then(() => {
      this.dispose();
    });
  }

  /**
   * Send a `kernel_info_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
   *
   * Fulfills with the `kernel_info_response` content when the shell reply is
   * received and validated.
   */
  kernelInfo(): Promise<KernelMessage.IInfoReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'kernel_info_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send a `complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
   *
   * Fulfills with the `complete_reply` content when the shell reply is
   * received and validated.
   */
  complete(content: KernelMessage.ICompleteRequest): Promise<KernelMessage.ICompleteReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'complete_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options, content);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send an `inspect_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
   *
   * Fulfills with the `inspect_reply` content when the shell reply is
   * received and validated.
   */
  inspect(content: KernelMessage.IInspectRequest): Promise<KernelMessage.IInspectReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'inspect_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options, content);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send a `history_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
   *
   * Fulfills with the `history_reply` content when the shell reply is
   * received and validated.
   */
  history(content: KernelMessage.IHistoryRequest): Promise<KernelMessage.IHistoryReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'history_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options, content);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send an `execute_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
   *
   * Future `onReply` is called with the `execute_reply` content when the
   * shell reply is received and validated. The future will resolve when
   * this message is received and the `idle` iopub status is received.
   * The future will also be disposed at this point unless `disposeOnDone`
   * is specified and `false`, in which case it is up to the caller to dispose
   * of the future.
   *
   * **See also:** [[IExecuteReply]]
   */
  execute(content: KernelMessage.IExecuteRequest, disposeOnDone: boolean = true): IKernel.IFuture {
    let options: KernelMessage.IOptions = {
      msgType: 'execute_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let defaults = {
      silent : false,
      store_history : true,
      user_expressions : {},
      allow_stdin : true,
      stop_on_error : false
    };
    content = utils.extend(defaults, content);
    let msg = Private.createShellMessage(options, content);
    return this.sendShellMessage(msg, true, disposeOnDone);
  }

  /**
   * Send an `is_complete_request` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
   *
   * Fulfills with the `is_complete_response` content when the shell reply is
   * received and validated.
   */
  isComplete(content: KernelMessage.IIsCompleteRequest): Promise<KernelMessage.IIsCompleteReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'is_complete_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options, content);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send a `comm_info_request` message.
   *
   * #### Notes
   * Fulfills with the `comm_info_reply` content when the shell reply is
   * received and validated.
   */
  commInfo(content: KernelMessage.ICommInfoRequest): Promise<KernelMessage.ICommInfoReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'comm_info_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    };
    let msg = Private.createShellMessage(options, content);
    return Private.sendShellMessage(this, msg);
  }

  /**
   * Send an `input_reply` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   */
  sendInputReply(content: KernelMessage.IInputReply): void {
    if (this.status === 'dead') {
      throw new Error('Kernel is dead');
    }
    let options: KernelMessage.IOptions = {
      msgType: 'input_reply',
      channel: 'stdin',
      username: this._username,
      session: this._clientId
    };
    let msg = createKernelMessage(options, content);
    if (!this._isReady) {
      this._pendingMessages.push(msg);
    } else {
      this._ws.send(serialize.serialize(msg));
    }
  }

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
  registerCommTarget(targetName: string, callback: (comm: IKernel.IComm, msg: KernelMessage.ICommOpenMsg) => void): IDisposable {
    this._targetRegistry[targetName] = callback;
    return new DisposableDelegate(() => {
      delete this._targetRegistry[targetName];
    });
  }

  /**
   * Connect to a comm, or create a new one.
   *
   * #### Notes
   * If a client-side comm already exists, it is returned.
   */
  connectToComm(targetName: string, commId?: string): IKernel.IComm {
    if (commId === void 0) {
      commId = utils.uuid();
    }
    let comm = this._comms.get(commId);
    if (!comm) {
      comm = new Comm(
        targetName,
        commId,
        this,
        () => { this._unregisterComm(commId); }
      );
      this._comms.set(commId, comm);
    }
    return comm;
  }

  /**
   * Get the kernel spec associated with the kernel.
   *
   * #### Notes
   * This value is cached and only fetched the first time it is requested.
   */
  getKernelSpec(): Promise<IKernel.ISpec> {
    if (this._spec) {
      return Promise.resolve(this._spec);
    }
    let name = this.name;
    let options = { baseUrl: this._baseUrl, ajaxSettings: this._ajaxSettings };
    return getKernelSpecs(options).then(ids => {
      let id = ids.kernelspecs[name];
      if (!id) {
        throw new Error(`Could not find kernel spec for ${name}`);
      }
      this._spec = id.spec;
      return this._spec;
    });
  }

  /**
   * Create the kernel websocket connection and add socket status handlers.
   */
  private _createSocket(): void {
    let partialUrl = utils.urlPathJoin(this._wsUrl, KERNEL_SERVICE_URL,
                                       utils.urlJoinEncode(this._id));
    console.log('Starting WebSocket:', partialUrl);

    let url = (
      utils.urlPathJoin(partialUrl, 'channels') +
      '?session_id=' + this._clientId
    );

    this._ws = new WebSocket(url);

    // Ensure incoming binary messages are not Blobs
    this._ws.binaryType = 'arraybuffer';

    this._ws.onmessage = (evt: MessageEvent) => { this._onWSMessage(evt); };
    this._ws.onopen = (evt: Event) => { this._onWSOpen(evt); };

    this._ws.onclose = (evt: Event) => { this._onWSClose(evt); };
    this._ws.onerror = (evt: Event) => { this._onWSClose(evt); };
  }

  /**
   * Handle a websocket open event.
   */
  private _onWSOpen(evt: Event) {
    this._reconnectAttempt = 0;
    // Allow the message to get through.
    this._isReady = true;
    // Trigger a status response.
    this.kernelInfo();
    this._isReady = false;
  }

  /**
   * Handle a websocket message, validating and routing appropriately.
   */
  private _onWSMessage(evt: MessageEvent) {
    if (this.status === 'dead') {
      // If the socket is being closed, ignore any messages
      return;
    }
    let msg = serialize.deserialize(evt.data);
    try {
      validate.validateKernelMessage(msg);
    } catch (error) {
      console.error(error.message);
      return;
    }
    if (msg.parent_header) {
      let parentHeader = msg.parent_header as KernelMessage.IHeader;
      let future = this._futures && this._futures.get(parentHeader.msg_id);
      if (future) {
        future.handleMsg(msg);
      } else {
        // If the message was sent by us and was not iopub, it is orphaned.
        let owned = parentHeader.session === this.clientId;
        if (msg.channel !== 'iopub' && owned) {
          this.unhandledMessage.emit(msg);
        }
      }
    }
    if (msg.channel === 'iopub') {
      switch (msg.header.msg_type) {
      case 'status':
        this._updateStatus((msg as KernelMessage.IStatusMsg).content.execution_state);
        break;
      case 'comm_open':
        this._handleCommOpen(msg as KernelMessage.ICommOpenMsg);
        break;
      case 'comm_msg':
        this._handleCommMsg(msg as KernelMessage.ICommMsgMsg);
        break;
      case 'comm_close':
        this._handleCommClose(msg as KernelMessage.ICommCloseMsg);
        break;
      }
      this.iopubMessage.emit(msg as KernelMessage.IIOPubMessage);
    }
  }

  /**
   * Handle a websocket close event.
   */
  private _onWSClose(evt: Event) {
    if (this.status === 'dead') {
      return;
    }
    // Clear the websocket event handlers and the socket itself.
    this._ws.onclose = null;
    this._ws.onerror = null;
    this._ws = null;

    if (this._reconnectAttempt < this._reconnectLimit) {
      this._updateStatus('reconnecting');
      let timeout = Math.pow(2, this._reconnectAttempt);
      console.error('Connection lost, reconnecting in ' + timeout + ' seconds.');
      setTimeout(this._createSocket.bind(this), 1e3 * timeout);
      this._reconnectAttempt += 1;
    } else {
      this._updateStatus('dead');
    }
  }

  /**
   * Handle status iopub messages from the kernel.
   */
  private _updateStatus(status: IKernel.Status): void {
    this._isReady = false;
    switch (status) {
    case 'starting':
    case 'idle':
    case 'busy':
      this._isReady = true;
      break;
    case 'restarting':
    case 'reconnecting':
    case 'dead':
      break;
    default:
      console.error('invalid kernel status:', status);
      return;
    }
    if (status !== this._status) {
      this._status = status;
      Private.logKernelStatus(this);
      this.statusChanged.emit(status);
      if (status === 'dead') {
        this.dispose();
      }
    }
    if (this._isReady) {
      this._sendPending();
    }
  }

  /**
   * Send pending messages to the kernel.
   */
  private _sendPending(): void {
    // We shift the message off the queue
    // after the message is sent so that if there is an exception,
    // the message is still pending.
    while (this._pendingMessages.length > 0) {
      let msg = serialize.serialize(this._pendingMessages[0]);
      this._ws.send(msg);
      this._pendingMessages.shift();
    }
  }

  /**
   * Clear the internal state.
   */
  private _clearState(): void {
    this._isReady = false;
    this._pendingMessages = [];
    this._futures.forEach((future, key) => {
      future.dispose();
    });
    this._comms.forEach((comm, key) => {
      comm.dispose();
    });
    this._futures = new Map<string, KernelFutureHandler>();
    this._commPromises = new Map<string, Promise<IKernel.IComm>>();
    this._comms = new Map<string, IKernel.IComm>();
  }

  /**
   * Handle a `comm_open` kernel message.
   */
  private _handleCommOpen(msg: KernelMessage.ICommOpenMsg): void {
    let content = msg.content;
    let promise = utils.loadObject(content.target_name, content.target_module,
      this._targetRegistry).then(target => {
        let comm = new Comm(
          content.target_name,
          content.comm_id,
          this,
          () => { this._unregisterComm(content.comm_id); }
        );
        let response : any;
        try {
          response = target(comm, msg);
        } catch (e) {
          comm.close();
          console.error('Exception opening new comm');
          throw(e);
        }
        return Promise.resolve(response).then(() => {
          this._commPromises.delete(comm.commId);
          this._comms.set(comm.commId, comm);
          return comm;
        });
    });
    this._commPromises.set(content.comm_id, promise);
  }

  /**
   * Handle 'comm_close' kernel message.
   */
  private _handleCommClose(msg: KernelMessage.ICommCloseMsg): void {
    let content = msg.content;
    let promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      let comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      }
      promise = Promise.resolve(comm);
    }
    promise.then((comm) => {
      this._unregisterComm(comm.commId);
      try {
        let onClose = comm.onClose;
        if (onClose) {
          onClose(msg);
        }
        (comm as Comm).dispose();
      } catch (e) {
        console.error('Exception closing comm: ', e, e.stack, msg);
      }
    });
  }

  /**
   * Handle a 'comm_msg' kernel message.
   */
  private _handleCommMsg(msg: KernelMessage.ICommMsgMsg): void {
    let content = msg.content;
    let promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      let comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      } else {
        let onMsg = comm.onMsg;
        if (onMsg) {
          onMsg(msg);
        }
      }
    } else {
      promise.then((comm) => {
        try {
          let onMsg = comm.onMsg;
          if (onMsg) {
            onMsg(msg);
          }
        } catch (e) {
          console.error('Exception handling comm msg: ', e, e.stack, msg);
        }
        return comm;
      });
    }
  }

  /**
   * Unregister a comm instance.
   */
  private _unregisterComm(commId: string) {
    this._comms.delete(commId);
    this._commPromises.delete(commId);
  }

  private _id = '';
  private _name = '';
  private _baseUrl = '';
  private _wsUrl = '';
  private _status: IKernel.Status = 'unknown';
  private _clientId = '';
  private _ws: WebSocket = null;
  private _username = '';
  private _ajaxSettings = '{}';
  private _reconnectLimit = 7;
  private _reconnectAttempt = 0;
  private _isReady = false;
  private _futures: Map<string, KernelFutureHandler> = null;
  private _commPromises: Map<string, Promise<IKernel.IComm>> = null;
  private _comms: Map<string, IKernel.IComm> = null;
  private _targetRegistry: { [key: string]: (comm: IKernel.IComm, msg: KernelMessage.ICommOpenMsg) => void; } = Object.create(null);
  private _spec: IKernel.ISpec = null;
  private _pendingMessages: KernelMessage.IMessage[] = [];
}


/**
 * Comm channel handler.
 */
class Comm extends DisposableDelegate implements IKernel.IComm {
  /**
   * Construct a new comm channel.
   */
  constructor(target: string, id: string, kernel: IKernel, disposeCb: () => void) {
    super(disposeCb);
    this._id = id;
    this._target = target;
    this._kernel = kernel;
  }

  /**
   * The unique id for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commId(): string {
    return this._id;
  }

  /**
   * The target name for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get targetName(): string {
    return this._target;
  }

  /**
   * Get the callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[ICommClose]], [[close]]
   */
  get onClose(): (msg: KernelMessage.ICommCloseMsg) => void {
    return this._onClose;
  }

  /**
   * Set the callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[close]]
   */
  set onClose(cb: (msg: KernelMessage.ICommCloseMsg) => void) {
    this._onClose = cb;
  }

  /**
   * Get the callback for a comm message received event.
   */
  get onMsg(): (msg: KernelMessage.ICommMsgMsg) => void {
    return this._onMsg;
  }

  /**
   * Set the callback for a comm message received event.
   */
  set onMsg(cb: (msg: KernelMessage.ICommMsgMsg) => void) {
    this._onMsg = cb;
  }

  /**
   * Test whether the comm has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return (this._kernel === null);
  }

  /**
   * Open a comm with optional data and metadata.
   *
   * #### Notes
   * This sends a `comm_open` message to the server.
   *
   * **See also:** [[ICommOpen]]
   */
  open(data?: JSONObject, metadata?: JSONObject): IKernel.IFuture {
    if (this.isDisposed || this._kernel.isDisposed) {
      return;
    }
    let options: KernelMessage.IOptions = {
      msgType: 'comm_open',
      channel: 'shell',
      username: this._kernel.username,
      session: this._kernel.clientId
    };
    let content: KernelMessage.ICommOpen = {
      comm_id: this._id,
      target_name: this._target,
      data: data || {}
    };
    let msg = Private.createShellMessage(options, content, metadata);
    return this._kernel.sendShellMessage(msg, false, true);
  }

  /**
   * Send a `comm_msg` message to the kernel.
   *
   * #### Notes
   * This is a no-op if the comm has been closed.
   *
   * **See also:** [[ICommMsg]]
   */
  send(data: JSONObject, metadata?: JSONObject, buffers: (ArrayBuffer | ArrayBufferView)[] = [], disposeOnDone: boolean = true): IKernel.IFuture {
    if (this.isDisposed || this._kernel.isDisposed) {
      return;
    }
    let options: KernelMessage.IOptions = {
      msgType: 'comm_msg',
      channel: 'shell',
      username: this._kernel.username,
      session: this._kernel.clientId
    };
    let content: KernelMessage.ICommMsg = {
      comm_id: this._id,
      data: data
    };
    let msg = Private.createShellMessage(options, content, metadata);
    return this._kernel.sendShellMessage(msg, false, true);
  }

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
  close(data?: JSONObject, metadata?: JSONObject): IKernel.IFuture {
    if (this.isDisposed || this._kernel.isDisposed) {
      return;
    }
    let options: KernelMessage.IOptions = {
      msgType: 'comm_msg',
      channel: 'shell',
      username: this._kernel.username,
      session: this._kernel.clientId
    };
    let content: KernelMessage.ICommClose = {
      comm_id: this._id,
      data: data || {}
    };
    let msg = Private.createShellMessage(options, content, metadata);
    let future = this._kernel.sendShellMessage(msg, false, true);
    let onClose = this._onClose;
    if (onClose) {
      onClose(future.msg as KernelMessage.ICommCloseMsg);
    }
    this.dispose();
    return future;
  }

  /**
   * Dispose of the resources held by the comm.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._onClose = null;
    this._onMsg = null;
    this._kernel = null;
    super.dispose();
  }

  private _target = '';
  private _id = '';
  private _kernel: IKernel = null;
  private _onClose: (msg: KernelMessage.ICommCloseMsg) => void = null;
  private _onMsg: (msg: KernelMessage.ICommMsgMsg) => void = null;
}


/**
 * A private namespace for the Kernel.
 */
namespace Private {
  /**
   * A signal emitted when the kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<IKernel, IKernel.Status>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<IKernel, KernelMessage.IIOPubMessage>();

  /**
   * A signal emitted for unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<IKernel, KernelMessage.IMessage>();

  /**
   * A module private store for running kernels.
   */
  export
  const runningKernels: { [key: string]: Kernel; } = Object.create(null);

  /**
   * Restart a kernel.
   */
  export
  function restartKernel(kernel: IKernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
    if (kernel.status === 'dead') {
      return Promise.reject(new Error('Kernel is dead'));
    }
    let url = utils.urlPathJoin(
      baseUrl, KERNEL_SERVICE_URL,
      utils.urlJoinEncode(kernel.id, 'restart')
    );
    ajaxSettings = ajaxSettings || { };
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateKernelModel(success.data);
    }, onKernelError);
  }

  /**
   * Interrupt a kernel.
   */
  export
  function interruptKernel(kernel: IKernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
    if (kernel.status === 'dead') {
      return Promise.reject(new Error('Kernel is dead'));
    }
    let url = utils.urlPathJoin(
      baseUrl, KERNEL_SERVICE_URL,
      utils.urlJoinEncode(kernel.id, 'interrupt')
    );
    ajaxSettings = ajaxSettings || { };
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    }, onKernelError);
  }

  /**
   * Delete a kernel.
   */
  export
  function shutdownKernel(kernel: Kernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
    if (kernel.status === 'dead') {
      return Promise.reject(new Error('Kernel is dead'));
    }
    let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL,
                                utils.urlJoinEncode(kernel.id));
    ajaxSettings = ajaxSettings || { };
    ajaxSettings.method = 'DELETE';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    }, onKernelError);
  }

  /**
   * Get a full kernel id model from the server by kernel id string.
   */
  export
  function getKernelId(id: string, options?: IKernel.IOptions): Promise<IKernel.IOptions> {
    options = options || {};
    let baseUrl = options.baseUrl || utils.getBaseUrl();
    let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, id);
    let ajaxSettings = options.ajaxSettings || {};
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      let data = success.data as IKernel.IModel;
      validate.validateKernelModel(data);
      return data;
    }, Private.onKernelError);
  }

  /**
   * Log the current kernel status.
   */
  export
  function logKernelStatus(kernel: IKernel): void {
    switch (kernel.status) {
    case 'idle':
    case 'busy':
    case 'unknown':
      return;
    default:
      console.log(`Kernel: ${kernel.status} (${kernel.id})`);
      break;
    }
  }

  /**
   * Handle an error on a kernel Ajax call.
   */
  export
  function onKernelError(error: utils.IAjaxError): any {
    console.error('API request failed (' + error.statusText + '): ');
    throw Error(error.statusText);
  }

  /**
   * Create a shell message given options.
   */
  export
  function createShellMessage(options: KernelMessage.IOptions, content: JSONObject = {}, metadata: JSONObject = {}, buffers: (ArrayBuffer | ArrayBufferView)[] = []) : KernelMessage.IShellMessage {
    let msg = createKernelMessage(options, content, metadata, buffers);
    return msg as KernelMessage.IShellMessage;
  }

  /**
   * Send a kernel message to the kernel and return the content of the response.
   */
  export
  function sendShellMessage(kernel: IKernel, msg: KernelMessage.IShellMessage): Promise<KernelMessage.IShellMessage> {
    let future: IKernel.IFuture;
    try {
      future = kernel.sendShellMessage(msg, true);
    } catch (e) {
      return Promise.reject(e);
    }
    return new Promise<any>((resolve, reject) => {
      future.onReply = (reply: KernelMessage.IMessage) => {
        resolve(reply);
      };
    });
  }

  /**
   * Throw a typed error.
   */
  export
  function typedThrow<T>(msg: string): T {
    throw new Error(msg);
  }
}
