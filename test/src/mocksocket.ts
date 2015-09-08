// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as utils from './utils';


// Mock implementation of a Web Socket and server following
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket


// stubs for node global variables
declare var global: any;


const CLOSE_NORMAL = 1000;


export 
function overrideWebSocket() {
  // Override the builtin websocket
  if (typeof window === 'undefined') {
    global.WebSocket = MockSocket;
  } else {
    (<any>window).WebSocket = MockSocket;
  }
}


/**
 * Base class for a mock socket implementation.
 */
class SocketBase {

  static CONNECTING = 0;  // The connection is not yet open.
  static OPEN = 1;        // The connection is open and ready to communicate.
  static CLOSING = 2;     // The connection is in the process of closing.
  static CLOSED = 3;      // The connection is closed or couldn't be opened.

  /**
   * Get the current ready state.
   */
  get readyState(): number {
    return this._readyState;
  }

  /**
   * Assign a callback for the websocket opening.
   */
  set onopen(cb: () => void) {
    this._onOpen = cb;
  }

  /**
   * Assign a callback for the websocket closing.
   */
  set onclose(cb: (evt: any) => void) {
    this._onClose = cb;
  }

  /**
   * Assign a callback for the websocket error condition.
   */
  set onerror(cb: (evt: any) => void) {
    this._onError = cb;
  }

  /**
   * Assign a callback for the websocket incoming message.
   */
  set onmessage(cb: (evt: any) => void) {
    this._onMessage = cb;
  }

  // Implementation details

  /**
   * Trigger an open event on the next event loop run.
   */
  triggerOpen() {
    this._readyState = SocketBase.CONNECTING;
    utils.doLater(() => {
      this._readyState = SocketBase.OPEN;
      var onOpen = this._onOpen;
      if (onOpen) onOpen();
    });
  }

  /**
   * Trigger a close event on the next event loop run.
   */
  triggerClose(evt: any) {
    this._readyState = SocketBase.CLOSING;
    utils.doLater(() => {
      this._readyState = SocketBase.CLOSED;
      var onClose = this._onClose;
      if (onClose) onClose(evt);
    });
  }

  /**
   * Trigger an error event on the next event loop run.
   */
  triggerError(msg: string) {
    utils.doLater(() => {
      var onError = this._onError;
      if (onError) onError({ message: msg });
    });
  }

  /**
   * Trigger a message event on the next event loop run.
   */
  triggerMessage(msg: string | ArrayBuffer) {
    if (this._readyState != SocketBase.OPEN) {
      throw Error('Websocket not connected');
    }
    utils.doLater(() => {
      var onMessage = this._onMessage;
      var isOpen = this._readyState === SocketBase.OPEN;
      if (onMessage && isOpen) onMessage({ data: msg });
    });
  }

  private _readyState = SocketBase.CLOSED;
  private _onClose: (evt?: any) => void = null;
  private _onMessage: (evt?: any) => void = null;
  private _onError: (evt?: any) => void = null;
  private _onOpen: () => void = null;
}


/**
 * Mock Websocket class that talks to a mock server.
 */
export
class MockSocket extends SocketBase {
  /**
   * Create a new Mock Websocket.
   * Look for an connect to a server on the same url.
   */
  constructor(url: string) {
    super();
    if (MockSocketServer.servers.has(url)) {
      this._server = MockSocketServer.servers.get(url);
    } else {
      this._server = new MockSocketServer(url);
      MockSocketServer.servers.set(url, this._server);
    }
    this._server.connect(this);
  }

  /**
   * Get the current binary data type.
   */
  get binaryType(): string {
    return this._binaryType;
  }

  /**
   * Set the binary data type.
   */
  set binaryType(type: string) {
    this._binaryType = type;
  }

  /**
   * Send a message to the server.
   */
  send(msg: string | ArrayBuffer) {
    this._server.triggerMessage(msg);
  }

  /**
   * Close the connection to the server.
   */
  close(code?: number, reason?: string) {
    if (this.readyState === SocketBase.CLOSED) {
      return;
    }
    if (code === void 0) {
      code = CLOSE_NORMAL;
    }
    if (reason === void 0) {
      reason = '';
    }
    var evt = { code: code, reason: reason, wasClean: code === CLOSE_NORMAL };
    this.triggerClose(evt);
    this._server.closeSocket(this, evt); 
  }

  private _binaryType = 'arraybuffer';
  private _server: MockSocketServer;
}


/**
 * Mock Websocket server.
 */
export
class MockSocketServer extends SocketBase {
  /**
   * Map of running servers by url.
   */
  static servers = new Map<string, MockSocketServer>();

  /**
   * Callback for when a server is started.
   */
  static onConnect: (server: MockSocketServer) => void = null;

  /**
   * Create a new mock web socket server.
   */
  constructor(url: string) {
    super();
    this._url = url;
    this.triggerOpen();
  }

  /**
   * Get the server url.
   *
   * Read-only.
   */
  get url(): string {
    return this._url;
  }

    /**
   * Assign a callback for the websocket closing.
   */
  set onWSClose(cb: (ws: MockSocket) => void) {
    this._onWSClose = cb;
  }

  /**
   * Handle a connection from a mock websocket.
   */
  connect(ws: MockSocket) {
    ws.triggerOpen();
    this._connections.push(ws);
    utils.doLater(() => {
      var callback = MockSocketServer.onConnect;
      if (callback) callback(this);
    });
  }

  /**
   * Handle a closing websocket.
   */
  closeSocket(ws: MockSocket, evt: any) {
    var i = this._connections.indexOf(ws);
    if (i !== -1) {
      this._connections.splice(i, 1);
      utils.doLater(() => {
        var onClose = this._onWSClose;
        if (onClose) onClose(ws, evt);
      });
    }
  }

  /**
   * Send a message to all connected web sockets.
   */
  send(msg: string | ArrayBuffer) {
    this._connections.forEach(ws => {
      if (ws.readyState == SocketBase.OPEN) ws.triggerMessage(msg);
    });
  }

  private _onWSClose: (ws: MockSocket, evt: any) => void = null;
  private _connections: MockSocket[] = [];
  private _url = '';
}
