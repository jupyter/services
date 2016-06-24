import {
  IAjaxSettings
} from 'jupyter-js-utils';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  ISession
} from './isession';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  MockKernel
} from './mockkernel';


/**
 * A mock session object that uses a mock kernel by default.
 */
export
class MockSession implements ISession {

  id: string;
  path: string;
  ajaxSettings: IAjaxSettings = {};

  constructor(path: string, kernel?: IKernel) {
    this.path = path;
    this._kernel = kernel || new MockKernel();
    this._kernel.statusChanged.connect(this.onKernelStatus, this);
    this._kernel.unhandledMessage.connect(this.onUnhandledMessage, this);
  }

  /**
   * A signal emitted when the session dies.
   */
  get sessionDied(): ISignal<ISession, void> {
    return Private.sessionDiedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel changes.
   */
  get kernelChanged(): ISignal<ISession, IKernel> {
    return Private.kernelChangedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<ISession, IKernel.Status> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for a kernel messages.
   */
  get iopubMessage(): ISignal<ISession, KernelMessage.IIOPubMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for an unhandled kernel message.
   */
  get unhandledMessage(): ISignal<ISession, KernelMessage.IMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * A signal emitted when the session path changes.
   */
  get pathChanged(): ISignal<ISession, string> {
    return Private.pathChangedSignal.bind(this);
  }

  /**
   * Get the session kernel object.
   */
  get kernel(): IKernel {
    return this._kernel;
  }

  /**
   * The current status of the session.
   */
  get status(): IKernel.Status {
    return this._kernel.status;
  }

  /**
   * Test whether the session has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    this._isDisposed = true;
  }

  /**
   * Rename or move the session.
   */
  rename(path: string): Promise<void> {
    this.path = path;
    return Promise.resolve(void 0);
  }

  /**
   * Change the kernel.
   */
  changeKernel(options: IKernel.IModel): Promise<IKernel> {
    this._kernel.dispose();
    this._kernel = new MockKernel(options);
    this.kernelChanged.emit(this._kernel);
    return Promise.resolve(this._kernel);
  }

  /**
   * Kill the kernel and shutdown the session.
   */
  shutdown(): Promise<void> {
    this._kernel.dispose();
    this._kernel = null;
    this.sessionDied.emit(void 0);
    return Promise.resolve(void 0);
  }

  /**
   * Handle to changes in the Kernel status.
   */
  protected onKernelStatus(sender: IKernel, state: IKernel.Status) {
    this.statusChanged.emit(state);
  }

  /**
   * Handle unhandled kernel messages.
   */
  protected onUnhandledMessage(sender: IKernel, msg: KernelMessage.IMessage) {
    this.unhandledMessage.emit(msg);
  }

  private _isDisposed = false;
  private _kernel: IKernel = null;
}


/**
 * A namespace for notebook session private data.
 */
namespace Private {
  /**
   * A signal emitted when the session is shut down.
   */
  export
  const sessionDiedSignal = new Signal<ISession, void>();

  /**
   * A signal emitted when the kernel changes.
   */
  export
  const kernelChangedSignal = new Signal<ISession, IKernel>();

  /**
   * A signal emitted when the session kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<ISession, IKernel.Status>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<ISession, KernelMessage.IIOPubMessage>();

  /**
   * A signal emitted for an unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<ISession, KernelMessage.IMessage>();

  /**
   * A signal emitted when the session path changes.
   */
  export
  const pathChangedSignal = new Signal<ISession, string>();
}
