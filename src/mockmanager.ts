// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import {
  Kernel
} from './kernel';

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
  specsChanged: ISignal<MockServiceManager, Kernel.ISpecModels>;

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
  get kernelspecs(): Kernel.ISpecModels {
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
  private _kernelspecs: Kernel.ISpecModels = null;
  private _isDisposed = false;
}


// Define the signals for the `MockServiceManager` class.
defineSignal(MockServiceManager.prototype, 'specsChanged');
