// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  IContents, ContentsManager
} from './contents';

import {
  IKernel
} from './ikernel';

import {
  ISession
} from './isession';

import {
  JSONObject
} from './json';

import {
  KernelManager, getKernelSpecs
} from './kernel';

import {
  SessionManager
} from './session';

import {
  ITerminalSession, TerminalManager
} from './terminals';

import {
  IAjaxSettings, getBaseUrl
} from './utils';

/**
 * A service manager interface.
 */
export
interface IServiceManager extends IDisposable {
  /**
   * A signal emitted when the specs change on the service manager.
   */
  specsChanged: ISignal<IServiceManager, IKernel.ISpecModels>;

  /**
   * The kernel specs for the manager.
   *
   * #### Notes
   * This is a read-only property.
   */
  kernelspecs: IKernel.ISpecModels;

  /**
   * The kernel manager for the manager.
   *
   * #### Notes
   * This is a read-only property.
   */
  kernels: IKernel.IManager;

  /**
   * The session manager for the manager.
   *
   * #### Notes
   * This is a read-only property.
   */
  sessions: ISession.IManager;

  /**
   * The contents manager for the manager.
   *
   * #### Notes
   * This is a read-only property.
   */
  contents: IContents.IManager;

  /**
   * The terminals manager for the manager.
   *
   * #### Notes
   * This is a read-only property.
   */
  terminals: ITerminalSession.IManager;
}


/**
 * The namespace for `IServiceManager` statics.
 */
export
namespace IServiceManager {
  /**
   * The options used to create a service manager.
   */
  export
  interface IOptions {
    /**
     * The base url of the server.
     */
    baseUrl?: string;

    /**
     * The ajax settings for the manager.
     */
    ajaxSettings?: IAjaxSettings;

    /**
     * The kernelspecs for the manager.
     */
    kernelspecs?: IKernel.ISpecModels;
  }
}

/**
 * Create a new service manager.
 *
 * @param options - The service manager creation options.
 *
 * @returns A promise that resolves with a service manager.
 */
export
function createServiceManager(options: IServiceManager.IOptions = {}): Promise<IServiceManager> {
  options.baseUrl = options.baseUrl || getBaseUrl();
  options.ajaxSettings = options.ajaxSettings || {};
  if (options.kernelspecs) {
    return Promise.resolve(new ServiceManager(options));
  }
  let kernelOptions: IKernel.IOptions = {
    baseUrl: options.baseUrl,
    ajaxSettings: options.ajaxSettings
  };
  return getKernelSpecs(kernelOptions).then(specs => {
    options.kernelspecs = specs;
    return new ServiceManager(options);
  });
}


/**
 * An implementation of a services manager.
 */
export
class ServiceManager implements IServiceManager {
  /**
   * Construct a new services provider.
   */
  constructor(options: IServiceManager.IOptions) {
    let subOptions: JSONObject = {
      baseUrl: options.baseUrl,
      ajaxSettings: options.ajaxSettings
    };
    this._kernelspecs = options.kernelspecs;
    this._kernelManager = new KernelManager(subOptions);
    this._sessionManager = new SessionManager(subOptions);
    this._contentsManager = new ContentsManager(subOptions);
    this._terminalManager = new TerminalManager(subOptions);
    this._kernelManager.specsChanged.connect(this._onSpecsChanged, this);
    this._sessionManager.specsChanged.connect(this._onSpecsChanged, this);
  }

  /**
   * A signal emitted when the specs change on the service manager.
   */
  specsChanged: ISignal<ServiceManager, IKernel.ISpecModels>;

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
  }

  /**
   * Get kernel specs.
   */
  get kernelspecs(): IKernel.ISpecModels {
    return this._kernelspecs;
  }

  /**
   * Get kernel manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get kernels(): KernelManager {
    return this._kernelManager;
  }

  /**
   * Get the session manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get sessions(): SessionManager {
    return this._sessionManager;
  }

  /**
   * Get the contents manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get contents(): ContentsManager {
    return this._contentsManager;
  }

  /**
   * Get the terminal manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get terminals(): TerminalManager {
    return this._terminalManager;
  }

  /**
   * Handle a change in kernel specs.
   */
  private _onSpecsChanged(sender: any, args: IKernel.ISpecModels): void {
    this._kernelspecs = args;
    this.specsChanged.emit(args);
  }

  private _kernelManager: KernelManager = null;
  private _sessionManager: SessionManager = null;
  private _contentsManager: ContentsManager = null;
  private _terminalManager: TerminalManager = null;
  private _kernelspecs: IKernel.ISpecModels = null;
  private _isDisposed = false;
}


// Define the signals for the `ServiceManager` class.
defineSignal(ServiceManager.prototype, 'specsChanged');
