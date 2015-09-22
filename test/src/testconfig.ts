// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  getConfigSection, ConfigWithDefaults
} from '../../lib/config';


import { RequestHandler, expectFailure } from './utils';


describe('jupyter.services - IConfigSection', () => {

  describe('getConfigSection()', () => {

    it('should complete properly', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(config => {
        done();
      });
      handler.respond(200, {});
    });

    it('should load a config', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(config => {
        expect(config.data.foo).to.be('bar');
        done();
      });
      handler.respond(200, { foo: 'bar' });
    });

    it('should fail for an incorrect response', (done) => {
      var handler = new RequestHandler();
      var configPromise = getConfigSection("test", "localhost");
      handler.respond(201, { });
      expectFailure(configPromise, done, 'Invalid Status: 201');
    });

  });

  describe('#update()', () => {

    it('should update a config', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(config => {
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
      handler.respond(200, {});
    });

    it('should fail for an incorrect response', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(config => {
        var update = config.update({ foo: 'baz' });
        handler.respond(201, { });
        expectFailure(update, done, 'Invalid Status: 201');
      });
      handler.respond(200, {});
    });

  });

});


describe('jupyter.services - ConfigWithDefaults', () => {

  describe('#constructor()', () => {

    it('should complete properly', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { spam: 'eggs' },
                                          'testclass');
        done();
      });
      handler.respond(200, { testclass: { foo: 'bar' } });
    });

  });

  describe('#get()', () => {

    it('should get a new config value', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { spam: 'eggs' },
                                            'testclass');
        var data = config.get('foo');
        expect(data).to.be('bar');
        done();
      });
      handler.respond(200, { testclass: { foo: 'bar' } });
    });

    it('should get a default config value', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { spam: 'eggs' },
                                            'testclass');
        var data = config.get('spam');
        expect(data).to.be('eggs');
        done();
      });
      handler.respond(200, { testclass: { foo: 'bar' } });
    });

    it('should get a default config value with no class', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { spam: 'eggs' });

        var data = config.get('spam');
        expect(data).to.be('eggs');
        done();
      });
      handler.respond(200, { foo: 'bar' });
    });

  });

  describe('#set()', () => {

    it('should set a value in a class immediately', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { },
                                            'testclass');

        var set = config.set('foo', 'bar');
        expect(section.data.testclass.foo).to.be('bar');
        done();
      });
      handler.respond(200, {});
    });

    it('should set a top level value', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { });
        var set = config.set('foo', 'bar');
        expect(section.data.foo).to.be('bar');
        set.then((data) => {
          expect(section.data.foo).to.be('bar');
          done();
        });
        handler.respond(200, {foo: 'bar'});
      });
      handler.respond(200, {});
    });

    it('should fail for an invalid response', (done) => {
      var handler = new RequestHandler();
      getConfigSection("test", "localhost").then(section => {
        var config = new ConfigWithDefaults(section, { });
        var set = config.set('foo', 'bar');
        expect(section.data.foo).to.be('bar');
        expectFailure(set, done, 'Invalid Status: 201');
        handler.respond(201, {foo: 'bar'});
      });
      handler.respond(200, {});
    });
  });

});
