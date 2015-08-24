// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  ConfigSection, ConfigWithDefaults
} from '../../lib/config';


import { RequestHandler, expectFailure } from './utils';


describe('jupyter.services - ConfigSection', () => {

  describe('#constructor()', () => {

    it('should complete properly', (done) => {
      var config = new ConfigSection("test", "localhost");
      done();
    });

  });

  describe('#load()', () => {

    it('should load a config', (done) => {
      var config = new ConfigSection("test", "localhost");
      var handler = new RequestHandler();
      var load = config.load();
      handler.respond(200, { foo: 'bar' });
      return load.then((data: any) => {
        expect(data.foo).to.be('bar');
        expect(config.data.foo).to.be('bar');
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      var config = new ConfigSection("test", "localhost");
      var handler = new RequestHandler();
      var load = config.load();
      handler.respond(201, { });
      expectFailure(load, done, 'Invalid Status: 201');
    });

  });

  describe('#onLoaded()', () => {

      it('should fullfill the onLoaded promise', (done) => {
      var config = new ConfigSection("test", "localhost");
      var handler = new RequestHandler();
      var load = config.load();
      handler.respond(200, { foo: 'bar' });

      config.onLoaded.then((data: any) => {
        expect(config.data.foo).to.be('bar');
        expect(data.foo).to.be('bar');
        done();
      });

    });
  });

  describe('#update()', () => {

    it('should update a config', (done) => {
      var config = new ConfigSection("test", "localhost");
      var handler = new RequestHandler();
      var update = config.update( { foo: 'baz', spam: 'eggs' });
      handler.respond(200, config.data );
      return update.then((data: any) => {
        expect(data.foo).to.be('baz');
        expect(config.data.foo).to.be('baz');
        expect(data.spam).to.be('eggs');
        expect(config.data.spam).to.be('eggs');
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      var config = new ConfigSection("test", "localhost");
      var handler = new RequestHandler();
      var update = config.update({ foo: 'baz' });
      handler.respond(201, { });
      expectFailure(update, done, 'Invalid Status: 201');
    });

  });

});


describe('jupyter.services - ConfigWithDefaults', () => {

});
