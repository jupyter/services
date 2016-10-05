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
  IServiceManager, createServiceManager
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

  describe('createServiceManager()', () => {

    it('should accept no arguments', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, KERNELSPECS);
      });
      createServiceManager().then(manager => {
        expect(manager.kernels).to.be.a(KernelManager);
        done();
      }).catch(done);
    });

    it('should accept arguments', (done) => {
      let options = {
        baseUrl: 'foo',
        kernelspecs: KERNELSPECS
      };
      createServiceManager(options).then(manager => {
        expect(manager.kernels).to.be.a(KernelManager);
        done();
      }).catch(done);
    });

  });

  describe('SessionManager', () => {

    let manager: IServiceManager;

    beforeEach((done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, KERNELSPECS);
      });
      createServiceManager().then(value => {
        manager = value;
        done();
      });
    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        manager.specsChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(args, KERNELSPECS)).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager.kernels.getSpecs();
      });

    });

    describe('#kernelspecs', () => {

      it('should be the kernel specs used by the manager', () => {
        expect(deepEqual(manager.kernelspecs, KERNELSPECS)).to.be(true);
      });

      it('should be read-only', () => {
        expect(() => { manager.kernelspecs = null; }).to.throwError();
      });

    });

    describe('#kernels', () => {

      it('should be the kernel manager instance', () => {
        expect(manager.kernels).to.be.a(KernelManager);
      });

      it('should be read-only', () => {
        expect(() => { manager.kernels = null; }).to.throwError();
      });

    });

    describe('#sessions', () => {

      it('should be the sessions manager instance', () => {
        expect(manager.sessions).to.be.a(SessionManager);
      });

      it('should be read-only', () => {
        expect(() => { manager.sessions = null; }).to.throwError();
      });

    });

    describe('#contents', () => {

      it('should be the contents manager instance', () => {
        expect(manager.contents).to.be.a(ContentsManager);
      });

      it('should be read-only', () => {
        expect(() => { manager.contents = null; }).to.throwError();
      });

    });

    describe('#terminals', () => {

      it('should be the terminal manager instance', () => {
        expect(manager.terminals).to.be.a(TerminalManager);
      });

      it('should be read-only', () => {
        expect(() => { manager.terminals = null; }).to.throwError();
      });

    });

  });

});
