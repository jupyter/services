// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IKernel, IKernelInfo, IKernelMessage } from './ikernel';

import * as utils from './utils';


/**
 * Contents of an 'inspect_request' message.
 */
export
interface IInspectOptions {
  code: string;
  cursor_pos: number;
  detail_level: number;
}


/**
 * Contents of an 'inspect_reply' message.
 */
export
interface IInspectResult {
  status: string;
  data: any;
  metadata: any;
}


/**
 * Contents of an 'execute_request' message.
 */
export
interface IExecuteOptions {
  code: string;
  silent: boolean;
  store_history: boolean;
  user_expressions: any;
  allow_stdin: boolean;
  stop_on_error: boolean;
}


/**
 * Contents of an 'execute_reply' message.
 */
export
interface IExecuteResult {
  execution_count: number;
  data: any;
  metadata: any;
}


/**
 * Send a "kernel_info_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
 */
export
function infoRequest(kernel: IKernel): Promise<IKernelInfo> {
  var msg = createMessage(kernel, 'kernel_info_request', 'shell');
  var future = kernel.sendMessage(msg);
  return new Promise<IKernelInfo>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IKernelInfo>msg.content);
    }
  });
}


/**
 * Send an "inspect_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#introspection
 */
export
function inspectRequest(kernel: IKernel, options: IInspectOptions): Promise<IInspectResult> {
  var msg = createMessage(kernel, 'inspect_request', 'shell', options);
  var future = kernel.sendMessage(msg);
  return new Promise<IInspectResult>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IInspectResult>msg.content);
    }
  });
}

/**
 * Send an "execute_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#execute
 */
export
function executeRequest(kernel: IKernel, options: IExecuteOptions): Promise<IExecuteResult> {
  var msg = createMessage(kernel, 'execute_request', 'shell', options);
  var future = kernel.sendMessage(msg);
  return new Promise<IExecuteResult>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IExecuteResult>msg.content);
    }
  });
}


/**
 * Create a well-formed Kernel Message.
 */
function createMessage(kernel: IKernel, msgType: string, channel: string, content: any = {}, metadata: any = {}, buffers: ArrayBuffer[] = []) : IKernelMessage {
  return {
    header: {
      username: kernel.username,
      version: '5.0',
      session: kernel.clientId,
      msg_id: utils.uuid(),
      msg_type: msgType
    },
    parent_header: { },
    channel: channel,
    content: content,
    metadata: metadata,
    buffers: buffers
  }
}
