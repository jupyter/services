// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  ContentsManager
} from '../../lib/contents';

import {
  ServiceManager
} from '../../lib/manager';

import {
  KernelManager
} from '../../lib/kernel';

import {
  SessionManager
} from '../../lib/session';

import {
  TerminalManager
} from '../../lib/terminal';

import {
  RequestHandler, KERNELSPECS
} from './utils';


describe('manager', () => {

  describe('SessionManager', () => {

    let manager: ServiceManager.IManager;

    beforeEach((done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, KERNELSPECS);
        done();
      });
      manager = new ServiceManager();
    });

    afterEach(() => {
      manager.dispose();
    });

    describe('#constructor()', () => {

      it('should create a new session manager', () => {
        expect(manager).to.be.a(ServiceManager);
      });

    });

    describe('#sessions', () => {

      it('should be the sessions manager instance', () => {
        expect(manager.sessions).to.be.a(SessionManager);
      });

    });

    describe('#contents', () => {

      it('should be the contents manager instance', () => {
        expect(manager.contents).to.be.a(ContentsManager);
      });

    });

    describe('#terminals', () => {

      it('should be the terminal manager instance', () => {
        expect(manager.terminals).to.be.a(TerminalManager);
      });

    });

  });

});
