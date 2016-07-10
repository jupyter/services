// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IKernel
} from './ikernel';

import {
  IServiceManager
} from './manager';

import {
  MockContentsManager
} from './mockcontents';

import {
  KERNELSPECS, MockKernelManager
} from './mockkernel';

import {
  MockSessionManager
} from './mocksession';

import {
  TerminalManager
} from './terminals';


/**
 * A mock implementation of a services manager.
 */
export
class MockServiceManager implements IServiceManager {
  /**
   * Construct a new services provider.
   */
  constructor() {
    this._kernelspecs = KERNELSPECS;
    this._kernelManager = new MockKernelManager();
    this._sessionManager = new MockSessionManager();
    this._contentsManager = new MockContentsManager();
    this._terminalManager = new TerminalManager();
  }

  /**
   * Get kernel specs.
   */
  get kernelspecs(): IKernel.ISpecModels {
    return this._kernelspecs;
  }

  /**
   * Get kernel manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get kernels(): MockKernelManager {
    return this._kernelManager;
  }

  /**
   * Get the session manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get sessions(): MockSessionManager {
    return this._sessionManager;
  }

  /**
   * Get the contents manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get contents(): MockContentsManager {
    return this._contentsManager;
  }

  /**
   * Get the terminal manager instance.
   *
   * #### Notes
   * This is a read-only property.
   */
  get terminals(): TerminalManager {
    return this._terminalManager;
  }

  private _kernelManager: MockKernelManager = null;
  private _sessionManager: MockSessionManager = null;
  private _contentsManager: MockContentsManager = null;
  private _terminalManager: TerminalManager = null;
  private _kernelspecs: IKernel.ISpecModels = null;
}
