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
 * Required fields for `IKernelHeader`.
 */
const HEADER_FIELDS = ['username', 'version', 'session', 'msg_id', 'msg_type'];

/**
 * Requred fields and types for contents of various types of `IKernelMessage`
 * messages on the iopub channel.
 */
const IOPUB_CONTENT_FIELDS: {[key: string]: any} = {
  stream: { name: 'string', text: 'string' },
  display_data: { data: 'any', metadata: 'any' },
  execute_input: { code: 'string', execution_count: 'number' },
  execute_result: { execution_count: 'number', data: 'any',
                    metadata: 'any' },
  error: { ename: 'string', evalue: 'string', traceback: 'any' },
  status: { execution_state: 'string' },
  clear_output: { wait: 'boolean' },
  comm_open: { comm_id: 'string', target_name: 'string', data: 'any' },
  comm_msg: { comm_id: 'string', data: 'any' },
  comm_close: { comm_id: 'string' },
  shutdown_reply: { restart : 'boolean' }  // Emitted by the IPython kernel.
};



/**
 * Validate a property as being on an object, and optionally
 * of a given type.
 */
function validateProperty(object: any, name: string, typeName?: string): void {
  if (!object.hasOwnProperty(name)) {
    throw Error(`Missing property '${name}'`);
  }
  if (typeName !== void 0) {
    let valid = true;
    let value = object[name];
    switch(typeName) {
    case 'array':
      valid = Array.isArray(value);
      break;
    case 'any':
      valid = typeof value !== 'undefined';
      break;
    default:
      valid = typeof value == typeName;
    }
    if (!valid) {
      throw new Error(`Property '${name}' is not of type '${typeName}`);
    }
  }
}


/**
 * Validate the header of an `IKernelMessage`.
 */
function validateKernelHeader(header: any): void {
  for (let i = 0; i < HEADER_FIELDS.length; i++) {
    validateProperty(header, HEADER_FIELDS[i], 'string');
  }
}


/**
 * Validate an `IKernelMessage` object.
 */
export
function validateKernelMessage(msg: IKernelMessage) : void {
  validateProperty(msg, 'metadata', 'any');
  validateProperty(msg, 'content', 'any');
  validateProperty(msg, 'channel', 'string');
  validateProperty(msg, 'buffers', 'array');
  validateKernelHeader(msg.header);
  if (Object.keys(msg.parent_header).length > 0) {
    validateKernelHeader(msg.parent_header as IKernelMessageHeader);
  }
  if (msg.channel === 'iopub') {
    validateIOPubContent(msg);
  }
}


/**
 * Validate content of an IKernelMessage on the iopub channel.
 */
function validateIOPubContent(msg: IKernelMessage) : void {
  if (msg.channel === 'iopub') {
    let fields = IOPUB_CONTENT_FIELDS[msg.header.msg_type];
    if (fields === void 0) {
      throw Error(`Invalid Kernel message: iopub message type ${msg.header.msg_type} not recognized`);
    }
    let names = Object.keys(fields);
    let content = msg.content;
    for (let i = 0; i < names.length; i++) {
      validateProperty(content, names[i], fields[names[i]])
    }
  }
}


/**
 * Validate an `IKernelId` object.
 */
export
function validateKernelId(info: IKernelId) : void {
  validateProperty(info, 'name', 'string');
  validateProperty(info, 'id', 'string');
}


/**
 * Validate an `ISessionId` object.
 */
export
function validateSessionId(info: ISessionId): void {
  validateProperty(info, 'id', 'string');
  validateProperty(info, 'notebook', 'any');
  validateProperty(info, 'kernel', 'any');
  validateKernelId(info.kernel);
  validateProperty(info.notebook, 'path', 'string');
}


/**
 * Validate an `IKernelSpecID` object.
 */
 export
function validateKernelSpec(info: IKernelSpecId): void {
  validateProperty(info, 'name', 'string');
  validateProperty(info, 'spec', 'any');
  validateProperty(info, 'resources', 'any');
  let spec = info.spec;
  validateProperty(spec, 'language', 'string');
  validateProperty(spec, 'display_name', 'string');
  validateProperty(spec, 'argv', 'array');
}


/**
 * Validate an `IContentsModel` object.
 */
export
function validateContentsModel(model: IContentsModel): void {
  validateProperty(model, 'name', 'string');
  validateProperty(model, 'path', 'string');
  validateProperty(model, 'type', 'string');
  validateProperty(model, 'created', 'string');
  validateProperty(model, 'last_modified', 'string');
  validateProperty(model, 'mimetype', 'any');
  validateProperty(model, 'content', 'any');
  validateProperty(model, 'format', 'any');
}


/**
 * Validate an `ICheckpointModel` object.
 */
export
function validateCheckpointModel(model: ICheckpointModel): void  {
  validateProperty(model, 'id', 'string');
  validateProperty(model, 'last_modified', 'string');
}
