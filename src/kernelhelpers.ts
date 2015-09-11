// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { 
  IKernel, IKernelFuture, IKernelInfo, IKernelMessage 
} from './ikernel';

import * as utils from './utils';


/**
 * Contents of a 'complete_request' message.
 */
export
interface ICompleteRequest {
  code: string;
  cursor_pos: string;
}


/**
 * Contents of a 'complete_reply' message.
 */
export 
interface ICompleteReply {
  matches: string[];
  cursor_start: number;
  cursor_end: number;
  metadata: any;
  status: string;
}


/**
 * Contents of an 'inspect_request' message.
 */
export
interface IInspectRequest {
  code: string;
  cursor_pos: number;
  detail_level: number;
}


/**
 * Contents of an 'inspect_reply' message.
 */
export
interface IInspectReply {
  status: string;
  data: any;
  metadata: any;
}


/**
 * Content of an 'is_complete_reply' message.
 */
export 
interface IIsCompleteReply {
  status: string;
  indent: string;
}


/**
 * Contents of an 'execute_request' message.
 */
export
interface IExecuteRequest {
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
interface IExecuteReply {
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
 * Send an "complete_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#completion
 */
export
function completeRequest(kernel: IKernel, options: ICompleteRequest): Promise<ICompleteReply> {
  var msg = createMessage(kernel, 'complete_request', 'shell', options);
  var future = kernel.sendMessage(msg);
  return new Promise<ICompleteReply>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<ICompleteReply>msg.content);
    }
  });
}


/**
 * Send an "inspect_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#introspection
 */
export
function inspectRequest(kernel: IKernel, options: IInspectRequest): Promise<IInspectReply> {
  var msg = createMessage(kernel, 'inspect_request', 'shell', options);
  var future = kernel.sendMessage(msg);
  return new Promise<IInspectReply>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IInspectReply>msg.content);
    }
  });
}

/**
 * Send an "execute_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#execute
 */
export
function executeRequest(kernel: IKernel, options: IExecuteRequest): IKernelFuture {
  var msg = createMessage(kernel, 'execute_request', 'shell', options);
  return kernel.sendMessage(msg);
}


/**
 * Send an "is_complete_request" message.
 *
 * See https://ipython.org/ipython-doc/dev/development/messaging.html#code-completeness
 */
export
function isCompleteRequest(kernel: IKernel, code: string): Promise<IIsCompleteReply> {
  var content = { code: code };
  var msg = createMessage(kernel, 'is_complete_request', 'shell', content);
  var future = kernel.sendMessage(msg);
  return new Promise<IIsCompleteReply>((resolve, reject) => {
    future.onReply = (msg: IKernelMessage) => {
      resolve(<IIsCompleteReply>msg.content);
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
