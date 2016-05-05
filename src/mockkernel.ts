import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils
  from 'jupyter-js-utils';

import {
  DisposableDelegate, IDisposable
} from 'phosphor-disposable';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  KernelFutureHandler
} from './kernelfuture';

import {
  IComm, ICommInfoRequest, ICommInfoReply, ICommOpen, ICompleteReply,
  ICompleteRequest, IExecuteRequest, IInspectReply,
  IInspectRequest, IIsCompleteReply, IIsCompleteRequest, IInputReply, IKernel,
  IKernelFuture, IKernelId, IKernelInfo, IKernelManager, IKernelMessage,
  IKernelMessageHeader, IKernelMessageOptions, IKernelOptions, IKernelSpecIds,
  KernelStatus, IKernelIOPubCommOpenMessage, IKernelSpec,
  IHistoryRequest, IHistoryReply
} from './ikernel';

import {
  createKernelMessage
} from './kernel';


/**
 * A mock kernel object that only handles execution requests.
 * It only keeps one kernel future at a time.
 */
export
class MockKernel implements IKernel {

  id: string;
  name: string;
  username = '';
  clientId = '';

  constructor(options?: IKernelId) {
    options = options || {};
    this.id = options.id || '';
    this.name = options.name || 'python';
    Promise.resolve().then(() => {
      this._changeStatus(KernelStatus.Idle);
    });
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<IKernel, KernelStatus> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for iopub kernel messages.
   */
  get iopubMessage(): ISignal<IKernel, IKernelMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for unhandled kernel message.
   */
  get unhandledMessage(): ISignal<IKernel, IKernelMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * The current status of the kernel.
   */
  get status(): KernelStatus {
    return this._status;
  }

  /**
   * Test whether the kernel has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed
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
  sendShellMessage(msg: IKernelMessage, expectReply=false, disposeOnDone=true): IKernelFuture {
    let future = new KernelFutureHandler(() => {}, msg, expectReply, disposeOnDone);
    this._future = future;
    return future;
  }

  /**
   * Send a message to the kernel.
   */
  sendServerMessage(msgType: string, channel: string, contents: any): void {
    let future = this._future;
    if (!future) {
      return;
    }
    let options = {
      msgType,
      channel,
      username: this.username,
      session: this.clientId
    }
    let msg = createKernelMessage(options, contents);
    future.handleMsg(msg);
  }

  /**
   * Send a shell reply message to the kernel.
   */
  sendShellReply(contents: any): void {
    let future = this._future;
    if (!future) {
      return;
    }
    let msgType = future.msg.header.msg_type.replace('_request', '_reply');
    this.sendServerMessage(msgType, 'shell', contents);
  }

  /**
   * Interrupt a kernel.
   */
  interrupt(): Promise<void> {
    return Promise.resolve().then(() => {
      this._changeStatus(KernelStatus.Idle);
    });
  }

  /**
   * Restart a kernel.
   */
  restart(): Promise<void> {
    this._changeStatus(KernelStatus.Restarting);
    return Promise.resolve().then(() => {
      this._changeStatus(KernelStatus.Idle);
    });
  }

  /**
   * Shutdown a kernel.
   */
  shutdown(): Promise<void> {
    this._changeStatus(KernelStatus.Dead);
    this.dispose();
    return Promise.resolve(void 0);
  }

  /**
   * Send a `kernel_info_request` message.
   */
  kernelInfo(): Promise<IKernelInfo> {
    return this._sendKernelMessage('kernel_info_request', 'shell', {});
  }

  /**
   * Send a `complete_request` message.
   */
  complete(contents: ICompleteRequest): Promise<ICompleteReply> {
    return this._sendKernelMessage('complete_request', 'shell', contents);
  }

  /**
   * Send a `history_request` message.
   */
  history(contents: IHistoryRequest): Promise<IHistoryReply> {
    return this._sendKernelMessage('history', 'shell', contents);
  }


  /**
   * Send an `inspect_request` message.
   */
  inspect(contents: IInspectRequest): Promise<IInspectReply> {
    return this._sendKernelMessage('inspect_request', 'shell', contents);
  }

  /**
   * Send an `execute_request` message.
   */
  execute(contents: IExecuteRequest, disposeOnDone: boolean = true): IKernelFuture {
    let options: IKernelMessageOptions = {
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
    contents = utils.extend(defaults, contents);
    let msg = createKernelMessage(options, contents);
    return this.sendShellMessage(msg, true, disposeOnDone);
  }

  /**
   * Send an `is_complete_request` message.
   */
  isComplete(contents: IIsCompleteRequest): Promise<IIsCompleteReply> {
    return this._sendKernelMessage('is_complete_request', 'shell', contents);
  }

  /**
   * Send a `comm_info_request` message.
   */
  commInfo(contents: ICommInfoRequest): Promise<ICommInfoReply> {
    return this._sendKernelMessage('comm_info_request', 'shell', contents);
  }

  /**
   * Send an `input_reply` message.
   */
  sendInputReply(contents: IInputReply): void { }

  /**
   * Register a comm target handler.
   */
  registerCommTarget(targetName: string, callback: (comm: IComm, msg: IKernelIOPubCommOpenMessage) => void): IDisposable {
    return void 0;
  }

  /**
   * Connect to a comm, or create a new one.
   */
  connectToComm(targetName: string, commId?: string): IComm {
    return void 0;
  }

  /**
   * Get the kernel spec associated with the kernel.
   */
  getKernelSpec(): Promise<IKernelSpec> {
    return Promise.resolve(void 0);
  }

  private _sendKernelMessage(msgType: string, channel: string, contents: any): Promise<any> {
    let options: IKernelMessageOptions = {
      msgType,
      channel,
      username: this.username,
      session: this.clientId
    };
    let msg = createKernelMessage(options, contents);
    let future: IKernelFuture;
    try {
      future = this.sendShellMessage(msg, true);
    } catch (e) {
      return Promise.reject(e);
    }
    return new Promise<IKernelInfo>((resolve, reject) => {
      future.onReply = (msg: IKernelMessage) => {
        resolve(msg.content);
      };
    });
  }

  private _changeStatus(status: KernelStatus): void {
    if (this._status === status) {
      return;
    }
    this._status = status;
    this.statusChanged.emit(status);
  }

  private _status = KernelStatus.Unknown;
  private _isDisposed = false;
  private _future: KernelFutureHandler = null;
}


namespace Private {
  /**
   * A signal emitted when the kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<IKernel, KernelStatus>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<IKernel, IKernelMessage>();

  /**
   * A signal emitted for unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<IKernel, IKernelMessage>();
}
