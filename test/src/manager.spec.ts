// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  ContentsManager
} from '../../lib/contents';

import {
  deepEqual
} from 'phosphor/lib/algorithm/json';

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
      expect(manager.kernelspecs).to.be(null);
    });

    afterEach(() => {
      manager.dispose();
    });

    describe('#constructor()', () => {

      it('should create a new session manager', () => {
        expect(manager).to.be.a(ServiceManager);
      });

      it('should trigger a kernel spec update', (done) => {
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager = new ServiceManager();
        manager.specsChanged.connect(() => {
          done();
        });
      });

    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager = new ServiceManager();
        manager.specsChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(args.default).to.be(KERNELSPECS.default);
          done();
        });
      });

    });

    describe('#kernelspecs', () => {

      it('should be the kernel specs used by the manager', () => {
        expect(manager.kernelspecs.default).to.be(KERNELSPECS.default);
      });

    });

    describe('#kernels', () => {

      it('should be the kernel manager instance', () => {
        expect(manager.kernels).to.be.a(KernelManager);
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
