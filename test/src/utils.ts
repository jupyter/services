// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import encoding = require('text-encoding');

import {
  IAjaxSettings, PromiseDelegate, uuid
} from 'jupyter-js-utils';

import {
  IContentsModel, IKernel, IKernelInfo, IKernelSpecId, IKernelMessage,
  IKernelMessageOptions, IKernelOptions, createKernelMessage, startNewKernel
} from '../../lib';

import {
  deserialize, serialize
} from '../../lib/serialize';

import {
  MockSocket, MockSocketServer, overrideWebSocket
} from './mocksocket';

import {
  MockXMLHttpRequest
} from './mockxhr';


// stub for node global
declare var global: any;


overrideWebSocket();


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
      (<any>window).XMLHttpRequest = MockXMLHttpRequest;
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
    var len = MockXMLHttpRequest.requests.length;
    var request = MockXMLHttpRequest.requests[len - 1];
    request.respond(statusCode, data, header);
  }
}


export
const EXAMPLE_KERNEL_INFO: IKernelInfo = {
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
}

export
const KERNEL_OPTIONS: IKernelOptions = {
  baseUrl: 'http://localhost:8888',
  name: 'python',
  username: 'testUser',
}


export
const AJAX_KERNEL_OPTIONS: IKernelOptions = {
  baseUrl: 'http://localhost:8888',
  name: 'python',
  username: 'testUser',
  ajaxSettings: ajaxSettings
}


export
const PYTHON_SPEC: IKernelSpecId = {
  name: "Python",
  spec: {
    language: "python",
    argv: [],
    display_name: "python",
    codemirror_mode: "python",
    env: {},
    help_links: [ { text: "re", url: "reUrl" }]
  },
  resources: { foo: 'bar' },
}


export
const DEFAULT_FILE: IContentsModel = {
  name: "test",
  path: "",
  type: "file",
  created: "yesterday",
  last_modified: "today",
  writable: true,
  mimetype: "text/plain",
  content: "hello, world!",
  format: "text"
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
    MockSocketServer.onConnect = (server: MockSocketServer) => {
      this._server = server;
      this.sendStatus(this._initialStatus);
      this._promiseDelegate.resolve();
      this._server.onmessage = (msg: any) => {
        let data = deserialize(msg.data);
        if (data.header.msg_type === 'kernel_info_request') {
          data.parent_header = data.header;
          data.header.msg_type = 'kernel_info_reply';
          data.content = EXAMPLE_KERNEL_INFO;
          this.send(data);
        } else {
          let onMessage = this._onMessage;
          if (onMessage) onMessage(data);
        }
      }
    }
  }

  get initialStatus(): string {
    return this._initialStatus;
  }

  set initialStatus(status: string) {
    this._initialStatus = status;
  }

  sendStatus(status: string) {
    let options: IKernelMessageOptions = {
      msgType: 'status',
      channel: 'iopub',
      session: uuid(),
    }
    let msg = createKernelMessage(options, { execution_state: status } );
    this.send(msg);
  }

  /**
   * Register a connection callback with the websocket server.
   */
  onConnect(cb: (server: MockSocketServer) => void) {
    this._promiseDelegate.promise.then(() => {
      cb(this._server);
    });
  }

  /**
   * Register a message callback with the websocket server.
   */
  onMessage(cb: (msg: IKernelMessage) => void) {
    this._onMessage = cb;
  }

  /**
   * Register a close with the websocket server.
   */
  onClose(cb: (ws: MockSocket) => void) {
    this._promiseDelegate.promise.then(() => {
      this._server.onWSClose = cb;
    });
  }

  /**
   * Send a message to the server.
   */
  send(msg: IKernelMessage) {
    this._promiseDelegate.promise.then(() => {
      this._server.send(serialize(msg));
    });
  }

  /**
   * Trigger an error on the server.
   */
  triggerError(msg: string) {
    this._promiseDelegate.promise.then(() => {
      this._server.triggerError(msg);
    })
  }

  private _server: MockSocketServer = null;
  private _onMessage: (msg: IKernelMessage) => void = null;
  private _promiseDelegate: PromiseDelegate<void> = null;
  private _initialStatus = 'starting';
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
  let kernelPromise = startNewKernel(KERNEL_OPTIONS);
  return kernelPromise;
}


/**
 * Expect a failure on a promise with the given message, then call `done`.
 */
export
function expectFailure(promise: Promise<any>, done: () => void, message?: string): Promise<any> {
  return promise.then((msg: any) => {
    console.error('***should not reach this point');
    throw Error('Should not reach this point');
  }).catch((error) => {
    if (message && error.message.indexOf(message) === -1) {
      console.error('****', message, 'not in:', error.message);
      return;
    }
    done();
  });
}


/**
 * Do something in the future ensuring total ordering wrt to Promises.
 */
export
function doLater(cb: () => void): void {
  Promise.resolve().then(cb);
}


/**
 * Optional ajax arguments.
 */
export
var ajaxSettings: IAjaxSettings = {
  timeout: 10,
  requestHeaders: { foo: 'bar', fizz: 'buzz' },
  withCredentials: true,
  user: 'foo',
  password: 'bar'
}
