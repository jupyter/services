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
  KernelStatus, IKernel, IKernelSpecIds, IKernelMessage,
  IKernelId, IKernelOptions
} from './ikernel';

import {
  INotebookSession, INotebookSessionManager, ISessionId, ISessionOptions
} from './isession';

import {
  connectToKernel, getKernelSpecs, startNewKernel
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
  constructor(options?: ISessionOptions) {
    this._options = utils.copy(options || {});
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
   * Find a session by id.
   */
  findById(id: string, options?: ISessionOptions): Promise<ISessionId> {
    return findSessionById(id, this._getOptions(options));
  }

  /**
   * Find a session by notebook path.
   */
  findByPath(path: string, options?: ISessionOptions): Promise<ISessionId> {
    return findSessionByPath(path, this._getOptions(options));
  }

  /*
   * Connect to a running session.  See also [[connectToSession]].
   */
  connectTo(id: string, options?: ISessionOptions): Promise<INotebookSession> {
    return connectToSession(id, this._getOptions(options));
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
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
 *
 * All client-side sessions are updated with current information.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
export
function listRunningSessions(options?: ISessionOptions): Promise<ISessionId[]> {
  options = options || {};
  let baseUrl = options.baseUrl || utils.getBaseUrl();
  let url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
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
    for (let i = 0; i < success.data.length; i++) {
      validate.validateSessionId(success.data[i]);
    }
    return Private.updateRunningSessions(success.data);
  }, Private.onSessionError);
}


/**
 * Start a new session.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
 *
 * A notebook path must be provided.  If a kernel id is given, it will
 * connect to an existing kernel.  If no kernel id or name is given,
 * the server will start the default kernel type.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.

 * Wrap the result in an NotebookSession object. The promise is fulfilled
 * when the session is created on the server, otherwise the promise is
 * rejected.
 */
export
function startNewSession(options: ISessionOptions): Promise<INotebookSession> {
  if (options.notebookPath === void 0) {
    return Promise.reject(new Error('Must specify a notebook path'));
  }
  return Private.startSession(options).then(sessionId => {
    return Private.createSession(sessionId, options);
  });
}


/**
 * Find a session by id.
 *
 * #### Notes
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object's information is used in the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to find to the existing
 * session.
 * The promise is fulfilled when the session is found,
 * otherwise the promise is rejected.
 */
export
function findSessionById(id: string, options?: ISessionOptions): Promise<ISessionId> {
  let sessions = Private.runningSessions;
  for (let clientId in sessions) {
    let session = sessions[clientId];
    if (session.id === id) {
      let sessionId = {
        id,
        notebook: { path: session.notebookPath },
        kernel: { name: session.kernel.name, id: session.kernel.id }
      };
      return Promise.resolve(sessionId);
    }
  }
  return Private.getSessionId(id, options).catch(() => {
    let msg = `No running session for id: ${id}`;
    return Private.typedThrow<ISessionId>(msg);
  });
}


/**
 * Find a session by notebook path.
 *
 * #### Notes
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object's info is used in the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to find to the existing
 * session using [listRunningSessions].
 * The promise is fulfilled when the session is found,
 * otherwise the promise is rejected.
 *
 * If the session was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function findSessionByPath(path: string, options?: ISessionOptions): Promise<ISessionId> {
  let sessions = Private.runningSessions;
  for (let clientId in sessions) {
    let session = sessions[clientId];
    if (session.notebookPath === path) {
      let sessionId = {
        id: session.id,
        notebook: { path: session.notebookPath },
        kernel: { name: session.kernel.name, id: session.kernel.id }
      };
      return Promise.resolve(sessionId);
    }
  }
  return listRunningSessions(options).then(sessionIds => {
    for (let sessionId of sessionIds) {
      if (sessionId.notebook.path === path) {
        return sessionId;
      }
    }
    let msg = `No running session for path: ${path}`;
    return Private.typedThrow<ISessionId>(msg);
  });
}


/**
 * Connect to a running notebook session.
 *
 * #### Notes
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * session.
 * The promise is fulfilled when the session is ready on the server,
 * otherwise the promise is rejected.
 *
 * If the session was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function connectToSession(id: string, options?: ISessionOptions): Promise<INotebookSession> {
  for (let clientId in Private.runningSessions) {
    let session = Private.runningSessions[clientId];
    if (session.id === id) {
      return session.clone();
    }
  }
  return Private.getSessionId(id, options).then(sessionId => {
    return Private.createSession(sessionId, options);
  }).catch(() => {
    let msg = `No running session with id: ${id}`;
    return Private.typedThrow<INotebookSession>(msg);
  });
}


/**
 * Session object for accessing the session REST api. The session
 * should be used to start kernels and then shut them down -- for
 * all other operations, the kernel object should be used.
 **/
class NotebookSession implements INotebookSession {
  /**
   * Construct a new session.
   */
  constructor(options: ISessionOptions, id: string, kernel: IKernel) {
    this.ajaxSettings = options.ajaxSettings || { };
    this._id = id;
    this._notebookPath = options.notebookPath;
    options.baseUrl = options.baseUrl || utils.getBaseUrl();
    this._url = utils.urlPathJoin(options.baseUrl, SESSION_SERVICE_URL, this._id);
    this._uuid = utils.uuid();
    Private.runningSessions[this._uuid] = this;
    this.setupKernel(kernel);
    this._options = utils.copy(options);
  }

  /**
   * A signal emitted when the session dies.
   */
  get sessionDied(): ISignal<INotebookSession, void> {
    return Private.sessionDiedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel changes.
   */
  get kernelChanged(): ISignal<INotebookSession, IKernel> {
    return Private.kernelChangedSignal.bind(this);
  }

  /**
   * A signal emitted when the kernel status changes.
   */
  get statusChanged(): ISignal<INotebookSession, KernelStatus> {
    return Private.statusChangedSignal.bind(this);
  }

  /**
   * A signal emitted for a kernel messages.
   */
  get iopubMessage(): ISignal<INotebookSession, IKernelMessage> {
    return Private.iopubMessageSignal.bind(this);
  }

  /**
   * A signal emitted for an unhandled kernel message.
   */
  get unhandledMessage(): ISignal<INotebookSession, IKernelMessage> {
    return Private.unhandledMessageSignal.bind(this);
  }

  /**
   * A signal emitted when the notebook path changes.
   */
  get notebookPathChanged(): ISignal<INotebookSession, string> {
    return Private.notebookPathChangedSignal.bind(this);
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
   * This is a read-only property, and can be altered by [changeKernel].
   * Use the [statusChanged] and [unhandledMessage] signals on the session
   * instead of the ones on the kernel.
   */
  get kernel() : IKernel {
    return this._kernel;
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
   * The current status of the session.
   *
   * #### Notes
   * This is a read-only property, and is a delegate to the kernel status.
   */
  get status(): KernelStatus {
    return this._kernel ? this._kernel.status : KernelStatus.Dead;
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
    return this._options === null;
  }

  /**
   * Clone the current session with a new clientId.
   */
  clone(): Promise<INotebookSession> {
    let options = this._getKernelOptions();
    return connectToKernel(this.kernel.id, options).then(kernel => {
      let options = utils.copy(this._options);
      options.ajaxSettings = this.ajaxSettings;
      return new NotebookSession(options, this._id, kernel);
    });
  }

  /**
   * Update the session based on a session model from the server.
   */
  update(id: ISessionId): Promise<void> {
    // Avoid a race condition if we are waiting for a REST call return.
    if (this._updating) {
      return Promise.resolve(void 0);
    }
    if (this._notebookPath !== id.notebook.path) {
      this.notebookPathChanged.emit(id.notebook.path);
    }
    this._notebookPath = id.notebook.path;
    if (id.kernel.id !== this._kernel.id) {
      let options = this._getKernelOptions();
      options.name = id.kernel.name;
      return connectToKernel(id.kernel.id, options).then(kernel => {
        this.setupKernel(kernel);
        this.kernelChanged.emit(kernel);
      });
    }
    return Promise.resolve(void 0);
  }

  /**
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    if (this._kernel) {
      this._kernel.dispose();
    }
    this._options = null;
    delete Private.runningSessions[this._uuid];
    this._kernel = null;
    clearSignalData(this);
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
    if (this.isDisposed) {
      return Promise.reject(new Error('Session is disposed'));
    }
    let data = JSON.stringify({
      notebook: { path }
    });
    return this._patch(data).then(() => { return void 0; });
  }

  /**
   * Change the kernel.
   *
   * @params options - The name or id of the new kernel.
   *
   * #### Notes
   * This shuts down the existing kernel and creates a new kernel,
   * keeping the existing session ID and notebook path.
   */
  changeKernel(options: IKernelId): Promise<IKernel> {
    if (this.isDisposed) {
      return Promise.reject(new Error('Session is disposed'));
    }
    this._kernel.dispose();
    let data = JSON.stringify({ kernel: options });
    return this._patch(data).then(() => {
      return this.kernel;
    });
  }

  /**
   * Kill the kernel and shutdown the session.
   *
   * @returns - The promise fulfilled on a valid response from the server.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
   * Emits a [sessionDied] signal on success.
   */
  shutdown(): Promise<void> {
    if (this.isDisposed) {
      return Promise.reject(new Error('Session is disposed'));
    }
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this._kernel.dispose();
      this._kernel = null;
      this.sessionDied.emit(void 0);
    }, (rejected: utils.IAjaxError) => {
      if (rejected.xhr.status === 410) {
        throw Error('The kernel was deleted but the session was not');
      }
      Private.onSessionError(rejected);
    });
  }

  /**
   * Handle connections to a kernel.
   */
  protected setupKernel(kernel: IKernel): void {
    this._kernel = kernel;
    kernel.statusChanged.connect(this.onKernelStatus, this);
    kernel.unhandledMessage.connect(this.onUnhandledMessage, this);
    kernel.iopubMessage.connect(this.onIopubMessage, this);
  }

  /**
   * Handle to changes in the Kernel status.
   */
  protected onKernelStatus(sender: IKernel, state: KernelStatus) {
    this.statusChanged.emit(state);
  }

  /**
   * Handle iopub kernel messages.
   */
  protected onIopubMessage(sender: IKernel, msg: IKernelMessage) {
    this.iopubMessage.emit(msg);
  }

  /**
   * Handle unhandled kernel messages.
   */
  protected onUnhandledMessage(sender: IKernel, msg: IKernelMessage) {
    this.unhandledMessage.emit(msg);
  }

  /**
   * Get the options used to create a new kernel.
   */
  private _getKernelOptions(): IKernelOptions {
    return {
      baseUrl: this._options.baseUrl,
      wsUrl: this._options.wsUrl,
      username: this.kernel.username,
      ajaxSettings: this.ajaxSettings
    }
  }

  /**
   * Send a PATCH to the server, updating the notebook path or the kernel.
   */
  private _patch(data: string): Promise<ISessionId> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PATCH';
    ajaxSettings.dataType = 'json';
    ajaxSettings.data = data;
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.cache = false;
    this._updating = true;

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      let data = success.data as ISessionId;
      validate.validateSessionId(data);
      this._updating = false;
      return Private.updateById(data);
    }, error => {
      this._updating = false;
      return Private.onSessionError(error);
    });
  }

  private _id = '';
  private _notebookPath = '';
  private _ajaxSettings = '';
  private _kernel: IKernel = null;
  private _uuid = '';
  private _url = '';
  private _options: ISessionOptions = null;
  private _updating = false;
}


/**
 * A namespace for notebook session private data.
 */
namespace Private {
  /**
   * A signal emitted when the session is shut down.
   */
  export
  const sessionDiedSignal = new Signal<INotebookSession, void>();

  /**
   * A signal emitted when the kernel changes.
   */
  export
  const kernelChangedSignal = new Signal<INotebookSession, IKernel>();

  /**
   * A signal emitted when the session kernel status changes.
   */
  export
  const statusChangedSignal = new Signal<INotebookSession, KernelStatus>();

  /**
   * A signal emitted for iopub kernel messages.
   */
  export
  const iopubMessageSignal = new Signal<INotebookSession, IKernelMessage>();

  /**
   * A signal emitted for an unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<INotebookSession, IKernelMessage>();

  /**
   * A signal emitted when the notebook path changes.
   */
  export
  const notebookPathChangedSignal = new Signal<INotebookSession, string>();

  /**
   * The running sessions.
   */
  export
  const runningSessions: { [key: string]: NotebookSession; } = Object.create(null);

  /**
   * Create a new session, or return an existing session if a session if
   * the notebook path already exists
   */
  export
  function startSession(options: ISessionOptions): Promise<ISessionId> {
    let baseUrl = options.baseUrl || utils.getBaseUrl();
    let url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
    let model = {
      kernel: { name: options.kernelName, id: options.kernelId },
      notebook: { path: options.notebookPath }
    };
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
      validate.validateSessionId(success.data);
      let data = success.data as ISessionId;
      return updateById(data);
    }, onSessionError);
  }

  /**
   * Create a Promise for a kernel object given a sessionId and options.
   */
  export
  function createKernel(sessionId: ISessionId, options: ISessionOptions): Promise<IKernel> {
    let kernelOptions = {
      name: sessionId.kernel.name,
      baseUrl: options.baseUrl || utils.getBaseUrl(),
      wsUrl: options.wsUrl,
      username: options.username,
      clientId: options.clientId,
      ajaxSettings: options.ajaxSettings
    };
    return connectToKernel(sessionId.kernel.id, kernelOptions);
  }

  /**
   * Create a NotebookSession object.
   *
   * @returns - A promise that resolves with a started session.
   */
  export
  function createSession(sessionId: ISessionId, options: ISessionOptions): Promise<NotebookSession> {
    return createKernel(sessionId, options).then(kernel => {
       return new NotebookSession(options, sessionId.id, kernel);
    }).catch(error => {
      return typedThrow('Session failed to start: ' + error.message);
    });
  }

  /**
   * Get a full session id model from the server by session id string.
   */
  export
  function getSessionId(id: string, options?: ISessionOptions): Promise<ISessionId> {
    options = options || {};
    let baseUrl = options.baseUrl || utils.getBaseUrl();
    let url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL, id);
    let ajaxSettings = options.ajaxSettings || {};
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      let data = success.data as ISessionId;
      validate.validateSessionId(data);
      return updateById(data);
    }, Private.onSessionError);
  }

  /**
   * Update the running sessions based on new data from the server.
   */
  export
  function updateRunningSessions(sessions: ISessionId[]): Promise<ISessionId[]> {
    let promises: Promise<void>[] = [];
    for (let uuid in runningSessions) {
      let session = runningSessions[uuid];
      let updated = false;
      for (let sId of sessions) {
        if (sId.id === session.id) {
          promises.push(session.update(sId));
          updated = true;
          break;
        }
      }
      // If session is no longer running on disk, emit dead signal.
      if (!updated && session.status !== KernelStatus.Dead) {
        session.sessionDied.emit(void 0);
      }
    }
    return Promise.all(promises).then(() => { return sessions; });
  }

  /**
   * Update the running sessions given an updated session Id.
   */
  export
  function updateById(sessionId: ISessionId): Promise<ISessionId> {
    let promises: Promise<void>[] = [];
    for (let uuid in runningSessions) {
      let session = runningSessions[uuid];
      if (session.id === sessionId.id) {
        promises.push(session.update(sessionId));
      }
    }
    return Promise.all(promises).then(() => { return sessionId; });
  }

  /**
   * Handle an error on a session Ajax call.
   */
  export
  function onSessionError(error: utils.IAjaxError): any {
    let text = (error.statusText ||
                error.error.message ||
                error.xhr.responseText);
    console.error(`API request failed (${error.xhr.status}):  ${text}`);
    throw Error(text);
  }

  /**
   * Throw a typed error.
   */
  export
  function typedThrow<T>(msg: string): T {
    throw new Error(msg);
  }
}
