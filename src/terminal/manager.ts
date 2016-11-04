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
  IAjaxSettings
} from '../utils';

import * as utils
  from '../utils';

import {
  TerminalSession
} from './terminal';


/**
 * A terminal session manager.
 */
export
class TerminalManager implements TerminalSession.IManager {
  /**
   * Construct a new terminal manager.
   */
  constructor(options: TerminalManager.IOptions = {}) {
    this._baseUrl = options.baseUrl || utils.getBaseUrl();
    this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
    this._ajaxSettings = JSON.stringify(options.ajaxSettings || {});

    // Initialize internal data.
    this._readyPromise = this._refreshRunning();

    // Set up polling.
    this._refreshTimer = setInterval(() => {
      this._refreshRunning();
    }, 10000);
  }

  /**
   * A signal emitted when the running terminals change.
   */
  runningChanged: ISignal<this, TerminalSession.IModel[]>;

  /**
   * Test whether the terminal manager is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
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
   * Dispose of the resources used by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    clearInterval(this._refreshTimer);
    clearSignalData(this);
    this._running = [];
  }

  /**
   * A promise that fulfills when the manager is ready.
   */
  ready(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * Create an iterator over the most recent running terminals.
   *
   * @returns A new iterator over the running terminals.
   */
  running(): IIterator<TerminalSession.IModel> {
    return iter(this._running);
  }

  /**
   * Create a new terminal session.
   *
   * @param ajaxSettings - The ajaxSettings to use, overrides manager
   *   settings.
   *
   * @returns A promise that resolves with the terminal instance.
   *
   * #### Notes
   * The baseUrl and wsUrl of the options will be forced
   * to the ones used by the manager. The ajaxSettings of the manager
   * will be used unless overridden.
   */
  startNew(options?: TerminalSession.IOptions): Promise<TerminalSession.ISession> {
    return TerminalSession.startNew(this._getOptions(options));
  }

  /*
   * Connect to a running session.
   *
   * @param name - The name of the target session.
   *
   * @param ajaxSettings - The ajaxSettings to use, overrides manager
   *   settings.
   *
   * @returns A promise that resolves with the new session instance.
   *
   * #### Notes
   * The baseUrl and wsUrl of the options will be forced
   * to the ones used by the manager. The ajaxSettings of the manager
   * will be used unless overridden.
   */
  connectTo(name: string, options?: IAjaxSettings): Promise<TerminalSession.ISession> {
    return TerminalSession.connectTo(name, this._getOptions(options));
  }

  /**
   * Shut down a terminal session by name.
   */
  shutdown(name: string): Promise<void> {
    return TerminalSession.shutdown(name, this._getOptions());
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
  refreshRunning(): Promise<void> {
    return this._refreshRunning();
  }

  /**
   * Refresh the running sessions.
   */
  private _refreshRunning(): Promise<void> {
    return TerminalSession.listRunning(this._getOptions({})).then(running => {
      if (!deepEqual(running, this._running)) {
        this._running = running.slice();
        this.runningChanged.emit(running);
      }
    });
  }

  /**
   * Get a set of options to pass.
   */
  private _getOptions(options: TerminalSession.IOptions = {}): TerminalSession.IOptions {
    options.baseUrl = this.baseUrl;
    options.wsUrl = this.wsUrl;
    options.ajaxSettings = options.ajaxSettings || this.ajaxSettings;
    return options;
  }

  private _baseUrl = '';
  private _wsUrl = '';
  private _ajaxSettings = '';
  private _running: TerminalSession.IModel[] = [];
  private _isDisposed = false;
  private _refreshTimer = -1;
  private _readyPromise: Promise<void>;
}



/**
 * The namespace for TerminalManager statics.
 */
export
namespace TerminalManager {
  /**
   * The options used to initialize a terminal manager.
   */
  export
  interface IOptions {
    /**
     * The base url.
     */
    baseUrl?: string;

    /**
     * The base websocket url.
     */
    wsUrl?: string;

    /**
     * The Ajax settings used for server requests.
     */
    ajaxSettings?: utils.IAjaxSettings;
  }
}



// Define the signals for the `TerminalManager` class.
defineSignal(TerminalManager.prototype, 'runningChanged');
