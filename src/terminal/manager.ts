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
    options.ajaxSettings = options.ajaxSettings || {};
    this._ajaxSettings = JSON.stringify(options.ajaxSettings);
    this._scheduleUpdate();
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
    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);
    clearSignalData(this);
    this._running = [];
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
    options = this._getOptions(options);
    return TerminalSession.connectTo(name, options).then(session => {
      this._scheduleUpdate();
      session.terminated.connect(() => {
        this._scheduleUpdate();
      });
      return session;
    });
  }

  /**
   * Shut down a terminal session by name.
   */
  shutdown(name: string): Promise<void> {
    return TerminalSession.shutdown(name, this._getOptions()).then(() => {
      this._scheduleUpdate();
    });
  }

  /**
   * Force a refresh of the running terminals.
   */
  refreshRunning(): Promise<TerminalSession.IModel[]> {
    clearTimeout(this._updateTimer);
    clearTimeout(this._refreshTimer);
    return TerminalSession.listRunning(this._getOptions()).then(data => {
      if (!deepEqual(data, this._running)) {
        this._running = data;
        this.runningChanged.emit(data);
      }
      // Throttle the next request.
      if (this._updateTimer !== -1) {
        this._scheduleUpdate();
      }
      this._refreshTimer = setTimeout(() => {
        this.refreshRunning();
      }, 10000);
      return data;
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
  private _running: TerminalSession.IModel[] = [];
  private _isDisposed = false;
  private _updateTimer = -1;
  private _refreshTimer = -1;
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
