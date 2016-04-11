// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  DisposableDelegate
} from 'phosphor-disposable';

import {
  IKernelMessage, IKernelFuture
} from './ikernel';


/**
 * Implementation of a kernel future.
 */
export
class KernelFutureHandler extends DisposableDelegate implements IKernelFuture {

  /**
   * Construct a new KernelFutureHandler.
   */
  constructor(cb: () => void, msg: IKernelMessage, expectShell: boolean, disposeOnDone: boolean) {
    super(cb);
    this._msg = msg;
    if (!expectShell) {
      this._setFlag(KernelFutureFlag.GotReply);
    }
    this._disposeOnDone = disposeOnDone;
  }

  /**
   * Get the original outgoing message.
   */
  get msg(): IKernelMessage {
    return this._msg;
  }

  /**
   * Check for message done state.
   */
  get isDone(): boolean {
    return this._testFlag(KernelFutureFlag.IsDone);
  }

  /**
   * Get the reply handler.
   */
  get onReply(): (msg: IKernelMessage) => void {
    return this._reply;
  }

  /**
   * Set the reply handler.
   */
  set onReply(cb: (msg: IKernelMessage) => void) {
    this._reply = cb;
  }

  /**
   * Get the iopub handler.
   */
  get onIOPub(): (msg: IKernelMessage) => void {
    return this._iopub;
  }

  /**
   * Set the iopub handler.
   */
  set onIOPub(cb: (msg: IKernelMessage) => void) {
    this._iopub = cb;
  }

  /**
   * Get the done handler.
   */
  get onDone(): (msg: IKernelMessage) => void  {
    return this._done;
  }

  /**
   * Set the done handler.
   */
  set onDone(cb: (msg: IKernelMessage) => void) {
    this._done = cb;
  }

  /**
   * Get the stdin handler.
   */
  get onStdin(): (msg: IKernelMessage) => void {
    return this._stdin;
  }

  /**
   * Set the stdin handler.
   */
  set onStdin(cb: (msg: IKernelMessage) => void) {
    this._stdin = cb;
  }

  /**
   * Dispose and unregister the future.
   */
  dispose(): void {
    this._stdin = null;
    this._iopub = null;
    this._reply = null;
    this._done = null;
    this._msg = null;
    super.dispose();
  }

  /**
   * Handle an incoming kernel message.
   */
  handleMsg(msg: IKernelMessage): void {
    switch (msg.channel) {
    case 'shell':
      this._handleReply(msg);
      break;
    case 'stdin':
      this._handleStdin(msg);
      break;
    case 'iopub':
      this._handleIOPub(msg);
      break;
    }
  }

  private _handleReply(msg: IKernelMessage): void {
    let reply = this._reply;
    if (reply) reply(msg);
    this._setFlag(KernelFutureFlag.GotReply);
    if (this._testFlag(KernelFutureFlag.GotIdle)) {
      this._handleDone(msg);
    }
  }

  private _handleStdin(msg: IKernelMessage): void {
    let stdin = this._stdin;
    if (stdin) stdin(msg);
  }

  private _handleIOPub(msg: IKernelMessage): void {
    let iopub = this._iopub;
    if (iopub) iopub(msg);
    if (msg.header.msg_type === 'status' &&
        msg.content.execution_state === 'idle') {
      this._setFlag(KernelFutureFlag.GotIdle);
      if (this._testFlag(KernelFutureFlag.GotReply)) {
        this._handleDone(msg);
      }
    }
  }

  private _handleDone(msg: IKernelMessage): void {
    if (this.isDone) {
      return;
    }
    this._setFlag(KernelFutureFlag.IsDone);
    let done = this._done;
    if (done) done(msg);
    this._done = null;
    if (this._disposeOnDone) {
      this.dispose();
    }
  }

  /**
   * Test whether the given future flag is set.
   */
  private _testFlag(flag: KernelFutureFlag): boolean {
    return (this._status & flag) !== 0;
  }

  /**
   * Set the given future flag.
   */
  private _setFlag(flag: KernelFutureFlag): void {
    this._status |= flag;
  }

  private _msg: IKernelMessage = null;
  private _status = 0;
  private _stdin: (msg: IKernelMessage) => void = null;
  private _iopub: (msg: IKernelMessage) => void = null;
  private _reply: (msg: IKernelMessage) => void = null;
  private _done: (msg: IKernelMessage) => void = null;
  private _disposeOnDone = true;
}


/**
 * Bit flags for the kernel future state.
 */
enum KernelFutureFlag {
  GotReply = 0x1,
  GotIdle = 0x2,
  IsDone = 0x4,
  DisposeOnDone = 0x8,
}
