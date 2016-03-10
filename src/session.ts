// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils
  from 'jupyter-js-utils';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  KernelStatus, IKernel, IKernelOptions, IKernelSpecIds
} from './ikernel';

import {
  INotebookSession, INotebookSessionManager, ISessionId, ISessionOptions
} from './isession';

import {
  connectToKernel, getKernelSpecs
} from './kernel';

import * as validate
  from './validate';


/**
 * The url for the session service.
 */
const SESSION_SERVICE_URL = 'api/sessions';



/**
 * An implementation of a notebook session manager.
 */
export
class NotebookSessionManager implements INotebookSessionManager {
  /**
   * Construct a new notebook session manager.
   *
   * @param options - The default options for each session.
   */
   constructor(options: ISessionOptions) {
     this._options = utils.copy(options);
   }

  /**
   * Get the available kernel specs. See also [[getKernelSpecs]].
   *
   * @param options - Overrides for the default options.
   */
  getSpecs(options?: ISessionOptions): Promise<IKernelSpecIds> {
    return getKernelSpecs(this._getOptions(options));
  }

  /**
   * List the running sessions.  See also [[listRunningSessions]].
   *
   * @param options - Overrides for the default options.
   */
  listRunning(options?: ISessionOptions): Promise<ISessionId[]> {
    return listRunningSessions(this._getOptions(options));
  }

  /**
   * Start a new session.  See also [[startNewSession]].
   *
   * @param options - Overrides for the default options, must include a
   *   `'notebookPath'`.
   */
  startNew(options: ISessionOptions): Promise<INotebookSession> {
    return startNewSession(this._getOptions(options));
  }

  /**
   * Connect to a running session.  See also [[connectToSession]].
   *
   * @param options - Overrides for the default options.
   */
  connectTo(id: string, options?: ISessionOptions): Promise<INotebookSession> {
    if (options) {
      options = this._getOptions(options);
    } else {
      options = utils.copy(this._options);
    }
    return connectToSession(id, options);
  }

  /**
   * Get optionally overidden options.
   */
  private _getOptions(options: ISessionOptions): ISessionOptions {
    if (options) {
      options = utils.extend(utils.copy(this._options), options);
    } else {
      options = this._options;
    }
    return options;
  }

  private _options: ISessionOptions = null;
}


/**
 * List the running sessions.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
export
function listRunningSessions(options: ISessionOptions): Promise<ISessionId[]> {
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(options.baseUrl, SESSION_SERVICE_URL);
  let ajaxSettings = utils.copy(options.ajaxSettings) || {};
  ajaxSettings.method = 'GET';
  ajaxSettings.dataType = 'json';
  ajaxSettings.cache = false;

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    if (!Array.isArray(success.data)) {
      throw Error('Invalid Session list');
    }
    for (var i = 0; i < success.data.length; i++) {
      validate.validateSessionId(success.data[i]);
    }
    return success.data;
  }, onSessionError);
}


/**
 * Start a new session.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.

 * Wrap the result in an NotebookSession object. The promise is fulfilled
 * when the session is fully ready to send the first message. If
 * the session fails to become ready, the promise is rejected.
 */
export
function startNewSession(options: ISessionOptions): Promise<INotebookSession> {
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
  var model = {
    kernel: { name: options.kernelName },
    notebook: { path: options.notebookPath }
  }
  let ajaxSettings = utils.copy(options.ajaxSettings) || {};
  ajaxSettings.method = 'POST';
  ajaxSettings.dataType = 'json';
  ajaxSettings.data = JSON.stringify(model);
  ajaxSettings.contentType = 'application/json';
  ajaxSettings.cache = false;

  return utils.ajaxRequest(url, ajaxSettings).then(success => {
    if (success.xhr.status !== 201) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    var sessionId = <ISessionId>success.data;
    validate.validateSessionId(success.data);
    return createSession(sessionId, options);
  }, onSessionError);
}


/**
 * Connect to a running notebook session.
 *
 * #### Notes
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * session found by calling `listRunningSessions`.
 * The promise is fulfilled when the session is fully ready to send
 * the first message. If the session fails to become ready, the promise is
 * rejected.
 *
 * If the session was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function connectToSession(id: string, options?: ISessionOptions): Promise<INotebookSession> {
  let session = runningSessions.get(id);
  if (session) {
    return Promise.resolve(session);
  }
  if (options === void 0) {
    return Promise.reject(new Error('Please specify session options'));
  }
  return listRunningSessions(options).then(sessionIds => {
    sessionIds = sessionIds.filter(k => k.id === id);
    if (!sessionIds.length) {
      return typedThrow('No running session with id: ' + id);
    }
    return createSession(sessionIds[0], options);
  });
}


/**
 * Create a Promise for a NotebookSession object.
 *
 * Fulfilled when the NotebookSession is Starting, or rejected if Dead.
 */
function createSession(sessionId: ISessionId, options: ISessionOptions): Promise<NotebookSession> {

  let baseUrl = options.baseUrl || utils.getBaseUrl();
  options.notebookPath = sessionId.notebook.path;

  let kernelOptions = {
    name: sessionId.kernel.name,
    baseUrl: options.baseUrl,
    wsUrl: options.wsUrl,
    username: options.username,
    clientId: options.clientId,
    ajaxSettings: options.ajaxSettings
  }
  return connectToKernel(sessionId.kernel.id, kernelOptions
  ).then(kernel => {
     let session = new NotebookSession(options, sessionId.id, kernel);
     runningSessions.set(session.id, session);
     return session;
  }).catch(error => {
    return typedThrow('Session failed to start: ' + error.message);
  });
}


/**
 * A module private store for running sessions.
 */
var runningSessions = new Map<string, NotebookSession>();


/**
 * Session object for accessing the session REST api. The session
 * should be used to start kernels and then shut them down -- for
 * all other operations, the kernel object should be used.
 **/
class NotebookSession implements INotebookSession {

  /**
   * A signal emitted when the session dies.
   *
   * **See also:** [[sessionDied]]
   */
  static sessionDiedSignal = new Signal<INotebookSession, void>();

  /**
   * Construct a new session.
   */
  constructor(options: ISessionOptions, id: string, kernel: IKernel) {
    this.ajaxSettings = options.ajaxSettings || { };
    this._id = id;
    this._notebookPath = options.notebookPath;
    this._kernel = kernel;
    this._url = utils.urlPathJoin(options.baseUrl, SESSION_SERVICE_URL, this._id);
    this._kernel.statusChanged.connect(this._kernelStatusChanged, this);
  }

  /**
   * A signal emitted when the session dies.
   */
  get sessionDied(): ISignal<INotebookSession, void> {
    return NotebookSession.sessionDiedSignal.bind(this);
  }

  /**
   * Get the session id.
   *
   * #### Notes
   * This is a read-only property.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the session kernel object.
   *
   * #### Notes
   * This is a read-only property.
   */
  get kernel() : IKernel {
    return this._kernel;
  }

  /**
   * The current status of the session, and is a delegate to the kernel status.
   *
   * #### Notes
   * This is a read-only property.
   */
  get status(): KernelStatus {
    return this._kernel.status;
  }

  /**
   * Get the notebook path.
   *
   * #### Notes
   * This is a read-only property.
   */
  get notebookPath(): string {
    return this._notebookPath;
  }

  /**
   * Get a copy of the default ajax settings for the session.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the session.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Test whether the session has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return (this._kernel === null);
  }

  /**
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    this._kernel = null;
    this._isDead = true;
    clearSignalData(this);
    runningSessions.delete(this._id);
  }

  /**
   * Rename or move a notebook.
   *
   * @param path - The new notebook path.
   *
   * #### Notes
   * This uses the Notebook REST API, and the response is validated.
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  renameNotebook(path: string): Promise<void> {
    if (this._isDead) {
      return Promise.reject(new Error('Session is dead'));
    }
    let model = {
      kernel: { name: this._kernel.name, id: this._kernel.id },
      notebook: { path: path }
    }
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PATCH';
    ajaxSettings.dataType = 'json';
    ajaxSettings.data = JSON.stringify(model);
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      var data = <ISessionId>success.data;
      validate.validateSessionId(data);
      this._notebookPath = data.notebook.path;
    }, onSessionError);
  }

  /**
   * Kill the kernel and shutdown the session.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  shutdown(): Promise<void> {
    if (this._isDead) {
      return Promise.reject(new Error('Session is dead'));
    }
    this._isDead = true;
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this.sessionDied.emit(void 0);
      this.kernel.dispose();
    }, (rejected: utils.IAjaxError) => {
      this._isDead = false;
      if (rejected.xhr.status === 410) {
        throw Error('The kernel was deleted but the session was not');
      }
      onSessionError(rejected);
    });
  }

  /**
   * React to changes in the Kernel status.
   */
  private _kernelStatusChanged(sender: IKernel, state: KernelStatus) {
    if (state == KernelStatus.Dead) {
      this.shutdown();
    }
  }

  private _id = '';
  private _notebookPath = '';
  private _ajaxSettings = '';
  private _kernel: IKernel = null;
  private _url = '';
  private _isDead = false;
}


/**
 * Handle an error on a session Ajax call.
 */
function onSessionError(error: utils.IAjaxError): any {
  console.error("API request failed (" + error.statusText + "): ");
  throw Error(error.statusText);
}


/**
 * Throw a typed error.
 */
function typedThrow<T>(msg: string): T {
  throw new Error(msg);
}
