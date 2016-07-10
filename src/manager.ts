// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IAjaxSettings, getBaseUrl
} from 'jupyter-js-utils';

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
  KernelManager, getKernelSpecs
} from './kernel';

import {
  SessionManager
} from './session';

import {
  ITerminalSession, TerminalManager
} from './terminals';


/**
 * A service manager interface.
 */
export
interface IServiceManager {
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
  return getKernelSpecs(options.baseUrl).then(specs => {
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
    let subOptions = {
      baseUrl: options.baseUrl,
      ajaxSettings: options.ajaxSettings
    };
    this._kernelspecs = options.kernelspecs;
    this._kernelManager = new KernelManager(subOptions);
    this._sessionManager = new SessionManager(subOptions);
    this._contentsManager = new ContentsManager(subOptions);
    this._terminalManager = new TerminalManager(subOptions);
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

  private _kernelManager: KernelManager = null;
  private _sessionManager: SessionManager = null;
  private _contentsManager: ContentsManager = null;
  private _terminalManager: TerminalManager = null;
  private _kernelspecs: IKernel.ISpecModels = null;
}
