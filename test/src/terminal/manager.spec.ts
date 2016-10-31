// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

import {
  toArray
} from 'phosphor/lib/algorithm/iteration';

import {
  deepEqual
} from 'phosphor/lib/algorithm/json';

import {
  TerminalSession, TerminalManager
} from '../../../lib/terminal';

import {
  TerminalTester
} from '../utils';


describe('terminals', () => {

  let tester: TerminalTester;
  let manager: TerminalSession.IManager;

  beforeEach(() => {
    tester = new TerminalTester();
    manager = new TerminalManager();
  });

  afterEach(() => {
    manager.dispose();
    tester.dispose();
  });

  describe('TerminalManager', () => {

    describe('#constructor()', () => {

      it('should accept no options', () => {
        expect(manager).to.be.a(TerminalManager);
        manager.dispose();
      });

      it('should accept options', () => {
        manager = new TerminalManager({
          baseUrl: 'foo',
          wsUrl: 'bar',
          ajaxSettings: {}
        });
        expect(manager).to.be.a(TerminalManager);
        manager.dispose();
      });

      it('should trigger a running changed signal', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.runningChanged.connect(() => {
          manager.dispose();
          done();
        });
      });

    });

    describe('#running()', () => {

      it('should give an iterator over the list of running models', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        expect(manager.running().next()).to.be(void 0);
        manager.runningChanged.connect(() => {
          expect(toArray(manager.running())).to.eql(data);
          manager.dispose();
          done();
        });
      });

    });

    describe('#startNew()', () => {

      it('should startNew a new terminal session', (done) => {
        tester.onRequest = () => {
          tester.respond(200, { name: '1' });
        };
        manager.startNew().then(session => {
          expect(session.name).to.be('1');
          done();
        }).catch(done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        manager.startNew().then(session => {
          tester.onRequest = () => {
            tester.respond(204, {});
          };
          return manager.shutdown(session.name);
        }).then(() => {
          done();
        }).catch(done);
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted when the running terminals changed', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), data)).to.be(true);
          done();
        });
        tester.onRequest = () => {
          tester.respond(200, data);
        };
      });

    });

    describe('#refreshRunning()', () => {

      it('should list the running session models', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.refreshRunning().then(models => {
          expect(deepEqual(data, toArray(models))).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

});
