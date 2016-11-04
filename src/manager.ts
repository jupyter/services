// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JSONObject
} from 'phosphor/lib/algorithm/json';

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  Contents, ContentsManager
} from './contents';

import {
  Kernel
} from './kernel';

import {
  Session, SessionManager
} from './session';

import {
  TerminalSession, TerminalManager
} from './terminal';

import {
  IAjaxSettings, getBaseUrl, getWsUrl
} from './utils';


/**
 * A Jupyter services manager.
 */
export
class ServiceManager implements ServiceManager.IManager {
  /**
   * Construct a new services provider.
   */
  constructor(options?: ServiceManager.IOptions) {
    options = options || {};
    options.wsUrl = options.wsUrl || getWsUrl();
    options.baseUrl = options.baseUrl || getBaseUrl();
    options.ajaxSettings = options.ajaxSettings || {};
    this._sessionManager = new SessionManager(options);
    this._contentsManager = new ContentsManager(options);
    this._terminalManager = new TerminalManager(options);
    this._sessionManager.specsChanged.connect((sender, specs) => {
      this.specsChanged.emit(specs);
    });
    this._readyPromise = this._sessionManager.ready().then(() => {
      return this._terminalManager.ready;
    });
  }

  /**
   * A signal emitted when the kernel specs change.
   */
  specsChanged: ISignal<this, Kernel.ISpecModels>;

  /**
   * Test whether the terminal manager is disposed.
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
    this._sessionManager.dispose();
    this._contentsManager.dispose();
    this._sessionManager.dispose();
  }

  /**
   * The kernel spec models.
   */
  get specs(): Kernel.ISpecModels | null {
    return this._sessionManager.specs;
  }

  /**
   * Get the base url of the server.
   */
  get baseUrl(): string {
    return this._sessionManager.baseUrl;
  }

  /**
   * Get the session manager instance.
   */
  get sessions(): SessionManager {
    return this._sessionManager;
  }

  /**
   * Get the contents manager instance.
   */
  get contents(): ContentsManager {
    return this._contentsManager;
  }

  /**
   * Get the terminal manager instance.
   */
  get terminals(): TerminalManager {
    return this._terminalManager;
  }

  /**
   * A promise that fulfills when the manager is ready.
   */
  ready(): Promise<void> {
    return this._readyPromise;
  }

  private _sessionManager: SessionManager = null;
  private _contentsManager: ContentsManager = null;
  private _terminalManager: TerminalManager = null;
  private _isDisposed = false;
  private _readyPromise: Promise<void>;
}


/**
 * The namespace for `ServiceManager` statics.
 */
export
namespace ServiceManager {
  /**
   * A service manager interface.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the kernel specs change.
     */
    specsChanged: ISignal<IManager, Kernel.ISpecModels>;

    /**
     * The kernel spec models.
     */
    readonly specs: Kernel.ISpecModels | null;

    /**
     * The base url of the manager.
     */
    readonly baseUrl: string;

    /**
     * The session manager for the manager.
     */
    readonly sessions: Session.IManager;

    /**
     * The contents manager for the manager.
     */
    readonly contents: Contents.IManager;

    /**
     * The terminals manager for the manager.
     */
    readonly terminals: TerminalSession.IManager;

    /**
     * A promise that fulfills when the manager is initially ready.
     */
    ready(): Promise<void>;
  }

  /**
   * The options used to create a service manager.
   */
  export
  interface IOptions extends JSONObject {
    /**
     * The base url of the server.
     */
    baseUrl?: string;

    /**
     * The base ws url of the server.
     */
    wsUrl?: string;

    /**
     * The ajax settings for the manager.
     */
    ajaxSettings?: IAjaxSettings;
  }
}


// Define the signals for the `ServiceManager` class.
defineSignal(ServiceManager.prototype, 'specsChanged');
