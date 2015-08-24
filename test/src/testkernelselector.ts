// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  IKernelSpecId, KernelSelector
} from '../../lib/kernelselector';


import { RequestHandler, expectFailure } from './utils';


var PYTHON_SPEC: IKernelSpecId = {
  name: "Python",
  spec: {
    language: "python",
    argv: [],
    display_name: "python",
    codemirror_mode: "python",
    env: {},
    help_links: [ { text: "re", url: "reUrl" }]
  },
  resources: { foo: 'bar' },
}

var PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = "Python3";
PYTHON3_SPEC.spec.display_name = "python3"


describe('jupyter.services - KernelSelector', () => {

  describe('#constructor()', () => {

    it('should create a new KernelSelector', (done) => {
      var session = new KernelSelector('localhost');
      done();
    });

  });

  describe('#load()', () => {

    it('should load the kernelspecs', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return load.then((names: string[]) => {
        expect(names[0]).to.be(PYTHON_SPEC.name);
        expect(names[1]).to.be(PYTHON3_SPEC.name);
        expect(selector.names[0]).to.be(PYTHON_SPEC.name);
        expect(selector.names[1]).to.be(PYTHON3_SPEC.name);
        done();
      });
    });

    it('should throw an error for missing default parameter', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(200, { 'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return expectFailure(load, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for missing kernelspecs parameter', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(200, { 'default': PYTHON_SPEC.name });
      return expectFailure(load, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for incorrect kernelspecs parameter type', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(200, { 'default': PYTHON_SPEC.name, 
                             'kernelspecs': PYTHON_SPEC });
      return expectFailure(load, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for incorrect kernelspec id', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      var R_SPEC: IKernelSpecId = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.spec.env;
      handler.respond(200, { 'default': PYTHON_SPEC.name, 
                             'kernelspecs': [R_SPEC] });
      return expectFailure(load, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(201, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return expectFailure(load, done, "Invalid Response: 201");
    });

  });

  describe('#select()', () => {

    it('should select by name', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return load.then((names: string[]) => {
        var spec = selector.select(PYTHON_SPEC.name);
        expect(spec.spec.display_name).to.be(PYTHON_SPEC.spec.display_name);
        done();
      });
    });
  });

  describe('#findByLanguage()', () => {

    it('should find by languague', (done) => {
      var handler = new RequestHandler();
      var selector = new KernelSelector('localhost');

      var load = selector.load();
      var R_SPEC: IKernelSpecId = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 'R';
      R_SPEC.spec.language = 'R';
      handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC,
                                             R_SPEC] });
      return load.then((names: string[]) => {
        var names = selector.findByLanguage('Python');
        expect(names[0]).to.be(PYTHON_SPEC.name);
        expect(names[1]).to.be(PYTHON3_SPEC.name);
        done();
      });
    });
  });
});
