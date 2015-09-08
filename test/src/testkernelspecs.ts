// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {  IKernelSpecId } from '../../lib/ikernel';

import { listKernelSpecs } from '../../lib/kernel';

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


describe('jupyter.services - Kernel', () => {

  describe('listKernelSpecs()', () => {

    it('should load the kernelspecs', (done) => {
      var handler = new RequestHandler();

      var list = listKernelSpecs('localhost');
      handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return list.then((specs) => {
        expect(specs[0].name).to.be(PYTHON_SPEC.name);
        expect(specs[1].name).to.be(PYTHON3_SPEC.name);
        done();
      });
    });

    it('should throw an error for missing default parameter', (done) => {
      var handler = new RequestHandler();
      var list = listKernelSpecs('localhost');
      handler.respond(200, { 'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return expectFailure(list, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for missing kernelspecs parameter', (done) => {
      var handler = new RequestHandler();
      var list = listKernelSpecs('localhost');
      handler.respond(200, { 'default': PYTHON_SPEC.name });
      return expectFailure(list, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for incorrect kernelspecs parameter type', (done) => {
      var handler = new RequestHandler();
      var list = listKernelSpecs('localhost');
      handler.respond(200, { 'default': PYTHON_SPEC.name, 
                             'kernelspecs': PYTHON_SPEC });
      return expectFailure(list, done, "Invalid KernelSpecs info");
    });

    it('should throw an error for incorrect kernelspec id', (done) => {
      var handler = new RequestHandler();
      var list = listKernelSpecs('localhost');
      var R_SPEC: IKernelSpecId = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.spec.env;
      handler.respond(200, { 'default': PYTHON_SPEC.name, 
                             'kernelspecs': [R_SPEC] });
      return expectFailure(list, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var list = listKernelSpecs('localhost');
      handler.respond(201, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      return expectFailure(list, done, "Invalid Response: 201");
    });

  });
});
