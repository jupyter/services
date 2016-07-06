// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  DisposableDelegate, IDisposable
} from 'phosphor-disposable';

import {
  IKernel, KernelMessage, IHookList
} from './ikernel';


/**
 * Implementation of a kernel future.
 */
export
class KernelFutureHandler extends DisposableDelegate implements IKernel.IFuture {
  /**
   * Construct a new KernelFutureHandler.
   */
  constructor(cb: () => void, msg: KernelMessage.IShellMessage, expectShell: boolean, disposeOnDone: boolean) {
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
  get msg(): KernelMessage.IShellMessage {
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
  get onReply(): (msg: KernelMessage.IShellMessage) => void {
    return this._reply;
  }

  /**
   * Set the reply handler.
   */
  set onReply(cb: (msg: KernelMessage.IShellMessage) => void) {
    this._reply = cb;
  }

  /**
   * Get the iopub handler.
   */
  get onIOPub(): (msg: KernelMessage.IIOPubMessage) => void {
    return this._iopub;
  }

  /**
   * Set the iopub handler.
   */
  set onIOPub(cb: (msg: KernelMessage.IIOPubMessage) => void) {
    this._iopub = cb;
  }

  /**
   * Get the done handler.
   */
  get onDone(): () => void  {
    return this._done;
  }

  /**
   * Set the done handler.
   */
  set onDone(cb: () => void) {
    this._done = cb;
  }

  /**
   * Get the stdin handler.
   */
  get onStdin(): (msg: KernelMessage.IStdinMessage) => void {
    return this._stdin;
  }

  /**
   * Set the stdin handler.
   */
  set onStdin(cb: (msg: KernelMessage.IStdinMessage) => void) {
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
    this._hooks = null;
    super.dispose();
  }

  /**
   * Handle an incoming kernel message.
   */
  handleMsg(msg: KernelMessage.IMessage): void {
    switch (msg.channel) {
    case 'shell':
      this._handleReply(msg as KernelMessage.IShellMessage);
      break;
    case 'stdin':
      this._handleStdin(msg as KernelMessage.IStdinMessage);
      break;
    case 'iopub':
      this._handleIOPub(msg as KernelMessage.IIOPubMessage);
      break;
    }
  }

  private _handleReply(msg: KernelMessage.IShellMessage): void {
    let reply = this._reply;
    if (reply) { reply(msg); }
    this._setFlag(KernelFutureFlag.GotReply);
    if (this._testFlag(KernelFutureFlag.GotIdle)) {
      this._handleDone();
    }
  }

  private _handleStdin(msg: KernelMessage.IStdinMessage): void {
    let process = this._hooks.process(msg);
    let stdin = this._stdin;
    if (process && stdin) { stdin(msg); }
  }

  private _handleIOPub(msg: KernelMessage.IIOPubMessage): void {
    let process = this._hooks.process(msg);
    let iopub = this._iopub;
    if (process && iopub) { iopub(msg); }
    if (KernelMessage.isStatusMsg(msg) &&
        msg.content.execution_state === 'idle') {
      this._setFlag(KernelFutureFlag.GotIdle);
      if (this._testFlag(KernelFutureFlag.GotReply)) {
        this._handleDone();
      }
    }
  }

  private _handleDone(): void {
    if (this.isDone) {
      return;
    }
    this._setFlag(KernelFutureFlag.IsDone);
    let done = this._done;
    if (done) done();
    this._done = null;
    if (this._disposeOnDone) {
      this.dispose();
    }
  }
  get hooks(): HookList<KernelMessage.IIOPubMessage> {
    return this._hooks;
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

  private _msg: KernelMessage.IShellMessage = null;
  private _status = 0;
  private _stdin: (msg: KernelMessage.IStdinMessage) => void = null;
  private _iopub: (msg: KernelMessage.IIOPubMessage) => void = null;
  private _reply: (msg: KernelMessage.IShellMessage) => void = null;
  private _done: () => void = null;
  private _hooks: HookList<KernelMessage.IIOPubMessage> = null;
  private _disposeOnDone = true;
}

export
class HookList<T> implements IHookList<T> {
  /**
   * Register a hook
   */
  add(hook: (msg: T) => boolean): void {
    this.remove(hook);
    this._hooks.push(hook);
  }

  remove(hook: (msg: T) => boolean): void {
    let index = this._hooks.indexOf(hook);
    if (index >= 0) {
      this._hooks[index] = null;
      this._scheduleCompact();
    }
  }

  /**
   * process hooks. Returns true if the processing should continue, false if the processing should stop.
   */
  process(msg: T): boolean {
    let continueHandling: boolean;
    // most recently-added hook is called first
    for (let i = this._hooks.length-1; i>=0; i--) {
      let hook = this._hooks[i];
      if (hook === null) { continue; }
      try {
        continueHandling = hook(msg);
      } catch(err) {
        // Should we stop processing when there is an error?
        continueHandling = true;
        console.error(err);
      }
      if (!continueHandling) {
        return continueHandling;
      }
    }
    return continueHandling;
  }

  /**
   * Test whether the HookList has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return (this._hooks === null);
  }

  /**
   * Dispose and unregister the future.
   */
  dispose(): void {
    this._hooks = null;
  }

  private _scheduleCompact(): void {
    if (!this._cleanupScheduled) {
      this._cleanupScheduled = true;
      requestAnimationFrame(() => {
        this._cleanupScheduled = false;
        this._compact();
      })
    }
  }

  private _compact(): void {
    let numNulls = 0;
    for (let i = 0, len = this._hooks.length; i < len; i++) {
      let hook = this._hooks[i];
      if (this._hooks[i] === null) {
        numNulls++;
      } else {
        this._hooks[i-numNulls] = hook;
      }
    }
    this._hooks.length -= numNulls;
  }

  private _hooks: ((msg: T) => boolean)[];
  private _cleanupScheduled: boolean;
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
