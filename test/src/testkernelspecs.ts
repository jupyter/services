// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {  IKernelSpecId, IKernelSpecIds } from '../../lib/ikernel';

import { getKernelSpecs } from '../../lib/kernel';

import { RequestHandler, ajaxOptions, expectFailure } from './utils';


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


describe('jupyter.services - Kernel', () => {

  describe('getKernelSpecs()', () => {

    it('should load the kernelspecs', (done) => {
      var handler = new RequestHandler();

      var promise = getKernelSpecs('localhost');
      var ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      }
      handler.respond(200, { 'default': 'python',
                             'kernelspecs': ids });
      return promise.then((specs) => {
        var names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var handler = new RequestHandler();

      var promise = getKernelSpecs('localhost', ajaxOptions);
      var ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      }
      handler.respond(200, { 'default': 'python',
                             'kernelspecs': ids });
      return promise.then((specs) => {
        var names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should throw an error for missing default parameter', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      handler.respond(200, { 'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for missing kernelspecs parameter', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      handler.respond(200, { 'default': PYTHON_SPEC.name });
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for incorrect kernelspecs parameter type', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      handler.respond(200, { 'default': PYTHON_SPEC.name, 
                             'kernelspecs': [ PYTHON_SPEC ]
                           });
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for improper name', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 1;
      handler.respond(200, { 'default': 'R', 
                             'kernelspecs': { 'R': R_SPEC } });
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper language', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.language = 1;
      handler.respond(200, { 'default': 'R', 
                             'kernelspecs': { 'R': R_SPEC } });
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper argv', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.argv = 'hello';
      handler.respond(200, { 'default': 'R', 
                             'kernelspecs': { 'R': R_SPEC } });
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper display_name', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.display_name = ['hello'];
      handler.respond(200, { 'default': 'R', 
                             'kernelspecs': { 'R': R_SPEC } });
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for missing resources', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.resources;
      handler.respond(200, { 'default': 'R', 
                             'kernelspecs': { 'R': R_SPEC } });
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var promise = getKernelSpecs('localhost');
      handler.respond(201, { });
      return expectFailure(promise, done, "Invalid Response: 201");
    });

  });
});
