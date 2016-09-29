// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import encoding = require('text-encoding');

import {
  useFakeXMLHttpRequest
} from 'sinon';

import * as WebSocket
  from  'ws';

import {
  Server
} from 'ws';

import {
  Contents, IKernel, Kernel, KernelMessage, ITerminalSession, TerminalSession
} from '../../lib';

import {
  IAjaxSettings, PromiseDelegate, uuid, IAjaxError
} from '../../lib/utils';

import {
  deserialize, serialize
} from '../../lib/kernel/serialize';


// stub for node global
declare var global: any;

global.WebSocket = WebSocket;


/**
 * Optional ajax arguments.
 */
export
const ajaxSettings: IAjaxSettings = {
  timeout: 10,
  requestHeaders: { foo: 'bar', fizz: 'buzz' },
  withCredentials: true,
  user: 'foo',
  password: 'bar'
};


export
const EXAMPLE_KERNEL_INFO: KernelMessage.IInfoReply = {
  protocol_version: '1',
  implementation: 'a',
  implementation_version: '1',
  language_info: {
    name: 'test',
    version: '',
    mimetype: '',
    file_extension: '',
    pygments_lexer: '',
    codemirror_mode: '',
    nbconverter_exporter: ''
  },
  banner: '',
  help_links: {
  }
};


export
const KERNEL_OPTIONS: Kernel.IOptions = {
  baseUrl: 'http://localhost:8888',
  name: 'python',
  username: 'testUser',
};


export
const AJAX_KERNEL_OPTIONS: Kernel.IOptions = {
  baseUrl: 'http://localhost:8888',
  name: 'python',
  username: 'testUser',
  ajaxSettings: ajaxSettings
};


export
const PYTHON_SPEC: Kernel.ISpecModel = {
  name: 'Python',
  spec: {
    language: 'python',
    argv: [],
    display_name: 'python',
    codemirror_mode: 'python',
    env: {},
    help_links: [ { text: 're', url: 'reUrl' }]
  },
  resources: { foo: 'bar' },
};


export
const DEFAULT_FILE: Contents.IModel = {
  name: 'test',
  path: '',
  type: 'file',
  created: 'yesterday',
  last_modified: 'today',
  writable: true,
  mimetype: 'text/plain',
  content: 'hello, world!',
  format: 'text'
};


export
interface IFakeRequest {
  url: string;
  method: string;
  requestHeaders: any;
  requestBody: string;
  status: number;
  statusText: string;
  async: boolean;
  username: string;
  password: string;
  withCredentials: boolean;
  respond(status: number, headers: any, body: string): void;
}


const xhr = useFakeXMLHttpRequest();


export
class RequestHandler {
  /**
   * Create a new RequestHandler.
   */
  constructor(onRequest?: (request: IFakeRequest) => void) {
    if (typeof window === 'undefined') {
      global.TextEncoder = encoding.TextEncoder;
      global.TextDecoder = encoding.TextDecoder;
    }
    this._onRequest = onRequest;
    xhr.onCreate = value => {
      this._requests.push(value);
      let handler = this.onRequest;
      if (handler) {
        handler(value);
      }
    };
  }

  set onRequest(cb: (request: IFakeRequest) => void) {
    this._onRequest = cb;
  }

  /**
   * Respond to the latest Ajax request.
   */
  respond(status: number, body: any, headers: any = {}): void {
    let len = this._requests.length;
    let request = this._requests[len - 1];
    request.respond(status, headers, JSON.stringify(body));
  }

  private _requests: IFakeRequest[] = [];
  private _onRequest: (request: IFakeRequest) => void = null;
}


/**
 * Request and socket class test rig.
 */
class RequestSocketTester extends RequestHandler {
  /**
   * Create a new request and socket tester.
   */
  constructor(onRequest?: (request: any) => void) {
    super(onRequest);
    this._server = new Server({ port: 8888 });
    this._promiseDelegate = new PromiseDelegate<void>();
    this._server.on('connection', ws => {
      this._ws = ws;
      this.onSocket(ws);
      this._promiseDelegate.resolve();
      let connect = this._onConnect;
      if (connect) {
        connect(ws);
      }
    });
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._server.close();
    this._server = null;
  }

  get isDisposed(): boolean {
    return this._server === null;
  }

  /**
   * Send a raw message to the server.
   */
  sendRaw(msg: string | ArrayBuffer) {
    this._promiseDelegate.promise.then(() => {
      this._ws.send(msg);
    });
  }

  /**
   * Close the socket.
   */
  close() {
    this._promiseDelegate.promise.then(() => {
      this._promiseDelegate = new PromiseDelegate<void>();
      this._ws.close();
    });
  }

  /**
   * Register the handler for connections.
   */
  onConnect(cb: (ws: WebSocket) => void): void {
    this._onConnect = cb;
  }

  protected onSocket(sock: WebSocket): void { /* no-op */ }

  private _ws: WebSocket = null;
  private _promiseDelegate: PromiseDelegate<void> = null;
  private _server: Server = null;
  private _onConnect: (ws: WebSocket) => void = null;
}


/**
 * Kernel class test rig.
 */
export
class KernelTester extends RequestSocketTester {
  /**
   * Create a new kernel tester.
   */
  constructor(onRequest?: (request: any) => void) {
    super(onRequest);
    if (!onRequest) {
      this.onRequest = () => {
        this.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      };
    }
  }

  get initialStatus(): string {
    return this._initialStatus;
  }

  set initialStatus(status: string) {
    this._initialStatus = status;
  }

  sendStatus(status: string) {
    let options: KernelMessage.IOptions = {
      msgType: 'status',
      channel: 'iopub',
      session: uuid(),
    };
    let msg = KernelMessage.createMessage(options, { execution_state: status } );
    this.send(msg);
  }

  send(msg: KernelMessage.IMessage): void {
    this.sendRaw(serialize(msg));
  }

  /**
   * Register the message callback with the websocket server.
   */
  onMessage(cb: (msg: KernelMessage.IMessage) => void): void {
    this._onMessage = cb;
  }

  protected onSocket(sock: WebSocket): void {
    super.onSocket(sock);
    this.sendStatus(this._initialStatus);
    sock.on('message', (msg: any) => {
      if (msg instanceof Buffer) {
        msg = new Uint8Array(msg).buffer;
      }
      let data = deserialize(msg);
      if (data.header.msg_type === 'kernel_info_request') {
        data.parent_header = data.header;
        data.header.msg_type = 'kernel_info_reply';
        data.content = EXAMPLE_KERNEL_INFO;
        this.send(data);
      } else {
        let onMessage = this._onMessage;
        if (onMessage) {
          onMessage(data);
        }
      }
    });
  }

  private _initialStatus = 'starting';
  private _onMessage: (msg: KernelMessage.IMessage) => void = null;
}


/**
 * Terminal session test rig.
 */
export
class TerminalTester extends RequestSocketTester {
  /**
   * Construct a new terminal tester.
   */
  constructor(onRequest?: (request: any) => void) {
    super(onRequest);
    this.onRequest = (request) => {
      let model = JSON.parse(request.requestBody) as TerminalSession.IModel;
      let name = model.name || String(++this._count);
      this.respond(200, { name });
    };
  }

  /**
   * Register the message callback with the websocket server.
   */
  onMessage(cb: (msg: TerminalSession.IMessage) => void) {
    this._onMessage = cb;
  }

  protected onSocket(sock: WebSocket): void {
    super.onSocket(sock);
    sock.on('message', (msg: any) => {
      let onMessage = this._onMessage;
      if (onMessage) {
        onMessage(JSON.parse(msg) as TerminalSession.IMessage);
      }
    });
  }

  private _onMessage: (msg: TerminalSession.IMessage) => void = null;
  private _count = 0;
}


/**
 * Expect a failure on a promise with the given message, then call `done`.
 */
export
function expectFailure(promise: Promise<any>, done: () => void, message?: string): Promise<any> {
  return promise.then((msg: any) => {
    throw Error('Expected failure did not occur');
  }, (error: Error) => {
    if (message && error.message.indexOf(message) === -1) {
      throw Error(`Error "${message}" not in: "${error.message}"`);
    }
  }).then(done, done);
}


/**
 * Expect an Ajax failure with a given throwError.
 */
export
function expectAjaxError(promise: Promise<any>, done: () => void, throwError: string): Promise<any> {
  return promise.then((msg: any) => {
    throw Error('Expected failure did not occur');
  }, (error: IAjaxError) => {
    if (error.throwError !== throwError) {
      throw Error(`Error "${throwError}" not equal to "${error.throwError}"`);
    }
  }).then(done, done);
}


/**
 * Do something in the future ensuring total ordering wrt to Promises.
 */
export
function doLater(cb: () => void): void {
  Promise.resolve().then(cb);
}
