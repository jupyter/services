// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils
  from 'jupyter-js-utils';

import {
  Signal, clearSignalData
} from 'phosphor-core/lib/patterns/signaling';

import {
  KernelStatus, IKernel, IKernelSpecIds, IKernelMessage,
  IKernelId
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
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
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
    return success.data;
  }, Private.onSessionError);
}


/**
 * Start a new session.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
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
 * NotebookSession object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to find to the existing
 * session.
 * The promise is fulfilled when the session is found,
 * otherwise the promise is rejected.
 */
export
function findSessionById(id: string, options?: ISessionOptions): Promise<ISessionId> {
  let sessions = Private.runningSessions;
  for (let sessionId in sessions) {
    let session = sessions[sessionId];
    if (sessionId === id) {
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
 * NotebookSession object is used as the fulfillment value.
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
  for (let id in sessions) {
    let session = sessions[id];
    if (session.notebookPath === path) {
      let sessionId = {
        id,
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
  let session = Private.runningSessions[id];
  if (session) {
    return Promise.resolve(session);
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
    this._kernel = kernel;
    let baseUrl = options.baseUrl || utils.getBaseUrl();
    this._url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL, this._id);
    IKernel.statusChanged.connect(this._kernel, this.onKernelStatus, this);
    IKernel.unhandledMessage.connect(
      this._kernel, this.onUnhandledMessage, this
    );
    this._options = utils.copy(options);
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
    return this._kernel.status;
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
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    this._kernel.dispose();
    this._options = null;
    this._kernel = null;
    clearSignalData(this);
    delete Private.runningSessions[this._id];
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
    return this._patch(data).then(id => {
      this._notebookPath = id.notebook.path;
    });
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
    return this._patch(data).then(id => {
      let options = utils.copy(this._options) as ISessionOptions;
      options.ajaxSettings = this.ajaxSettings;
      options.kernelName = id.kernel.name;
      options.notebookPath = id.notebook.path;
      this._notebookPath = id.notebook.path;
      return Private.createKernel(id, options);
    }).then(kernel => {
      this._kernel = kernel;
      IKernel.statusChanged.connect(kernel, this.onKernelStatus, this);
      IKernel.unhandledMessage.connect(kernel, this.onUnhandledMessage, this);
      INotebookSession.kernelChanged.emit(this, kernel);
      return kernel;
    });
  }

  /**
   * Kill the kernel and shutdown the session.
   *
   * @returns - The promise fulfilled on a valid response from the server.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
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
      INotebookSession.sessionDied.emit(this, void 0);
    }, (rejected: utils.IAjaxError) => {
      if (rejected.xhr.status === 410) {
        throw Error('The kernel was deleted but the session was not');
      }
      Private.onSessionError(rejected);
    });
  }

  /**
   * Handle to changes in the Kernel status.
   */
  protected onKernelStatus(state: KernelStatus, sender: IKernel) {
    INotebookSession.statusChanged.emit(this, state);
  }

  /**
   * Handle unhandled kernel messages.
   */
  protected onUnhandledMessage(msg: IKernelMessage, sender: IKernel) {
    INotebookSession.unhandledMessage.emit(this, msg);
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

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      let data = success.data as ISessionId;
      validate.validateSessionId(data);
      return data;
    }, Private.onSessionError);
  }

  private _id = '';
  private _notebookPath = '';
  private _ajaxSettings = '';
  private _kernel: IKernel = null;
  private _url = '';
  private _options: ISessionOptions = null;
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
   * A signal emitted for an unhandled kernel message.
   */
  export
  const unhandledMessageSignal = new Signal<INotebookSession, IKernelMessage>();

  /**
   * The running sessions.
   */
  export
  const runningSessions: { [key: string]: INotebookSession; } = Object.create(null);

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
      return success.data as ISessionId;
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
       let session = new NotebookSession(options, sessionId.id, kernel);
       runningSessions[session.id] = session;
       return session;
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
      return data;
    }, Private.onSessionError);
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
