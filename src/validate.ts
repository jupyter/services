// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IKernelId, IKernelSpecId } from './ikernel';

import { INotebookId, ISessionId } from './isession';


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
  if (!spec.hasOwnProperty('codemirror_mode') ||
      typeof spec.codemirror_mode !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('env') || !spec.hasOwnProperty('help_links')) {
    throw err;
  }
}
