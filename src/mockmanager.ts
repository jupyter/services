// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

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
  MockTerminalManager
} from './mockterminals';


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
    this._terminalManager = new MockTerminalManager();
  }

  /**
   * A signal emitted when the specs change on the service manager.
   */
  get specsChanged(): ISignal<MockServiceManager, IKernel.ISpecModels> {
    return Private.specsChangedSignal.bind(this);
  }

  /**
   * Test whether the terminal manager is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources used by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    clearSignalData(this);
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
  get terminals(): MockTerminalManager {
    return this._terminalManager;
  }

  private _kernelManager: MockKernelManager = null;
  private _sessionManager: MockSessionManager = null;
  private _contentsManager: MockContentsManager = null;
  private _terminalManager: MockTerminalManager = null;
  private _kernelspecs: IKernel.ISpecModels = null;
  private _cwd = '';
  private _isDisposed = false;
}


/**
 * A namespace for private data.
 */
namespace Private {

  /**
   * A signal emitted when the specs change.
   */
  export
  const specsChangedSignal = new Signal<MockServiceManager, IKernel.ISpecModels>();

  /**
   * A signal emitted when the cwd of the manager changes.
   */
  export
  const cwdChangedSignal = new Signal<MockServiceManager, string>();
}
