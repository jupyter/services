// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as utils
  from 'jupyter-js-utils';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  JSONPrimitive, JSONObject
} from './json';


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
   * Get the name of the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  name: string;

  /**
   * Get the websocket url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  url: string;

  /**
   * Callback for a message received event.
   */
  onMessage: (msg: ITerminalSession.IMessage) => void;

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
  interface IManager {
    /**
     * Create a new terminal.
     */
    createNew(options?: ITerminalSession.IOptions): Promise<ITerminalSession>;

    /**
     * Shut down a terminal session by name.
     */
    shutdown(name: string): Promise<void>;

    /**
     * Get the list of models for the terminals running on the server.
     */
    listRunning(): Promise<IModel[]>;
  }
}


/**
 * Create a terminal session or connect to an existing connection.
 *
 * #### Notes
 * If the session is already running on the client, the existing
 * instance will be returned.
 */
export
function createTerminalSession(options: ITerminalSession.IOptions = {}): Promise<ITerminalSession> {
  if (options.name && options.name in Private.running) {
    return Private.running[options.name];
  }
  return new TerminalSession(options).connect();
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
   * Create a new terminal.
   */
  createNew(options?: ITerminalSession.IOptions): Promise<ITerminalSession> {
    options = options || {};
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
      return data;
    });
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings: utils.IAjaxSettings = null;
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
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._ajaxSettings = options.ajaxSettings || {};
    this._name = options.name;
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._promise = new utils.PromiseDelegate<ITerminalSession>();
  }

  /**
   * The callback for a message received event.
   */
  get onMessage(): (msg: ITerminalSession.IMessage) => void {
    return this._onMsg;
  }
  set onMessage(cb: (msg: ITerminalSession.IMessage) => void) {
    this._onMsg = cb;
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
   * Get the websocket url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get url(): string {
    return this._url;
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
    this._promise = null;
    this._onMsg = null;
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
    let url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, this._name);
    let ajaxSettings = utils.copy(this._ajaxSettings);
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
    });
  }

  /**
   * Connect to the terminal session.
   */
  connect(): Promise<ITerminalSession> {
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
    let ajaxSettings = utils.copy(this._ajaxSettings);
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw new Error('Invalid Response: ' + success.xhr.status);
      }
      return (success.data as ITerminalSession.IModel).name;
    });
  }

  /**
   * Connect to the websocket.
   */
  private _initializeSocket(): Promise<ITerminalSession> {
    let name = this._name;
    Private.running[name] = this._promise.promise;
    this._url = `${this._wsUrl}terminals/websocket/${name}`;
    this._ws = new WebSocket(this._url);

    this._ws.onmessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data);
      let onMsg = this._onMsg;
      if (onMsg) {
        onMsg({
          type: data[0] as ITerminalSession.MessageType,
          content: data.slice(1)
        });
      }
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
  private _promise: utils.PromiseDelegate<ITerminalSession> = null;
  private _onMsg: (msg: ITerminalSession.IMessage) => void = null;
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A mapping of running terminals by name.
   */
  export
  var running: { [key: string]: Promise<ITerminalSession> } = Object.create(null);

  /**
   * A signal emitted when the terminal is fully connected.
   */
  export
  const connectedSignal = new Signal<ITerminalSession, void>();

  /**
   * A signal emitted when a message is received.
   */
  export
  const messageReceivedSignal = new Signal<ITerminalSession, ITerminalSession.IMessage>();
}
