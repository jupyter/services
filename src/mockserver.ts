// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  Server as MockSocketServer
} from 'mock-socket';

import {
  request as MockXhr, server as MockXhrServer
} from 'mock-xhr';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  IContents
} from './contents';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  ISession
} from './isession';

import {
  JSONObject, JSONPrimitive
} from './json';

import {
  createKernelMessage
} from './kernel';

import * as serialize
 from './serialize';

import {
  ITerminalSession
} from './terminals';

import * as utils
 from './utils';


/**
 * The default kernel spec models.
 */
const KERNELSPECS: IKernel.ISpecModels = {
  default: 'python',
  kernelspecs: {
    python: {
      name: 'python',
      spec: {
        language: 'python',
        argv: [],
        display_name: 'Python',
        env: {}
      },
      resources: {}
    },
    shell: {
      name: 'shell',
      spec: {
        language: 'shell',
        argv: [],
        display_name: 'Shell',
        env: {}
      },
      resources: {}
    }
  }
};


/**
 * The default language infos.
 */
const LANGUAGE_INFOS: { [key: string]: KernelMessage.ILanguageInfo } = {
  python: {
    name: 'python',
    version: '1',
    mimetype: 'text/x-python',
    file_extension: '.py',
    pygments_lexer: 'python',
    codemirror_mode: 'python',
    nbconverter_exporter: ''
  },
  shell: {
    name: 'shell',
    version: '1',
    mimetype: 'text/x-sh',
    file_extension: '.sh',
    pygments_lexer: 'shell',
    codemirror_mode: 'shell',
    nbconverter_exporter: ''
  }
};


/**
 * A mock Jupyter http server.
 */
export
class MockHttpServer implements IDisposable {
  /**
   * Construct a new mock http server.
   */
  constructor() {
    this._server = new MockXhrServer((value: MockXhr) => {
      this.requestReceived.emit(value);
    });
    this._server.start();
  }

  /**
   * Get the kernelspec models associated with the server.
   *
   * #### Notes
   * This is a read-only property.
   */
  get kernelspecs(): IKernel.ISpecModels {
    return KERNELSPECS;
  }

  /**
   * A signal emitted when a request is received.
   */
  get requestReceived(): ISignal<MockHttpServer, MockXhr> {
    return Private.requestReceivedSignal.bind(this);
  }

  /**
   * Test whether the server is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the server.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._server.stop();
    clearSignalData(this);
  }

  /**
   * Respond to a request.
   */
  respond(request: MockXhr, status: number, data: string | JSONObject) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    request.receive(status, data as string);
  }

  /**
   * Simulate a request error (e.g. NETWORK_ERR).
   */
  triggerError(request: MockXhr, msg: string): void {
    request.err(new Error(msg));
  }

  /**
   * Get the kernelspec for a given kernel.
   */
  getKernelspec(name: string): IKernel.ISpecModel {
    return KERNELSPECS.kernelspecs[name];
  }

  /**
   * Create a kernel model with a given name.
   */
  createKernelModel(options: IKernel.IOptions = {}): IKernel.IModel {
    return {
      name: options.name || KERNELSPECS.default,
      id: options.id || utils.uuid()
    };
  }

  /**
   * Create a session model with given options.
   */
  createSessionModel(options: ISession.IOptions = {}): ISession.IModel {
    return {
      id: options.id || utils.uuid(),
      notebook: {
        path: options.path || `Untitled${this._fileCounter++}.ipynb`
      },
      kernel: {
        name: options.kernelName || KERNELSPECS.default,
        id: options.kernelId || utils.uuid()
      }
    };
  }

  /**
   * Create a terminal model with given options.
   */
  createTerminalModel(options: ITerminalSession.IOptions = {}): ITerminalSession.IModel {
    return {
      name: options.name || `${this._terminalCounter++}`
    };
  }

  /**
   * Create a contents model with given options.
   */
  createContentsModel(options: IContents.IModel = {}): IContents.IModel {
    let name = options.name || `Untitled${this._fileCounter++}.txt`;
    let path = options.path || '';
    path = utils.urlPathJoin(path, name);
    return {
      name,
      path,
      type: options.type || 'file',
      created: options.created || '2013-10-01T14:22:36.123456+00:00',
      last_modified: options.last_modified || '2013-10-02T11:29:27.616675+00:00',
      writable: options.writable || true,
      mimetype: options.mimetype || 'text/plain',
      content: options.content || 'hello, world!',
      format: options.format || 'text'
    };
  }

  /**
   * Create a populated contents directory.
   */
  createContentsDirectory(options: IContents.IModel = {}): IContents.IModel {
    let name = options.name || `Untitled Folder ${this._fileCounter++}`;
    let path = options.path || '';
    path = utils.urlPathJoin(path, name);
    let content: IContents.IModel[] = [];
    for (let i = 0; i < 10; i++) {
      let subname = `Untitled${i}.txt`;
      content.push(this.createContentsModel({
        name: subname,
        path: utils.urlPathJoin(path, subname)
      }));
    }
    return {
      name,
      path,
      type: 'directory',
      created: options.created || 'yesterday',
      last_modified: options.last_modified || 'today',
      writable: options.writable || true,
      mimetype: options.mimetype || 'text/plain',
      content,
      format: 'json'
    };
  }

  private _isDisposed = false;
  private _server: MockXhrServer = null;
  private _terminalCounter = 0;
  private _fileCounter = 0;
}


/**
 * A class that mocks the server end of a terminal websocket.
 */
export
class MockTerminal implements IDisposable {
  /**
   * Construct a new mock terminal.
   */
  constructor(options: MockTerminal.IOptions) {
    this._terminal = options.terminal;
    this._server = new MockSocketServer(this._terminal.wsUrl);
    this._server.start();
    this._server.on('message', (evt: MessageEvent) => {
      let data = JSON.parse(evt.data);
      if (options.autoEcho !== false) {
        this.sendMessage({
          type: 'stdout',
          content: data
        });
      }
      this.messageReceived.emit({
        type: data[0] as ITerminalSession.MessageType,
        content: data.slice(1)
      });
    });
  }

  /**
   * A signal emitted when a terminal message is received.
   */
  get messageReceived(): ISignal<MockTerminal, ITerminalSession.IMessage> {
    return Private.termMessageReceivedSignal.bind(this);
  }

  /**
   * Test whether the helper is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the helper.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._server.stop();
    clearSignalData(this);
  }

  /**
   * Send a message to a terminal.
   */
  sendMessage(message: ITerminalSession.IMessage): void {
    let msg: JSONPrimitive[] = [message.type];
    msg.push(...message.content);
    this._server.send(JSON.stringify(msg));
  }

  private _server: MockSocketServer = null;
  private _terminal: ITerminalSession = null;
  private _isDisposed = false;
}


/**
 * A class that mocks the server end of the kernel websocket.
 */
export
class MockKernel implements IDisposable {
  /**
   * Construct a new kernel helper.
   */
  constructor(options: MockKernel.IOptions) {
    this._kernel = options.kernel;
    this._server = new MockSocketServer(this._kernel.wsUrl);
    this._server.start();
    this._server.on('message', (evt: MessageEvent) => {
      let msg = serialize.deserialize(evt.data);
      // Automatically handle kernel info requests.
      if (options.autoInfo !== false) {
        if (msg.header.msg_type === 'kernel_info_reply') {
          this.sendInfo(msg);
        }
      }
      this.messageReceived.emit(msg);
    });
  }

  /**
   * A signal emitted when a kernel message is received.
   */
  get messageReceived(): ISignal<MockKernel, KernelMessage.IMessage> {
    return Private.kernelMessageReceivedSignal.bind(this);
  }

  /**
   * Test whether the helper is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the helper.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._server.stop();
    clearSignalData(this);
  }

  /**
   * Send a message to a kernel.
   */
  sendMessage(original: KernelMessage.IMessage, options: KernelMessage.IOptions): void {
    options = utils.copy(options);
    options.parentHeader = original.header;
    options.msgId = options.parentHeader.msg_id;
    let msg = createKernelMessage(this._kernel, options);
    this._server.send(serialize.serialize(msg));
  }

  /**
   * Send a kernel status message.
   */
  sendStatus(original: KernelMessage.IMessage, status: IKernel.Status, options: KernelMessage.IOptions = {}): void {
    options = utils.copy(options);
    options.msgType = 'status';
    options.channel = 'iopub';
    options.content = { execution_state: status };
    this.sendMessage(original, options);
  }

  /**
   * Send a shell reply to the kernel.
   */
  sendReply(original: KernelMessage.IMessage, content: JSONObject, options: KernelMessage.IOptions = {}): void {
    options = utils.copy(options);
    options.msgType = original.header.msg_type.replace('_request', '_reply');
    options.channel = 'shell';
    options.content = content;
    this.sendMessage(original, options);
  }

  /**
   * Handle an execute request.
   */
  handleExecute(original: KernelMessage.IMessage, options: KernelMessage.IOptions): void {
    options = utils.copy(options);
    this.sendStatus(original, 'busy', options);
    this.sendMessage(original, options);
    let content: JSONObject = {
      status: 'ok',
      execution_count: this._executionCount++
    };
    this.sendReply(original, content, options);
    this.sendStatus(original, 'idle', options);
  }

  /**
   * Handle an execute request with error.
   */
  errorExecute(original: KernelMessage.IMessage, options: KernelMessage.IOptions = {}): void {
    options = utils.copy(options);
    this.sendStatus(original, 'busy', options);
    let content: JSONObject = {
      status: 'error',
      execution_count: this._executionCount++,
      ename: 'foo',
      evalue: 'bar',
      traceback: ['fizz', 'buzz']
    };
    this.sendReply(original, content, options);
    this.sendStatus(original, 'idle', options);
  }

  /**
   * Send a kernel info reply.
   */
  sendInfo(original: KernelMessage.IMessage): void {
    let options: KernelMessage.IOptions = {
      msgType: 'kernel_info_reply',
      channel: 'shell'
    };
    if (this._kernel.name in LANGUAGE_INFOS) {
      let content: KernelMessage.IInfoReply = {
        protocol_version: '5',
        implementation: '1',
        implementation_version: '1',
        language_info: LANGUAGE_INFOS[this._kernel.name],
        banner: 'hello',
        help_links: { }
      };
      options.content = content;
    }
    this.sendMessage(original, options);
  }

  private _kernel: IKernel = null;
  private _server: MockSocketServer = null;
  private _executionCount = 0;
  private _isDisposed = false;
}


/**
 * The namespace for MockTerminal statics.
 */
export
namespace MockTerminal {
  /**
   * The options used to construct a MockTerminal.
   */
  export
  interface IOptions {
    /**
     * The terminal session being mocked.
     */
    terminal: ITerminalSession;

    /**
     * Whether to echo messages back from the websocket.
     *
     * The default is true.
     */
    autoEcho?: boolean;
  }
}



/**
 * The namespace for MockKernel statics.
 */
export
namespace MockKernel {
  /**
   * The options used to construct a MockKernel.
   */
  export
  interface IOptions {
    /**
     * The kernel being mocked.
     */
    kernel: IKernel;

    /**
     * Whether to automatically respond with an kernel info request.
     *
     * The default is `true`.
     */
    autoInfo?: boolean;
  }
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A signal emitted when a kernel websocket message is received.
   */
  export
  const kernelMessageReceivedSignal = new Signal<MockKernel, KernelMessage.IMessage>();

  /**
   * A signal emitted when a terminal websocket message is received.
   */
  export
  const termMessageReceivedSignal = new Signal<MockTerminal, ITerminalSession.IMessage>();

  /**
   * A signal emitted when a request is received.
   */
  export
  const requestReceivedSignal = new Signal<MockHttpServer, MockXhr>();
}
