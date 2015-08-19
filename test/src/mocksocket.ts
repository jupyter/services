// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as utils from './utils';


// Mock implementation of a Web Socket and server following
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket


// stubs for node global variables
declare var global: any;


/**
 * Base class for a mock socket implementation.
 */
class SocketBase {

  static CONNECTING = 0;  // The connection is not yet open.
  static OPEN = 1;  //  The connection is open and ready to communicate.
  static CLOSING = 2;  //  The connection is in the process of closing.
  static CLOSED = 3; //  The connection is closed or couldn't be opened.

  /**
   * Get the current ready state.
   */
  get readyState(): number {
    return this._readyState;
  }

  /**
   * Assign a callback for the websocket opening.
   * If it is already opened, call immediately.
   */
  set onopen(cb: () => void) {
    this._onOpen = cb;
    if (this._readyState === SocketBase.OPEN) {
      cb();
    }
  }

  /**
   * Assign a callback for the websocket closing.
   */
  set onclose(cb: () => void) {
    this._onClose = cb;
  }

  /**
   * Assign a callback for the websocket error condition.
   */
  set onerror(cb: () => void) {
    this._onError = cb;
  }

  /**
   * Assign a callback for the websocket incoming message.
   */
  set onmessage(cb: () => void) {
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
      if (this._onOpen) {
        this._onOpen();
      }
    });
  }

  /**
   * Trigger a close event on the next event loop run.
   */
  triggerClose() {
    this._readyState = SocketBase.CLOSING;
    if (this._onClose) {
      utils.doLater(() => {
        this._readyState = SocketBase.CLOSED;
        this._onClose();
      });
    }
  }

  /**
   * Trigger an error event on the next event loop run.
   */
  triggerError(msg: string) {
    if (this._onError) {
      utils.doLater(() => {this._onError({message: msg});});
    }
  }

  /**
   * Trigger a message event on the next event loop run.
   */
  triggerMessage(msg: string | ArrayBuffer) {
    if (this._readyState != SocketBase.OPEN) {
      throw Error('Websocket not connected');
    }
    if (this._onMessage) {
      utils.doLater(() => {this._onMessage({data: msg});});
    }
  }

  private _onOpen: () => void = null;
  private _onClose: () => void = null;
  private _onMessage: (evt?: any) => void = null;
  private _onError: (evt?: any) => void = null;
  private _readyState = SocketBase.CLOSED;
}


/**
 * Mock Websocket class that talks to a mock server.
 */
export
class MockWebSocket extends SocketBase {

  /**
   * A map of available servers by url.
   */
  static servers: Map<string, MockWebSocketServer> = new Map<string, MockWebSocketServer>();

  /**
   * Create a new Mock Websocket.
   * Look for an connect to a server on the same url.
   */
  constructor(url: string) {
    super();
    var server = MockWebSocket.servers.get(url);
    if (!server) {
      throw Error('No Server found on: ' + url);
    }
    this._server = server;
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
  close() {
    this._server.closeSocket(this);
  }

  private _binaryType = 'arraybuffer';
  private _server: MockWebSocketServer;
}


/**
 * Mock Websocket server.
 */
export
class MockWebSocketServer extends SocketBase {

  /**
   * Create a new mock web socket server.
   */
  constructor(url: string) {
    super();
    if (typeof window === 'undefined') {
      global.WebSocket = MockWebSocket;
    } else {
      (<any>window).WebSocket = MockWebSocket;
    }
    MockWebSocket.servers.set(url, this);
    this.triggerOpen();
  }

  /**
   * Assign a callback for a websocket connection.
   * If there are existing open connections, call the callback for each.
   */
  set onconnect(cb: (ws: MockWebSocket) => void) {
    this._onConnect = cb;
    for (var i = 0; i < this._connections.length; i++) {
      if (this._connections[i].readyState == MockWebSocket.OPEN) {
        utils.doLater(() => {
          this._onConnect(this._connections[i]);
        });
      }
    };
  }

  /**
   * Handle a connection from a mock websocket.
   */
  connect(ws: MockWebSocket) {
    ws.triggerOpen();
    this._connections.push(ws);
    utils.doLater(() => {
      if (this._onConnect) {
        this._onConnect(ws);
      }
    });
  }

  /**
   * Handle a closing websocket.
   */
  closeSocket(ws: MockWebSocket) {
    ws.triggerClose();
    var index = this._connections.indexOf(ws);
    this._connections.splice(index, 1);
  }

  /**
   * Send a message to all connected web sockets.
   */
  send(msg: string | ArrayBuffer) {
    for (var i = 0; i < this._connections.length; i++) {
      var ws = this._connections[i];
      if (ws.readyState == SocketBase.OPEN) {
        ws.triggerMessage(msg);
      }
    }
  }

  private _connections: MockWebSocket[] = [];
  private _onConnect: (ws: MockWebSocket) => void = null;
}
