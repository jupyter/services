// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable, DisposableDelegate } from 'phosphor-disposable';

import { ISignal, defineSignal } from 'phosphor-signaling';

import { 
  ICompleteReply, ICompleteRequest, IExecuteReply, IExecuteRequest,
  IInspectReply, IInspectRequest, IIsCompleteReply, IIsCompleteRequest,
  IKernelFuture, IKernelId, IKernelInfo, IKernelMessage, 
  IKernelMessageHeader, IKernelOptions, KernelStatus
} from './ikernel';

import * as serialize from './serialize';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the kernel service.
 */
var KERNEL_SERVICE_URL = 'api/kernels';


/**
 * Fetch the running kernels via API: GET /kernels
 */
export
function listRunningKernels(baseUrl: string): Promise<IKernelId[]> {
  var url = utils.urlJoinEncode(baseUrl, KERNEL_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "GET",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess): IKernelId[] => {
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
  });
}


/**
 * Start a new kernel via API: POST /kernels
 *
 * Wrap the result in an Kernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
export
function startNewKernel(options: IKernelOptions): Promise<Kernel> {
  var url = utils.urlJoinEncode(options.baseUrl, KERNEL_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelId(success.data);
    return createKernel(options, success.data.id);
  });
}


/**
 * Connect to a running kernel.
 *
 * If the kernel was already started via `startNewKernel`, the existing
 * Kernel object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * kernel.  The promise is fulfilled when the kernel is fully ready to send 
 * the first message. If the kernel fails to become ready, the promise is 
 * rejected.
 *
 * If the kernel was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function connectToKernel(id: string, options?: IKernelOptions): Promise<Kernel> {
  var kernel = runningKernels.get(id);
  if (kernel) {
    return Promise.resolve(kernel);
  }
  if (options === void 0) {
    return Promise.reject(new Error('Please specify kernel options'));
  }
  return listRunningKernels(options.baseUrl).then((kernelIds) => {
    if (!kernelIds.some(k => k.id === id)) {
      throw new Error('No running kernel with id: ' + id);
    }
    return createKernel(options, id);
  });
}


/**
 * Create a Promise for a Kernel object.
 * 
 * Fulfilled when the Kernel is Starting, or rejected if Dead.
 */
function createKernel(options: IKernelOptions, id: string): Promise<Kernel> {
  return new Promise<Kernel>((resolve, reject) => {
    var kernel = new Kernel(options, id);
    var callback = (status: KernelStatus) => {
      if (status === KernelStatus.Starting) {
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
export
class Kernel {

  /**
   * A signal emitted when the kernel status changes.
   */
  @defineSignal
  statusChanged: ISignal<KernelStatus>;

  /**
   * Construct a kernel object.
   */
  constructor(options: IKernelOptions, id: string) {
    this._name = options.name;
    this._id = id;
    this._baseUrl = options.baseUrl;
    this._clientId = options.clientId || utils.uuid();
    this._username = options.username || '';
    this._handlerMap = new Map<string, KernelFutureHandler>();
    this._createSocket(options.wsUrl);
  }

  /**
   * The id of the server-side kernel.
   */
  get id(): string {
    return this._id;
  }

  /**
   * The name of the server-side kernel.
   */
  get name(): string {
    return this._name;
  }

  /**
   * The client username.
   *
   * Read-only
   */
   get username(): string {
     return this._username;
   }

  /**
   * The client unique id.
   *
   * Read-only
   */
  get clientId(): string {
    return this._clientId;
  }

  /**
   * The current status of the kernel.
   */
  get status(): KernelStatus {
    return this._status;
  }

  /**
   * Send a message to the kernel.
   *
   * The future object will yield the result when available.
   */
  sendMessage(msg: IKernelMessage): IKernelFuture {
    if (this._status === KernelStatus.Dead) {
      throw Error('Cannot send a message to a closed Kernel');
    }

    this._ws.send(serialize.serialize(msg));

    var future = new KernelFutureHandler(() => {
      this._handlerMap.delete(msg.header.msg_id);
    });

    this._handlerMap.set(msg.header.msg_id, future);

    return future;
  }

  /**
   * Interrupt a kernel via API: POST /kernels/{kernel_id}/interrupt
   */
  interrupt(): Promise<void> {
    return interruptKernel(this, this._baseUrl);
  }

  /**
   * Restart a kernel via API: POST /kernels/{kernel_id}/restart
   *
   * It is assumed that the API call does not mutate the kernel id or name.
   */
  restart(): Promise<void> {
    return restartKernel(this, this._baseUrl);
  }

  /**
   * Delete a kernel via API: DELETE /kernels/{kernel_id}
   *
   * If the given kernel id corresponds to an Kernel object, that
   * object is disposed and its websocket connection is cleared.
   *
   * Any further calls to `sendMessage` for that Kernel will throw
   * an exception.
   */
  shutdown(): Promise<void> {
    return shutdownKernel(this, this._baseUrl).then(() => {
      this._ws.close();
    });
  }

  /**
   * Send a "kernel_info_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
   */
  infoRequest(): Promise<IKernelInfo> {
    var msg = createKernelMessage(this, 'kernel_info_request', 'shell');
    return sendKernelMessage(this, msg);
  }

  /**
   * Send a "complete_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#completion
   */
  completeRequest(contents: ICompleteRequest): Promise<ICompleteReply> {
    var msg = createKernelMessage(this, 'complete_request', 'shell', contents);
    return sendKernelMessage(this, msg);
  }

  /**
   * Send an "inspect_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#introspection
   */
  inspectRequest(contents: IInspectRequest): Promise<IInspectReply> {
    var msg = createKernelMessage(this, 'inspect_request', 'shell', contents);
    return sendKernelMessage(this, msg);
  }

  /**
   * Send an "execute_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#execute
   */
  executeRequest(contents: IExecuteRequest): IKernelFuture {
    var msg = createKernelMessage(this, 'execute_request', 'shell', contents);
    return this.sendMessage(msg);
  }

  /**
   * Send an "is_complete_request" message.
   *
   * See https://ipython.org/ipython-doc/dev/development/messaging.html#code-completeness
   */
  isCompleteRequest(contents: IIsCompleteRequest): Promise<IIsCompleteReply> {
    var msg = createKernelMessage(
      this, 'is_complete_request', 'shell', contents
    );
    return sendKernelMessage(this, msg);
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
    var url = (
      wsUrl + 
      utils.urlJoinEncode(
        this._baseUrl, KERNEL_SERVICE_URL, this._id, 'channels'
      ) + 
      '?session_id=' + this._clientId
    );

    this._ws = new WebSocket(url);
    // Ensure incoming binary messages are not Blobs
    this._ws.binaryType = 'arraybuffer';

    this._ws.onmessage = (evt: MessageEvent) => { this._onWSMessage(evt); };
    this._ws.onclose = (evt: Event) => { this._onWSClose(evt); };
    this._ws.onerror = (evt: Event) => { this._onWSClose(evt); };
  }

  private _onWSMessage(evt: MessageEvent) {
    var msg = serialize.deserialize(evt.data);
    if (msg.channel === 'iopub' && msg.header.msg_type === 'status') {
      this._updateStatus(msg.content.executionstate);
    }
    if (msg.parent_header) {
      var header = (<IKernelMessageHeader>msg.parent_header);
      var future = this._handlerMap.get(header.msg_type);
      if (future) {
        future.handleMsg(msg);
      }
    }
  }

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

  private _id = '';
  private _name = '';
  private _baseUrl = '';
  private _status = KernelStatus.Unknown;
  private _clientId = '';
  private _ws: WebSocket = null;
  private _username = '';
  private _handlerMap: Map<string, KernelFutureHandler> = null;
}


/**
 * A module private store for running kernels.
 */
var runningKernels = new Map<string, Kernel>();


/**
 * Restart a kernel via API: POST /kernels/{kernel_id}/restart
 *
 * It is assumed that the API call does not mutate the kernel id or name.
 */
function restartKernel(kernel: Kernel, baseUrl: string): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlJoinEncode(
    baseUrl, KERNEL_SERVICE_URL, kernel.id, 'restart'
  );
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    validate.validateKernelId(success.data);
  }, onKernelError);
}


/**
 * Interrupt a kernel via API: POST /kernels/{kernel_id}/interrupt
 */
function interruptKernel(kernel: Kernel, baseUrl: string): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlJoinEncode(
    baseUrl, KERNEL_SERVICE_URL, kernel.id, 'interrupt'
  );
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
  }, onKernelError);
}


/**
 * Delete a kernel via API: DELETE /kernels/{kernel_id}
 *
 * If the given kernel id corresponds to an Kernel object, that
 * object is disposed and its websocket connection is cleared.
 *
 * Any further calls to `sendMessage` for that Kernel will throw
 * an exception.
 */
function shutdownKernel(kernel: Kernel, baseUrl: string): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(new Error('Kernel is dead'));
  }
  var url = utils.urlJoinEncode(baseUrl, KERNEL_SERVICE_URL, kernel.id);
  return utils.ajaxRequest(url, {
    method: "DELETE",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 204) {
      throw Error('Invalid response');
    }
  }, onKernelError);
}


/**
 * Log the current kernel status.
 */
function logKernelStatus(kernel: Kernel): void {
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
  var msg = 'Kernel: ' + status + ' (' + kernel.id + ')';
}


/**
 * Handle an error on a kernel Ajax call.
 */
function onKernelError(error: utils.IAjaxError): any {
  console.error("API request failed (" + error.statusText + "): ");
  throw Error(error.statusText);
}


/**
 * Create a well-formed Kernel Message.
 */
export
function createKernelMessage(kernel: Kernel, msgType: string, channel: string, content: any = {}, metadata: any = {}, buffers: ArrayBuffer[] = []) : IKernelMessage {
  return {
    header: {
      username: kernel.username,
      version: '5.0',
      session: kernel.clientId,
      msg_id: utils.uuid(),
      msg_type: msgType
    },
    parent_header: { },
    channel: channel,
    content: content,
    metadata: metadata,
    buffers: buffers
  }
}


/**
 * Send a kernel message to the kernel and return the contents of the response.
 */
function sendKernelMessage(kernel: Kernel, msg: IKernelMessage): Promise<any> {
  var future = kernel.sendMessage(msg);
  return new Promise<IKernelInfo>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IKernelInfo>msg.content);
    }
  });
}


/**
 * Bit flags for the kernel future state.
 */
enum KernelFutureFlag {
  GotReply = 0x1,
  GotIdle = 0x2,
  AutoDispose = 0x4,
  IsDone = 0x8
}


/**
 * Implementation of a kernel future.
 */
class KernelFutureHandler extends DisposableDelegate implements IKernelFuture {

  constructor(callback: () => void) {
    super(callback);
    this.autoDispose = true;
  }

  /**
   * Get the current autoDispose status of the future.
   */
  get autoDispose(): boolean {
    return this._testFlag(KernelFutureFlag.AutoDispose);
  }

  /**
   * Set the current autoDispose behavior of the future.
   *
   * If True, it will self-dispose() after onDone() is called.
   */
  set autoDispose(value: boolean) {
    if (value) {
      this._setFlag(KernelFutureFlag.AutoDispose);
    } else {
      this._clearFlag(KernelFutureFlag.AutoDispose);
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
   * Get the output handler.
   */
  get onOutput(): (msg: IKernelMessage) => void {
    return this._output;
  }

  /**
   * Set the output handler.
   */
  set onOutput(cb: (msg: IKernelMessage) => void) {
    this._output = cb;
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
   * Get the input handler.
   */
  get onInput(): (msg: IKernelMessage) => void {
    return this._input;
  }

  /**
   * Set the input handler.
   */
  set onInput(cb: (msg: IKernelMessage) => void) {
    this._input = cb;
  }

  /**
   * Handle an incoming message from the kernel belonging to this future.
   */
  handleMsg(msg: IKernelMessage): void {
    if (msg.channel === 'iopub') {
      var output = this._output;
      if (output) output(msg);
      if (msg.header.msg_type === 'status' &&
          msg.content.execution_state === 'idle') {
        this._setFlag(KernelFutureFlag.GotIdle);
        if (this._testFlag(KernelFutureFlag.GotReply)) {
          this._handleDone(msg);
        }
      }
    } else if (msg.channel === 'shell') {
      var reply = this._reply;
      if (reply) reply(msg);
      this._setFlag(KernelFutureFlag.GotReply);
      if (this._testFlag(KernelFutureFlag.GotIdle)) {
        this._handleDone(msg);
      }
    } else if (msg.channel === 'stdin') {
      var input = this._input;
      if (input) input(msg);
    }
  }

  /**
   * Dispose and unregister the future.
   */
  dispose(): void {
    this._input = null;
    this._output = null;
    this._reply = null;
    this._done = null;
    super.dispose();
  }

  /**
   * Handle a message done status.
   */
  private _handleDone(msg: IKernelMessage): void {
    if (this.isDone) {
      return;
    }
    this._setFlag(KernelFutureFlag.IsDone);
    var done = this._done;
    if (done) done(msg);
    this._done = null;
    if (this._testFlag(KernelFutureFlag.AutoDispose)) {
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

  private _status = 0;
  private _input: (msg: IKernelMessage) => void = null;
  private _output: (msg: IKernelMessage) => void = null;
  private _reply: (msg: IKernelMessage) => void = null;
  private _done: (msg: IKernelMessage) => void = null;
}
