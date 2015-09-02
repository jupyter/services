// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { ISignal } from 'phosphor-signaling';

import { IKernel, IKernelId, KernelStatus } from './ikernel';


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
   * A signal emitted when the session dies.
   */
  sessionDied: ISignal<void>;

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
  renameNotebook(path: string): Promise<void>;

  /**
   * Kill the kernel and shutdown the session.
   */
  shutdown(): Promise<void>;
}
