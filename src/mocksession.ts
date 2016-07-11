import {
  IAjaxSettings, uuid
} from 'jupyter-js-utils';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  ISession
} from './isession';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  deepEqual
} from './json';

import {
  KERNELSPECS, MockKernel
} from './mockkernel';


/**
 * A mock session object that uses a mock kernel by default.
 */
export
class MockSession implements ISession {

  id: string;
  path: string;
  ajaxSettings: IAjaxSettings = {};

  constructor(model?: ISession.IModel) {
    if (!model) {
      model = {
        id: uuid(),
        notebook: {
          path: ''
        },
        kernel: {}
      };
    }
    this.id = model.id;
    this.path = model.notebook.path;
    this._kernel = new MockKernel(model.kernel);
    this._kernel.statusChanged.connect(this.onKernelStatus, this);
    this._kernel.unhandledMessage.connect(this.onUnhandledMessage, this);
    Private.runningSessions[this.id] = this;
  }

  /**
   * A signal emitted when the session dies.
   */
  get sessionDied(): ISignal<MockSession, void> {
    return Private.sessionDiedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel changes.
   */
  get kernelChanged(): ISignal<MockSession, MockKernel> {
    return Private.kernelChangedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<MockSession, IKernel.Status> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for a kernel messages.
   */
  get iopubMessage(): ISignal<MockSession, KernelMessage.IIOPubMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for an unhandled kernel message.
   */
  get unhandledMessage(): ISignal<MockSession, KernelMessage.IMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * A signal emitted when the session path changes.
   */
  get pathChanged(): ISignal<MockSession, string> {
    return Private.pathChangedSignal.bind(this);
  }

  /**
   * Get the session kernel object.
   */
  get kernel(): MockKernel {
    return this._kernel;
  }

  /**
   * Get the session model.
   */
  get model(): ISession.IModel {
    return {
      id: this.id,
      kernel: this.kernel.model,
      notebook: {
        path: this.path
      }
    };
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
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    delete Private.runningSessions[this.id];
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
  changeKernel(options: IKernel.IModel): Promise<MockKernel> {
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
  private _kernel: MockKernel = null;
}


/**
 *  A mock session manager object.
 */
export
class MockSessionManager implements ISession.IManager {
  /**
   * A signal emitted when the kernel specs change.
   */
  get specsChanged(): ISignal<MockSessionManager, IKernel.ISpecModels> {
    return Private.specsChangedSignal.bind(this);
  }

  /**
   * A signal emitted when the running sessions change.
   */
  get runningChanged(): ISignal<MockSessionManager, ISession.IModel[]> {
    return Private.runningChangedSignal.bind(this);
  }

  /**
   * Test whether the terminal manager is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    clearSignalData(this);
    this._running = [];
  }

  /**
   * Get the available kernel specs.
   */
  getSpecs(options?: ISession.IOptions): Promise<IKernel.ISpecModels> {
    return Promise.resolve(KERNELSPECS);
  }

  /*
   * Get the running sessions.
   */
  listRunning(options?: ISession.IOptions): Promise<ISession.IModel[]> {
    let models: ISession.IModel[] = [];
    for (let id in Private.runningSessions) {
      let session = Private.runningSessions[id];
      models.push(session.model);
    }
    if (!deepEqual(models, this._running)) {
      this._running = models.slice();
      this.runningChanged.emit(models);
    }
    return Promise.resolve(models);
  }

  /**
   * Start a new session.
   */
  startNew(options: ISession.IOptions, id?: string): Promise<MockSession> {
    let session = new MockSession({
      id,
      notebook: {
        path: options.path || ''
      },
      kernel: {
        id: options.kernelId,
        name: options.kernelName
      }
    });
    return Promise.resolve(session);
  }

  /**
   * Find a session by id.
   */
  findById(id: string, options?: ISession.IOptions): Promise<ISession.IModel> {
    if (id in Private.runningSessions) {
      return Promise.resolve(Private.runningSessions[id].model);
    }
    return Promise.resolve(void 0);
  }

  /**
   * Find a session by path.
   */
  findByPath(path: string, options?: ISession.IOptions): Promise<ISession.IModel> {
    for (let id in Private.runningSessions) {
      let session = Private.runningSessions[id];
      if (session.path === path) {
        return Promise.resolve(session.model);
      }
    }
    return Promise.resolve(void 0);
  }

  /**
   * Connect to a running session.
   */
  connectTo(id: string, options?: ISession.IOptions): Promise<MockSession> {
    if (id in Private.runningSessions) {
      return Promise.resolve(Private.runningSessions[id]);
    }
    return this.startNew(options, id);
  }

  shutdown(id: string, options?: IKernel.IOptions): Promise<void> {
    let session = Private.runningSessions[id];
    if (!session) {
      return Promise.reject(`No running sessions with id: ${id}`);
    }
    return session.shutdown();
  }

  private _isDisposed = false;
  private _running: ISession.IModel[] = [];
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

  /**
   * A signal emitted when the specs change.
   */
  export
  const specsChangedSignal = new Signal<MockSessionManager, IKernel.ISpecModels>();

  /**
   * A signal emitted when the running kernels change.
   */
  export
  const runningChangedSignal = new Signal<MockSessionManager, ISession.IModel[]>();

  /**
   * A module private store for running mock sessions.
   */
  export
  const runningSessions: { [key: string]: MockSession; } = Object.create(null);
}
