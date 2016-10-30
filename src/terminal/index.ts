// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IIterator, each, iter, map, toArray
} from 'phosphor/lib/algorithm/iteration';

import {
  JSONPrimitive, JSONObject, deepEqual
} from 'phosphor/lib/algorithm/json';

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  IAjaxSettings
} from '../utils';

import * as utils
  from '../utils';


/**
 * The url for the terminal service.
 */
const TERMINAL_SERVICE_URL = 'api/terminals';



/**
 * The namespace for TerminalSession.ISession statics.
 */
export
namespace TerminalSession {
  /**
   * An interface for a terminal session.
   */
  export
  interface ISession extends IDisposable {
    /**
     * A signal emitted when the session is shut down.
     */
    terminated: ISignal<ISession, void>;

    /**
     * A signal emitted when a message is received from the server.
     */
    messageReceived: ISignal<ISession, TerminalSession.IMessage>;

    /**
     * Get the name of the terminal session.
     */
    readonly name: string;

    /**
     * The model associated with the session.
     */
    readonly model: TerminalSession.IModel;

    /**
     * The base url of the server.
     */
    readonly baseUrl: string;

    /**
     * The Ajax settings used for server requests.
     */
    ajaxSettings: utils.IAjaxSettings;

    /**
     * Send a message to the terminal session.
     */
    send(message: TerminalSession.IMessage): void;

    /**
     * Shut down the terminal session.
     */
    shutdown(): Promise<void>;
  }

  /**
   * Create a terminal session or connect to an existing session.
   *
   * #### Notes
   * If the session is already running on the client, the existing
   * instance will be returned.
   */
  export
  function open(options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession> {
    if (options.name && options.name in Private.running) {
      return Private.running[options.name];
    }
    return new DefaultTerminalSession(options).connect();
  }

  /**
   * The options for intializing a terminal session object.
   */
  export
  interface IOptions extends JSONObject {
    /**
     * The name of the terminal.
     */
    name?: string;

    /**
     * The base url.
     */
    baseUrl?: string;

    /**
     * The base websocket url.
     */
    wsUrl?: string;

    /**
     * The Ajax settings used for server requests.
     */
    ajaxSettings?: utils.IAjaxSettings;
  }

  /**
   * The server model for a terminal session.
   */
  export
  interface IModel extends JSONObject {
    /**
     * The name of the terminal session.
     */
    readonly name: string;
  }

  /**
   * A message from the terminal session.
   */
  export
  interface IMessage {
    /**
     * The type of the message.
     */
    readonly type: MessageType;

    /**
     * The content of the message.
     */
    readonly content?: JSONPrimitive[];
  }

  /**
   * Valid message types for the terminal.
   */
  export
  type MessageType = 'stdout' | 'disconnect' | 'set_size' | 'stdin';

  /**
   * The interface for a terminal manager.
   *
   * #### Notes
   * The manager is responsible for maintaining the state of running
   * terminal sessions.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the running terminals change.
     */
    runningChanged: ISignal<IManager, IModel[]>;

    /**
     * Create an iterator over the known running terminals.
     *
     * @returns A new iterator over the running terminals.
     */
    running(): IIterator<IModel>;

    /**
     * Create a new terminal session or connect to an existing session.
     *
     * #### Notes
     * This will emit [[runningChanged]] if the running terminals list
     * changes.
     */
    create(options?: TerminalSession.IOptions): Promise<TerminalSession.ISession>;

    /**
     * Shut down a terminal session by name.
     *
     * #### Notes
     * This will emit [[runningChanged]] if the running terminals list
     * changes.
     */
    shutdown(name: string, options?: TerminalSession.IOptions): Promise<void>;

    /**
     * Force a refresh of the running terminals.
     */
    refresh(options?: TerminalSession.IOptions): void;
  }
}


/**
 * A terminal session manager.
 */
export
class TerminalManager implements TerminalSession.IManager {
  /**
   * Construct a new terminal manager.
   */
  constructor(options: TerminalManager.IOptions = {}) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._ajaxSettings = utils.copy(options.ajaxSettings || {});
    this._scheduleUpdate();
  }

  /**
   * A signal emitted when the running terminals change.
   */
  runningChanged: ISignal<this, TerminalSession.IModel[]>;

  /**
   * Test whether the terminal manager is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);
    clearSignalData(this);
    this._running = [];
  }

  /**
   * Create an iterator over the most recent running terminals.
   *
   * @returns A new iterator over the running terminals.
   */
  running(): IIterator<TerminalSession.IModel> {
    return iter(this._running);
  }

  /**
   * Create a new terminal session or connect to an existing session.
   */
  create(options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession> {
    options.baseUrl = options.baseUrl || this._baseUrl;
    options.wsUrl = options.wsUrl || this._wsUrl;
    options.ajaxSettings = (
      options.ajaxSettings || utils.copy(this._ajaxSettings)
    );
    return TerminalSession.open(options).then(session => {
      this._scheduleUpdate();
      session.terminated.connect(() => {
        this._scheduleUpdate();
      });
      return session;
    });
  }

  /**
   * Shut down a terminal session by name.
   */
  shutdown(name: string): Promise<void> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, name);
    let ajaxSettings: IAjaxSettings = utils.copy(this._ajaxSettings || {});
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        return utils.makeAjaxError(success);
      }
      this._scheduleUpdate();
      if (name in Private.running) {
        Private.running[name].then(session => {
          session.terminated.emit(void 0);
          session.dispose();
        });
      }
    });
  }

  /**
   * Get the list of models for the terminals running on the server.
   */
  listRunning(): Promise<TerminalSession.IModel[]> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL);
    let ajaxSettings: IAjaxSettings = utils.copy(this._ajaxSettings || {});
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        return utils.makeAjaxError(success);
      }
      let data = success.data as TerminalSession.IModel[];
      if (!Array.isArray(data)) {
        return utils.makeAjaxError(success, 'Invalid terminal data');
      }
      if (!deepEqual(data, this._running)) {
        this._running = data;
        let names = toArray(map(data, item => item.name));
        each(Object.keys(Private.running), name => {
          if (names.indexOf(name) !== -1) {
            Private.running[name].then(session => {
              session.terminated.emit(void 0);
              session.dispose();
            });
          }
        });
        this.runningChanged.emit(data);
      }
      clearTimeout(this._updateTimer);
      clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(() => {
        this.listRunning();
      }, 10000);
      return data;
    });
  }

  /**
   * Schedule an update of the running sessions.
   */
  private _scheduleUpdate(): void {
    if (this._updateTimer !== -1) {
      return;
    }
    this._updateTimer = setTimeout(() => {
      this.listRunning();
    }, 100);
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings: utils.IAjaxSettings = null;
  private _running: TerminalSession.IModel[] = [];
  private _isDisposed = false;
  private _updateTimer = -1;
  private _refreshTimer = -1;
}



/**
 * The namespace for TerminalManager statics.
 */
export
namespace TerminalManager {
  /**
   * The options used to initialize a terminal manager.
   */
  export
  interface IOptions {
    /**
     * The base url.
     */
    baseUrl?: string;

    /**
     * The base websocket url.
     */
    wsUrl?: string;

    /**
     * The Ajax settings used for server requests.
     */
    ajaxSettings?: utils.IAjaxSettings;
  }
}


/**
 * An implementation of a terminal interface.
 */
class DefaultTerminalSession implements TerminalSession.ISession {
  /**
   * Construct a new terminal session.
   */
  constructor(options: TerminalSession.IOptions = {}) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._ajaxSettings = options.ajaxSettings || {};
    this._name = options.name;
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._promise = new utils.PromiseDelegate<TerminalSession.ISession>();
  }

  /**
   * A signal emitted when the session is shut down.
   */
  terminated: ISignal<this, void>;

  /**
   * A signal emitted when a message is received from the server.
   */
  messageReceived: ISignal<this, TerminalSession.IMessage>;

  /**
   * Get the name of the terminal session.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the websocket url used by the terminal session.
   */
  get url(): string {
    return this._url;
  }

  /**
   * Test whether the session is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    delete Private.running[this._name];
    this._promise = null;
    clearSignalData(this);
  }

  /**
   * Send a message to the terminal session.
   */
  send(message: TerminalSession.IMessage): void {
    let msg: JSONPrimitive[] = [message.type];
    msg.push(...message.content);
    this._ws.send(JSON.stringify(msg));
  }

  /**
   * Shut down the terminal session.
   */
  shutdown(): Promise<void> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, this._name);
    let ajaxSettings: IAjaxSettings = utils.copy(this._ajaxSettings);
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        return utils.makeAjaxError(success);
      }
      this.terminated.emit(void 0);
      this.dispose();
    });
  }

  /**
   * Connect to the terminal session.
   */
  connect(): Promise<TerminalSession.ISession> {
    if (this._name) {
      return this._initializeSocket();
    }
    return this._getName().then(name => {
      this._name = name;
      return this._initializeSocket();
    });
  }

  /**
   * Get a name for the terminal from the server.
   */
  private _getName(): Promise<string> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL);
    let ajaxSettings: IAjaxSettings = utils.copy(this._ajaxSettings);
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        return utils.makeAjaxError(success);
      }
      return (success.data as TerminalSession.IModel).name;
    });
  }

  /**
   * Connect to the websocket.
   */
  private _initializeSocket(): Promise<TerminalSession.ISession> {
    let name = this._name;
    Private.running[name] = this._promise.promise;
    this._url = `${this._wsUrl}terminals/websocket/${name}`;
    this._ws = new WebSocket(this._url);

    this._ws.onmessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data) as JSONPrimitive[];
      this.messageReceived.emit({
        type: data[0] as TerminalSession.MessageType,
        content: data.slice(1)
      });
    };

    this._ws.onopen = (event: MessageEvent) => {
      this._promise.resolve(this);
    };

    return this._promise.promise;
  }

  private _name: string;
  private _baseUrl: string;
  private _wsUrl: string;
  private _url: string;
  private _ajaxSettings: utils.IAjaxSettings = null;
  private _ws: WebSocket = null;
  private _isDisposed = false;
  private _promise: utils.PromiseDelegate<TerminalSession.ISession> = null;
}


// Define the signals for the `TerminalManager` class.
defineSignal(TerminalManager.prototype, 'runningChanged');


// Define the signals for the `DefaultTerminalSession` class.
defineSignal(DefaultTerminalSession.prototype, 'terminated');
defineSignal(DefaultTerminalSession.prototype, 'messageReceived');


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A mapping of running terminals by name.
   */
  export
  var running: { [key: string]: Promise<TerminalSession.ISession> } = Object.create(null);
}
