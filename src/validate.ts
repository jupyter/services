// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { 
  IKernelId, IKernelMessage, IKernelMessageHeader, IKernelSpecId
} from './ikernel';

import { INotebookId, ISessionId } from './isession';


/**
 * Validate an Kernel Message as being a valid Comm Message.
 */
export 
function validateCommMessage(msg: IKernelMessage): boolean {
  var fields = ['comm_id', 'target_name'];
  for (var i = 0; i < fields.length; i++) {
    if (!msg.content.hasOwnProperty(fields[i])) {
      return false;
    }
    if (typeof msg.content[fields[i]] !== 'string') {
      return false;
    }
  } 
  return true;
}


function validateKernelHeader(header: any): void {
  var fields = ['username', 'version', 'session', 'msg_id',  'msg_type'];
  for (var i = 0; i < fields.length; i++) {
    if (!header.hasOwnProperty(fields[i])) {
      throw Error('Invalid Kernel message ' + fields[i]);
    }
    if (typeof header[fields[i]] !== 'string') {
      throw Error('Invalid Kernel message');
    }
  }
}


/**
 * Validate an object as being of IKernelMessage type.
 */
export
function validateKernelMessage(msg: IKernelMessage) : void {
  var fields = ['header', 'parent_header', 'metadata', 'content', 
                'channel', 'buffers'];
  for (var i = 0; i < fields.length; i++) {
    if (!msg.hasOwnProperty(fields[i])) {
      throw Error('Invalid Kernel message');
    }
  }
  validateKernelHeader(msg.header);
  if (Object.keys(msg.parent_header).length > 0) {
    validateKernelHeader(msg.parent_header as IKernelMessageHeader);
  }
  if (typeof msg.channel !== 'string') {
    throw Error('Invalid Kernel message');
  }
  if (!Array.isArray(msg.buffers)) {
    throw Error('Invalid Kernel message');
  }
}


/**
 * Validate an object as being of IKernelID type
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
 * Validate an object as being of ISessionId type.
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
 * Validate an object as being of INotebookId type.
 */
export
function validateNotebookId(model: INotebookId): void {
   if ((!model.hasOwnProperty('path')) || (typeof model.path !== 'string')) {
     throw Error('Invalid Notebook Model');
   }
}


/**
 * Validate an object as being of IKernelSpecID type.
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
