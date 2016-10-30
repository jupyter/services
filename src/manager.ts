// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JSONObject
} from 'phosphor/lib/algorithm/json';

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  Contents, ContentsManager
} from './contents';

import {
  Session, SessionManager
} from './session';

import {
  TerminalSession, TerminalManager
} from './terminal';

import {
  IAjaxSettings, getBaseUrl
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
    options.baseUrl = options.baseUrl || getBaseUrl();
    options.ajaxSettings = options.ajaxSettings || {};
    this._sessionManager = new SessionManager(options);
    this._contentsManager = new ContentsManager(options);
    this._terminalManager = new TerminalManager(options);
  }

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
    this._sessionManager.dispose();
    this._contentsManager.dispose();
    this._sessionManager.dispose();
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

  private _sessionManager: SessionManager = null;
  private _contentsManager: ContentsManager = null;
  private _terminalManager: TerminalManager = null;
  private _isDisposed = false;
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
     * The ajax settings for the manager.
     */
    ajaxSettings?: IAjaxSettings;
  }
}
