// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import encoding = require('text-encoding');

import {
  IAjaxSettings, PromiseDelegate, uuid, IAjaxError
} from '../../lib/utils';

import * as WebSocket
  from  'ws';

import {
  Server
} from 'ws';

import {
  MockXMLHttpRequest
} from '../../lib/mockxhr';

import {
  Contents, IKernel, Kernel, KernelMessage
} from '../../lib';

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
class RequestHandler {
  /**
   * Create a new RequestHandler.
   */
  constructor(onRequest?: (request: MockXMLHttpRequest) => void) {
    if (typeof window === 'undefined') {
      global.XMLHttpRequest = MockXMLHttpRequest;
      global.TextEncoder = encoding.TextEncoder;
      global.TextDecoder = encoding.TextDecoder;
    } else {
      (window as any).XMLHttpRequest = MockXMLHttpRequest;
    }
    MockXMLHttpRequest.requests = [];
    this.onRequest = onRequest;
  }

  set onRequest(cb: (request: MockXMLHttpRequest) => void) {
    MockXMLHttpRequest.onRequest = cb;
  }

  /**
   * Respond to the latest Ajax request.
   */
  respond(statusCode: number, data: any, header?: any): void {
    let len = MockXMLHttpRequest.requests.length;
    let request = MockXMLHttpRequest.requests[len - 1];
    request.respond(statusCode, data, header);
  }
}


/**
 * Kernel class test rig.
 */
export
class KernelTester extends RequestHandler {
  /**
   * Create a new Kernel tester.
   */
  constructor(onRequest?: (request: any) => void) {
    super(onRequest);
    this._promiseDelegate = new PromiseDelegate<void>();
    this._server = new Server({ port: 8888 });
    this._server.on('connection', (sock: WebSocket) => {
      this._ws = sock;
      this.sendStatus(this._initialStatus);
      this._promiseDelegate.resolve();
      this._ws.on('message', (msg: any) => {
        let data = deserialize(msg.data);
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
    });
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

  /**
   * Register a message callback with the websocket server.
   */
  onMessage(cb: (msg: KernelMessage.IMessage) => void) {
    this._onMessage = cb;
  }

  /**
   * Send a message to the server.
   */
  send(msg: KernelMessage.IMessage) {
    this._promiseDelegate.promise.then(() => {
      this._ws.send(serialize(msg));
    });
  }

  /**
   * Close the server.
   */
  close() {
    this._promiseDelegate.promise.then(() => {
      this._server.close();
    });
  }

  private _server: Server = null;
  private _onMessage: (msg: KernelMessage.IMessage) => void = null;
  private _promiseDelegate: PromiseDelegate<void> = null;
  private _initialStatus = 'starting';
  private _ws: WebSocket = null;
}


/**
 * Convenience function to start a kernel fully.
 */
export
function createKernel(tester?: KernelTester): Promise<IKernel> {
  tester = tester || new KernelTester();
  tester.onRequest = () => {
    tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
  };
  let kernelPromise = Kernel.startNew(KERNEL_OPTIONS);
  return kernelPromise;
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
