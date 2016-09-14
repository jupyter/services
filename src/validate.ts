// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  validateKernelModel
} from './kernel/validate';

import {
  IContents
} from './contents';

import {
  ISession
} from './isession';


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
    switch (typeName) {
    case 'array':
      valid = Array.isArray(value);
      break;
    case 'object':
      valid = typeof value !== 'undefined';
      break;
    default:
      valid = typeof value === typeName;
    }
    if (!valid) {
      throw new Error(`Property '${name}' is not of type '${typeName}`);
    }
  }
}


/**
 * Validate an `ISession.IModel` object.
 */
export
function validateSessionModel(model: ISession.IModel): void {
  validateProperty(model, 'id', 'string');
  validateProperty(model, 'notebook', 'object');
  validateProperty(model, 'kernel', 'object');
  validateKernelModel(model.kernel);
  validateProperty(model.notebook, 'path', 'string');
}


/**
 * Validate an `IContents.IModel` object.
 */
export
function validateContentsModel(model: IContents.IModel): void {
  validateProperty(model, 'name', 'string');
  validateProperty(model, 'path', 'string');
  validateProperty(model, 'type', 'string');
  validateProperty(model, 'created', 'string');
  validateProperty(model, 'last_modified', 'string');
  validateProperty(model, 'mimetype', 'object');
  validateProperty(model, 'content', 'object');
  validateProperty(model, 'format', 'object');
}


/**
 * Validate an `IContents.ICheckpointModel` object.
 */
export
function validateCheckpointModel(model: IContents.ICheckpointModel): void  {
  validateProperty(model, 'id', 'string');
  validateProperty(model, 'last_modified', 'string');
}
