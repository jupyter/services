// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  DisposableDelegate
} from 'phosphor-disposable';

import {
  kernel
} from './ikernel';


/**
 * Comm channel handler.
 */
export
class Comm extends DisposableDelegate implements kernel.IComm {

  /**
   * Construct a new comm channel.
   */
  constructor(target: string, id: string, msgFunc: (payload: kernel.ICommPayload, disposeOnDone?: boolean) => kernel.IFuture, disposeCb: () => void) {
    super(disposeCb);
    this._target = target;
    this._id = id;
    this._msgFunc = msgFunc;
  }

  /**
   * The unique id for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commId(): string {
    return this._id;
  }

  /**
   * The target name for the comm channel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get targetName(): string {
    return this._target;
  }

  /**
   * Get the callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[ICommClose]], [[close]]
   */
  get onClose(): (msg: kernel.IMessage) => void {
    return this._onClose;
  }

  /**
   * Set the callback for a comm close event.
   *
   * #### Notes
   * This is called when the comm is closed from either the server or
   * client.
   *
   * **See also:** [[ICommClose]], [[close]]
   */
  set onClose(cb: (msg: kernel.IMessage) => void) {
    this._onClose = cb;
  }

  /**
   * Get the callback for a comm message received event.
   *
   * **See also:** [[ICommMsg]]
   */
  get onMsg(): (msg: kernel.IMessage) => void {
    return this._onMsg;
  }

  /**
   * Set the callback for a comm message received event.
   *
   * **See also:** [[ICommMsg]]
   */
  set onMsg(cb: (msg: kernel.IMessage) => void) {
    this._onMsg = cb;
  }

  /**
   * Test whether the comm has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return (this._msgFunc === null);
  }

  /**
   * Open a comm with optional data and metadata.
   *
   * #### Notes
   * This sends a `comm_open` message to the server.
   *
   * **See also:** [[ICommOpen]]
   */
  open(data?: any, metadata?: any): kernel.IFuture {
    let content: kernel.ICommOpen = {
      comm_id: this._id,
      target_name: this._target,
      data: data || {}
    };
    let payload = {
      msgType: 'comm_open', content, metadata
    };
    if (this._msgFunc === void 0) {
      return;
    }
    return this._msgFunc(payload);
  }

  /**
   * Send a `comm_msg` message to the kernel.
   *
   * #### Notes
   * This is a no-op if the comm has been closed.
   *
   * **See also:** [[ICommMsg]]
   */
  send(data: any, metadata={}, buffers: (ArrayBuffer | ArrayBufferView)[]=[], disposeOnDone: boolean = true): kernel.IFuture {
    if (this.isDisposed) {
      throw Error('Comm is closed');
    }
    let content: kernel.ICommMsg = { comm_id: this._id, data: data };
    let payload = {
      msgType: 'comm_msg',
      content,
      metadata,
      buffers
    };
    if (this._msgFunc === void 0) {
      return;
    }
    return this._msgFunc(payload, disposeOnDone);
  }

  /**
   * Close the comm.
   *
   * #### Notes
   * This will send a `comm_close` message to the kernel, and call the
   * `onClose` callback if set.
   *
   * This is a no-op if the comm is already closed.
   *
   * **See also:** [[ICommClose]], [[onClose]]
   */
  close(data?: any, metadata?: any): kernel.IFuture {
    if (this.isDisposed) {
      return;
    }
    let content: kernel.ICommClose = { comm_id: this._id, data: data || {} };
    let payload = {
      msgType: 'comm_close', content, metadata
    };
    let future = this._msgFunc(payload);
    let onClose = this._onClose;
    if (onClose) onClose(future.msg);
    this.dispose();
    return future;
  }

  /**
   * Dispose of the resources held by the comm.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._onClose = null;
    this._onMsg = null;
    this._msgFunc = null;
    this._id = null;
    super.dispose();
  }

  private _target = '';
  private _id = '';
  private _onClose: (msg: kernel.IMessage) => void = null;
  private _onMsg: (msg: kernel.IMessage) => void = null;
  private _msgFunc: (payload: kernel.ICommPayload, disposeOnDone?: boolean) => kernel.IFuture = null;
}
