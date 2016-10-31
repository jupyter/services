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
  TerminalSession
} from '../../../lib/terminal';

import {
  TerminalTester
} from '../utils';


describe('terminals', () => {

  let tester: TerminalTester;
  let session: TerminalSession.ISession;

  beforeEach(() => {
    tester = new TerminalTester();
  });

  afterEach(() => {
    if (session) {
      session.dispose();
    }
    tester.dispose();
  });

  describe('TerminalSession', () => {

    describe('.startNew()', () => {

      it('should startNew a terminal session', (done) => {
        TerminalSession.startNew().then(s => {
          session = s;
          expect(session.name).to.be.ok();
          done();
        }).catch(done);
      });

    });

    describe('.connectTo', () => {

      it('should give back an existing session', (done) => {
        TerminalSession.startNew().then(s => {
          session = s;
          return TerminalSession.connectTo(s.name).then(newSession => {
            expect(newSession).to.be(session);
            done();
          });
        }).catch(done);
      });

    });


    describe('.shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        TerminalSession.startNew().then(s => {
          tester.onRequest = () => {
            tester.respond(204, {});
          };
          session = s;
          return TerminalSession.shutdown(s.name);
        }).then(() => {
          done();
        }).catch(done);
      });

    });

    describe('.listRunning()', () => {

      it('should list the running session models', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        TerminalSession.listRunning().then(models => {
          expect(deepEqual(data, toArray(models))).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

  describe('.ISession', () => {

    beforeEach((done) => {
      TerminalSession.startNew().then(s => {
        session = s;
        done();
      });
    });

    afterEach(() => {
      session.dispose();
    });

    describe('#terminated', () => {

      it('should be emitted when the session is shut down', (done) => {
        session.terminated.connect((sender, args) => {
          expect(sender).to.be(session);
          expect(args).to.be(void 0);
          done();
        });
        tester.onRequest = () => {
          tester.respond(204, {});
        };
        session.shutdown();
      });

    });

    describe('#messageReceived', () => {

      it('should be emitted when a message is received', (done) => {
        session.messageReceived.connect((sender, msg) => {
          expect(sender).to.be(session);
          expect(msg.type).to.be('stdout');
          expect(toArray(msg.content)).to.eql(['foo bar']);
          done();
        });
        tester.sendRaw(JSON.stringify(['stdout', 'foo bar']));
      });

    });

    describe('#name', () => {

      it('should be the name of the session', (done) => {
        session.dispose();
        tester.onRequest = () => {
          tester.respond(200, { name: 'foo' });
        };
        TerminalSession.startNew().then(s => {
          session = s;
          expect(session.name).to.be('foo');
          done();
        }).catch(done);
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the object is disposed', () => {
        expect(session.isDisposed).to.be(false);
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources used by the session', () => {
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

      it('should be safe to call more than once', () => {
        session.dispose();
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

    });

    describe('#send()', () => {

      it('should send a message to the socket', (done) => {
        tester.onMessage(msg => {
          expect(msg.type).to.be('stdin');
          done();
        });
        session.send({ type: 'stdin', content: [1, 2] });
      });

    });

    describe('#shutdown()', () => {

      it('should shut down the terminal session', (done) => {
        tester.onRequest = () => {
          tester.respond(204, {});
        };
        session.shutdown().then(done, done);
      });

    });

  });

});
