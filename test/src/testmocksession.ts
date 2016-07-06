// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  KERNELSPECS
} from '../../lib/mockkernel';

import {
  MockSession, MockSessionManager
} from '../../lib/mocksession';


describe('mocksession', () => {

  describe('MockSessionManager', () => {

    describe('#getSpecs()', () => {

      it('should get the kernel specs', (done) => {
        let manager = new MockSessionManager();
        manager.getSpecs().then(specs => {
          expect(specs).to.be(KERNELSPECS);
          done();
        });
      });

    });

    describe('#listRunning()', () => {

      it('should list the running sessions', (done) => {
        let manager = new MockSessionManager();
        let id0: string;
        let id1: string;
        manager.startNew({}).then(session => {
          id0 = session.id;
          return manager.startNew({});
        }).then(session => {
          id1 = session.id;
          return manager.listRunning();
        }).then(response => {
          expect(response.filter(value => value.id === id0).length).to.be(1);
          expect(response.filter(value => value.id === id1).length).to.be(1);
          done();
        }).catch(done);
      });

    });

    describe('#startNew()', () => {

      it('should start a new session', (done) => {
        let manager = new MockSessionManager();
        manager.startNew({}).then(session => {
          expect(session.kernel.name).to.be(KERNELSPECS.default);
          done();
        }).catch(done);
      });

    });

    describe('#findById()', () => {

      it('should find an existing session by id', (done) => {
        let manager = new MockSessionManager();
        manager.startNew({}).then(session => {
          return manager.findById(session.id);
        }).then(model => {
          expect(model.kernel.name).to.be(KERNELSPECS.default);
          return manager.findById('');
        }).then(model => {
          expect(model).to.be(void 0);
          done();
        }).catch(done);
      });

    });

    describe('#findByPath()', () => {

      it('should find an existing session by path', (done) => {
        let manager = new MockSessionManager();
        manager.startNew({ path: 'foo' }).then(session => {
          return manager.findById(session.id);
        }).then(model => {
          expect(model.notebook.path).to.be('foo');
          return manager.findByPath('');
        }).then(model => {
          expect(model).to.be(void 0);
          done();
        }).catch(done);
      });

    });

    describe('#connectTo()', () => {

      it('should connect to an existing session', (done) => {
        let session = new MockSession();
        let manager = new MockSessionManager();
        manager.connectTo(session.id).then(newSession => {
          expect(newSession.id).to.be(session.id);
          done();
        }).catch(done);
      });

    });

  });

});
