// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  JSONPrimitive, JSONObject, deepEqual
} from './json';

import * as utils
  from './utils';


/**
 * The url for the terminal service.
 */
const TERMINAL_SERVICE_URL = 'api/terminals';


/**
 * An interface for a terminal session.
 */
export
interface ITerminalSession extends IDisposable {
  /**
   * A signal emitted when a message is received from the server.
   */
  messageReceived: ISignal<ITerminalSession, ITerminalSession.IMessage>;

  /**
   * A signal emitted when the connection state changes.
   */
  connectionChanged: ISignal<ITerminalSession, boolean>;

  /**
   * Get the name of the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  name: string;

  /**
   * Get the http url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  httpUrl: string;

  /**
   * Get the websocket url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  wsUrl: string;

  /**
   * Test whether the session is connected to a websocket.
   */
  isConnected: boolean;

  /**
   * Connect or reconnect to the terminal session.
   */
  connect(): Promise<void>;

  /**
   * Send a message to the terminal session.
   */
  send(message: ITerminalSession.IMessage): void;

  /**
   * Shut down the terminal session.
   */
  shutdown(): Promise<void>;
}


/**
 * The namespace for ITerminalSession statics.
 */
export
namespace ITerminalSession {
  /**
   * The options for intializing a terminal session object.
   */
  export
  interface IOptions {
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
    name: string;
  }

  /**
   * A message from the terminal session.
   */
  export
  interface IMessage extends JSONObject {
    /**
     * The type of the message.
     */
    type: MessageType;

    /**
     * The content of the message.
     */
    content?: JSONPrimitive[];
  }

  /**
   * Valid message types for the terminal.
   */
  export
  type MessageType = 'stdout' | 'disconnect' | 'set_size' | 'stdin';

  /**
   * The interface for a terminal manager.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the running terminals change.
     */
    runningChanged: ISignal<IManager, IModel[]>;

    /**
     * Create a new terminal session or connect to an existing session.
     *
     * #### Notes
     * This will emit [[runningChanged]] if the running terminals list
     * changes.
     */
    create(options?: ITerminalSession.IOptions): Promise<ITerminalSession>;

    /**
     * Shut down a terminal session by name.
     *
     * #### Notes
     * This will emit [[runningChanged]] if the running terminals list
     * changes.
     */
    shutdown(name: string): Promise<void>;

    /**
     * Get the list of models for the terminals running on the server.
     */
    listRunning(): Promise<IModel[]>;
  }
}


/**
 * Create a terminal session object, or connect to an existing client
 * object.
 *
 * #### Notes
 * If a name is not given, one will be fetched from the server.
 * If a session with the given name is already running on the client,
 * the existing instance will be returned.
 */
export
function createTerminalSession(options: ITerminalSession.IOptions = {}): Promise<ITerminalSession> {
  let value: ITerminalSession.IOptions = {
    baseUrl: options.baseUrl || utils.getBaseUrl(),
    wsUrl: options.wsUrl || utils.getWsUrl(options.baseUrl),
    ajaxSettings: utils.copy(options.ajaxSettings) || {},
    name
  };
  if (value.name && value.name in Private.running) {
    return Promise.resolve(Private.running[value.name]);
  }
  if (value.name) {
    let term = new TerminalSession(value);
    return Promise.resolve(term);
  }
  return Private.getName(value).then(name => {
    value.name = name;
    return new TerminalSession(value);
  });
}


/**
 * A terminal session manager.
 */
export
class TerminalManager implements ITerminalSession.IManager {
  /**
   * Construct a new terminal manager.
   */
  constructor(options: TerminalManager.IOptions = {}) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._ajaxSettings = utils.copy(options.ajaxSettings) || {};
  }

  /**
   * A signal emitted when the running terminals change.
   */
  get runningChanged(): ISignal<TerminalManager, ITerminalSession.IModel[]> {
    return Private.runningChangedSignal.bind(this);
  }

  /**
   * Test whether the terminal manager is disposed.
   *
   * #### Notes
   * This is a read-only property.
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
    clearSignalData(this);
    this._running = [];
  }

  /**
   * Create a new terminal session or connect to an existing session.
   */
  create(options: ITerminalSession.IOptions = {}): Promise<ITerminalSession> {
    options.baseUrl = options.baseUrl || this._baseUrl;
    options.wsUrl = options.wsUrl || this._wsUrl;
    options.ajaxSettings = (
      options.ajaxSettings || utils.copy(this._ajaxSettings)
    );
    return createTerminalSession(options);
  }

  /**
   * Shut down a terminal session by name.
   */
  shutdown(name: string): Promise<void> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, name);
    let ajaxSettings = utils.copy(this._ajaxSettings) || {};
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
    });
  }

  /**
   * Get the list of models for the terminals running on the server.
   */
  listRunning(): Promise<ITerminalSession.IModel[]> {
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL);
    let ajaxSettings = utils.copy(this._ajaxSettings) || {};
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
      let data = success.data as ITerminalSession.IModel[];
      if (!Array.isArray(data)) {
        throw new Error('Invalid terminal data');
      }
      if (!deepEqual(data, this._running)) {
        this._running = data.slice();
        this.runningChanged.emit(data);
      }
      return data;
    });
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings: utils.IAjaxSettings = null;
  private _running: ITerminalSession.IModel[] = [];
  private _isDisposed = false;
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
class TerminalSession implements ITerminalSession {
  /**
   * Construct a new terminal session.
   */
  constructor(options: ITerminalSession.IOptions = {}) {
    // The options are already handled by `createTerminalSession`.
    this._baseUrl = options.baseUrl;
    this._ajaxSettings = options.ajaxSettings;
    this._name = options.name;
    this._wsBaseUrl = options.wsUrl;
    Private.running[name] = this;
    this._wsUrl = `${this._wsBaseUrl}terminals/websocket/${name}`;
    this._httpUrl = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL,
                                      name);
  }

  /**
   * A signal emitted when the connection state changes.
   */
  get connectionChanged(): ISignal<ITerminalSession, boolean> {
    return Private.connectionChangedSignal.bind(this);
  }

  /**
   * A signal emitted when a message is received from the server.
   */
  get messageReceived(): ISignal<ITerminalSession, ITerminalSession.IMessage> {
    return Private.messageReceivedSignal.bind(this);
  }

  /**
   * Get the name of the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the http url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get httpUrl(): string {
    return this._httpUrl;
  }

  /**
   * Get the websocket url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get wsUrl(): string {
    return this._wsUrl;
  }

  /**
   * Test whether the session is connected to a websocket.
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Test whether the session is disposed.
   *
   * #### Notes
   * This is a read-only property.
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
    clearSignalData(this);
  }

  /**
   * Send a message to the terminal session.
   */
  send(message: ITerminalSession.IMessage): void {
    let msg: JSONPrimitive[] = [message.type];
    msg.push(...message.content);
    this._ws.send(JSON.stringify(msg));
  }

  /**
   * Shut down the terminal session.
   */
  shutdown(): Promise<void> {
    let ajaxSettings = utils.copy(this._ajaxSettings);
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(this._httpUrl, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
      this.dispose();
    });
  }

  /**
   * Connect to the terminal session.
   */
  connect(): Promise<void> {
    let ws = this._ws;
    if (ws !== null) {
      ws.onclose = null;
      ws.onerror = null;
      ws.close();
      ws = null;
      if (this._isConnected) {
        this._isConnected = false;
        this.connectionChanged.emit(false);
      }
    }

    ws = this._ws = new WebSocket(this._wsUrl);

    ws.onmessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data);
      this.messageReceived.emit({
        type: data[0] as ITerminalSession.MessageType,
        content: data.slice(1)
      });
    };

    ws.onclose = (evt: Event) => { this._onWSClose(evt); };
    ws.onerror = (evt: Event) => { this._onWSClose(evt); };

    return new Promise<void>(resolve => {
      ws.onopen = (event: MessageEvent) => {
        this._isConnected = true;
        this.connectionChanged.emit(true);
        resolve(void 0);
      };
    });
  }

  /**
   * Handle a websocket close or error event.
   */
  private _onWSClose(evt: Event) {
    if (this._isConnected) {
      this._isConnected = false;
      this.connectionChanged.emit(false);
    }
  }

  private _name = '';
  private _baseUrl = '';
  private _httpUrl = '';
  private _wsUrl = '';
  private _wsBaseUrl = '';
  private _ajaxSettings: utils.IAjaxSettings = null;
  private _ws: WebSocket = null;
  private _isDisposed = false;
  private _isConnected = false;
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A mapping of running terminals by name.
   */
  export
  var running: { [key: string]: ITerminalSession } = Object.create(null);

  /**
   * A signal emitted when the connection state changes.
   */
  export
  const connectionChangedSignal = new Signal<ITerminalSession, boolean>();

  /**
   * A signal emitted when the running terminals change.
   */
  export
  const runningChangedSignal = new Signal<TerminalManager, ITerminalSession.IModel[]>();

  /**
   * A signal emitted when a message is received.
   */
  export
  const messageReceivedSignal = new Signal<ITerminalSession, ITerminalSession.IMessage>();

  /**
   * Get a name for the terminal from the server.
   */
  export
  function getName(options: ITerminalSession.IOptions): Promise<string> {
    let url = utils.urlPathJoin(options.baseUrl, TERMINAL_SERVICE_URL);
    let ajaxSettings = utils.copy(options.ajaxSettings);
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
      return (success.data as ITerminalSession.IModel).name;
    });
  }
}
