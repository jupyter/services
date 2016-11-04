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
  let data: TerminalSession.IModel[] =  [{ name: 'foo'}, { name: 'bar' }];

  beforeEach((done) => {
    tester = new TerminalTester();
    tester.onRequest = () => {
      tester.respond(200, data);
    };
    manager = new TerminalManager();
    return manager.ready().then(done, done);
  });

  afterEach(() => {
    manager.dispose();
    tester.dispose();
  });

  describe('TerminalManager', () => {

    describe('#constructor()', () => {

      it('should accept no options', () => {
        manager.dispose();
        manager = new TerminalManager();
        expect(manager).to.be.a(TerminalManager);
      });

      it('should accept options', () => {
        manager.dispose();
        manager = new TerminalManager({
          baseUrl: 'foo',
          wsUrl: 'bar',
          ajaxSettings: {}
        });
        expect(manager).to.be.a(TerminalManager);
      });

    });

    describe('#baseUrl', () => {

      it('should get the base url of the server', () => {
        manager.dispose();
        manager = new TerminalManager({ baseUrl: 'foo' });
        expect(manager.baseUrl).to.be('foo');
      });

    });

    describe('#wsUrl', () => {

      it('should get the ws url of the server', () => {
        manager.dispose();
        manager = new TerminalManager({ wsUrl: 'bar' });
        expect(manager.wsUrl).to.be('bar');
      });

    });

    describe('#ajaxSettings', () => {

      it('should get the ajax sessions of the server', () => {
        let ajaxSettings = { withCredentials: true };
        manager.dispose();
        manager = new TerminalManager({ ajaxSettings });
        expect(manager.ajaxSettings).to.eql(ajaxSettings);
      });

    });

    describe('#ready()', () => {

      it('should resolve when the manager is ready', (done) => {
        manager.ready().then(done, done);
      });

    });

    describe('#running()', () => {

      it('should give an iterator over the list of running models', () => {
        expect(toArray(manager.running())).to.eql(data);
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
        let newData: TerminalSession.IModel[] = [{ name: 'foo'}];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), newData)).to.be(true);
          done();
        });
        tester.onRequest = () => {
          tester.respond(200, newData);
        };
        manager.refreshRunning();
      });

    });

    describe('#refreshRunning()', () => {

      it('should update the running session models', (done) => {
        let newData: TerminalSession.IModel[] = [{ name: 'foo'}];
        tester.onRequest = () => {
          tester.respond(200, newData);
        };
        manager.refreshRunning().then(() => {
          let running = toArray(manager.running());
          expect(deepEqual(newData, running)).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

});
