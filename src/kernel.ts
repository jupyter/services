// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable, DisposableDelegate } from 'phosphor-disposable';

import { ISignal, defineSignal } from 'phosphor-signaling';

import { 
  IKernel, IKernelFuture, IKernelId, IKernelInfo, IKernelMessage, 
  IKernelMessageHeader, IKernelOptions, IKernelSpecs, KernelStatus
} from './ikernel';

import * as serialize from './serialize';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the kernel service.
 */
var KERNEL_SERVICE_URL = 'api/kernel';


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
 * Fetch the kernel specs via API: GET /kernelspecs
 */
export
function listKernelSpecs(): Promise<IKernelSpecs> {
  return null;
}


/**
 * Start a new kernel via API: POST /kernels
 *
 * Wrap the result in an IKernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
export
function startNewKernel(options: IKernelOptions): Promise<IKernel> {
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
 * Wrap the result in an IKernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
export
function connectToKernel(id: string, options?: IKernelOptions): Promise<IKernel> {
  var kernel = runningKernels.get(id);
  if (kernel) {
    return Promise.resolve(kernel);
  }
  if (options === void 0) {
    return Promise.reject(<IKernel>void 0);
  }
  return createKernel(options, id);
}


function createKernel(options: IKernelOptions, id: string): Promise<IKernel> {
  return new Promise<IKernel>((resolve, reject) => {
    var kernel = new Kernel(options, id);
    var callback = (status: KernelStatus) => {
      if (status === KernelStatus.Starting) {
        kernel.statusChanged.disconnect(callback);
        resolve(kernel);
      } else if (status === KernelStatus.Dead) {
        kernel.statusChanged.disconnect(callback);
        reject(<IKernel>void 0);
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
   */
  statusChanged: ISignal<KernelStatus>;


  constructor(options: IKernelOptions, id: string) {
    this._name = options.name;
    this._id = id;
    this._baseUrl = options.baseUrl;
    this._clientId = utils.uuid();
    this._handlerMap = new Map<string, KernelFutureHandler>();
    this._wsUrl = options.wsUrl;
    if (!this._wsUrl) {
      // trailing 's' in https will become wss for secure web sockets
      this._wsUrl = (
        location.protocol.replace('http', 'ws') + "//" + location.host
      );
    }
    this._createSocket();
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
    if (this._status != KernelStatus.Idle) {
      throw Error('Cannot send a message to a closed Kernel');
    }
    this._ws.send(serialize.serialize(msg));

    var future = new KernelFutureHandler(() => {
      this._handlerMap.delete(msg.header.msgId);
    });

    this._handlerMap.set(msg.header.msgId, future);

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
   * If the given kernel id corresponds to an IKernel object, that
   * object is disposed and its websocket connection is cleared.
   *
   * Any further calls to `sendMessage` for that IKernel will throw
   * an exception.
   */
  shutdown(): Promise<void> {
    return shutdownKernel(this, this._baseUrl).then(() => {
      this._ws.close();
    });
  }

  /**
   * Handle an incoming Websocket message.
   */
  private _handleMessage(evt: MessageEvent): void {
    try {
      var msg = serialize.deserialize(evt.data);
    } catch (error) {
      console.error(error.message);
      return;
    }
    if (msg.channel === 'iopub' && msg.msgType === 'status') {
      this._handleStatusMessage(msg);
    }
    if (msg.parentHeader) {
      var header = (<IKernelMessageHeader>msg.parentHeader);
      var future = this._handlerMap.get(header.msgId);
      if (future) {
        future.handleMsg(msg);
      }
    }
  }

  /**
   * Handle status iopub messages from the kernel.
   */
  private _handleStatusMessage(msg: IKernelMessage): void {
    var execution_state = msg.content.execution_state;

    if (execution_state === 'dead') {
      this._ws.close();
      return;
    }

    switch(execution_state) {
      case 'starting':
        this._status = KernelStatus.Starting;
        break;
      case 'idle':
        this._status = KernelStatus.Idle;
        break;
      case 'busy':
        this._status = KernelStatus.Busy;
        break;
      case 'restarting':
        this._status = KernelStatus.Restarting;
        break;
    }
    this.statusChanged.emit(this._status);
    logKernelStatus(this);
  }

  private _createSocket() {
    var url = (this._wsUrl + 
      utils.urlJoinEncode(this._baseUrl, KERNEL_SERVICE_URL, this._id, 'channels') +
      '?session_id=' + this._clientId
    );

    this._ws = new WebSocket(url);
    // Ensure incoming binary messages are not Blobs
    this._ws.binaryType = 'arraybuffer';

    this._ws.onmessage = (evt: MessageEvent) => {
      this._handleMessage(evt);
    };

    this._ws.onclose = () => {
      this._status = KernelStatus.Dead;
      this.statusChanged.emit(this._status);
      logKernelStatus(this);
    }
  }

  private _id = '';
  private _name = '';
  private _baseUrl = '';
  private _wsUrl = '';
  private _status = KernelStatus.Unknown;
  private _clientId = '';
  private _ws: WebSocket = null;
  private _handlerMap: Map<string, KernelFutureHandler> = null;
}


function restartKernel(kernel: IKernel, baseUrl: string): Promise<void> {
  if (kernel.status != KernelStatus.Idle) {
    return Promise.reject(void 0);
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


function interruptKernel(kernel: IKernel, baseUrl: string): Promise<void> {
  if (kernel.status === KernelStatus.Dead) {
    return Promise.reject(void 0);
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


function shutdownKernel(kernel: IKernel, baseUrl: string): Promise<void> {
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


function logKernelStatus(kernel: Kernel) {
  var msg = 'Kernel: ' + status + ' (' + kernel.id + ')';
  if (status === 'idle' || status === 'busy') {
    // console.log(msg);
  } else {
    console.log(msg);
  }
}


function onKernelError(error: utils.IAjaxError) {
  console.error("API request failed (" + error.statusText + "): ");
  throw Error(error.statusText);
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
   * Register a reply handler. Returns `this`.
   */
  set onReply(cb: (msg: IKernelMessage) => void) {
    this._reply = cb;
  }

  /**
   * Register an output handler. Returns `this`.
   */
  set onOutput(cb: (msg: IKernelMessage) => void) {
    this._output = cb;
  }

  /**
   * Register a done handler. Returns `this`.
   */
  set onDone(cb: (msg: IKernelMessage) => void) {
    this._done = cb;
  }

  /**
   * Register an input handler. Returns `this`.
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
      if (msg.msgType === 'status' && msg.content.execution_state === 'idle') {
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


var runningKernels = new Map<string, IKernel>();
