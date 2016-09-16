// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

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
  ISession, Session
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
      return running;
    });
  }

  /**
   * Start a new session.  See also [[startNewSession]].
   *
   * @param options - Overrides for the default options, must include a
   *   `'path'`.
   *
   * #### Notes
   * This will emit [[runningChanged]] if the running kernels list
   * changes.
   */
  startNew(options: Session.IOptions): Promise<ISession> {
    return Session.startNew(this._getOptions(options));
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
  connectTo(id: string, options?: Session.IOptions): Promise<ISession> {
    return Session.connectTo(id, this._getOptions(options));
  }

  /**
   * Shut down a session by id.
   *
   * #### Notes
   * This will emit [[runningChanged]] if the running kernels list
   * changes.
   */
  shutdown(id: string, options?: Session.IOptions): Promise<void> {
    return Session.shutdown(id, this._getOptions(options));
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

  private _options: Session.IOptions = null;
  private _isDisposed = false;
  private _running: Session.IModel[] = [];
  private _specs: Kernel.ISpecModels = null;
}

// Define the signals for the `SessionManager` class.
defineSignal(SessionManager.prototype, 'specsChanged');
defineSignal(SessionManager.prototype, 'runningChanged');
