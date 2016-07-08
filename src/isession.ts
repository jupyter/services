// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  ISignal
} from 'phosphor-signaling';

import {
  IKernel, KernelMessage
} from './ikernel';

import {
  JSONObject
} from './json';


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
  statusChanged: ISignal<ISession, IKernel.Status>;

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
  model: ISession.IModel;

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
  status: IKernel.Status;

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
  changeKernel(options: IKernel.IModel): Promise<IKernel>;

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
 * A namespace for session interfaces.
 */
export
namespace ISession {
  /**
   * The session initialization options.
   */
  export
  interface IOptions {
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
  interface IManager {
    /**
     * Get the available kernel specs.
     */
    getSpecs(options?: IOptions): Promise<IKernel.ISpecModels>;

    /*
     * Get the running sessions.
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
    kernel?: IKernel.IModel;
  }
}
