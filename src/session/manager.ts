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
    this._options = utils.copy(options || {});
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
   * Create an iterator over the most recent running sessions.
   *
   * @returns A new iterator over the running sessions.
   */
  running(): IIterator<Session.IModel> {
    return iter(this._running);
  }

  /**
   * Get the available kernel specs. See also [[Kernel.getSpecs]].
   *
   * @param options - Overrides for the default options.
   */
  getSpecs(options?: Session.IOptions): Promise<Kernel.ISpecModels> {
    return Kernel.getSpecs(this._getOptions(options)).then(specs => {
      if (!deepEqual(specs, this._specs)) {
        this._specs = specs;
        this.specsChanged.emit(specs);
      }
      return specs;
    });
  }

  /**
   * List the running sessions.  See also [[listRunningSessions]].
   *
   * @param options - Overrides for the default options.
   */
  listRunning(options?: Session.IOptions): Promise<Session.IModel[]> {
    return Session.listRunning(this._getOptions(options)).then(running => {
      if (!deepEqual(running, this._running)) {
        this._running = running.slice();
        this.runningChanged.emit(running);
      }
      clearTimeout(this._updateTimer);
      clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(() => {
        this.listRunning();
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
    if (options) {
      options = utils.extend(utils.copy(this._options), options);
    } else {
      options = this._options;
    }
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
      this.listRunning();
    }, 100);
  }

  private _options: Session.IOptions = null;
  private _isDisposed = false;
  private _running: Session.IModel[] = [];
  private _specs: Kernel.ISpecModels = null;
  private _updateTimer = -1;
  private _refreshTimer = -1;
}

// Define the signals for the `SessionManager` class.
defineSignal(SessionManager.prototype, 'specsChanged');
defineSignal(SessionManager.prototype, 'runningChanged');
