// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  ISession
} from '../../lib/isession';

import {
  validateSessionModel, validateContentsModel, validateCheckpointModel
} from '../../lib/validate';

import {
  DEFAULT_FILE
} from './utils';


describe('validate', () => {

  describe('#validateSessionModel()', () => {

    it('should pass a valid id', () => {
      let id: ISession.IModel = {
        id: 'foo',
        kernel: { name: 'foo', id: '123'},
        notebook: { path: 'bar' }
      };
      validateSessionModel(id);
    });

    it('should fail on missing data', () => {
      let id: ISession.IModel = {
        id: 'foo',
        kernel: { name: 'foo', id: '123'},
      };
      expect(() => validateSessionModel(id)).to.throwError();
    });

  });

  describe('validateContentsModel()', () => {

    it('should pass with valid data', () => {
      validateContentsModel(DEFAULT_FILE);
    });

    it('should fail on missing data', () => {
      let model = JSON.parse(JSON.stringify(DEFAULT_FILE));
      delete model['path'];
      expect(() => validateContentsModel(model)).to.throwError();
    });

    it('should fail on incorrect data', () => {
      let model = JSON.parse(JSON.stringify(DEFAULT_FILE));
      model.type = 1;
      expect(() => validateContentsModel(model)).to.throwError();
    });

  });

  describe('validateCheckpointModel()', () => {

    it('should pass with valid data', () => {
      validateCheckpointModel({ id: 'foo', last_modified: 'yesterday '});
    });

    it('should fail on missing data', () => {
      let model = { id: 'foo' };
      expect(() => validateCheckpointModel(model as any)).to.throwError();
    });

    it('should fail on incorrect data', () => {
      let model = { id: 1, last_modified: '1'};
      expect(() => validateCheckpointModel(model as any)).to.throwError();
    });

  });

});
