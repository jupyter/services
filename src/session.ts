// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { ISignal, Signal } from 'phosphor-signaling';

import { KernelStatus, IKernel, IKernelOptions } from './ikernel';

import { INotebookSession, ISessionId, ISessionOptions } from './isession';

import { connectToKernel } from './kernel';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the session service.
 */
var SESSION_SERVICE_URL = 'api/sessions';


/**
 * Fetch the running sessions via API: GET /sessions
 */
export
function listRunningSessions(baseUrl: string): Promise<ISessionId[]> {
  var url = utils.urlJoinEncode(baseUrl, SESSION_SERVICE_URL);
  return utils.ajaxRequest(url, {
    method: "GET",
    dataType: "json"
  }).then((success: utils.IAjaxSuccess) => {
    if (success.xhr.status !== 200) {
      throw Error('Invalid Status: ' + success.xhr.status);
    }
    if (!Array.isArray(success.data)) {
      throw Error('Invalid Session list');
    }
    for (var i = 0; i < success.data.length; i++) {
      validate.validateSessionId(success.data[i]);
    }
    return <ISessionId[]>success.data;
  }, onSessionError);
}


/**
 * Start a new session via API: POST /kernels
 *
 * Wrap the result in an NotebookSession object. The promise is fulfilled
 * when the session is fully ready to send the first message. If
 * the session fails to become ready, the promise is rejected.
 */
export
function startNewSession(options: ISessionOptions): Promise<INotebookSession> {
  var url = utils.urlJoinEncode(options.baseUrl, SESSION_SERVICE_URL);
  var model = {
    kernel: { name: options.kernelName },
    notebook: { path: options.notebookPath }
  }
  return utils.ajaxRequest(url, {
    method: "POST",
    dataType: "json",
    data: JSON.stringify(model),
    contentType: 'application/json'
  }).then((success: utils.IAjaxSuccess) => {
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
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * session.  The promise is fulfilled when the session is fully ready to send 
 * the first message. If the session fails to become ready, the promise is 
 * rejected.
 *
 * If the session was not already started and no `options` are given,
 * the promise is rejected.
 */
export
function connectToSession(id: string, options?: ISessionOptions): Promise<INotebookSession> {
  var session = runningSessions.get(id);
  if (session) {
    return Promise.resolve(session);
  }
  if (options === void 0) {
    return Promise.reject(new Error('Please specify session options'));
  }
  return new Promise<NotebookSession>((resolve, reject) => {
    listRunningSessions(options.baseUrl).then((sessionIds) => {
      var sessionIds = sessionIds.filter(k => k.id === id);
      if (!sessionIds.length) {
        reject(new Error('No running session with id: ' + id));
      }
      createSession(sessionIds[0], options).then((session) => {
        resolve(session);
      });
    });
  });
}


/**
 * Create a Promise for a NotebookSession object.
 * 
 * Fulfilled when the NotebookSession is Starting, or rejected if Dead.
 */
function createSession(sessionId: ISessionId, options: ISessionOptions): Promise<NotebookSession> {
  return new Promise<NotebookSession>((resolve, reject) => {
    options.notebookPath = sessionId.notebook.path;
    var kernelOptions: IKernelOptions = {
      name: sessionId.kernel.name,
      baseUrl: options.baseUrl,
      wsUrl: options.wsUrl,
      username: options.username,
      clientId: options.clientId
    }
    var kernelPromise = connectToKernel(sessionId.kernel.id, kernelOptions);
    kernelPromise.then((kernel: IKernel) => {
      var session = new NotebookSession(options, sessionId.id, kernel);
      runningSessions.set(session.id, session);
      resolve(session);
    }).catch(() => {
      reject(new Error('Session failed to start'));
    })
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
   */
  static sessionDiedSignal = new Signal<INotebookSession, void>();

  /**
   * Construct a new session.
   */
  constructor(options: ISessionOptions, id: string, kernel: IKernel) {
    this._id = id;
    this._notebookPath = options.notebookPath;
    this._kernel = kernel;
    this._url = utils.urlJoinEncode(
      options.baseUrl, SESSION_SERVICE_URL, this._id
    );
    this._kernel.statusChanged.connect(this._kernelStatusChanged, this);
  }

  /**
   * Get the session died signal.
   */
  get sessionDied(): ISignal<INotebookSession, void> {
    return NotebookSession.sessionDiedSignal.bind(this);
  }

  /**
   * Get the session id.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the session kernel object.
  */
  get kernel() : IKernel {
    return this._kernel;
  }

  /**
   * Get the notebook path.
   */
  get notebookPath(): string {
    return this._notebookPath;
  }

  /**
   * Rename the notebook.
   */
  renameNotebook(path: string): Promise<void> {
    if (this._isDead) {
      return Promise.reject(new Error('Session is dead'));
    }
    return utils.ajaxRequest(this._url, {
      method: "PATCH",
      dataType: "json",
      data: JSON.stringify({ notebook: { path: path } }),
      contentType: 'application/json'
    }).then((success: utils.IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      var data = <ISessionId>success.data;
      validate.validateSessionId(data);
      this._notebookPath = data.notebook.path;
    }, onSessionError);
  }

  /**
   * DELETE /api/sessions/[:session_id]
   *
   * Kill the kernel and shutdown the session.
   */
  shutdown(): Promise<void> {
    if (this._isDead) {
      return Promise.reject(new Error('Session is dead'));
    }
    this._isDead = true;
    return utils.ajaxRequest(this._url, {
      method: "DELETE",
      dataType: "json"
    }).then((success: utils.IAjaxSuccess) => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this.sessionDied.emit(void 0);
      this.kernel.shutdown();
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

  private _id = "";
  private _notebookPath = "";
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
