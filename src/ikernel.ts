// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IDisposable } from 'phosphor-disposable';

import { ISignal } from 'phosphor-signaling';


export
interface IKernelOptions {
  name: string;
  baseUrl: string;
  wsUrl?: string;
  username?: string;
  clientId?: string;
}


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
  msg_id: string;
  msg_type: string;
}


/**
 * Kernel message specification.
 */
export
interface IKernelMessage {
  header: IKernelMessageHeader;
  parent_header: IKernelMessageHeader | {};
  metadata: any;
  content: any;
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


export
enum KernelStatus {
  Unknown,
  Starting,
  Idle,
  Busy,
  Restarting,
  Dead
}


/**
 * Contents of a 'complete_request' message.
 */
export
interface ICompleteRequest {
  code: string;
  cursor_pos: number;
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
 * Contents of an 'is_complete_request' message.
 */
export 
interface IIsCompleteRequest {
  code: string;
}


/**
 * Contents of an 'is_complete_reply' message.
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
 * Object providing a Future interface for message callbacks.
 *
 * If `autoDispose` is set, the future will self-dispose after `isDone` is
 * set and the registered `onDone` handler is called.
 *
 * The Future is considered done when a `reply` message and a
 * an `idle` iopub status message have been received.
 */
export
interface IKernelFuture extends IDisposable {
  /**
   * Whether the future disposes itself when done.
   *
   * The default is `true`. This can be set to `false` if the consumer
   * expects addition output messages to arrive after the reply. In
   * this case, the consumer must call `dispose()` when finished.
   */
  autoDispose: boolean;

  /**
   * Test whether the future is done.
   *
   * Read-only.
   */
  isDone: boolean;

  /**
   * The reply handler for the kernel future.
   */
  onReply: (msg: IKernelMessage) => void;

  /**
   * The input handler for the kernel future.
   */
  onInput: (msg: IKernelMessage) => void;

  /**
   * The output handler for the kernel future.
   */
  onOutput: (msg: IKernelMessage) => void;

  /**
   * The done handler for the kernel future.
   */
  onDone: (msg: IKernelMessage) => void;
}
