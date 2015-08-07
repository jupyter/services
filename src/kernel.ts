// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


import serialize = require('./serialize');
import utils = require('./utils');

import ISignal = phosphor.core.ISignal;
import signal = phosphor.core.signal;
import IDisposable = phosphor.utility.IDisposable;
import Disposable = phosphor.utility.Disposable;
import IAjaxSuccess = utils.IAjaxSuccess;
import IAjaxError = utils.IAjaxError;


/**
 * The url for the kernel service.
 */
var KERNEL_SERVICE_URL = 'api/kernel';


/**
 * Get a logger kernel objects.
 */
var kernel_log = Logger.get('kernel');


/**
 * Kernel message header content.
 */
export
interface IKernelMsgHeader {
  username: string;
  version: string;
  session: string;
  msgId: string;
  msgType: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMsg {
  header: IKernelMsgHeader;
  metadata: any;
  content: any;
  parentHeader: {} | IKernelMsgHeader;
  msgId?: string;
  msgType?: string;
  channel?: string;
  buffers?: string[] | ArrayBuffer[];
}


/**
 * Settings for a kernel execute command.
 */
export
interface IKernelExecute {
  silent?: boolean;
  user_expressions?: any;
  allow_stdin?: boolean;
  store_history?: boolean;
}


/**
 * Kernel identification specification.
 */
export
interface IKernelId {
    id: string;
    name: string;
}


/**
 * Kernel information specification.
 * http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
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
 * Object providing a Future interface for message callbacks.
 *
 * Only one callback can be registered per type.
 * If `autoDispose` is set, the future will self-dispose after `isDone` is
 * set and the registered `onDone` handler is called.
 *
 * The Future is considered done when a `reply` message and a
 * an `idle` iopub status message have been received.
 */
export
interface IKernelFuture extends IDisposable {
  /**
   * The autoDispose behavior of the future.
   *
   * If True, it will self-dispose() after onDone() is called.
   */
  autoDispose: boolean;

  /**
   * Set when the message is done.
   */
  isDone: boolean;

  /**
   * Register a reply handler. Returns `this`.
   */
  onReply(cb: (msg: IKernelMsg) => void): IKernelFuture;

  /**
   * Register an output handler. Returns `this`.
   */
  onOutput(cb: (msg: IKernelMsg) => void): IKernelFuture;

  /**
   * Register a done handler. Returns `this`.
   */
  onDone(cb: (msg: IKernelMsg) => void): IKernelFuture;

  /**
   * Register an input handler. Returns `this`.
   */
  onInput(cb: (msg: IKernelMsg) => void): IKernelFuture;
}


/**
 * A class to communicate with the Python kernel. This
 * should generally not be constructed directly, but be created
 * by the `Session` object. Once created, this object should be
 * used to communicate with the kernel.
 */
export
class Kernel {

  /**
   * A signal emitted when the kernel changes state.
   */
  @signal
  statusChanged: ISignal<string>;

  /**
   * GET /api/kernels
   *
   * Get the list of running kernels.
   */
  static list(baseUrl: string): Promise<IKernelId[]> {
    var kernelServiceUrl = utils.urlJoinEncode(baseUrl, KERNEL_SERVICE_URL)
    return utils.ajaxRequest(kernelServiceUrl, {
      method: "GET",
      dataType: "json"
    }).then((success: IAjaxSuccess): IKernelId[] => {
      if (success.xhr.status === 200) {
        if (!Array.isArray(success.data)) {
          throw Error('Invalid kernel list');
        }
        for (var i = 0; i < success.data.length(); i++) {
          validateKernelId(success.data[i]);
        }
        return success.data;
      }
      throw Error('Invalid Status: ' + success.xhr.status);
    });
  }

  /**
   * Construct a new kernel.
   */
  constructor(baseUrl: string, wsUrl: string) {
    this._baseUrl = baseUrl;
    this._wsUrl = wsUrl;
    if (!this._wsUrl) {
      // trailing 's' in https will become wss for secure web sockets
      this._wsUrl = location.protocol.replace('http', 'ws') + "//" + location.host;
    }

    this._staticId = utils.uuid();
    this._handlerMap = new Map<string, KernelFutureHandler>();

    if (typeof WebSocket === 'undefined') {
      alert('Your browser does not have WebSocket support, please try Chrome, Safari, or Firefox ≥ 11.');
    }
  }

  /**
   * Get the name of the kernel.
   */
  get name() : string {
    return this._name;
  }

  /**
   * Set the name of the kernel.
   */
  set name(value: string) {
    this._name = value;
  }

  /**
   * Check whether there is a connection to the kernel. This
   * function only returns true if websocket has been
   * created and has a state of WebSocket.OPEN.
   */
  get isConnected(): boolean {
    if (this._ws === null) {
      return false;
    }
    if (this._ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    return true;
  }

  /**
   * Check whether the connection to the kernel has been completely
   * severed. This function only returns true if the websocket is null.
   */
  get isFullyDisconnected(): boolean {
    return (this._ws === null);
  }

  /**
   * Get the Info Reply Message from the kernel.
   */
  get infoReply(): IKernelInfo {
    return this._infoReply;
  }

  /**
   * Get the current status of the kernel.
   */
  get status() : string {
    return this._status;
  }

  /**
   * Get the current id of the kernel
   */
  get id(): string {
    return this._id;
  }

  /**
   * GET /api/kernels/[:kernel_id]
   *
   * Get information about the kernel.
   */
  getInfo(): Promise<IKernelId> {
    return utils.ajaxRequest(this._kernelUrl, {
      method: "GET",
      dataType: "json"
    }).then((success: IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validateKernelId(success.data);
      return success.data;
    }, (error: IAjaxError) => {
      this._onError(error);
    });
  }

  /**
   * POST /api/kernels/[:kernel_id]/interrupt
   *
   * Interrupt the kernel.
   */
  interrupt(): Promise<void> {
    this._handleStatus('interrupting');

    var url = utils.urlJoinEncode(this._kernelUrl, 'interrupt');
    return utils.ajaxRequest(url, {
      method: "POST",
      dataType: "json"
    }).then((success: IAjaxSuccess) => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    }, (error: IAjaxError) => {
      this._onError(error);
    });
  }

  /**
   * POST /api/kernels/[:kernel_id]/restart
   *
   * Restart the kernel.
   */
  restart(): Promise<void> {
    this._handleStatus('restarting');
    this.disconnect();

    var url = utils.urlJoinEncode(this._kernelUrl, 'restart');
    return utils.ajaxRequest(url, {
      method: "POST",
      dataType: "json"
    }).then((success: IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this.connect(success.data);
    }, (error: IAjaxError) => {
      this._onError(error);
    });
  }

  /**
   * Connect to the server-side the kernel.
   *
   * This should only be called by a session.
   */
  connect(id: IKernelId) : void {
    this._id = id.id;
    this._kernelUrl = utils.urlJoinEncode(this._baseUrl, KERNEL_SERVICE_URL,
                                          this._id);
    this._name = id.name;
    this._startChannels();
    this._handleStatus('created');
  }

  /**
   * Reconnect to a disconnected kernel. This is not actually a
   * standard HTTP request, but useful function nonetheless for
   * reconnecting to the kernel if the connection is somehow lost.
   */
  reconnect(): void {
    if (this.isConnected) {
      return;
    }
    this._reconnectAttempt = this._reconnectAttempt + 1;
    this._handleStatus('reconnecting');
    this._startChannels();
  }

  /**
   * Disconnect the kernel.
   */
  disconnect(): void {
    if (this._ws !== null) {
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.onclose = () => { this._clearSocket(); };
        this._ws.close();
      } else {
        this._clearSocket();
      }
    }
  }

  /**
   * Send a message on the kernel's shell channel.
   */
  sendShellMessage(msg_type: string, content: any, metadata = {}, buffers: string[] = []): IKernelFuture {
    if (!this.isConnected) {
      throw new Error("kernel is not connected");
    }
    var msg = this._createMsg(msg_type, content, metadata, buffers);
    msg.channel = 'shell';

    this._ws.send(serialize.serialize(msg));

    var future = new KernelFutureHandler(() => {
      this._handlerMap.delete(msg.header.msgId);
    });

    this._handlerMap.set(msg.header.msgId, future);

    return future;
  }

  /**
   * Get kernel info.
   *
   * Returns a KernelFuture that will resolve to a `kernel_info_reply` message documented
   * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info)
   */
  kernelInfo(): IKernelFuture {
    return this.sendShellMessage("kernel_info_request", {});
  }

  /**
   * Get info on an object.
   *
   * Returns a KernelFuture that will resolve to a `inspect_reply` message documented
   * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#object-information)
   */
  inspect(code: string, cursor_pos: number): IKernelFuture {
    var content = {
      code: code,
      cursor_pos: cursor_pos,
      detail_level: 0
    };
    return this.sendShellMessage("inspect_request", content);
  }

  /**
   * Execute given code into kernel, returning a KernelFuture.
   *
   * @example
   *
   * The options object should contain the options for the execute
   * call. Its default values are:
   *
   *      options = {
   *        silent : true,
   *        user_expressions : {},
   *        allow_stdin : false,
            store_history: false
   *      }
   *
   */
  execute(code: string, options?: IKernelExecute): IKernelFuture {
    var content = {
      code: code,
      silent: true,
      store_history: false,
      user_expressions: {},
      allow_stdin: false
    };
    utils.extend(content, options);
    return this.sendShellMessage("execute_request", content);
  }

  /**
   * Request a code completion from the kernel.
   *
   * Returns a KernelFuture with will resolve to a `complete_reply` documented
   * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#complete)
   */
  complete(code: string, cursor_pos: number): IKernelFuture {
    var content = {
      code: code,
      cursor_pos: cursor_pos
    };
    return this.sendShellMessage("complete_request", content);
  }

  /**
   * Send an input reply message to the kernel.
   *
   * TODO: how to handle this?  Right now called by
   * ./static/notebook/js/outputarea.js:827:
   * this.events.trigger('send_input_reply.Kernel', value);
   *
   * which has no reference to the session or the kernel
   */
  sendInputReply(input: any): string {
    if (!this.isConnected) {
      throw new Error("kernel is not connected");
    }
    var content = {
      value: input
    };
    var msg = this._createMsg("input_reply", content);
    msg.channel = 'stdin';
    this._ws.send(serialize.serialize(msg));
    return msg.header.msgId;
  }

  /**
   * Create a kernel message given input attributes.
   */
  private _createMsg(msg_type: string, content: any,
    metadata = {}, buffers: string[] = []): IKernelMsg {
    var msg: IKernelMsg = {
      header: {
        msgId: utils.uuid(),
        username: this._username,
        session: this._staticId,
        msgType: msg_type,
        version: "5.0"
      },
      metadata: metadata || {},
      content: content,
      buffers: buffers || [],
      parentHeader: {}
    };
    return msg;
  }

  /**
   * Handle a kernel status change message.
   */
  private _handleStatus(status: string) {
    this.statusChanged.emit(status);
    this._status = status;
    var msg = 'Kernel: ' + status + ' (' + this._id + ')';
    if (status === 'idle' || status === 'busy') {
      kernel_log.debug(msg);
    } else {
      kernel_log.info(msg);
    }
  }

  /**
   * Handle a failed AJAX request by logging the error message, and throwing
   * another error.
   */
  private _onError(error: IAjaxError): void {
    var msg = "API request failed (" + error.statusText + "): ";
    kernel_log.error(msg);
    throw Error(error.statusText);
  }

  /**
   * Start the Websocket channels.
   * Will stop and restart them if they already exist.
   */
  private _startChannels(): void {
    this.disconnect();
    var ws_host_url = this._wsUrl + this._kernelUrl;

    kernel_log.info("Starting WebSockets:", ws_host_url);

    this._ws = new WebSocket([
      this._wsUrl,
      utils.urlJoinEncode(this._kernelUrl, 'channels'),
      "?session_id=" + this._staticId
    ].join('')
      );

    // Ensure incoming binary messages are not Blobs
    this._ws.binaryType = 'arraybuffer';

    var already_called_onclose = false; // only alert once
    this._ws.onclose = (evt: CloseEvent) => {
      if (already_called_onclose) {
        return;
      }
      already_called_onclose = true;
      if (!evt.wasClean) {
        // If the websocket was closed early, that could mean
        // that the kernel is actually dead. Try getting
        // information about the kernel from the API call --
        // if that fails, then assume the kernel is dead,
        // otherwise just follow the typical websocket closed
        // protocol.
        this.getInfo().then(function() {
          this._ws_closed(ws_host_url, false);
        }, function() {
          this._kernel_dead();
        });
      }
    };
    this._ws.onerror = (evt: ErrorEvent) => {
      if (already_called_onclose) {
        return;
      }
      already_called_onclose = true;
      this._wsClosed(ws_host_url, true);
    };

    this._ws.onopen = (evt: Event) => {
      this._wsOpened(evt);
    };
    var ws_closed_late = (evt: CloseEvent) => {
      if (already_called_onclose) {
        return;
      }
      already_called_onclose = true;
      if (!evt.wasClean) {
        this._wsClosed(ws_host_url, false);
      }
    };
    // switch from early-close to late-close message after 1s
    setTimeout(() => {
      if (this._ws !== null) {
        this._ws.onclose = ws_closed_late;
      }
    }, 1000);
    this._ws.onmessage = (evt: MessageEvent) => {
      this._handleWSMessage(evt);
    };
  }

  /**
   * Clear the websocket if necessary.
   */
  private _clearSocket(): void {
    if (this._ws && this._ws.readyState === WebSocket.CLOSED) {
      this._ws = null;
    }
  }

  /**
   * Perform necessary tasks once the connection to the kernel has
   * been established. This includes requesting information about
   * the kernel.
   */
  private _kernelConnected(): void {
    this._handleStatus('connected');
    this._reconnectAttempt = 0;
    // get kernel info so we know what state the kernel is in
    this.kernelInfo().onReply((reply?: IKernelMsg) => {
      this._infoReply = reply.content;
      this._handleStatus('ready');
      this._autorestartAttempt = 0;
    });
  }

  /**
   * Perform necessary tasks after the kernel has died. This closes
   * communication channels to the kernel if they are still somehow
   * open.
   */
  private _kernelDead(): void {
    this._handleStatus('dead');
    this.disconnect();
  }

  /**
   * Handle a websocket entering the open state,
   * signaling that the kernel is connected when websocket is open.
   */
  private _wsOpened(evt: Event): void {
    if (this.isConnected) {
      // all events ready, trigger started event.
      this._kernelConnected();
    }
  }

  /**
   * Handle a websocket entering the closed state.  If the websocket
   * was not closed due to an error, try to reconnect to the kernel.
   *
   * @param {string} ws_url - the websocket url
   * @param {bool} error - whether the connection was closed due to an error
   */
  private _wsClosed(ws_url: string, error: boolean): void {
    this.disconnect();
    this._handleStatus('disconnected');
    if (error) {
      kernel_log.error('WebSocket connection failed: ', ws_url);
      this._handleStatus('connectionFailed');
    }
    this._scheduleReconnect();
  }

  /**
   * Function to call when kernel connection is lost.
   * schedules reconnect, or fires 'connection_dead' if reconnect limit is hit.
   */
  private _scheduleReconnect(): void {
    if (this._reconnectAttempt < this._reconnectLimit) {
      var timeout = Math.pow(2, this._reconnectAttempt);
      kernel_log.error("Connection lost, reconnecting in " + timeout + " seconds.");
      setTimeout(() => { this.reconnect(); }, 1e3 * timeout);
    } else {
      this._handleStatus('connectionDead');
      kernel_log.error("Failed to reconnect, giving up.");
    }
  }

  /**
   * Handle an incoming Websocket message.
   */
  private _handleWSMessage(e: MessageEvent): void {
    try {
      var msg = serialize.deserialize(e.data);
    } catch (error) {
      kernel_log.error(error.message);
      return;
    }
    if (msg.channel === 'iopub' && msg.msgType === 'status') {
      this._handleStatusMessage(msg);
    }
    if (msg.parentHeader) {
      var header = (<IKernelMsgHeader>msg.parentHeader);
      var future = this._handlerMap.get(header.msgId);
      if (future) {
        future.handleMsg(msg);
      }
    }
  }

  /**
   * Handle status iopub messages from the kernel.
   */
  private _handleStatusMessage(msg: IKernelMsg): void {
    var execution_state = msg.content.execution_state;

    if (execution_state !== 'dead') {
      this._handleStatus(execution_state);
    }

    if (execution_state === 'starting') {
      this.kernelInfo().onReply((reply: IKernelMsg) => {
        this._infoReply = reply.content;
        this._handleStatus('ready');
        this._autorestartAttempt = 0;
      });

    } else if (execution_state === 'restarting') {
      // autorestarting is distinct from restarting,
      // in that it means the kernel died and the server is restarting it.
      // kernel_restarting sets the notification widget,
      // autorestart shows the more prominent dialog.
      this._autorestartAttempt = this._autorestartAttempt + 1;
      this._handleStatus('autorestarting');

    } else if (execution_state === 'dead') {
      this._kernelDead();
    }
  }

  private _id = 'unknown';
  private _name = 'unknown';
  private _baseUrl = 'unknown';
  private _kernelUrl = 'unknown';
  private _wsUrl = 'unknown';
  private _username = 'unknown';
  private _staticId = 'unknown';
  private _ws: WebSocket = null;
  private _infoReply: IKernelInfo = null;
  private _reconnectLimit = 7;
  private _autorestartAttempt = 0;
  private _reconnectAttempt = 0;
  private _handlerMap: Map<string, KernelFutureHandler> = null;
  private _iopubHandlers: Map<string, (msg: IKernelMsg) => void> = null;
  private _status = 'unknown';
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
class KernelFutureHandler extends Disposable implements IKernelFuture {
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
  onReply(cb: (msg: IKernelMsg) => void): IKernelFuture {
    this._reply = cb;
    return this;
  }

  /**
   * Register an output handler. Returns `this`.
   */
  onOutput(cb: (msg: IKernelMsg) => void): IKernelFuture {
    this._output = cb;
    return this;
  }

  /**
   * Register a done handler. Returns `this`.
   */
  onDone(cb: (msg: IKernelMsg) => void): IKernelFuture {
    this._done = cb;
    return this;
  }

  /**
   * Register an input handler. Returns `this`.
   */
  onInput(cb: (msg: IKernelMsg) => void): IKernelFuture {
    this._input = cb;
    return this;
  }

  /**
   * Handle an incoming message from the kernel belonging to this future.
   */
  handleMsg(msg: IKernelMsg): void {
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
      var reply = this._output;
      if (reply) reply(msg);
      this._setFlag(KernelFutureFlag.GotReply)
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
  private _handleDone(msg: IKernelMsg): void {
    this._setFlag(KernelFutureFlag.IsDone);
    var done = this._done;
    if (done) done(msg);
    // clear the other callbacks
    this._reply = null;
    this._done = null;
    this._input = null;
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
  private _input: (msg: IKernelMsg) => void = null;
  private _output: (msg: IKernelMsg) => void = null;
  private _reply: (msg: IKernelMsg) => void = null;
  private _done: (msg: IKernelMsg) => void = null;
}


/**
 * Validate an object as being of IKernelID type
 */
export
function validateKernelId(info: IKernelId) : void {
   if (!info.hasOwnProperty('name') || !info.hasOwnProperty('id')) {
     throw Error('Invalid kernel id');
   }
   if ((typeof info.id !== 'string') || (typeof info.name !== 'string')) {
     throw Error('Invalid kernel id');
   }
}
