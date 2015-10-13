// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { DisposableDelegate } from 'phosphor-disposable';

import { ISignal, Signal, disconnectReceiver } from 'phosphor-signaling';

import { 
  IComm, ICommInfoRequest, ICommInfoReply, ICommOpen, ICompleteReply, 
  ICompleteRequest, IExecuteReply, IExecuteRequest, IInspectReply, 
  IInspectRequest, IIsCompleteReply, IIsCompleteRequest, IInputReply, IKernel, 
  IKernelFuture, IKernelId, IKernelInfo, IKernelMessage, IKernelMessageHeader,
  IKernelMessageOptions, IKernelOptions, IKernelSpecIds, KernelStatus
} from './ikernel';

import { IAjaxOptions } from './utils';

import * as serialize from './serialize';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the kernel service.
 */
var KERNEL_SERVICE_URL = 'api/kernels';


/**
 * The url for the kernelspec service.
 */
var KERNELSPEC_SERVICE_URL = 'api/kernelspecs';


/**  
 * Fetch the kernel specs.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernelspecs).
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
export
function getKernelSpecs(baseUrl: string, ajaxOptions?: IAjaxOptions): Promise<IKernelSpecIds> {
  var url = utils.urlPathJoin(baseUrl, KERNELSPEC_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "GET",
    dataType: "json"   
  }, ajaxOptions).then((success: utils.IAjaxSuccess) => {
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
function listRunningKernels(baseUrl: string, ajaxOptions?: IAjaxOptions): Promise<IKernelId[]> {
  var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "GET",
    dataType: "json"
  }, ajaxOptions).then((success: utils.IAjaxSuccess): IKernelId[] => {
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
 * Wraps the result in an Kernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
export
function startNewKernel(options: IKernelOptions, ajaxOptions?: IAjaxOptions): Promise<IKernel> {
  var url = utils.urlPathJoin(options.baseUrl, KERNEL_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }, ajaxOptions).then((success: utils.IAjaxSuccess) => {
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
function connectToKernel(id: string, options?: IKernelOptions, ajaxOptions?: IAjaxOptions): Promise<IKernel> {
  var kernel = runningKernels.get(id);
  if (kernel) {
    return Promise.resolve(kernel);
  }
  if (options === void 0) {
    return Promise.reject(new Error('Please specify kernel options'));
  }
  return listRunningKernels(options.baseUrl, ajaxOptions).then((kernelIds) => {
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
  constructor(options: IKernelOptions, id: string) {
    this._name = options.name;
    this._id = id;
    this._baseUrl = options.baseUrl;
    this._clientId = options.clientId || utils.uuid();
    this._username = options.username || '';
    this._futures = new Map<string, KernelFutureHandler>();
    this._commPromises = new Map<string, Promise<IComm>>();
    this._comms = new Map<string, IComm>();
    this._createSocket(options.wsUrl);
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
  sendShellMessage(msg: IKernelMessage, expectReply=false): IKernelFuture {
    if (this._status === KernelStatus.Dead) {
      throw Error('Cannot send a message to a closed Kernel');
    }
    this._ws.send(serialize.serialize(msg));

    var future = new KernelFutureHandler(expectReply, () => {
      this._futures.delete(msg.header.msg_id);
    });
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
  interrupt(ajaxOptions?: IAjaxOptions): Promise<void> {
    return interruptKernel(this, this._baseUrl, ajaxOptions);
  }

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
  restart(ajaxOptions?: IAjaxOptions): Promise<void> {
    if (this._status === KernelStatus.Dead) {
      return Promise.reject(new Error('Kernel is dead'));
    }
    this._status = KernelStatus.Restarting;
    return restartKernel(this, this._baseUrl, ajaxOptions);
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
  shutdown(ajaxOptions?: IAjaxOptions): Promise<void> {
    return shutdownKernel(this, this._baseUrl, ajaxOptions).then(() => {
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
   * shell reply is received and validated.  The future will dispose when
   * this message is received and the `idle` iopub status is received.
   *
   * **See also:** [[IExecuteReply]]
   */
  execute(contents: IExecuteRequest): IKernelFuture {
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
    return this.sendShellMessage(msg, true);
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
    if (this._status === KernelStatus.Dead) {
      throw Error('Cannot send a message to a closed Kernel');
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
  private _createSocket(wsUrl: string) {
    if (!wsUrl) {
      // trailing 's' in https will become wss for secure web sockets
      wsUrl = (
        location.protocol.replace('http', 'ws') + "//" + location.host
      );
    }
    var partialUrl = utils.urlPathJoin(wsUrl, KERNEL_SERVICE_URL, 
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
    this._updateStatus('dead');
  }

  /**
   * Handle status iopub messages from the kernel.
   */
  private _updateStatus(state: string): void {
    var status: KernelStatus;
    switch(state) {
      case 'starting':
        status = KernelStatus.Starting;
        break;
      case 'idle':
        status = KernelStatus.Idle;
        break;
      case 'busy':
        status = KernelStatus.Busy;
        break;
      case 'restarting':
        status = KernelStatus.Restarting;
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
   * Handle `comm_open` kernel message.
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
        console.log("Exception closing comm: ", e, e.stack, msg);
      }
    });
  }

  /**
   * Handle 'comm_msg' kernel message.
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
          console.log("Exception handling comm msg: ", e, e.stack, msg);
        }
        return comm;
      });
    }
  }

  /**
   * Send a comm message to the kernel.
   */
  private _sendCommMessage(payload: ICommPayload): IKernelFuture {
   var options: IKernelMessageOptions = {
      msgType: payload.msgType,
      channel: 'shell',
      username: this.username,
      session: this.clientId
    }
    var msg = createKernelMessage(
      options, payload.content, payload.metadata, payload.buffers
    );  
    return this.sendShellMessage(msg);
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
  private _status = KernelStatus.Unknown;
  private _clientId = '';
  private _ws: WebSocket = null;
  private _username = '';
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
function restartKernel(kernel: IKernel, baseUrl: string, ajaxOptions?: IAjaxOptions): Promise<void> {
  var url = utils.urlPathJoin(
    baseUrl, KERNEL_SERVICE_URL, 
    utils.urlJoinEncode(kernel.id, 'restart')
  );
  var promise = new Promise<void>((resolve, reject) => {
    var callback = () => {
      if (kernel.status === KernelStatus.Starting) {
        kernel.statusChanged.disconnect(callback);
        kernel.kernelInfo().then(() => resolve());
      } else if (kernel.status === KernelStatus.Dead) {
        reject(new Error('Kernel is dead'));
      }
    }
    kernel.statusChanged.connect(callback);
  });
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }, ajaxOptions).then((success: utils.IAjaxSuccess) => {
    console.log('****got the ajax response');
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelId(success.data);
    return promise;
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
function interruptKernel(kernel: IKernel, baseUrl: string, ajaxOptions?: IAjaxOptions): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlPathJoin(
    baseUrl, KERNEL_SERVICE_URL, 
    utils.urlJoinEncode(kernel.id, 'interrupt')
  );
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }, ajaxOptions).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
  }, onKernelError);
}


/**
 * Delete a kernel.
 */
function shutdownKernel(kernel: Kernel, baseUrl: string, ajaxOptions?: IAjaxOptions): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, 
                              utils.urlJoinEncode(kernel.id));
  return utils.ajaxRequest(url, {
    method: "DELETE",
    dataType: "json"
  }, ajaxOptions).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
  }, onKernelError);
}


/**
 * Log the current kernel status.
 */
function logKernelStatus(kernel: IKernel): void {
  /*
  if (kernel.status == KernelStatus.Idle || 
      kernel.status === KernelStatus.Busy ||
      kernel.status === KernelStatus.Unknown) {
    return;
  }
  */
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
  case KernelStatus.Idle:
    status = 'idle';
    break;
  case KernelStatus.Busy:
    status = 'busy';
    break;
  }
  console.log('***Kernel: ' + status + ' (' + kernel.id + ')');
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
  IsDone = 0x4
}


/**
 * Implementation of a kernel future.
 */
class KernelFutureHandler extends DisposableDelegate implements IKernelFuture {

  /**
   * Construct a new KernelFutureHandler. 
   */
  constructor(expectShell: boolean, cb: () => void) {
    super(cb);
    if (!expectShell) {
      this._setFlag(KernelFutureFlag.GotReply);
    }
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
    this.dispose();
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

  private _status = 0;
  private _stdin: (msg: IKernelMessage) => void = null;
  private _iopub: (msg: IKernelMessage) => void = null;
  private _reply: (msg: IKernelMessage) => void = null;
  private _done: (msg: IKernelMessage) => void = null;
}


/**
 * Comm channel handler.
 */
class Comm extends DisposableDelegate implements IComm {

  /**
   * Construct a new comm channel.
   */
  constructor(target: string, id: string, msgFunc: (payload: ICommPayload) => IKernelFuture, disposeCb: () => void) {
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
  send(data: any, metadata={}, buffers: (ArrayBuffer | ArrayBufferView)[]=[]): IKernelFuture {
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
    return this._msgFunc(payload);
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
    super.dispose();
  }

  private _target = '';
  private _id = '';
  private _onClose: (data?: any) => void = null;
  private _onMsg: (data: any) => void = null;
  private _msgFunc: (payload: ICommPayload) => IKernelFuture = null;
}
