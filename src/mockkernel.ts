// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as utils
  from 'jupyter-js-utils';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  KernelFutureHandler
} from './kernelfuture';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  JSONObject
} from './json';

import {
  createKernelMessage
} from './kernel';


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
 * A mock kernel object.
 * It only keeps one kernel future at a time.
 */
export
class MockKernel implements IKernel {

  id: string;
  name: string;
  username = '';
  clientId = '';

  constructor(options?: IKernel.IModel) {
    options = options || {};
    this.id = options.id || '';
    this.name = options.name || 'python';
    let name = this.name;
    if (!(name in KERNELSPECS.kernelspecs)) {
      name = 'python';
    }
    this._kernelspec = KERNELSPECS.kernelspecs[name].spec;
    this._kernelInfo = {
      protocol_version: '1',
      implementation: 'foo',
      implementation_version: '1',
      language_info: LANGUAGE_INFOS[name],
      banner: 'Hello',
      help_links: {}
    };
    Promise.resolve().then(() => {
      this._changeStatus('idle');
    });
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<IKernel, IKernel.Status> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for iopub kernel messages.
   */
  get iopubMessage(): ISignal<IKernel, KernelMessage.IIOPubMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for unhandled kernel message.
   */
  get unhandledMessage(): ISignal<IKernel, KernelMessage.IMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * The current status of the kernel.
   */
  get status(): IKernel.Status {
    return this._status;
  }

  /**
   * Test whether the kernel has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
  }

  /**
   * Send a shell message to the kernel.
   */
  sendShellMessage(msg: KernelMessage.IShellMessage, expectReply=false, disposeOnDone=true): IKernel.IFuture {
    let future = new KernelFutureHandler(() => {}, msg, expectReply, disposeOnDone);
    this._future = future;
    return future;
  }

  /**
   * Send a message to the kernel.
   */
  sendServerMessage(msgType: string, channel: KernelMessage.Channel, content: JSONObject): void {
    let future = this._future;
    if (!future) {
      return;
    }
    let options: KernelMessage.IOptions = {
      msgType,
      channel,
      username: this.username,
      session: this.clientId
    };
    let msg = createKernelMessage(options, content);
    future.handleMsg(msg);
  }

  /**
   * Send a shell reply message to the kernel.
   */
  sendShellReply(content: JSONObject): void {
    let future = this._future;
    if (!future) {
      return;
    }
    let msgType = future.msg.header.msg_type.replace('_request', '_reply');
    this.sendServerMessage(msgType, 'shell', content);
  }

  /**
   * Interrupt a kernel.
   */
  interrupt(): Promise<void> {
    this._changeStatus('busy');
    return Promise.resolve().then(() => {
      this._changeStatus('idle');
    });
  }

  /**
   * Restart a kernel.
   */
  restart(): Promise<void> {
    this._changeStatus('restarting');
    return Promise.resolve().then(() => {
      this._changeStatus('idle');
    });
  }

  /**
   * Shutdown a kernel.
   */
  shutdown(): Promise<void> {
    this._changeStatus('dead');
    this.dispose();
    return Promise.resolve(void 0);
  }

  /**
   * Send a `kernel_info_request` message.
   */
  kernelInfo(): Promise<KernelMessage.IInfoReplyMsg> {
    let options: KernelMessage.IOptions = {
      msgType: 'kernel_info_reply',
      channel: 'shell',
      username: '',
      session: ''
    };
    let msg = createKernelMessage(options, this._kernelInfo);
    return Promise.resolve(msg);
  }

  /**
   * Send a `complete_request` message.
   */
  complete(content: KernelMessage.ICompleteRequest): Promise<KernelMessage.ICompleteReplyMsg> {
    return this._sendKernelMessage('complete_request', 'shell', content);
  }

  /**
   * Send a `history_request` message.
   */
  history(content: KernelMessage.IHistoryRequest): Promise<KernelMessage.IHistoryReplyMsg> {
    return this._sendKernelMessage('history', 'shell', content);
  }


  /**
   * Send an `inspect_request` message.
   */
  inspect(content: KernelMessage.IInspectRequest): Promise<KernelMessage.IInspectReplyMsg> {
    return this._sendKernelMessage('inspect_request', 'shell', content);
  }

  /**
   * Send an `execute_request` message.
   *
   * #### Notes
   * This simulatates an actual exection on the server.
   */
  execute(content: KernelMessage.IExecuteRequest, disposeOnDone: boolean = true): IKernel.IFuture {
    let options: KernelMessage.IOptions = {
      msgType: 'execute_request',
      channel: 'shell',
      username: '',
      session: ''
    };
    let defaults = {
      silent : false,
      store_history : true,
      user_expressions : {},
      allow_stdin : true,
      stop_on_error : false
    };
    content = utils.extend(defaults, content);
    let msg = createKernelMessage(options, content) as KernelMessage.IShellMessage;
    let future = this.sendShellMessage(msg, true, disposeOnDone);
    Promise.resolve(void 0).then(() => {
      this.sendServerMessage('status', 'iopub', {
        execution_state: 'busy'
      });
      this.sendServerMessage('stream', 'iopub', {
        name: 'stdout',
        text: 'foo'
      });
      this.sendServerMessage('status', 'iopub', {
        execution_state: 'idle'
      });
      this.sendServerMessage('execute_reply', 'shell', {
        execution_count: ++this._executionCount,
        data: {},
        metadata: {}
      });
    });
    return future;
  }

  /**
   * Send an `is_complete_request` message.
   */
  isComplete(content: KernelMessage.IIsCompleteRequest): Promise<KernelMessage.IIsCompleteReplyMsg> {
    return this._sendKernelMessage('is_complete_request', 'shell', content);
  }

  /**
   * Send a `comm_info_request` message.
   */
  commInfo(content: KernelMessage.ICommInfoRequest): Promise<KernelMessage.ICommInfoReplyMsg> {
    return this._sendKernelMessage('comm_info_request', 'shell', content);
  }

  /**
   * Send an `input_reply` message.
   */
  sendInputReply(content: KernelMessage.IInputReply): void { }

  /**
   * Register a comm target handler.
   */
  registerCommTarget(targetName: string, callback: (comm: IKernel.IComm, msg: KernelMessage.ICommOpenMsg) => void): IDisposable {
    return void 0;
  }

  /**
   * Connect to a comm, or create a new one.
   */
  connectToComm(targetName: string, commId?: string): IKernel.IComm {
    return void 0;
  }

  /**
   * Get the kernel spec associated with the kernel.
   */
  getKernelSpec(): Promise<IKernel.ISpec> {
    return Promise.resolve(this._kernelspec);
  }

  private _sendKernelMessage(msgType: string, channel: KernelMessage.Channel, content: JSONObject): Promise<KernelMessage.IShellMessage> {
    let options: KernelMessage.IOptions = {
      msgType,
      channel,
      username: this.username,
      session: this.clientId
    };
    let msg = createKernelMessage(options, content) as KernelMessage.IShellMessage;
    let future: IKernel.IFuture;
    try {
      future = this.sendShellMessage(msg, true);
    } catch (e) {
      return Promise.reject(e);
    }
    return new Promise<KernelMessage.IShellMessage>((resolve, reject) => {
      future.onReply = (reply: KernelMessage.IShellMessage) => {
        resolve(reply);
      };
    });
  }

  private _changeStatus(status: IKernel.Status): void {
    if (this._status === status) {
      return;
    }
    this._status = status;
    this.statusChanged.emit(status);
  }

  private _status: IKernel.Status = 'unknown';
  private _isDisposed = false;
  private _future: KernelFutureHandler = null;
  private _kernelspec: IKernel.ISpec = null;
  private _kernelInfo: KernelMessage.IInfoReply = null;
  private _executionCount = 0;
}


namespace Private {
  /**
   * A signal emitted when the kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<IKernel, IKernel.Status>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<IKernel, KernelMessage.IIOPubMessage>();

  /**
   * A signal emitted for unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<IKernel, KernelMessage.IMessage>();
}
