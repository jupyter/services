// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { ISignal, Signal } from 'phosphor-signaling';

import { IKernel, IKernelId, KernelStatus } from './ikernel';

import { IAjaxOptions } from './utils';


/**
 * Notebook Identification specification.
 */
export
interface INotebookId {
  path: string;
}


/**
 * Session Identification specification.
 */
export
interface ISessionId {
  id: string;
  notebook: INotebookId;
  kernel: IKernelId;
}


/**
 * Session initialization options.
 */
export
interface ISessionOptions {
  notebookPath: string;
  kernelName: string;
  baseUrl: string;
  wsUrl?: string;
  username?: string;
  clientId?: string;
}


/**
 * Interface of a notebook session object.
 */
export
interface INotebookSession {
  /**
   * Get the session died signal.
   */
  sessionDied: ISignal<INotebookSession, void>;

  /**
   * Unique id of the session.
   *
   * Read only.
   */
  id: string;

  /**
   * The path to the notebook.
   *
   * Read only.
   */
  notebookPath: string;

  /**
   * The kernel.
   *
   * Read only.
   */
  kernel: IKernel;

  /**
   * Rename the notebook.
   */
  renameNotebook(path: string, ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Kill the kernel and shutdown the session.
   */
  shutdown(ajaxOptions?: IAjaxOptions): Promise<void>;
}
