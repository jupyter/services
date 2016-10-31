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
     * The base url of the session.
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
   * Start a new terminal session.
   *
   * @options - The session options to use.
   *
   * @returns A promise that resolves with the session instance.
   */
  export
  function startNew(options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession> {
    return new DefaultTerminalSession(options).connect();
  }

  /*
   * Connect to a running session.
   *
   * @param name - The name of the target session.
   *
   * @param options - The session options to use.
   *
   * @returns A promise that resolves with the new session instance.
   *
   * #### Notes
   * If the session was already started via `startNew`, the existing
   * session object is used as the fulfillment value.
   *
   * Otherwise, if `options` are given, we attempt to connect to the existing
   * session.
   * The promise is fulfilled when the session is ready on the server,
   * otherwise the promise is rejected.
   *
   * If the session was not already started and no `options` are given,
   * the promise is rejected.
   */
  export
  function connectTo(name: string, options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession> {
    options.baseUrl = options.baseUrl || utils.getBaseUrl();
    let url = Private.getTermUrl(options.baseUrl, name);
    if (url in Private.running) {
      return Private.running[url];
    }
    let session = new DefaultTerminalSession(options);
    return session.connect(name);
  }

  /**
   * The options for intializing a terminal session object.
   */
  export
  interface IOptions extends JSONObject {
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
     * The base url of the manager.
     */
    readonly baseUrl: string;

    /**
     * The base ws url of the manager.
     */
    readonly wsUrl: string;

    /**
     * The default ajax settings for the manager.
     */
    ajaxSettings?: IAjaxSettings;

    /**
     * Create an iterator over the known running terminals.
     *
     * @returns A new iterator over the running terminals.
     */
    running(): IIterator<IModel>;

    /**
     * Create a new terminal session.
     *
     * @param ajaxSettings - The ajaxSettings to use, overrides manager
     *   settings.
     *
     * @returns A promise that resolves with the terminal instance.
     */
    startNew(ajaxSettings?: IAjaxSettings): Promise<TerminalSession.ISession>;

    /*
     * Connect to a running session.
     *
     * @param name - The name of the target session.
     *
     * @param ajaxSettings - The ajaxSettings to use, overrides manager
     *   settings.
     *
     * @returns A promise that resolves with the new session instance.
     */
    connectTo(name: string, ajaxSettings?: IAjaxSettings): Promise<TerminalSession.ISession>;

    /**
     * Shut down a terminal session by name.
     */
    shutdown(name: string): Promise<void>;

    /**
     * Force a refresh of the running terminals.
     *
     * @returns A promise that resolves when the refresh is complete.
     *
     * #### Notes
     * This is not typically meant to be called by the user, since the
     * manager maintains its own internal state.
     */
    refresh(): Promise<void>;
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
    options.ajaxSettings = options.ajaxSettings || {};
    this._ajaxSettings = JSON.stringify(options.ajaxSettings);
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
   * The base url of the manager.
   */
  get baseUrl(): string {
    return this._baseUrl;
  }

  /**
   * The base ws url of the manager.
   */
  get wsUrl(): string {
    return this._wsUrl;
  }

  /**
   * The default ajax settings for the manager.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }

  /**
   * Set the default ajax settings for the manager.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
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
   * Create a new terminal session.
   *
   * @param ajaxSettings - The ajaxSettings to use, overrides manager
   *   settings.
   *
   * @returns A promise that resolves with the terminal instance.
   */
  startNew(ajaxSettings?: IAjaxSettings): Promise<TerminalSession.ISession> {
    let options = {
      baseUrl: this._baseUrl,
      wsUrl: this._wsUrl,
      ajaxSettings: ajaxSettings || this.ajaxSettings
    };
    return TerminalSession.startNew(options);
  }

  /*
   * Connect to a running session.
   *
   * @param name - The name of the target session.
   *
   * @param ajaxSettings - The ajaxSettings to use, overrides manager
   *   settings.
   *
   * @returns A promise that resolves with the new session instance.
   */
  connectTo(name: string, ajaxSettings: IAjaxSettings = {}): Promise<TerminalSession.ISession> {
    let options = {
      baseUrl: this._baseUrl,
      wsUrl: this._wsUrl,
      ajaxSettings: ajaxSettings || this.ajaxSettings
    };
    return TerminalSession.connectTo(name, options).then(session => {
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
    let url = Private.getTermUrl(this._baseUrl, name);
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        return utils.makeAjaxError(success);
      }
      this._scheduleUpdate();
      if (url in Private.running) {
        Private.running[url].then(session => {
          session.terminated.emit(void 0);
          session.dispose();
        });
      }
    });
  }

  /**
   * Force a refresh of the running terminals.
   */
  refresh(): Promise<void> {
    let url = Private.getBaseUrl(this._baseUrl);
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';

    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);

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
        let urls = toArray(map(data, item => {
          return utils.urlPathJoin(url, item.name);
        }));
        each(Object.keys(Private.running), runningUrl => {
          if (urls.indexOf(runningUrl) !== -1) {
            Private.running[runningUrl].then(session => {
              session.terminated.emit(void 0);
              session.dispose();
            });
          }
        });
        this.runningChanged.emit(data);
      }
      // Throttle the next request.
      if (this._updateTimer !== -1) {
        this._scheduleUpdate();
      }
      this._refreshTimer = setTimeout(() => {
        this.refresh();
      }, 10000);
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
      this.refresh();
    }, 100);
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings = '';
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
    options.ajaxSettings = options.ajaxSettings || {};
    this._ajaxSettings = JSON.stringify(options.ajaxSettings);
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
   * Get the model for the terminal session.
   */
  get model(): TerminalSession.IModel {
    return { name: this._name };
  }

  /**
   * The base url of the terminal.
   */
  get baseUrl(): string {
    return this._baseUrl;
  }

  /**
   * Get a copy of the default ajax settings for the terminal.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }

  /**
   * Set the default ajax settings for the terminal.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
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
    let url = Private.getTermUrl(this._baseUrl, this._name);
    let ajaxSettings = this.ajaxSettings;
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
  connect(name = ''): Promise<TerminalSession.ISession> {
    this._name = name;
    if (this._name) {
      return this._initializeSocket();
    }
    return this._getName().then(value => {
      this._name = value;
      return this._initializeSocket();
    });
  }

  /**
   * Get a name for the terminal from the server.
   */
  private _getName(): Promise<string> {
    let url = Private.getBaseUrl(this._baseUrl);
    let ajaxSettings = this.ajaxSettings;
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
    let wsUrl = utils.urlPathJoin(this._wsUrl, `terminals/websocket/${name}`);
    this._ws = new WebSocket(wsUrl);

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
  private _ajaxSettings = '';
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
   * A mapping of running terminals by url.
   */
  export
  var running: { [key: string]: Promise<TerminalSession.ISession> } = Object.create(null);

  /**
   * Get the url for a terminal.
   */
  export
  function getTermUrl(baseUrl: string, name: string): string {
    return utils.urlPathJoin(baseUrl, TERMINAL_SERVICE_URL, name);
  }

  /**
   * Get the base url.
   */
  export
  function getBaseUrl(baseUrl: string): string {
    return utils.urlPathJoin(baseUrl, TERMINAL_SERVICE_URL);
  }
}
