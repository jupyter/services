// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import requirejs = require('requirejs');

import {
  PromiseDelegate, extend, copy, shallowEquals, uuid, urlPathJoin,
  encodeURIComponents, urlJoinEncode, jsonToQueryString, getConfigOption,
  getBaseUrl, getWsUrl, ajaxRequest, loadObject
} from '../../lib/utils';

import {
  MockXMLHttpRequest
} from '../../lib/mockxhr';


declare var global: any;
global.requirejs = requirejs;


describe('jupyter-js-utils', () => {

  describe('extend()', () => {

    it('should copy the contents of one object to another', () => {
      let target = {
        foo: 'bar',
        baz: { fizz: 0, buzz: 1}
      };
      let source = {
        baz: { buzz: 2}
      };
      let newObj = extend(target, source);
      expect(newObj.foo).to.be('bar');
      expect(newObj.baz.buzz).to.be(2);
      expect(newObj.baz.fizz).to.be(0);
    });

  });

  describe('copy()', () => {

    it('should get a copy of an object', () => {
      let source = {
        foo: 'bar',
        baz: { fizz: 0, buzz: 1}
      };
      let newObj = copy(source);
      expect(newObj.baz.buzz).to.be(1);
      newObj.baz.fizz = 4;
      expect(source.baz.fizz).to.be(0);
      expect(copy([1, 2])).to.eql([1, 2]);
    });

    it('should return null if the object is not copy-able', () => {
      expect(copy(null)).to.be(null);
      expect(copy(0)).to.be(null);
      expect(copy(void 0)).to.be(null);
    });

  });

  describe('shallowEquals()', () => {

    it('should check for shallow equality of two objects', () => {
      expect(shallowEquals({ foo: 1}, { foo: 1})).to.be(true);
      expect(shallowEquals({ foo: 1}, { foo: 1, bar: 2 })).to.be(false);
      expect(shallowEquals({ foo: { bar: 1} }, { foo: { bar: 1 } })).to.be(false);
    });

  });

  describe('uuid()', () => {

    it('should generate a random 32 character hex string', () => {
      let id0 = uuid();
      let id1 = uuid();
      expect(id0.length).to.be(32);
      expect(id1.length).to.be(32);
      expect(id0).to.not.eql(id1);
    });

  });

  describe('#urlPathJoin()', () => {

    it('should join a sequence of url components', () => {
      expect(urlPathJoin('foo', 'bar')).to.be('foo/bar');
      expect(urlPathJoin('/foo/', 'bar/')).to.be('/foo/bar/');
    });

  });

  describe('encodeURIComponents()', () => {

    it('should encode just the components of a multi-segment uri', () => {
      expect(encodeURIComponents('>/>')).to.be('%3E/%3E');
    });

  });

  describe('urlJoinEncode()', () => {

    it('should encode and join a sequence of url components', () => {
      expect(urlJoinEncode('>', '>')).to.be('%3E/%3E');
    });

  });

  describe('jsonToQueryString()', () => {

    it('should return a serialized object string suitable for a query', () => {
      let obj = {
        name: 'foo',
        id: 'baz'
      };
      expect(jsonToQueryString(obj)).to.be('?name=foo&id=baz');
    });

  });

  describe('getConfigOption()', () => {

    it('should get a config option passed on the command line', () => {
      expect(getConfigOption('foo')).to.be('bar');
    });

    it('should return `undefined` for a option that was not given', () => {
      expect(getConfigOption('baz')).to.be(void 0);
    });

  });

  describe('PromiseDelegate', () => {

    describe('#constructor()', () => {

      it('should create a new promise delegate', () => {
        let delegate = new PromiseDelegate<number>();
        expect(delegate instanceof PromiseDelegate).to.be(true);
      });

    });

    describe('#promise', () => {

      it('should get the underlying promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.then(value => {
          expect(value).to.be(1);
          done();
        });
        delegate.resolve(1);
      });

    });

    describe('#resolve()', () => {

      it('should resolve the underlying promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.then(value => {
          expect(value).to.be(1);
          done();
        });
        delegate.resolve(1);
      });

      it('should accept another promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.then(value => {
          expect(value).to.be(1);
          done();
        });
        delegate.resolve(Promise.resolve(1));
      });

    });

    describe('#reject()', () => {

      it('should reject the underlying promise', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.catch(() => {
          done();
        });
        delegate.reject();
      });

      it('should accept a reason', done => {
        let delegate = new PromiseDelegate<number>();
        delegate.promise.catch(reason => {
          expect(reason).to.be('some reason');
          done();
        });
        delegate.reject('some reason');
      });
    });

  });

  describe('getBaseUrl()', () => {

    it('should get the default base url', () => {
      expect(getBaseUrl()).to.be('http://localhost:8888/');
    });

  });

  describe('getWsUrl()', () => {

    it('should get the default ws url', () => {
      expect(getWsUrl()).to.be('ws://localhost:8888/');
    });

  });

  describe('ajaxRequest()', () => {

    it('should handle default values', (done) => {
      let called = false;
      MockXMLHttpRequest.onRequest = request => {
        expect(request.method).to.be('GET');
        expect(request.password).to.be('');
        expect(request.async).to.be(true);
        expect(Object.keys(request.requestHeaders)).to.eql([]);
        let url = request.url;
        expect(url.indexOf('hello?')).to.be(0);
        called = true;
        request.respond(200, 'hello!');
      };
      ajaxRequest('hello', {}).then(response => {
        expect(called).to.be(true);
        expect(response.data).to.be('hello!');
        expect(response.statusText).to.be('200 OK');
      }).then(done, done);
    });

    it('should allow overrides', (done) => {
      MockXMLHttpRequest.onRequest = request => {
        expect(request.method).to.be('POST');
        expect(request.password).to.be('password');
        expect(Object.keys(request.requestHeaders)).to.eql(['Content-Type', 'foo']);
        let url = request.url;
        expect(url.indexOf('hello?')).to.be(-1);
        expect(url.indexOf('hello')).to.be(0);
        request.respond(200, 'hello!');
      };
      ajaxRequest('hello', {
        method: 'POST',
        password: 'password',
        cache: true,
        contentType: 'bar',
        requestHeaders: {
          foo: 'bar'
        },
        timeout: 5
      }).then(response => {
        expect(response.data).to.be('hello!');
        expect(response.statusText).to.be('200 OK');
      }).then(done, done);
    });

    it('should reject the promise for a bad status response', (done) => {
      MockXMLHttpRequest.onRequest = request => {
        request.respond(400, 'denied!');
      };
      ajaxRequest('hello', {}).catch(response => {
        expect(response.statusText).to.be('400 Bad Request');
        expect(response.error.message).to.be('400 Bad Request');
      }).then(done, done);
    });

    it('should reject the promise on an error', (done) => {
      MockXMLHttpRequest.onRequest = request => {
        request.error(new Error('Denied!'));
      };
      ajaxRequest('hello', {}).catch(response => {
        expect(response.statusText).to.be('');
        expect(response.error.message).to.be('Denied!');
      }).then(done, done);
    });

  });

  describe('#loadObject()', () => {

    it('should accept a name and a module name to load', done => {
      // The path is relative to mocha.
      loadObject('test', '../../../test/build/target').then(func => {
        expect(func()).to.be(1);
      }).then(done, done);
    });

    it('should reject if the module name is not found', done => {
      loadObject('test', 'foo').catch(error => {
        expect(error.message.indexOf("Cannot find module 'foo'")).to.not.be(-1);
      }).then(done, done);
    });

    it('should reject if the object is not found', done => {
      loadObject('foo', '../../../test/build/target').catch(error => {
        expect(error.message).to.be("Object 'foo' not found in module '../../../test/build/target'");
      }).then(done, done);
    });

    it('should accept a registry', done => {
      let registry = { test: () => { return 1; }};
      loadObject('test', void 0, registry).then(func => {
        expect(func()).to.be(1);
      }).then(done, done);
    });

    it('should reject if the object is not in the registry', done => {
      let registry = { test: () => { return 1; }};
      loadObject('foo', void 0, registry).catch(error => {
        expect(error.message).to.be("Object 'foo' not found in registry");
      }).then(done, done);
    });

  });

});
