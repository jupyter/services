// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Mock implementation of a Web Socket and server following
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket


import expect = require('expect.js');


// stubs for node global variables
declare var global: any;
declare var setImmediate: any;


/**
 * Possible ready states for the socket.
 **/
enum ReadyState {
  CONNECTING = 0,  // The connection is not yet open.
  OPEN = 1,  //  The connection is open and ready to communicate.
  CLOSING = 2,  //  The connection is in the process of closing.
  CLOSED = 3 //  The connection is closed or couldn't be opened.
}


/**
 * Base class for a mock socket implementation.
 */
class SocketBase {

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
   * Trigger an open event.
   * Allow time for an onopen callback to be assigned.
   */
  triggerOpen() {
    this._readyState = ReadyState.CONNECTING;
    setTimeout(() => {
      this._readyState = ReadyState.OPEN;
      if (this._onOpen) {
        this._onOpen();
      }
    }, 10);
  }

  /**
   * Trigger a close event on the next event loop run.
   */
  triggerClose() {
    this._readyState = ReadyState.CLOSING;
    if (this._onClose) {
      setImmediate(() => {
        this._readyState = ReadyState.CLOSED;
        this._onClose();
      });
    }
  }

  /**
   * Trigger an error event on the next event loop run.
   */
  triggerError(msg: string) {
    if (this._onError) {
      setImmediate(() => {this._onError({message: msg});});
    }
  }

  /**
   * Trigger a message event on the next event loop run.
   */
  triggerMessage(msg: string | ArrayBuffer) {
    if (this._readyState != ReadyState.OPEN) {
      throw Error('Websocket not connected');
    }
    if (this._onMessage) {
      setImmediate(() => {this._onMessage({data: msg});});
    }
  }

  private _onOpen: () => void = null;
  private _onClose: () => void = null;
  private _onMessage: (evt?: any) => void = null;
  private _onError: (evt?: any) => void = null;
  private _readyState = ReadyState.CLOSED;
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
    this._server.close(this);
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
    (<any>global).WebSocket = MockWebSocket;
    MockWebSocket.servers.set(url, this);
  }

  /**
   * Handle a connection from a mock websocket.
   */
  connect(ws: MockWebSocket) {
    this.triggerOpen();
    ws.triggerOpen();
    this._connections.push(ws);
  }

  /**
   * Handle a closing websocket.
   */
  close(ws: MockWebSocket) {
    this.triggerClose();
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
      if (ws.readyState == ReadyState.OPEN) {
        ws.triggerMessage(msg);
      }
    }
  }

  private _connections: MockWebSocket[] = [];
}


describe('jupyter.services - mockSocket', () => {

  it('should connect', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    expect(ws.readyState).to.be(ReadyState.CONNECTING);
    ws.onopen = () => {
      expect(ws.readyState).to.be(ReadyState.OPEN);
      done();
    };
  });

  it('should send a message', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    server.onmessage = () => {
      done();
    };
    ws.onopen = () => {
      ws.send('hi');
    };
  });

  it('should receive a message', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    ws.onmessage = () => {
      done();
    };
    ws.onopen = () => {
      server.send('hi');
    };
  });

  it('should close the socket', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    ws.onclose = () => {
      expect(ws.readyState).to.be(ReadyState.CLOSED);
      done();
    };
    ws.onopen = () => {
      ws.close();
      expect(ws.readyState).to.be(ReadyState.CLOSING);
    }
  });

  it('should handle multiple connections', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws1 = new WebSocket('hello');
    var ws2 = new WebSocket('hello');
    ws1.onmessage = () => {
      done();
    };
    ws2.onopen = () => {
      server.send('hi');
    }
  });
});

