// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IIterator, iter
} from 'phosphor/lib/algorithm/iteration';

import {
  deepEqual
} from 'phosphor/lib/algorithm/json';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  Kernel
} from '../kernel';

import * as utils
  from '../utils';

import {
  IAjaxSettings
} from '../utils';

import {
  Session
} from './session';


/**
 * An implementation of a session manager.
 */
export
class SessionManager implements Session.IManager {
  /**
   * Construct a new session manager.
   *
   * @param options - The default options for each session.
   */
  constructor(options?: Session.IOptions) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    options.ajaxSettings = options.ajaxSettings || {};
    this._ajaxSettings = JSON.stringify(options.ajaxSettings);
    this._scheduleUpdate();
  }

  /**
   * A signal emitted when the kernel specs change.
   */
  specsChanged: ISignal<SessionManager, Kernel.ISpecModels>;

  /**
   * A signal emitted when the running sessions change.
   */
  runningChanged: ISignal<SessionManager, Session.IModel[]>;

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
    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);
    clearSignalData(this);
    this._running = [];
  }

  /**
   * Get the most recent specs from the server.
   */
  get specs(): Kernel.ISpecModels | null {
    return this._specs;
  }

  /**
   * The base url of the manager.
   */
  get baseUrl(): string {
    return this._baseUrl;
  }

  /**
   * The base ws url of the manager.
   */
  get wsUrl(): string {
    return this._wsUrl;
  }

  /**
   * The default ajax settings for the manager.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }

  /**
   * Set the default ajax settings for the manager.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Create an iterator over the most recent running sessions.
   *
   * @returns A new iterator over the running sessions.
   */
  running(): IIterator<Session.IModel> {
    return iter(this._running);
  }

  /**
   * Force an update of the available kernel specs.
   *
   * @returns A promise that resolves with the kernel spec models.
   *
   * #### Notes
   * This is only meant to be called by the user if the kernel specs
   * are known to have changed on disk.
   */
  updateSpecs(): Promise<Kernel.ISpecModels> {
    let options = {
      baseUrl: this._baseUrl,
      ajaxSettings: this.ajaxSettings
    };
    return Kernel.getSpecs(options).then(specs => {
      if (!deepEqual(specs, this._specs)) {
        this._specs = specs;
        this.specsChanged.emit(specs);
      }
      return specs;
    });
  }

  /**
   * Force a refresh of the running sessions.
   *
   * @returns A promise that with the list of running sessions.
   *
   * #### Notes
   * This is not typically meant to be called by the user, since the
   * manager maintains its own internal state.
   */
  refreshRunning(): Promise<Session.IModel[]> {

    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);

    return Session.listRunning(this._getOptions({})).then(running => {
      if (!deepEqual(running, this._running)) {
        this._running = running.slice();
        this.runningChanged.emit(running);
      }
      // Throttle the next request.
      if (this._updateTimer !== -1) {
        this._scheduleUpdate();
      }
      this._refreshTimer = setTimeout(() => {
        this.refreshRunning();
      }, 10000);
      return running;
    });
  }

  /**
   * Start a new session.  See also [[startNewSession]].
   *
   * @param options - Overrides for the default options, must include a
   *   `'path'`.
   */
  startNew(options: Session.IOptions): Promise<Session.ISession> {
    return Session.startNew(this._getOptions(options)).then(session => {
      this._scheduleUpdate();
      session.terminated.connect(() => { this._scheduleUpdate(); });
      return session;
    });
  }

  /**
   * Find a session by id.
   */
  findById(id: string, options?: Session.IOptions): Promise<Session.IModel> {
    return Session.findById(id, this._getOptions(options));
  }

  /**
   * Find a session by path.
   */
  findByPath(path: string, options?: Session.IOptions): Promise<Session.IModel> {
    return Session.findByPath(path, this._getOptions(options));
  }

  /*
   * Connect to a running session.  See also [[connectToSession]].
   */
  connectTo(id: string, options?: Session.IOptions): Promise<Session.ISession> {
    return Session.connectTo(id, this._getOptions(options)).then(session => {
      session.terminated.connect(() => { this._scheduleUpdate(); });
      return session;
    });
  }

  /**
   * Shut down a session by id.
   */
  shutdown(id: string, options?: Session.IOptions): Promise<void> {
    return Session.shutdown(id, this._getOptions(options)).then(() => {
      this._scheduleUpdate();
    });
  }

  /**
   * Get optionally overidden options.
   */
  private _getOptions(options: Session.IOptions): Session.IOptions {
    options.baseUrl = this._baseUrl;
    options.wsUrl = this._wsUrl;
    options.ajaxSettings = options.ajaxSettings || this.ajaxSettings;
    return options;
  }

  /**
   * Schedule an update of the running sessions.
   */
  private _scheduleUpdate(): void {
    if (this._updateTimer !== -1) {
      return;
    }
    this._updateTimer = setTimeout(() => {
      this.refreshRunning();
    }, 100);
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings = '';
  private _isDisposed = false;
  private _running: Session.IModel[] = [];
  private _specs: Kernel.ISpecModels = null;
  private _updateTimer = -1;
  private _refreshTimer = -1;
}

// Define the signals for the `SessionManager` class.
defineSignal(SessionManager.prototype, 'specsChanged');
defineSignal(SessionManager.prototype, 'runningChanged');
