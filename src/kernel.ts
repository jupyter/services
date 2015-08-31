// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable, DisposableDelegate } from 'phosphor-disposable';

import { ISignal, defineSignal } from 'phosphor-signaling';

import { 
  IKernel, IKernelFuture, IKernelId, IKernelInfo, IKernelMessage, 
  IKernelOptions, IKernelSpecs, KernelStatus
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
  if (!options.wsUrl) {
    // trailing 's' in https will become wss for secure web sockets
    options.wsUrl = (
      location.protocol.replace('http', 'ws') + "//" + location.host
    );
  }
  return Promise.resolve();
}


/**
 * Implementation of the Kernel object
 */
class Kernel implements IKernel {

  /**
   * A signal emitted when the kernel status changes.
   */
  statusChanged: ISignal<KernelStatus>;


  constructor(name: string, id: string, ws: WebSocket, baseUrl: string) {
    this._name = name;
    this._id = id;
    this._ws = ws;
    this._baseUrl = baseUrl;
    this._clientId = utils.uuid();
    this._handlerMap = new Map<string, KernelFutureHandler>();
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
   * The information about the kernel.
   */
  get info(): IKernelInfo {
    return this._info;
  }

  /**
   * Send a message to the kernel.
   *
   * The future object will yield the result when available.
   */
  sendMessage(msg: IKernelMessage): IKernelFuture {
    if (this._status != KernelStatus.Open) {
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
    this._status = KernelStatus.Closing;
    return shutdownKernel(this, this._baseUrl);
  }

  private _id = '';
  private _name = '';
  private _baseUrl = '';
  private _status = KernelStatus.Closed;
  private _clientId = '';
  private _info: IKernelInfo = null;
  private _ws: WebSocket = null;
  private _handlerMap: Map<string, KernelFutureHandler> = null;
}


function restartKernel(kernel: IKernel, baseUrl: string): Promise<void> {
  if (kernel.status != KernelStatus.Open) {
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
  if (kernel.status != KernelStatus.Open) {
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
