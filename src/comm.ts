// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

import requirejs = require('r.js');

import { 
  IKernel, IKernelFuture, IKernelMessage, IKernelMessageOptions 
} from './ikernel';

import { createKernelMessage } from './kernel';

import { IComm, ICommManager, ICommInfo } from './icomm';

import * as utils from './utils';


/*
 * CommManager implementation for a Kernel.
 *
 * http://ipython.org/ipython-doc/dev/development/messaging.html#custom-messages
 */
export
class CommManager implements ICommManager {

  /**
   * Create a CommManager instance.
   */
  constructor(kernel: IKernel) {
    this._kernel = kernel;
  }

  /**
   * Start a new Comm, sending a "comm_open" message.
   *
   */
  startNewComm(targetName: string, data?: any, commId?: string): Promise<IComm> {
    var comm = new Comm(targetName, commId, this);
    
    var contents = {
      comm_id: comm.commId,
      target_name: targetName,
      data: data || {}
    }
    this.sendCommMessage('comm_open', contents);
    var promise = Promise.resolve(comm)
    this._comms.set(comm.commId, promise);
    return promise;
  }

  /**
   * Connect to an existing server side comm.
   */
  connectToComm(targetName: string, commId: string): Promise<IComm> {
    var comm = new Comm(targetName, commId, this);
    var promise = Promise.resolve(comm);
    this._comms.set(commId, promise);
    return promise;
  }

  /**
   * Register the handler for a "comm_open" message on a given targetName.
   */
  registerTarget(targetName: string, cb: (comm: IComm, data: any) => void): void {
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
    var future = this.sendCommMessage('comm_info', contents);
    return new Promise((resolve, reject) => {
      future.onReply = (msg) => {
        resolve(msg.content);
      }
    });
  }

  /**
   * Handle 'comm_open' kernel message.
   *
   * Not part of ICommManager interface.
   */  
  handleOpen(msg: IKernelMessage): void {
    var content = msg.content;

    var promise = loadTarget(content.target_name, content.target_module, 
        this._targets).then((target: (comm: IComm, data: any) => any) => {
      var comm = new Comm(content.target_name, content.comm_id, this);
      try {
        var response = target(comm, content.data);
      } catch (e) {
        comm.close();
        this.unregisterComm(comm);
        console.error("Exception opening new comm");
        return Promise.reject(e);
      }
      // Regardless of the target return value, we need to
      // then return the comm
      return Promise.resolve(response).then(() => { return comm; });
    }, () => { throw Error('Could not open comm')} );
    this._comms.set(content.comm_id, promise);
  }
    
  /**
   * Handle 'comm_close' kernel message.
   *
   * Not part of ICommManager interface.
   */  
  handleClose(msg: IKernelMessage): void {
    var content = msg.content;
    var promise = this._comms.get(content.commId);
    if (!promise) {
        console.error('Comm promise not found for comm id ' + content.comm_id);
        return;
    }
    promise.then((comm) => {
      this.unregisterComm(comm);
      try {
        comm.close(msg);
      } catch (e) {
        console.log("Exception closing comm: ", e, e.stack, msg);
      }
    });
  }

  /**
   * Handle 'comm_msg' kernel message.
   *
   * Not part of ICommManager interface.
   */  
  handleMsg(msg: IKernelMessage): void {
    var content = msg.content;
    var promise = this._comms.get(content.comm_id);
    if (!promise) {
      console.error('Comm promise not found for comm id ' + content.comm_id);
      return;
    }
    var newPromise = promise.then((comm) => {
      try {
        var onMsg = comm.onMsg;
        if (onMsg) onMsg(msg);
      } catch (e) {
        console.log("Exception handling comm msg: ", e, e.stack, msg);
      }
      return comm;
    });
    this._comms.set(content.comm_id, newPromise);
  }

  /**
   * Unregister a comm instance.
   *
   * Not part of ICommManager interface.
   */
  unregisterComm(comm: IComm) {
    this._comms.delete(comm.commId);
  }

  /**
   * Send a comm message to the kernel.
   *
   * Not part of ICommManager interface.
   */
  sendCommMessage(msgType: string, contents: any): IKernelFuture {
   var options: IKernelMessageOptions = {
      msgType: msgType,
      channel: 'shell',
      username: this._kernel.username,
      session: this._kernel.clientId
    }
    var msg = createKernelMessage(options, contents);
    return this._kernel.sendShellMessage(msg);
  }

  private _comms = new Map<string, Promise<IComm>>();
  private _kernel: IKernel = null;
  private _targets = new Map<string, (comm: IComm, data: any) => any>();
}


/**
 * Comm channel handler.
 */
export
class Comm implements IComm {

  /**
   * Construct a new comm channel.
   */
  constructor(targetName: string, commId: string, manager: CommManager) {
    this._target = targetName;
    this._id = commId || utils.uuid();  
    this._manager = manager;
  }

  /**
   * Get the uuid for the comm channel.
   *
   * Read only.
   */
  get commId(): string {
    return this._id;
  }

  /** 
   * Get the target name for the comm channel.
   *
   * Read only.
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
   * Get the onMessage handler.
   */
  get onMsg(): (data: any) => void {
    return this._onMsg;
  }

  /**
   * Set the onMessage handler.
   */
  set onMsg(cb: (data: any) => void) {
    this._onMsg = cb;
  }

  /**
   * Send a comm message to the kernel.
   */
  send(data: any): void {
    var contents = { comm_id: this._id, data: data || {} };
    this._manager.sendCommMessage('comm_msg', contents);
  }

  /**
   * Close the comm.
   */
  close(data?: any): void {
    var onClose = this._onClose;
    if (onClose) onClose(data);
    var contents = { comm_id: this._id, data: data || {} };
    this._manager.sendCommMessage('comm_close', contents);
    this._manager.unregisterComm(this);
  }

  private _target = '';
  private _id = '';
  private _manager: CommManager = null;
  private _onClose: (data?: any) => void = null;
  private _onMsg: (data: any) => void = null;
}


/**
 * Load a target from a module using require.js, if a module 
 * is specified, otherwise try to load a target from the given registry.
 */
function loadTarget(targetName: string, moduleName: string, registry: Map<string, (comm: IComm, data: any) => any>): Promise<any> {
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
