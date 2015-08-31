// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IKernel, IKernelInfo } from './ikernel';


/**
 * Settings for a kernel execute command.
 */
export
interface IKernelExecute {
  silent?: boolean;
  user_expressions?: any;
  allow_stdin?: boolean;
  store_history?: boolean;
}


export
interface IInspectOptions {
  // whatever
}


export
interface IInspectResult {
  // whatever
}


export
interface IExecuteOptions {
  // whatever
}


export
interface IExecuteResult {
  // whatever
}


/**
 * Send a "kernel_info_request" message.
 */
export
function infoRequest(kernel: IKernel): Promise<IKernelInfo> {
  return null;
}


/**
 * Send an "inspect_request" message.
 */
export
function inspectRequest(kernel: IKernel, options: IInspectOptions): Promise<IInspectResult> {
  return null;
}


/**
 * Send an "execute_request" message.
 */
export
function executeRequest(kernel: IKernel, options: IExecuteOptions): Promise<IExecuteResult> {
  return null;
}
