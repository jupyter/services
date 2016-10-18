// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IIterator, iter, toArray
} from 'phosphor/lib/algorithm/iteration';

import {
  deepEqual
} from 'phosphor/lib/algorithm/json';

import {
  ISignal, clearSignalData, defineSignal
} from 'phosphor/lib/core/signaling';

import * as utils
  from '../utils';

import {
  IKernel, Kernel
} from './kernel';


/**
 * An implementation of a kernel manager.
 */
export
class KernelManager implements Kernel.IManager {
  /**
   * Construct a new kernel manager.
   *
   * @param options - The default options for kernel.
   */
  constructor(options?: Kernel.IOptions) {
    this._options = utils.copy(options || {});
  }

  /**
   * A signal emitted when the specs change.
   */
  specsChanged: ISignal<this, Kernel.ISpecModels>;

  /**
   * A signal emitted when the running kernels change.
   */
  runningChanged: ISignal<this, IIterator<Kernel.IModel>>;

  /**
   * Test whether the terminal manager is disposed.
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
    this._spec = null;
    this._running = [];
  }

  /**
   * Get the kernel specs.  See also [[getKernelSpecs]].
   *
   * @param options - Overrides for the default options.
   */
  getSpecs(options?: Kernel.IOptions): Promise<Kernel.ISpecModels> {
    return Kernel.getSpecs(this._getOptions(options)).then(specs => {
      if (!deepEqual(specs, this._spec)) {
        this._spec = specs;
        this.specsChanged.emit(specs);
      }
      return specs;
    });
  }

  /**
   * List the running kernels.  See also [[listRunningKernels]].
   *
   * @param options - Overrides for the default options.
   */
  listRunning(options?: Kernel.IOptions): Promise<IIterator<Kernel.IModel>> {
    return Kernel.listRunning(this._getOptions(options)).then(it => {
      let running = toArray(it);
      if (!deepEqual(running, this._running)) {
        this._running = running;
        this.runningChanged.emit(iter(running));
      }
      return running;
    });
  }

  /**
   * Start a new kernel.  See also [[startNewKernel]].
   *
   * @param options - Overrides for the default options.
   *
   * #### Notes
   * This will emit [[runningChanged]] if the running kernels list
   * changes.
   */
  startNew(options?: Kernel.IOptions): Promise<IKernel> {
    return Kernel.startNew(this._getOptions(options));
  }

  /**
   * Find a kernel by id.
   *
   * @param options - Overrides for the default options.
   */
  findById(id: string, options?: Kernel.IOptions): Promise<Kernel.IModel> {
    return Kernel.findById(id, this._getOptions(options));
  }

  /**
   * Connect to a running kernel.  See also [[connectToKernel]].
   *
   * @param options - Overrides for the default options.
   */
  connectTo(id: string, options?: Kernel.IOptions): Promise<IKernel> {
    return Kernel.connectTo(id, this._getOptions(options));
  }

  /**
   * Shut down a kernel by id.
   *
   * @param options - Overrides for the default options.
   *
   * #### Notes
   * This will emit [[runningChanged]] if the running kernels list
   * changes.
   */
  shutdown(id: string, options?: Kernel.IOptions): Promise<void> {
    return Kernel.shutdown(id, this._getOptions(options));
  }

  /**
   * Get optionally overidden options.
   */
  private _getOptions(options: Kernel.IOptions): Kernel.IOptions {
    if (options) {
      options = utils.extend(utils.copy(this._options), options);
    } else {
      options = this._options;
    }
    return options;
  }

  private _options: Kernel.IOptions = null;
  private _running: Kernel.IModel[] = [];
  private _spec: Kernel.ISpecModels = null;
  private _isDisposed = false;
}


// Define the signal for the `KernelManager` class.
defineSignal(KernelManager.prototype, 'specsChanged');
defineSignal(KernelManager.prototype, 'runningChanged');
