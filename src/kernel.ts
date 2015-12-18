// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  DisposableDelegate
} from 'phosphor-disposable';

import {
  ISignal, Signal, disconnectReceiver
} from 'phosphor-signaling';

import {
  IComm, ICommInfoRequest, ICommInfoReply, ICommOpen, ICompleteReply,
  ICompleteRequest, IExecuteReply, IExecuteRequest, IInspectReply,
  IInspectRequest, IIsCompleteReply, IIsCompleteRequest, IInputReply, IKernel,
  IKernelFuture, IKernelId, IKernelInfo, IKernelManager, IKernelMessage,
  IKernelMessageHeader, IKernelMessageOptions, IKernelOptions, IKernelSpecIds,
  KernelStatus
} from './ikernel';

import {
  IAjaxSettings
} from './utils';

import * as serialize from './serialize';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the kernel service.
 */
const KERNEL_SERVICE_URL = 'api/kernels';


/**
 * The url for the kernelspec service.
 */
const KERNELSPEC_SERVICE_URL = 'api/kernelspecs';


/**
 * The error message to send when the kernel is not ready.
 */
const KERNEL_NOT_READY_MSG = 'Kernel is not ready to send a message';

/**
 * Default base URL.
 */
const DEFAULT_BASE_URL = (typeof location === undefined ?
                          'http://localhost:8888/': location.origin + '/');


/**
 * An implementation of a kernel manager.
 */
export
class KernelManager implements IKernelManager {
  /**
   * Construct a new kernel manager.
   *
   * @param baseUrl - The base url of the kernel manager.  If an empty string
   *   is passed, it will use the default base url.
   *
   * @param ajaxSettings - Optional default ajax settings for the manager.
   */
   constructor(baseUrl: string, ajaxSettings?: IAjaxSettings) {
     this._baseUrl = baseUrl || DEFAULT_BASE_URL;
     if (ajaxSettings) this.ajaxSettings = ajaxSettings;
   }

  /**
   * Get a copy of the default ajax settings for the content manager.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the content manager.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Fetch the kernel specs.  See also [[getKernelSpecs]].
   */
  getKernelSpecs(ajaxSettings?: IAjaxSettings): Promise<IKernelSpecIds> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    return getKernelSpecs(this._baseUrl, ajaxSettings);
  }

  /**
   * Fetch the running kernels.  See also [[listRunningKernels]].
   */
  listRunningKernels(ajaxSettings?: IAjaxSettings): Promise<IKernelId[]> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    return listRunningKernels(this._baseUrl, ajaxSettings);
  }

  /**
   * Start a new kernel.  See also [[startNewKernel]].
   */
  startNewKernel(options: IKernelOptions, ajaxSettings?: IAjaxSettings): Promise<IKernel> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    options.baseUrl = this._baseUrl;
    return startNewKernel(options, ajaxSettings);
  }

  /**
   * Connect to a running kernel.  See also [[connectToKernel]].
   */
  connectToKernel(id: string, options?: IKernelOptions, ajaxSettings?: IAjaxSettings): Promise<IKernel> {
    if (options) {
      options.baseUrl = this._baseUrl;
    } else {
      options = void 0;
    }
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    return connectToKernel(id, options, ajaxSettings);
  }

  private _baseUrl = '';
  private _ajaxSettings = '';

}


/**
 * Fetch the kernel specs.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernelspecs).
 */
export
function getKernelSpecs(baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<IKernelSpecIds> {
  baseUrl = baseUrl || DEFAULT_BASE_URL;
  let url = utils.urlPathJoin(baseUrl, KERNELSPEC_SERVICE_URL);
  ajaxSettings = ajaxSettings ? JSON.parse(JSON.stringify(ajaxSettings)) : { };
  ajaxSettings.method = 'GET';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    var err = new Error('Invalid KernelSpecs Model');
    if (success.xhr.status !== 200) {
      throw new Error('Invalid Response: ' + success.xhr.status);
    }
    var data = success.data;
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
    var keys = Object.keys(data.kernelspecs);
    for (var i = 0; i < keys.length; i++) {
      var ks = data.kernelspecs[keys[i]];
      validate.validateKernelSpec(ks);
    }
    return data;
  });
}


/**
 * Fetch the running kernels.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
export
function listRunningKernels(baseUrl?: string, ajaxSettings?: IAjaxSettings): Promise<IKernelId[]> {
  baseUrl = baseUrl || DEFAULT_BASE_URL;
  let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
  ajaxSettings = ajaxSettings ? JSON.parse(JSON.stringify(ajaxSettings)) : { };
  ajaxSettings.method = 'GET';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    if (!Array.isArray(success.data)) {
      throw Error('Invalid kernel list');
    }
    for (var i = 0; i < success.data.length; i++) {
      validate.validateKernelId(success.data[i]);
    }
    return <IKernelId[]>success.data;
  }, onKernelError);
}


/**
 * Start a new kernel.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
 *
 * Wraps the result in a Kernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
export
function startNewKernel(options: IKernelOptions, ajaxSettings?: IAjaxSettings): Promise<IKernel> {
  let baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  let url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
  ajaxSettings = ajaxSettings ? JSON.parse(JSON.stringify(ajaxSettings)) : { };
  ajaxSettings.method = 'POST';
  ajaxSettings.data = JSON.stringify({ name: options.name });
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 201) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelId(success.data);
    return createKernel(options, success.data.id);
  }, onKernelError);
}


/**
 * Connect to a running kernel.
 *
 * #### Notes
 * If the kernel was already started via `startNewKernel`, the existing
 * Kernel object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * kernel found by calling `listRunningKernels`.
 * The promise is fulfilled when the kernel is fully ready to send
 * the first message. If the kernel fails to become ready, the promise is
 * rejected.
 *
 * If the kernel was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function connectToKernel(id: string, options?: IKernelOptions, ajaxSettings?: IAjaxSettings): Promise<IKernel> {
  var kernel = runningKernels.get(id);
  if (kernel) {
    return Promise.resolve(kernel);
  }
  if (options === void 0) {
    return Promise.reject(new Error('Please specify kernel options'));
  }
  let baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  return listRunningKernels(baseUrl, ajaxSettings).then(kernelIds => {
    if (!kernelIds.some(k => k.id === id)) {
      throw new Error('No running kernel with id: ' + id);
    }
    return createKernel(options, id);
  });
}


/**
 * Create a well-formed Kernel Message.
 */
export
function createKernelMessage(options: IKernelMessageOptions, content: any = {}, metadata: any = {}, buffers:(ArrayBuffer | ArrayBufferView)[] = []) : IKernelMessage {
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
  }
}


/**
 * Create a Promise for a Kernel object.
 *
 * #### Notes
 * Fulfilled when the Kernel is Starting, or rejected if Dead.
 */
function createKernel(options: IKernelOptions, id: string): Promise<IKernel> {
  return new Promise<IKernel>((resolve, reject) => {
    var kernel = new Kernel(options, id);
    var callback = (sender: IKernel, status: KernelStatus) => {
      if (status === KernelStatus.Starting || status === KernelStatus.Idle) {
        kernel.statusChanged.disconnect(callback);
        runningKernels.set(kernel.id, kernel);
        resolve(kernel);
      } else if (status === KernelStatus.Dead) {
        kernel.statusChanged.disconnect(callback);
        reject(new Error('Kernel failed to start'));
      }
    }
    kernel.statusChanged.connect(callback);
  });
}


/**
 * Implementation of the Kernel object
 */
class Kernel implements IKernel {

  /**
   * A signal emitted when the kernel status changes.
   *
   * **See also:** [[statusChanged]]
   */
  static statusChangedSignal = new Signal<IKernel, KernelStatus>();

  /**
   * A signal emitted for unhandled kernel message.
   *
   * **See also:** [[unhandledMessage]]
   */
  static unhandledMessageSignal = new Signal<IKernel, IKernelMessage>();

  /**
   * A signal emitted for unhandled comm open message.
   *
   * **See also:** [[commOpened]]
   */
  static commOpenedSignal = new Signal<IKernel, ICommOpen>();

  /**
   * Construct a kernel object.
   */
  constructor(options: IKernelOptions, id: string, ajaxSettings?: IAjaxSettings) {
    if (ajaxSettings) this.ajaxSettings = ajaxSettings;
    this._name = options.name;
    this._id = id;
    this._baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    if (options.wsUrl) {
      this._wsUrl = options.wsUrl;
    } else {
        this._wsUrl = 'ws' + this._baseUrl.slice(4);
    }
    this._clientId = options.clientId || utils.uuid();
    this._username = options.username || '';
    this._futures = new Map<string, KernelFutureHandler>();
    this._commPromises = new Map<string, Promise<IComm>>();
    this._comms = new Map<string, IComm>();
    this._createSocket();
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<IKernel, KernelStatus> {
    return Kernel.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for unhandled kernel message.
   */
  get unhandledMessage(): ISignal<IKernel, IKernelMessage> {
    return Kernel.unhandledMessageSignal.bind(this);
  }

  /**
   * A signal emitted for unhandled comm open message.
   */
  get commOpened(): ISignal<IKernel, ICommOpen> {
    return Kernel.commOpenedSignal.bind(this);
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
  get status(): KernelStatus {
    return this._status;
  }

  /**
   * Get a copy of the default ajax settings for the content manager.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the content manager.
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
    return (this._futures !== null);
  }

  /**
   * Dispose of the resources held by the kernel.
   */
  dispose(): void {
    this._futures.forEach((future, key) => {
      future.dispose();
    });
    this._comms.forEach((comm, key) => {
      comm.dispose();
    });
    this._futures = null;
    this._commPromises = null;
    this._comms = null;
    this._ws = null;
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
  sendShellMessage(msg: IKernelMessage, expectReply=false, disposeOnDone=true): IKernelFuture {
    if (this._status === KernelStatus.Dead) {
      throw Error(KERNEL_NOT_READY_MSG);
    }
    this._ws.send(serialize.serialize(msg));

    var future = new KernelFutureHandler(() => {
      this._futures.delete(msg.header.msg_id);
    }, msg.header.msg_id, expectReply, disposeOnDone);
    this._futures.set(msg.header.msg_id, future);
    return future;
  }

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
  interrupt(ajaxSettings?: IAjaxSettings): Promise<void> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    return interruptKernel(this, this._baseUrl, ajaxSettings);
  }

  /**
   * Restart a kernel.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
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
  restart(ajaxSettings?: IAjaxSettings): Promise<void> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    // clear internal state
    this._futures.forEach((future, key) => {
      future.dispose();
    });
    this._comms.forEach((comm, key) => {
      comm.dispose();
    });
    this._updateStatus('restarting');
    this._futures = new Map<string, KernelFutureHandler>();
    this._commPromises = new Map<string, Promise<IComm>>();
    this._comms = new Map<string, IComm>();
    return restartKernel(this, this._baseUrl, this.ajaxSettings);
  }

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
  shutdown(ajaxSettings?: IAjaxSettings): Promise<void> {
    ajaxSettings = ajaxSettings || this.ajaxSettings;
    return shutdownKernel(this, this._baseUrl, this.ajaxSettings).then(() => {
      this._status = KernelStatus.Dead;
      this._ws.close();
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
  kernelInfo(): Promise<IKernelInfo> {
    if (this._status === KernelStatus.Dead) {
      return Promise.reject(Error(KERNEL_NOT_READY_MSG));
    }
    var options: IKernelMessageOptions = {
      msgType: 'kernel_info_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options);
    return sendKernelMessage(this, msg);
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
  complete(contents: ICompleteRequest): Promise<ICompleteReply> {
    if (!this._isReady) {
      return Promise.reject(Error(KERNEL_NOT_READY_MSG));
    }
    var options: IKernelMessageOptions = {
      msgType: 'complete_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options, contents);
    return sendKernelMessage(this, msg);
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
  inspect(contents: IInspectRequest): Promise<IInspectReply> {
    if (!this._isReady) {
      return Promise.reject(Error(KERNEL_NOT_READY_MSG));
    }
    var options: IKernelMessageOptions = {
      msgType: 'inspect_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options, contents);
    return sendKernelMessage(this, msg);
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
  execute(contents: IExecuteRequest, disposeOnDone: boolean = true): IKernelFuture {
    if (!this._isReady) {
      throw Error(KERNEL_NOT_READY_MSG);
    }
    var options: IKernelMessageOptions = {
      msgType: 'execute_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var defaults = {
      silent : true,
      store_history : false,
      user_expressions : {},
      allow_stdin : false
    };
    contents = utils.extend(defaults, contents);
    var msg = createKernelMessage(options, contents);
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
  isComplete(contents: IIsCompleteRequest): Promise<IIsCompleteReply> {
    if (!this._isReady) {
      return Promise.reject(Error(KERNEL_NOT_READY_MSG));
    }
    var options: IKernelMessageOptions = {
      msgType: 'is_complete_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options, contents);
    return sendKernelMessage(this, msg);
  }

  /**
   * Send a `comm_info_request` message.
   *
   * #### Notes
   * Fulfills with the `comm_info_reply` content when the shell reply is
   * received and validated.
   */
  commInfo(contents: ICommInfoRequest): Promise<ICommInfoReply> {
    if (!this._isReady) {
      return Promise.reject(Error(KERNEL_NOT_READY_MSG));
    }
    var options: IKernelMessageOptions = {
      msgType: 'comm_info_request',
      channel: 'shell',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options, contents);
    return sendKernelMessage(this, msg);
  }

  /**
   * Send an `input_reply` message.
   *
   * #### Notes
   * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
   */
  sendInputReply(contents: IInputReply): void {
    if (!this._isReady) {
      throw Error(KERNEL_NOT_READY_MSG);
    }
    var options: IKernelMessageOptions = {
      msgType: 'input_reply',
      channel: 'stdin',
      username: this._username,
      session: this._clientId
    }
    var msg = createKernelMessage(options, contents);
    this._ws.send(serialize.serialize(msg));
  }

  /**
   * Connect to a comm, or create a new one.
   *
   * #### Notes
   * If a client-side comm already exists, it is returned.
   */
  connectToComm(targetName: string, commId?: string): IComm {
    if (commId === void 0) {
      commId = utils.uuid();
    }
    var comm = this._comms.get(commId);
    if (!comm) {
      comm = new Comm(targetName, commId, this._sendCommMessage.bind(this), () => {
        this._unregisterComm(comm.commId);
      });
      this._comms.set(commId, comm);
    }
    return comm;
  }

  /**
   * Create the kernel websocket connection and add socket status handlers.
   */
  private _createSocket() {
    var partialUrl = utils.urlPathJoin(this._wsUrl, KERNEL_SERVICE_URL,
                                       utils.urlJoinEncode(this._id));
    console.log('Starting WebSocket:', partialUrl);

    var url = (
      utils.urlPathJoin(partialUrl, 'channels') +
      '?session_id=' + this._clientId
    );

    this._ws = new WebSocket(url);

    // Ensure incoming binary messages are not Blobs
    this._ws.binaryType = 'arraybuffer';

    this._ws.onmessage = (evt: MessageEvent) => { this._onWSMessage(evt); };
    this._ws.onopen = (evt: Event) => { this._onWSOpen(evt); }

    this._ws.onclose = (evt: Event) => { this._onWSClose(evt); };
    this._ws.onerror = (evt: Event) => { this._onWSClose(evt); };
  }

  /**
   * Handle a websocket open event.
   */
  private _onWSOpen(evt: Event) {
    this._reconnectAttempt = 0;
    // trigger a status response
    this.kernelInfo();
  }

  /**
   * Handle a websocket message, validating and routing appropriately.
   */
  private _onWSMessage(evt: MessageEvent) {
    var msg = serialize.deserialize(evt.data);
    var handled = false;
    try {
      validate.validateKernelMessage(msg);
    } catch(error) {
      console.error(error.message);
      return;
    }
    if (msg.parent_header) {
      var parentHeader = msg.parent_header as IKernelMessageHeader;
      var future = this._futures.get(parentHeader.msg_id);
      if (future) {
        future.handleMsg(msg);
        handled = true;
      }
    }
    if (msg.channel === 'iopub') {
      switch(msg.header.msg_type) {
      case 'status':
        this._updateStatus(msg.content.execution_state);
        break
      case 'comm_open':
        this._handleCommOpen(msg);
        handled = true;
        break;
      case 'comm_msg':
        this._handleCommMsg(msg);
        handled = true;
        break;
      case 'comm_close':
        this._handleCommClose(msg);
        handled = true;
        break;
      }
    }
    if (!handled) {
      this.unhandledMessage.emit(msg);
    }
  }

  /**
   * Handle a websocket close event.
   */
  private _onWSClose(evt: Event) {
    if ((this.status !== KernelStatus.Dead) &&
        (this._reconnectAttempt < this._reconnectLimit)) {
      this._updateStatus('reconnecting');
      var timeout = Math.pow(2, this._reconnectAttempt);
      console.error("Connection lost, reconnecting in " + timeout + " seconds.");
      setTimeout(this._createSocket.bind(this), 1e3 * timeout);
      this._reconnectAttempt += 1;
    } else {
      this._updateStatus('dead');
    }
  }

  /**
   * Handle status iopub messages from the kernel.
   */
  private _updateStatus(state: string): void {
    var status: KernelStatus;
    this._isReady = false;
    switch(state) {
    case 'starting':
      status = KernelStatus.Starting;
      this._isReady = true;
      break;
    case 'idle':
      status = KernelStatus.Idle;
      this._isReady = true;
      break;
    case 'busy':
      status = KernelStatus.Busy;
      this._isReady = true;
      break;
    case 'restarting':
      status = KernelStatus.Restarting;
      break;
    case 'reconnecting':
      status = KernelStatus.Reconnecting;
      break;
    case 'dead':
      status = KernelStatus.Dead;
      break;
    default:
      console.error('invalid kernel status:', state);
      return;
    }
    if (status !== this._status) {
      this._status = status;
      if (status === KernelStatus.Dead) {
        runningKernels.delete(this._id);
        this._ws.close();
      }
      logKernelStatus(this);
      this.statusChanged.emit(status);
    }
  }

  /**
   * Handle a `comm_open` kernel message.
   */
  private _handleCommOpen(msg: IKernelMessage): void {
    if (!validate.validateCommMessage(msg)) {
      console.error('Invalid comm message');
      return;
    }
    var content = msg.content as ICommOpen;
    if (!content.target_module) {
      this.commOpened.emit(msg.content);
      return;
    }
    var targetName = content.target_name;
    var moduleName = content.target_module
    var promise = new Promise((resolve, reject) => {
      // Try loading the module using require.js
      requirejs([moduleName], (mod: any) => {
        if (mod[targetName] === undefined) {
          reject(new Error(
            'Target ' + targetName + ' not found in module ' + moduleName
          ));
        }
        var target = mod[targetName];
        var comm = new Comm(
          content.target_name,
          content.comm_id,
          this._sendCommMessage,
          () => { this._unregisterComm(content.comm_id); }
        );
        try {
          var response = target(comm, content.data);
        } catch (e) {
          comm.close();
          this._unregisterComm(comm.commId);
          console.error("Exception opening new comm");
          reject(e);
        }
        this._commPromises.delete(comm.commId);
        this._comms.set(comm.commId, comm);
        resolve(comm);
      });
    });
    this._commPromises.set(content.comm_id, promise);
  }

  /**
   * Handle 'comm_close' kernel message.
   */
  private _handleCommClose(msg: IKernelMessage): void {
    if (!validate.validateCommMessage(msg)) {
      console.error('Invalid comm message');
      return;
    }
    var content = msg.content;
    var promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      var comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      }
      promise = Promise.resolve(comm);
    }
    promise.then((comm) => {
      this._unregisterComm(comm.commId);
      try {
        var onClose = comm.onClose;
        if (onClose) onClose(msg.content.data);
        (<Comm>comm).dispose();
      } catch (e) {
        console.error("Exception closing comm: ", e, e.stack, msg);
      }
    });
  }

  /**
   * Handle a 'comm_msg' kernel message.
   */
  private _handleCommMsg(msg: IKernelMessage): void {
    if (!validate.validateCommMessage(msg)) {
      console.error('Invalid comm message');
      return;
    }
    var content = msg.content;
    var promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      var comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      } else {
        var onMsg = comm.onMsg;
        if (onMsg) onMsg(msg.content.data);
      }
    } else {
      promise.then((comm) => {
        try {
          var onMsg = comm.onMsg;
          if (onMsg) onMsg(msg.content.data);
        } catch (e) {
          console.error("Exception handling comm msg: ", e, e.stack, msg);
        }
        return comm;
      });
    }
  }

  /**
   * Send a comm message to the kernel.
   */
  private _sendCommMessage(payload: ICommPayload, disposeOnDone: boolean = true): IKernelFuture {
   var options: IKernelMessageOptions = {
      msgType: payload.msgType,
      channel: 'shell',
      username: this.username,
      session: this.clientId
    }
    var msg = createKernelMessage(
      options, payload.content, payload.metadata, payload.buffers
    );
    return this.sendShellMessage(msg, false, disposeOnDone);
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
  private _status = KernelStatus.Unknown;
  private _clientId = '';
  private _ws: WebSocket = null;
  private _username = '';
  private _ajaxSettings = '';
  private _reconnectLimit = 7;
  private _reconnectAttempt = 0;
  private _isReady = false;
  private _futures: Map<string, KernelFutureHandler> = null;
  private _commPromises: Map<string, Promise<IComm>> = null;
  private _comms: Map<string, IComm> = null;
}


/**
 * A module private store for running kernels.
 */
var runningKernels = new Map<string, Kernel>();


/**
 * Restart a kernel.
 */
function restartKernel(kernel: IKernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
  var url = utils.urlPathJoin(
    baseUrl, KERNEL_SERVICE_URL,
    utils.urlJoinEncode(kernel.id, 'restart')
  );
  ajaxSettings = ajaxSettings || { };
  ajaxSettings.method = 'POST';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelId(success.data);
  }, onKernelError);
}


/**
 * The contents of a comm payload.
 */
interface ICommPayload {
  msgType: string;
  content: any;
  metadata: any;
  buffers?: (ArrayBuffer | ArrayBufferView)[];
}


/**
 * Interrupt a kernel.
 */
function interruptKernel(kernel: IKernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlPathJoin(
    baseUrl, KERNEL_SERVICE_URL,
    utils.urlJoinEncode(kernel.id, 'interrupt')
  );
  ajaxSettings = ajaxSettings || { };
  ajaxSettings.method = 'POST';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
  }, onKernelError);
}


/**
 * Delete a kernel.
 */
function shutdownKernel(kernel: Kernel, baseUrl: string, ajaxSettings?: IAjaxSettings): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL,
                              utils.urlJoinEncode(kernel.id));
  ajaxSettings = ajaxSettings || { };
  ajaxSettings.method = 'DELETE';
  ajaxSettings.dataType = 'json';

  return utils.ajaxRequest(ur, ajaxSettings).then(success => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
  }, onKernelError);
}


/**
 * Log the current kernel status.
 */
function logKernelStatus(kernel: IKernel): void {
  if (kernel.status == KernelStatus.Idle ||
      kernel.status === KernelStatus.Busy ||
      kernel.status === KernelStatus.Unknown) {
    return;
  }
  var status = '';
  switch (kernel.status) {
  case KernelStatus.Starting:
    status = 'starting';
    break;
  case KernelStatus.Restarting:
    status = 'restarting';
    break;
  case KernelStatus.Dead:
    status = 'dead';
    break;
  }
  console.log('Kernel: ' + status + ' (' + kernel.id + ')');
}


/**
 * Handle an error on a kernel Ajax call.
 */
function onKernelError(error: utils.IAjaxError): any {
  console.error("API request failed (" + error.statusText + "): ");
  throw Error(error.statusText);
}


/**
 * Send a kernel message to the kernel and return the contents of the response.
 */
function sendKernelMessage(kernel: IKernel, msg: IKernelMessage): Promise<any> {
  var future = kernel.sendShellMessage(msg, true);
  return new Promise<IKernelInfo>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(msg.content);
    }
  });
}


/**
 * Bit flags for the kernel future state.
 */
enum KernelFutureFlag {
  GotReply = 0x1,
  GotIdle = 0x2,
  IsDone = 0x4,
  DisposeOnDone = 0x8,
}


/**
 * Implementation of a kernel future.
 */
class KernelFutureHandler extends DisposableDelegate implements IKernelFuture {

  /**
   * Construct a new KernelFutureHandler.
   */
  constructor(cb: () => void, msgId: string, expectShell: boolean, disposeOnDone: boolean) {
    super(cb);
    this._msgId = msgId;
    if (!expectShell) {
      this._setFlag(KernelFutureFlag.GotReply);
    }
    this._disposeOnDone = disposeOnDone;
  }

  /**
   * Get the id of the message.
   */
  get msgId(): string {
    return this._msgId;
  }

  /**
   * Check for message done state.
   */
  get isDone(): boolean {
    return this._testFlag(KernelFutureFlag.IsDone);
  }

  /**
   * Get the reply handler.
   */
  get onReply(): (msg: IKernelMessage) => void {
    return this._reply;
  }

  /**
   * Set the reply handler.
   */
  set onReply(cb: (msg: IKernelMessage) => void) {
    this._reply = cb;
  }

  /**
   * Get the iopub handler.
   */
  get onIOPub(): (msg: IKernelMessage) => void {
    return this._iopub;
  }

  /**
   * Set the iopub handler.
   */
  set onIOPub(cb: (msg: IKernelMessage) => void) {
    this._iopub = cb;
  }

  /**
   * Get the done handler.
   */
  get onDone(): (msg: IKernelMessage) => void  {
    return this._done;
  }

  /**
   * Set the done handler.
   */
  set onDone(cb: (msg: IKernelMessage) => void) {
    this._done = cb;
  }

  /**
   * Get the stdin handler.
   */
  get onStdin(): (msg: IKernelMessage) => void {
    return this._stdin;
  }

  /**
   * Set the stdin handler.
   */
  set onStdin(cb: (msg: IKernelMessage) => void) {
    this._stdin = cb;
  }

  /**
   * Dispose and unregister the future.
   */
  dispose(): void {
    this._stdin = null;
    this._iopub = null;
    this._reply = null;
    this._done = null;
    super.dispose();
  }

  /**
   * Handle an incoming kernel message.
   */
  handleMsg(msg: IKernelMessage): void {
    switch(msg.channel) {
    case 'shell':
      this._handleReply(msg);
      break;
    case 'stdin':
      this._handleStdin(msg);
      break;
    case 'iopub':
      this._handleIOPub(msg);
      break;
    }
  }

  private _handleReply(msg: IKernelMessage): void {
    var reply = this._reply;
    if (reply) reply(msg);
    this._setFlag(KernelFutureFlag.GotReply);
    if (this._testFlag(KernelFutureFlag.GotIdle)) {
      this._handleDone(msg);
    }
  }

  private _handleStdin(msg: IKernelMessage): void {
    var stdin = this._stdin;
    if (stdin) stdin(msg);
  }

  private _handleIOPub(msg: IKernelMessage): void {
    var iopub = this._iopub;
    if (iopub) iopub(msg);
    if (msg.header.msg_type === 'status' &&
        msg.content.execution_state === 'idle') {
      this._setFlag(KernelFutureFlag.GotIdle);
      if (this._testFlag(KernelFutureFlag.GotReply)) {
        this._handleDone(msg);
      }
    }
  }

  private _handleDone(msg: IKernelMessage): void {
    if (this.isDone) {
      return;
    }
    this._setFlag(KernelFutureFlag.IsDone);
    var done = this._done;
    if (done) done(msg);
    this._done = null;
    if (this._disposeOnDone) {
      this.dispose();
    }
  }

  /**
   * Test whether the given future flag is set.
   */
  private _testFlag(flag: KernelFutureFlag): boolean {
    return (this._status & flag) !== 0;
  }

  /**
   * Set the given future flag.
   */
  private _setFlag(flag: KernelFutureFlag): void {
    this._status |= flag;
  }

  /**
   * Clear the given future flag.
   */
  private _clearFlag(flag: KernelFutureFlag): void {
    this._status &= ~flag;
  }

  private _msgId = '';
  private _status = 0;
  private _stdin: (msg: IKernelMessage) => void = null;
  private _iopub: (msg: IKernelMessage) => void = null;
  private _reply: (msg: IKernelMessage) => void = null;
  private _done: (msg: IKernelMessage) => void = null;
  private _disposeOnDone = true;
}


/**
 * Comm channel handler.
 */
class Comm extends DisposableDelegate implements IComm {

  /**
   * Construct a new comm channel.
   */
  constructor(target: string, id: string, msgFunc: (payload: ICommPayload, disposeOnDone?: boolean) => IKernelFuture, disposeCb: () => void) {
    super(disposeCb);
    this._target = target;
    this._id = id;
    this._msgFunc = msgFunc;
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
  get onClose(): (data?: any) => void {
    return this._onClose;
  }

  /**
   * Set the callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[ICommClose]], [[close]]
   */
  set onClose(cb: (data?: any) => void) {
    this._onClose = cb;
  }

  /**
   * Get the callback for a comm message received event.
   *
   * **See also:** [[ICommMsg]]
   */
  get onMsg(): (data: any) => void {
    return this._onMsg;
  }

  /**
   * Set the callback for a comm message received event.
   *
   * **See also:** [[ICommMsg]]
   */
  set onMsg(cb: (data: any) => void) {
    this._onMsg = cb;
  }

  /**
   * Test whether the comm has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return (this._msgFunc === null);
  }

  /**
   * Open a comm with optional data and metadata.
   *
   * #### Notes
   * This sends a `comm_open` message to the server.
   *
   * **See also:** [[ICommOpen]]
   */
  open(data?: any, metadata?: any): IKernelFuture {
    var content = {
      comm_id: this._id,
      target_name: this._target,
      data: data || {}
    }
    var payload = {
      msgType: 'comm_open', content: content, metadata: metadata
    }
    if (this._msgFunc === void 0) {
      return;
    }
    return this._msgFunc(payload);
  }

  /**
   * Send a `comm_msg` message to the kernel.
   *
   * #### Notes
   * This is a no-op if the comm has been closed.
   *
   * **See also:** [[ICommMsg]]
   */
  send(data: any, metadata={}, buffers: (ArrayBuffer | ArrayBufferView)[]=[], disposeOnDone: boolean = true): IKernelFuture {
    if (this.isDisposed) {
      throw Error('Comm is closed');
    }
    var content = { comm_id: this._id, data: data };
    var payload = {
      msgType: 'comm_msg',
      content: content,
      metadata: metadata,
      buffers: buffers,
    }
    if (this._msgFunc === void 0) {
      return;
    }
    return this._msgFunc(payload, disposeOnDone);
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
  close(data?: any, metadata?: any): IKernelFuture {
    if (this.isDisposed) {
      return;
    }
    var onClose = this._onClose;
    if (onClose) onClose(data);
    if (this._msgFunc === void 0) {
      return;
    }
    var content = { comm_id: this._id, data: data || {} };
    var payload = {
      msgType: 'comm_close', content: content, metadata: metadata
    }
    var future = this._msgFunc(payload);
    this.dispose();
    return future;
  }

  /**
   * Dispose of the resources held by the comm.
   */
  dispose(): void {
    this._onClose = null;
    this._onMsg = null;
    this._msgFunc = null;
    this._id = null;
    super.dispose();
  }

  private _target = '';
  private _id = '';
  private _onClose: (data?: any) => void = null;
  private _onMsg: (data: any) => void = null;
  private _msgFunc: (payload: ICommPayload, disposeOnDone?: boolean) => IKernelFuture = null;
}
