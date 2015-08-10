// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

module jupyter.services {

import ISignal = phosphor.core.ISignal;
import signal = phosphor.core.signal;
import IAjaxSuccess = utils.IAjaxSuccess;
import IAjaxError = utils.IAjaxError;

/**
 * The url for the session service.
 */
var SESSION_SERVICE_URL = 'api/sessions';


/**
 * Get a logger session objects.
 */
var session_log = Logger.get('session');


/**
 * Notebook Identification specification.
 */
export
interface INotebookId {
  path: string;
};


/**
 * Session Identification specification.
 */
export
interface ISessionId {
  id: string;
  notebook: INotebookId;
  kernel: IKernelId;
};


/**
 * Session initialization options.
 */
export
interface ISessionOptions {
  notebookPath: string;
  kernelName: string;
  baseUrl: string;
  wsUrl: string;
};

/**
 * Session object for accessing the session REST api. The session
 * should be used to start kernels and then shut them down -- for
 * all other operations, the kernel object should be used.
 **/
export
class NotebookSession {

  /**
   * A signal emitted when the session changes state.
   */
  @signal
  statusChanged: ISignal<string>;

  /**
   * GET /api/sessions
   *
   * Get a list of the current sessions.
   */
  static list(baseUrl: string): Promise<ISessionId[]> {
    var sessionUrl = utils.urlJoinEncode(baseUrl, SESSION_SERVICE_URL);
    return utils.ajaxRequest(sessionUrl, {
      method: "GET",
      dataType: "json"
    }).then((success: IAjaxSuccess): ISessionId[] => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      if (!Array.isArray(success.data)) {
        throw Error('Invalid Session list');
      }
      for (var i = 0; i < success.data.length; i++) {
        validateSessionId(success.data[i]);
      }
      return success.data;
    });
  }

  /**
   * Construct a new session.
   */
  constructor(options: ISessionOptions) {
    this._id = utils.uuid();
    this._notebookPath = options.notebookPath;
    this._baseUrl = options.baseUrl;
    this._wsUrl = options.wsUrl;
    this._kernel = new Kernel(this._baseUrl, this._wsUrl);
    this._sessionUrl = utils.urlJoinEncode(this._baseUrl, SESSION_SERVICE_URL,
                                           this._id);
  }

  /**
   * Get the session kernel object.
  */
  get kernel() : Kernel {
    return this._kernel;
  }

  /**
   * POST /api/sessions
   *
   * Start a new session. This function can only be successfully executed once.
   */
  start(): Promise<ISessionId> {
    var url = utils.urlJoinEncode(this._baseUrl, SESSION_SERVICE_URL);
    return utils.ajaxRequest(url, {
      method: "POST",
      dataType: "json",
      data: JSON.stringify(this._model),
      contentType: 'application/json'
    }).then((success: IAjaxSuccess) => {
      if (success.xhr.status !== 201) {
        throw Error('Invalid response');
      }
      validateSessionId(success.data);
      this._kernel.connect(success.data.kernel);
      this._handleStatus('kernelCreated');
      return success.data;
    }, (error: IAjaxError) => {
      this._handleStatus('kernelDead');
    });
  }

  /**
   * GET /api/sessions/[:session_id]
   *
   * Get information about a session.
   */
  getInfo(): Promise<ISessionId> {
    return utils.ajaxRequest(this._sessionUrl, {
      method: "GET",
      dataType: "json"
    }).then((success: IAjaxSuccess): ISessionId => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid response');
      }
      validateSessionId(success.data);
      return success.data;
    });
  }

  /**
   * DELETE /api/sessions/[:session_id]
   *
   * Kill the kernel and shutdown the session.
   */
  delete(): Promise<void> {
    if (this._kernel) {
      this._handleStatus('kernelKilled');
      this._kernel.disconnect();
    }
    return utils.ajaxRequest(this._sessionUrl, {
      method: "DELETE",
      dataType: "json"
    }).then((success: IAjaxSuccess) => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid response');
      }
      validateSessionId(success.data);
    }, (rejected: IAjaxError) => {
        if (rejected.xhr.status === 410) {
          throw Error('The kernel was deleted but the session was not');
        }
        throw Error(rejected.statusText);
    });
  }

  /**
   * Restart the session by deleting it and then starting it fresh.
   */
  restart(options?: ISessionOptions): Promise<void> {
    return this.delete().then(() => this.start()).catch(
        () => this.start()).then(() => {
      if (options && options.notebookPath) {
        this._notebookPath = options.notebookPath;
      }
      if (options && options.kernelName) {
        this._kernel.name = options.kernelName;
      }
    })
  }

  /**
   * Rename the notebook.
   */ 
  renameNotebook(path: string): Promise<ISessionId> {
    this._notebookPath = path;
    return utils.ajaxRequest(this._sessionUrl, {
      method: "PATCH",
      dataType: "json",
      data: JSON.stringify(this._model),
      contentType: 'application/json'
    }).then((success: IAjaxSuccess): ISessionId => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid response');
      }
      validateSessionId(success.data);
      return success.data;
    });
  }

  /**
   * Get the data model for the session, which includes the notebook path
   * and kernel (name and id).
   */
  private get _model(): ISessionId {
    return {
      id: this._id,
      notebook: {path: this._notebookPath},
      kernel: {name: this._kernel.name,
               id: this._kernel.id}
    };
  }

  /**
   * Handle a session status change.
   */
  private _handleStatus(status: string) {
    this.statusChanged.emit(status);
    session_log.error('Session: ' + status + ' (' + this._id + ')');
  }

  private _id = "unknown";
  private _notebookPath = "unknown";
  private _baseUrl = "unknown";
  private _sessionUrl = "unknown";
  private _wsUrl = "unknown";
  private _kernel: Kernel = null;
}


/**
 * Validate an object as being of ISessionId type.
 */
function validateSessionId(info: ISessionId): void {
  if (!info.hasOwnProperty('id') || !info.hasOwnProperty('notebook') ||
      !info.hasOwnProperty('kernel')) {
    throw Error('Invalid Session Model');
  }
  validateKernelId(info.kernel);
  if (typeof info.id !== 'string') {
    throw Error('Invalid Session Model');
  }
  validateNotebookId(info.notebook);
}


/**
 * Validate an object as being of INotebookId type.
 */
function validateNotebookId(model: INotebookId): void {
   if ((!model.hasOwnProperty('path')) || (typeof model.path !== 'string')) {
     throw Error('Invalid Notebook Model');
   }
}

} // module jupyter.services
