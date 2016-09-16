// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  JSONObject
} from 'phosphor/lib/algorithm/json';

import {
  IDisposable
} from 'phosphor/lib/core/disposable';

import {
  ISignal
} from 'phosphor/lib/core/signaling';

import {
  IKernel, Kernel, KernelMessage
} from '../kernel';

import {
  IAjaxSettings
} from '../utils';

import {
  DefaultSession
} from './default';


/**
 * Interface of a session object.
 */
export
interface ISession extends IDisposable {
  /**
   * A signal emitted when the session is shut down.
   */
  sessionDied: ISignal<ISession, void>;

  /**
   * A signal emitted when the kernel changes.
   */
  kernelChanged: ISignal<ISession, IKernel>;

  /**
   * A signal emitted when the session status changes.
   */
  statusChanged: ISignal<ISession, Kernel.Status>;

  /**
   * A signal emitted when the session path changes.
   */
  pathChanged: ISignal<ISession, string>;

  /**
   * A signal emitted for iopub kernel messages.
   */
  iopubMessage: ISignal<ISession, KernelMessage.IIOPubMessage>;

  /**
   * A signal emitted for unhandled kernel message.
   */
  unhandledMessage: ISignal<ISession, KernelMessage.IMessage>;

  /**
   * Unique id of the session.
   *
   * #### Notes
   * This is a read-only property.
   */
  id: string;

  /**
   * The path associated with the session.
   *
   * #### Notes
   * This is a read-only property.
   */
  path: string;

  /**
   * The model associated with the session.
   *
   * #### Notes
   * This is a read-only property.
   */
  model: Session.IModel;

  /**
   * The kernel.
   *
   * #### Notes
   * This is a read-only property, and can be altered by [changeKernel].
   * Use the [statusChanged] and [unhandledMessage] signals on the session
   * instead of the ones on the kernel.
   */
  kernel: IKernel;

  /**
   * The current status of the session.
   *
   * #### Notes
   * This is a read-only property, and is a delegate to the kernel status.
   */
  status: Kernel.Status;

  /**
   * Optional default settings for ajax requests, if applicable.
   */
  ajaxSettings?: IAjaxSettings;

  /**
   * Change the session path.
   *
   * @param path - The new session path.
   *
   * #### Notes
   * This uses the Jupyter REST API, and the response is validated.
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  rename(path: string): Promise<void>;

  /**
   * Change the kernel.
   *
   * @params options - The name or id of the new kernel.
   *
   * #### Notes
   * This shuts down the existing kernel and creates a new kernel,
   * keeping the existing session ID and path.
   */
  changeKernel(options: Kernel.IModel): Promise<IKernel>;

  /**
   * Kill the kernel and shutdown the session.
   *
   * #### Notes
   * This uses the Jupyter REST API, and the response is validated.
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  shutdown(): Promise<void>;
}


/**
 * A namespace for session interfaces and factory functions.
 */
export
namespace Session {
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
  function listRunning(options?: Session.IOptions): Promise<Session.IModel[]> {
    return DefaultSession.listRunning(options);
  }

  /**
   * Start a new session.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
   *
   * A path must be provided.  If a kernel id is given, it will
   * connect to an existing kernel.  If no kernel id or name is given,
   * the server will start the default kernel type.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * Wrap the result in an Session object. The promise is fulfilled
   * when the session is created on the server, otherwise the promise is
   * rejected.
   */
  export
  function startNew(options: Session.IOptions): Promise<ISession> {
    return DefaultSession.startNew(options);
  }

  /**
   * Find a session by id.
   *
   * #### Notes
   * If the session was already started via `startNewSession`, the existing
   * Session object's information is used in the fulfillment value.
   *
   * Otherwise, if `options` are given, we attempt to find to the existing
   * session.
   * The promise is fulfilled when the session is found,
   * otherwise the promise is rejected.
   */
  export
  function findById(id: string, options?: Session.IOptions): Promise<Session.IModel> {
    return DefaultSession.findById(id, options);
  }

  /**
   * Find a session by path.
   *
   * #### Notes
   * If the session was already started via `startNewSession`, the existing
   * Session object's info is used in the fulfillment value.
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
  function findByPath(path: string, options?: Session.IOptions): Promise<Session.IModel> {
    return DefaultSession.findByPath(path, options);
  }

  /**
   * Connect to a running session.
   *
   * #### Notes
   * If the session was already started via `startNewSession`, the existing
   * Session object is used as the fulfillment value.
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
  function connectTo(id: string, options?: Session.IOptions): Promise<ISession> {
    return DefaultSession.connectTo(id, options);
  }

  /**
   * Shut down a session by id.
   */
  export
  function shutdown(id: string, options: Session.IOptions = {}): Promise<void> {
    return DefaultSession.shutdown(id, options);
  }

  /**
   * The session initialization options.
   */
  export
  interface IOptions extends JSONObject {
    /**
     * The path (not including name) to the session.
     */
    path?: string;

    /**
     * The type of kernel (e.g. python3).
     */
    kernelName?: string;

    /**
     * The id of an existing kernel.
     */
    kernelId?: string;

    /**
     * The root url of the server.
     */
    baseUrl?: string;

    /**
     * The url to access websockets.
     */
    wsUrl?: string;

    /**
     * The username of the session client.
     */
    username?: string;

    /**
     * The unique identifier for the session client.
     */
    clientId?: string;

    /**
     * The default ajax settings to use for the session.
     */
    ajaxSettings?: IAjaxSettings;
  }

  /**
   * Object which manages session instances.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the kernel specs change.
     */
    specsChanged: ISignal<IManager, Kernel.ISpecModels>;

    /**
     * A signal emitted when the running sessions change.
     */
    runningChanged: ISignal<IManager, IModel[]>;

    /**
     * Get the available kernel specs.
     *
     * #### Notes
     * This will emit a [[specsChange]] signal if the value
     * has changed since the last fetch.
     */
    getSpecs(options?: IOptions): Promise<Kernel.ISpecModels>;

    /*
     * Get the running sessions.
     *
     * #### Notes
     * This will emit a [[runningChanged]] signal if the value
     * has changed since the last fetch.
     */
    listRunning(options?: IOptions): Promise<IModel[]>;

    /**
     * Start a new session.
     */
    startNew(options: IOptions): Promise<ISession>;

    /**
     * Find a session by id.
     */
    findById(id: string, options?: IOptions): Promise<IModel>;

    /**
     * Find a session by path.
     */
    findByPath(path: string, options?: IOptions): Promise<IModel>;

    /**
     * Connect to a running session.
     */
    connectTo(id: string, options?: IOptions): Promise<ISession>;

    /**
     * Shut down a session by id.
     */
    shutdown(id: string, options?: IOptions): Promise<void>;
  }

  /**
   * The session model used by the server.
   *
   * #### Notes
   * See the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions).
   */
  export
  interface IModel extends JSONObject {
    /**
     * The unique identifier for the session client.
     */
    id: string;
    notebook?: {
      [ key: string ]: string;
      path: string;
    };
    kernel?: Kernel.IModel;
  }
}
