// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

import { DisposableDelegate } from 'phosphor-disposable';

import { 
  IKernel, IKernelFuture, IKernelMessage, IKernelMessageOptions 
} from './ikernel';

import { createKernelMessage } from './kernel';

import { validateCommMessage } from './validate';

import * as utils from './utils';


/**
 * A client side Comm interface.
 */
export
interface IComm {
  /**
   * The uuid for the comm channel.
   *
   * Read-only
   */
  commId: string;

  /** 
   * The target name for the comm channel.
   *
   * Read-only
   */
  targetName: string;

  /**
   * The onClose handler.
   */
  onClose: (data?: any) => void;

  /**
   * The onMsg handler.
   */
  onMsg: (data: any) => void;

  /**
   * Open a comm with optional data.
   */
  open(data?: any, metadata?: any): IKernelFuture;

  /**
   * Send a comm message to the kernel.
   */
  send(data: any, metadata?: any, buffers?:(ArrayBuffer | ArrayBufferView)[]): IKernelFuture;

  /**
   * Close the comm.
   */
  close(data?: any, metadata?: any): IKernelFuture;
}


/**
 * Contents of `comm_info` message.
 */
export
interface ICommInfo {
  /**
   * Mapping of comm ids to target names.
   */
  comms: { [id: string]: string };
}


/*
 * CommManager for a Kernel.
 *
 * http://ipython.org/ipython-doc/dev/development/messaging.html#custom-messages
 */
export
class CommManager {

  /**
   * Create a CommManager instance.
   */
  constructor(kernel: IKernel) {
    this._kernel = kernel;
    this._kernel.iopubReceived.connect(this._handleKernelMsg, this);
  }

  /**
   * Connect to a comm, or create a new one.
   *
   * If a client-side comm already exists, it is returned.
   */
  connect(targetName: string, commId?: string): Promise<IComm> {
    if (commId === void 0) {
      commId = utils.uuid();
    }
    var promise = this._commPromises.get(commId);
    if (promise) {
      return promise;
    }
    var comm = this._comms.get(commId);
    if (!comm) {
      comm = new Comm(targetName, commId, this._kernel, () => {
        this._unregisterComm(comm.commId);
      });
      this._comms.set(commId, comm);
    }
    return Promise.resolve(comm);
  }

  /**
   * Register the handler for a "comm_open" message on a given targetName.
   */
  setTargetHandler(targetName: string, cb: (comm: IComm, data: any) => void): void {
    this._targets.set(targetName, cb);
  }

  /**
   * Send a 'comm_info_request', and return the contents of the
   * 'comm_info_reply'.
   */
  commInfo(targetName?: string): Promise<ICommInfo> {
    var contents = {};
    if (targetName !== void 0) {
      contents = { target_name: targetName };
    }
    var future = sendCommMessage(this._kernel, 'comm_info_request', contents);
    return new Promise((resolve, reject) => {
      future.onReply = (msg) => {
        resolve(msg.content);
      }
    });
  }

  private _handleKernelMsg(kernel: IKernel, msg: IKernelMessage): void {
    if (!validateCommMessage(msg)) {
      console.error('Invalid comm message');
      return;
    }
    switch(msg.header.msg_type) {
       case 'comm_open':
         this._handleOpen(msg);
         break;
       case 'comm_msg':
         this._handleMsg(msg);
         break;
       case 'comm_close':
         this._handleClose(msg);
         break;
    }
  }

  /**
   * Handle 'comm_open' kernel message.
   */  
  private _handleOpen(msg: IKernelMessage): void {
    var content = msg.content;
    var promise = loadTarget(
      content.target_name, content.target_module, this._targets
    ).then((target: (comm: IComm, data: any) => any) => {
      var comm = new Comm(
        content.target_name, 
        content.comm_id, 
        this._kernel,
        () => { this._unregisterComm(content.comm_id); }
      );
      try {
        var response = target(comm, content.data);
      } catch (e) {
        comm.close();
        this._unregisterComm(comm.commId);
        console.error("Exception opening new comm");
        return Promise.reject(e);
      }
      this._commPromises.delete(comm.commId);
      this._comms.set(comm.commId, comm);
      return comm;
    });
    this._commPromises.set(content.comm_id, promise);
  }

  /**
   * Handle 'comm_close' kernel message.
   */  
  private _handleClose(msg: IKernelMessage): void {
    var content = msg.content;
    var promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      var comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      }
      promise = Promise.resolve(comm);
    }
    promise.then((comm) => {
      this._unregisterComm(comm.commId);
      try {
        comm.close(msg.content.data);
      } catch (e) {
        console.log("Exception closing comm: ", e, e.stack, msg);
      }
    });
  }

  /**
   * Handle 'comm_msg' kernel message.
   */  
  private _handleMsg(msg: IKernelMessage): void {
    var content = msg.content;
    var promise = this._commPromises.get(content.comm_id);
    if (!promise) {
      var comm = this._comms.get(content.comm_id);
      if (!comm) {
        console.error('Comm not found for comm id ' + content.comm_id);
        return;
      } else {
        var onMsg = comm.onMsg;
        if (onMsg) onMsg(msg.content.data);
      }
    } else {
      promise.then((comm) => {
        try {
          var onMsg = comm.onMsg;
          if (onMsg) onMsg(msg.content.data);
        } catch (e) {
          console.log("Exception handling comm msg: ", e, e.stack, msg);
        }
        return comm;
      });
    }
  }

  /**
   * Unregister a comm instance.
   */
  private _unregisterComm(commId: string) {
    this._comms.delete(commId);
  }

  private _commPromises = new Map<string, Promise<IComm>>();
  private _comms = new Map<string, IComm>();
  private _kernel: IKernel = null;
  private _targets = new Map<string, (comm: IComm, data: any) => any>();
}


/**
 * Comm channel handler.
 */
export
class Comm extends DisposableDelegate implements IComm {

  /**
   * Construct a new comm channel.
   */
  constructor(targetName: string, commId: string, kernel: IKernel, callback: () => void) {
    super(callback);
    this._target = targetName;
    this._id = commId;  
    this._kernel = kernel;
  }

  /**
   * Get the uuid for the comm channel.
   *
   * Read-only
   */
  get commId(): string {
    return this._id;
  }

  /** 
   * Get the target name for the comm channel.
   *
   * Read-only
   */
  get targetName(): string {
    return this._target;
  }

  /** 
   * Get the onClose handler.
   */
  get onClose(): (data?: any) => void {
    return this._onClose;
  }

  /**
   * Set the onClose handler.
   */
  set onClose(cb: (data?: any) => void) {
    this._onClose = cb;
  }

  /**
   * Get the onMsg handler.
   */
  get onMsg(): (data: any) => void {
    return this._onMsg;
  }

  /**
   * Set the onMsg handler.
   */
  set onMsg(cb: (data: any) => void) {
    this._onMsg = cb;
  }

  /**
   * Initialize a comm with optional data.
   */
  open(data?: any, metadata?: any): IKernelFuture {
    var contents = {
      comm_id: this._id,
      target_name: this._target,
      data: data || {}
    }
    return sendCommMessage(this._kernel, 'comm_open', contents, metadata);
  }

  /**
   * Send a comm message to the kernel.
   */
  send(data: any, metadata={}, buffers: (ArrayBuffer | ArrayBufferView)[]=[]): IKernelFuture {
    if (this.isDisposed) {
      throw Error('Comm is closed');
    }
    var contents = { comm_id: this._id, data: data };
    return sendCommMessage(this._kernel, 'comm_msg', contents, metadata, buffers);
  }

  /**
   * Close the comm.
   */
  close(data?: any, metadata={}): IKernelFuture {
    if (this.isDisposed) {
      return;
    }
    var onClose = this._onClose;
    if (onClose) onClose(data);
    var contents = { comm_id: this._id, data: data || {} };
    var future = sendCommMessage(this._kernel, 'comm_close', contents, metadata);
    this._onClose = null;
    this._onMsg = null;
    this.dispose();
    return future;
  }

  /**
   * Clear internal state when disposed.
   */
  dispose(): void {
    this._kernel = null;
    this._onClose = null;
    this._onMsg = null;
    super.dispose();
  }

  private _target = '';
  private _id = '';
  private _kernel: IKernel = null;
  private _onClose: (data?: any) => void = null;
  private _onMsg: (data: any) => void = null;
}


/**
 * Load a target from a module using require.js, if a module 
 * is specified, otherwise try to load a target from the given registry.
 */
function loadTarget(targetName: string, moduleName: string, registry: Map<string, (comm: IComm, data: any) => any>): Promise<(comm: IComm, data: any) => any> {
  return new Promise((resolve, reject) => {
    // Try loading the module using require.js
    if (moduleName) {
      requirejs([moduleName], (mod: any) => {
        if (mod[targetName] === undefined) {
          reject(new Error(
            'Target ' + targetName + ' not found in module ' + moduleName
          ));
        } else {
          resolve(mod[targetName]);
        }
      }, reject);
    } else {
      var target = registry.get(targetName);
      if (target) resolve(target);
      reject(new Error('Target ' + targetName + ' not found in registry '));
    }
  });
};



/**
 * Send a comm message to the kernel.
 */
function sendCommMessage(kernel: IKernel, msgType: string, contents: any, metadata={}, buffers:(ArrayBuffer | ArrayBufferView)[]=[]): IKernelFuture {
 var options: IKernelMessageOptions = {
    msgType: msgType,
    channel: 'shell',
    username: kernel.username,
    session: kernel.clientId
  }
  var msg = createKernelMessage(options, contents, metadata, buffers);
  var future = kernel.sendShellMessage(msg);
  future.autoDispose = false;
  return future;
}
