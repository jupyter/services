import {
  IAjaxSettings
} from 'jupyter-js-utils';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  INotebookSession
} from './isession';

import {
  KernelStatus, IKernel, IKernelId, IKernelMessage
} from './ikernel';

import {
  MockKernel
} from './mockkernel';


/**
 * A mock notebook session object that uses a mock kernel by default.
 */
export
class MockSession implements INotebookSession {

  id: string;
  notebookPath: string;
  ajaxSettings: IAjaxSettings = {};

  constructor(path: string, kernel?: IKernel) {
    this.notebookPath = path;
    this._kernel = kernel || new MockKernel();
    this._kernel.statusChanged.connect(this.onKernelStatus, this);
    this._kernel.unhandledMessage.connect(this.onUnhandledMessage, this);
  }

  /**
   * A signal emitted when the session dies.
   */
  get sessionDied(): ISignal<INotebookSession, void> {
    return Private.sessionDiedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel changes.
   */
  get kernelChanged(): ISignal<INotebookSession, IKernel> {
    return Private.kernelChangedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<INotebookSession, KernelStatus> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for a kernel messages.
   */
  get iopubMessage(): ISignal<INotebookSession, IKernelMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for an unhandled kernel message.
   */
  get unhandledMessage(): ISignal<INotebookSession, IKernelMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * A signal emitted when the notebook path changes.
   */
  get notebookPathChanged(): ISignal<INotebookSession, string> {
    return Private.notebookPathChangedSignal.bind(this);
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
  get status(): KernelStatus {
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
   * Rename or move a notebook.
   */
  renameNotebook(path: string): Promise<void> {
    this.notebookPath = path;
    return Promise.resolve(void 0);
  }

  /**
   * Change the kernel.
   */
  changeKernel(options: IKernelId): Promise<IKernel> {
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
  protected onKernelStatus(sender: IKernel, state: KernelStatus) {
    this.statusChanged.emit(state);
  }

  /**
   * Handle unhandled kernel messages.
   */
  protected onUnhandledMessage(sender: IKernel, msg: IKernelMessage) {
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
  const sessionDiedSignal = new Signal<INotebookSession, void>();

  /**
   * A signal emitted when the kernel changes.
   */
  export
  const kernelChangedSignal = new Signal<INotebookSession, IKernel>();

  /**
   * A signal emitted when the session kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<INotebookSession, KernelStatus>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<INotebookSession, IKernelMessage>();

  /**
   * A signal emitted for an unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<INotebookSession, IKernelMessage>();

  /**
   * A signal emitted when the notebook path changes.
   */
  export
  const notebookPathChangedSignal = new Signal<INotebookSession, string>();

}
