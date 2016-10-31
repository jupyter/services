// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  each, map, toArray
} from 'phosphor/lib/algorithm/iteration';

import {
  JSONPrimitive
} from 'phosphor/lib/algorithm/json';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  IAjaxSettings
} from '../utils';

import * as utils
  from '../utils';

import {
  TerminalSession
} from './terminal';


/**
 * The url for the terminal service.
 */
const TERMINAL_SERVICE_URL = 'api/terminals';


/**
 * An implementation of a terminal interface.
 */
export
class DefaultTerminalSession implements TerminalSession.ISession {
  /**
   * Construct a new terminal session.
   */
  constructor(name: string, options: TerminalSession.IOptions = {}) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    options.ajaxSettings = options.ajaxSettings || {};
    this._ajaxSettings = JSON.stringify(options.ajaxSettings);
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
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
    delete Private.running[this._url];
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
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
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
    if (this._promise) {
      return this._promise;
    }
    if (this._name) {
      this._promise = this._initializeSocket();
    }
    this._promise = this._getName().then(value => {
      this._name = value;
      return this._initializeSocket();
    });
    return this._promise;
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
    this._url = Private.getTermUrl(this._baseUrl, this._name);
    Private.running[this._url] = this;
    let wsUrl = utils.urlPathJoin(this._wsUrl, `terminals/websocket/${name}`);
    this._ws = new WebSocket(wsUrl);

    this._ws.onmessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data) as JSONPrimitive[];
      this.messageReceived.emit({
        type: data[0] as TerminalSession.MessageType,
        content: data.slice(1)
      });
    };

    return new Promise<TerminalSession.ISession>((resolve, reject) => {
      this._ws.onopen = (event: MessageEvent) => {
        resolve(this);
      };
      this._ws.onerror = (event: Event) => {
        reject(this);
      };
    });
  }

  private _name: string;
  private _baseUrl: string;
  private _wsUrl: string;
  private _url: string;
  private _ajaxSettings = '';
  private _ws: WebSocket = null;
  private _isDisposed = false;
  private _promise: Promise<TerminalSession.ISession>;
}



export
namespace DefaultTerminalSession {
  /**
   * Start a new terminal session.
   *
   * @options - The session options to use.
   *
   * @returns A promise that resolves with the session instance.
   */
  export
  function startNew(options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession> {
    return new DefaultTerminalSession('', options).connect();
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
      return Private.running[url].connect();
    }
    return new DefaultTerminalSession(name, options).connect();
  }

  /**
   * List the running terminal sessions.
   *
   * @param options - The session options to use.
   *
   * @returns A promise that resolves with the list of running session models.
   */
  export
  function listRunning(options: TerminalSession.IOptions = {}): Promise<TerminalSession.ISession[]> {
    let url = Private.getBaseUrl(options.baseUrl);
    let ajaxSettings = utils.copy(options.ajaxSettings || {}) as IAjaxSettings;
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
      // Update the local data store.
      let urls = toArray(map(data, item => {
          return utils.urlPathJoin(url, item.name);
      }));
      each(Object.keys(Private.running), runningUrl => {
        if (urls.indexOf(runningUrl) !== -1) {
          let session = Private.running[runningUrl];
          session.terminated.emit(void 0);
          session.dispose();
        }
      });
      return data;
    });
  }

  /**
   * Shut down a terminal session by name.
   *
   * @param name - The name of the target session.
   *
   * @param options - The session options to use.
   *
   * @returns A promise that resolves when the session is shut down.
   */
  export
  function shutdown(name: string, options: TerminalSession.IOptions = {}): Promise<void> {
    let url = Private.getTermUrl(options.baseUrl, name);
    let ajaxSettings = utils.copy(options.ajaxSettings || {}) as IAjaxSettings;
    ajaxSettings.method = 'DELETE';
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        return utils.makeAjaxError(success);
      }
      // Update the local data store.
      if (Private.running[url]) {
        let session = Private.running[url];
        session.terminated.emit(void 0);
        session.dispose();
      }
    });
  }

}


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
  var running: { [key: string]: DefaultTerminalSession } = Object.create(null);

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
