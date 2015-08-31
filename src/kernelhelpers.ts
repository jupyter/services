// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IKernel } from './kernel';


/**
 * Kernel identification specification.
 */
export
interface IKernelId {
  id: string;
  name: string;
}


/**
 * Kernel message header content.
 */
export
interface IKernelMessageHeader {
  username: string;
  version: string;
  session: string;
  msgId: string;
  msgType: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMessage {
  header: IKernelMessageHeader;
  parentHeader: IKernelMessageHeader | {};
  metadata: any;
  content: any;
  msgId?: string;
  msgType?: string;
  channel?: string;
  buffers?: (ArrayBuffer | ArrayBufferView)[]
}



/**
 * Kernel information specification.
 * http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
 */
export
interface IKernelInfo {
  protocol_version: string;
  implementation: string;
  implementation_version: string;
  language_info: IKernelLanguageInfo;
  banner: string;
  help_links: { [key: string]: string; };
}


/**
 * Kernel language information specification.
 */
export
interface IKernelLanguageInfo {
  name: string;
  version: string;
  mimetype: string;
  file_extension: string;
  pygments_lexer: string;
  codemirror_mode: string | {};
  nbconverter_exporter: string;
}



/**
 * Kernel message header content.
 */
export
interface IKernelMsgHeader {
  username: string;
  version: string;
  session: string;
  msgId: string;
  msgType: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMsg {
  header: IKernelMsgHeader;
  metadata: any;
  content: any;
  parentHeader: {} | IKernelMsgHeader;
  msgId?: string;
  msgType?: string;
  channel?: string;
  buffers?: (ArrayBuffer | ArrayBufferView)[]
}


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
