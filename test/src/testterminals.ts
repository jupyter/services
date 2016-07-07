// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  MockSocket, MockSocketServer
} from 'jupyter-js-utils/lib/mocksocket';

import {
  ITerminalSession, TerminalManager, createTerminalSession
} from '../../lib/terminals';

import {
  JSONValue, deepEqual
} from '../../lib/json';

import {
  RequestHandler
} from './utils';


describe('terminals', () => {

  describe('createTerminalSession()', () => {

    it('should create a terminal session', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { name: '1' });
      });
      createTerminalSession().then(session => {
        expect(session.name).to.be('1');
        done();
      }).catch(done);
    });

    it('should give back an existing session', (done) => {
      createTerminalSession({ name: 'foo' }).then(session => {
        return createTerminalSession({ name: 'foo' }).then(newSession => {
          expect(newSession).to.be(session);
          done();
        });
      }).catch(done);
    });

  });

  describe('TerminalManager', () => {

    describe('#constructor()', () => {

      it('should accept no options', () => {
        let manager = new TerminalManager();
        expect(manager).to.be.a(TerminalManager);
      });

      it('should accept options', () => {
        let manager = new TerminalManager({
          baseUrl: 'foo',
          wsUrl: 'bar',
          ajaxSettings: {}
        });
        expect(manager).to.be.a(TerminalManager);
      });

    });

    describe('#createNew()', () => {

      it('should create a new terminal session', (done) => {
        let manager = new TerminalManager();
        let handler = new RequestHandler(() => {
          handler.respond(200, { name: '1' });
        });
        manager.createNew().then(session => {
          expect(session.name).to.be('1');
          done();
        }).catch(done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        let manager = new TerminalManager();
        let handler = new RequestHandler(() => {
          handler.respond(204, {});
        });
        manager.createNew({ name: 'foo' }).then(session => {
          return manager.shutdown('foo');
        }).then(() => {
          done();
        }).catch(done);
      });

    });

    describe('#listRunning()', () => {

      it('should list the running session models', (done) => {
        let data: ITerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        let handler = new RequestHandler(() => {
          handler.respond(200, data);
        });
        let manager = new TerminalManager();
        manager.listRunning().then(models => {
          expect(deepEqual(data, models)).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

  describe('ITerminalSession', () => {

    describe('#onMessage', () => {

      it('should be called when a message is received', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          session.onMessage = msg => {
            expect(msg.type).to.be('stdout');
            expect(msg.content).to.eql(['foo bar']);
            done();
          };
          let server = MockSocketServer.servers[session.url];
          server.send(JSON.stringify(['stdout', 'foo bar']));
        }).catch(done);
      });

    });

    describe('#name', () => {

      it('should be the name of the session', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          expect(session.name).to.be('foo');
          done();
        }).catch(done);
      });

      it('should be read-only', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          expect(() => { session.name = ''; }).to.throwError();
          done();
        }).catch(done);
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the object is disposed', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          expect(session.isDisposed).to.be(false);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

      it('should be read-only', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          expect(() => { session.isDisposed = false; }).to.throwError();
          done();
        }).catch(done);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources used by the session', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

      it('should be safe to call more than once', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          session.dispose();
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

    });

    describe('#send()', () => {

      it('should send a message to the socket', (done) => {
        createTerminalSession({ name: 'foo' }).then(session => {
          let server = MockSocketServer.servers[session.url];
          server.onmessage = (msg: any) => {
            let data = JSON.parse(msg.data) as any[];
            expect(data).to.eql(['stdin', 1, 2]);
            done();
          };
          session.send({ type: 'stdin', content: [1, 2] });
        }).catch(done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down the terminal session', (done) => {
        let handler = new RequestHandler(() => {
          handler.respond(204, {});
        });
        createTerminalSession({ name: 'foo' }).then(session => {
          return session.shutdown();
        }).then(done, done);
      });

    });

  });

});
