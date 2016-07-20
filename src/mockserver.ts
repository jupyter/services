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
  ISignal, Signal
} from 'phosphor-signaling';

import {
  IContents
} from './contents';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  JSONObject
} from './json';

import {
  createKernelMessage
} from './kernel';

import * as serialize
 from './serialize';

import * as utils
 from './utils';


/**
 * The default kernel spec models.
 */
export
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
 * The default file contents.
 */
export
const DEFAULT_FILE: IContents.IModel = {
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


/**
 * Reply to a kernel spec request for a specific kernel.
 */
export
function provideKernelspec(request: MockXhr, name: string): void {
  if (name in KERNELSPECS.kernelspecs) {
    request.receive(200, JSON.stringify(KERNELSPECS.kernelspecs[name]));
  } else {
    request.receive(404, 'Invalid kernelspec name');
  }
}


/**
 * Reply to a kernel spec request for all kernels.
 */
export
function provideKernelspecs(request: MockXhr): void {
  request.receive(200, JSON.stringify(KERNELSPECS));
}


/**
 * Convenience function to start and connect to a kernel.
 */
export
function createKernelModel(name: string): Promise<IKernel> {
  // TODO.
  return void 0;
}


/**
 * A class that mimics the server end of the kernel.
 */
export
class KernelHelper {
  /**
   * Construct a new kernel helper.
   */
  constructor(kernel: IKernel) {
    this._kernel = kernel;
    this._sockServer = new MockSocketServer(kernel.wsUrl);
    this._sockServer.start();
    this._sockServer.on('message', (evt: MessageEvent) => {
      this.messageReceived.emit(serialize.deserialize(evt.data));
    });
  }

  /**
   * A signal emitted when a kernel message is received.
   */
  get messageReceived(): ISignal<KernelHelper, KernelMessage.IMessage> {
    return Private.messageReceivedSignal.bind(this);
  }

  /**
   * Send a message to a kernel.
   */
  sendMessage(original: KernelMessage.IMessage, options: KernelMessage.IOptions): void {
    options = utils.copy(options);
    options.parentHeader = original.header;
    options.msgId = options.parentHeader.msg_id;
    let msg = createKernelMessage(this._kernel, options);
    this._sockServer.send(serialize.serialize(msg));
  }

  /**
   * Send a kernel info reply.
   */
  sendInfo(original: KernelMessage.IMessage, language: string, options: KernelMessage.IOptions = {}): void {
    options = utils.copy(options);
    options.msgType = 'kernel_info_reply';
    options.channel = 'shell';
    if (language in LANGUAGE_INFOS) {
      let content: KernelMessage.IInfoReply = {
        protocol_version: '1',
        implementation: '1',
        implementation_version: '1',
        language_info: LANGUAGE_INFOS[language],
        banner: language,
        help_links: { }
      };
      options.content = content;
    }
    this.sendMessage(original, options);
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

  private _kernel: IKernel = null;
  private _sockServer: MockSocketServer = null;
  private _executionCount = 0;
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A signal emitted when a websocket message is received.
   */
  export
  const messageReceivedSignal = new Signal<KernelHelper, KernelMessage.IMessage>();
}
