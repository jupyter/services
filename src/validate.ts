// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  ICheckpointModel, IContentsModel
} from './contents';

import {
  IKernelId, IKernelMessage, IKernelMessageHeader, IKernelSpecId
} from './ikernel';

import {
  INotebookId, ISessionId
} from './isession';

/**
 * Required fields for comm messages.
 */
const COMM_FIELDS = ['comm_id', 'data'];

/**
 * Required fields for `IKernelHeader`.
 */
const HEADER_FIELDS = ['username', 'version', 'session', 'msg_id', 'msg_type'];

/**
 * Required fields for `IKernelMessage`.
 */
const MESSAGE_FIELDS = ['header', 'parent_header', 'metadata', 'content',
                        'channel', 'buffers'];

/**
 * Requred fields and types for contents of various types of `IKernelMessage`
 * messages on the iopub channel.
 */
const IOPUB_CONTENT_FIELDS: {[key: string]: any} = {
  'stream': {'name': 'string', 'text': 'string'},
  'display_data': {'source': 'string', 'data': 'any', 'metadata': 'object'},
  'execute_input': {'code': 'string', 'execution_count': 'number'},
  'execute_result': {'execution_count': 'number', 'data': 'any', 'metadata': 'object'},
  'error': {'ename': 'string', 'evalue': 'string', 'traceback': 'object'},
  'status': {'execution_state': 'string'},
  'clear_output': {'wait': 'boolean'},
  'comm_open': { 'comm_id': 'string', 'target_name': 'string',
                 'data': 'any' },
  'comm_msg': { 'comm_id': 'string', 'data': 'any' },
  'comm_close': { 'comm_id': 'string' }
}

/**
 * Validate an `IKernelMessage` as being a valid Comm Message.
 */
export
function validateCommMessage(msg: IKernelMessage): boolean {
  for (var i = 0; i < COMM_FIELDS.length; i++) {
    if (!msg.content.hasOwnProperty(COMM_FIELDS[i])) {
      return false;
    }
  }
  if (msg.header.msg_type === 'comm_open') {
    if (!msg.content.hasOwnProperty('target_name') ||
        typeof msg.content.target_name !== 'string') {
      return false;
    }
    if (msg.content.hasOwnProperty('target_module') &&
        msg.content.target_module !== null &&
        typeof msg.content.target_module !== 'string') {
      return false;
    }
  }
  if (typeof msg.content.comm_id !== 'string') {
    return false;
  }
  return true;
}


/**
 * Validate the header of an `IKernelMessage`.
 */
function validateKernelHeader(header: any): void {
  for (var i = 0; i < HEADER_FIELDS.length; i++) {
    if (!header.hasOwnProperty(HEADER_FIELDS[i])) {
      throw Error(`Invalid Kernel message: header missing field ${HEADER_FIELDS[i]}`);
    }
    if (typeof header[HEADER_FIELDS[i]] !== 'string') {
      throw Error(`Invalid Kernel message: header field ${HEADER_FIELDS[i]} is not a string`);
    }
  }
}


/**
 * Validate an `IKernelMessage` object.
 */
export
function validateKernelMessage(msg: IKernelMessage) : void {
  for (var i = 0; i < MESSAGE_FIELDS.length; i++) {
    if (!msg.hasOwnProperty(MESSAGE_FIELDS[i])) {
      throw Error(`Invalid Kernel message: missing field ${MESSAGE_FIELDS[i]}`);
    }
  }
  validateKernelHeader(msg.header);
  if (Object.keys(msg.parent_header).length > 0) {
    validateKernelHeader(msg.parent_header as IKernelMessageHeader);
  }
  if (typeof msg.channel !== 'string') {
    throw Error('Invalid Kernel message: channel is not a string');
  }
  if (msg.channel === 'iopub') {
    validateIOPubKernelMessageContent(msg);
  }
  if (!Array.isArray(msg.buffers)) {
    throw Error('Invalid Kernel message: buffers is not an array');
  }
}


/**
 * Validate content of an IKernelMessage on the iopub channel.
 */
export
function validateIOPubKernelMessageContent(msg: IKernelMessage) : void {
  if (msg.channel === 'iopub') {
    let fields = IOPUB_CONTENT_FIELDS[msg.header.msg_type];
    if (fields === void 0) {
      throw Error(`Invalid Kernel message: iopub message type ${msg.header.msg_type} not recognized`)
    }
    let content = msg.content;
    let names = Object.keys(fields);
    for (let i = 0; i < names.length; i++) {
      if (fields[names[i]] === 'any') {
        continue
      }
      if (typeof msg.content[names[i]] !== fields[names[i]]) {
        throw Error(`Invalid Kernel message: iopub content field ${names[i]} is not of type ${fields[names[i]]}`);
      }
    }
  }
}


/**
 * Validate an `IKernelId` object.
 */
export
function validateKernelId(info: IKernelId) : void {
   if (!info.hasOwnProperty('name') || !info.hasOwnProperty('id')) {
     throw Error('Invalid kernel id');
   }
   if ((typeof info.id !== 'string') || (typeof info.name !== 'string')) {
     throw Error('Invalid kernel id');
   }
}


/**
 * Validate an `ISessionId` object.
 */
export
function validateSessionId(info: ISessionId): void {
  if (!info.hasOwnProperty('id') ||
      !info.hasOwnProperty('notebook') ||
      !info.hasOwnProperty('kernel')) {
    throw Error('Invalid Session Model');
  }
  validateKernelId(info.kernel);
  if (typeof info.id !== 'string') {
    throw Error('Invalid Session Model');
  }
  validateNotebookId(info.notebook);
}


/**
 * Validate an `INotebookId` object.
 */
export
function validateNotebookId(model: INotebookId): void {
   if ((!model.hasOwnProperty('path')) || (typeof model.path !== 'string')) {
     throw Error('Invalid Notebook Model');
   }
}


/**
 * Validate an `IKernelSpecID` object.
 */
 export
function validateKernelSpec(info: IKernelSpecId): void {
  var err = new Error("Invalid KernelSpec Model");
  if (!info.hasOwnProperty('name') || typeof info.name !== 'string') {
    throw err;
  }
  if (!info.hasOwnProperty('spec') || !info.hasOwnProperty('resources')) {
    throw err;
  }
  var spec = info.spec;
  if (!spec.hasOwnProperty('language') || typeof spec.language !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('display_name') ||
      typeof spec.display_name !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('argv') || !Array.isArray(spec.argv)) {
    throw err;
  }
}


/**
 * Validate an `IContentsModel` object.
 */
export
function validateContentsModel(model: IContentsModel) {
  var err = new Error('Invalid Contents Model');
  if (!model.hasOwnProperty('name') || typeof model.name !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('path') || typeof model.path !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('type') || typeof model.type !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('created') || typeof model.created !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('last_modified') ||
      typeof model.last_modified !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('mimetype')) {
    throw err;
  }
  if (!model.hasOwnProperty('content')) {
    throw err;
  }
  if (!model.hasOwnProperty('format')) {
    throw err;
  }
}


/**
 * Validate an `ICheckpointModel` object.
 */
export
function validateCheckpointModel(model: ICheckpointModel) {
  var err = new Error('Invalid Checkpoint Model');
  if (!model.hasOwnProperty('id') || typeof model.id !== 'string') {
    throw err;
  }
  if (!model.hasOwnProperty('last_modified') ||
      typeof model.last_modified !== 'string') {
    throw err;
  }
}
