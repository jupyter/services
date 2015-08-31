// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import { IKernelId } from './kernelhelpers';

import { INotebookId, ISessionId } from './session';


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
