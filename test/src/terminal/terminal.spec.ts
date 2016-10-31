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
          expect(session.name).to.be('1');
          done();
        }).catch(done);
      });

      it('should give back an existing session', (done) => {
        TerminalSession.startNew({ name: 'foo' }).then(s => {
          session = s;
          return TerminalSession.startNew({ name: 'foo' }).then(newSession => {
            expect(newSession).to.be(session);
            done();
          });
        }).catch(done);
      });

    });


    describe('.shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        tester.onRequest = () => {
          tester.respond(204, {});
        };
        TerminalSession.startNew({ name: 'foo' }).then(s => {
          session = s;
          return TerminalSession.shutdown('foo');
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

  describe('TerminalManager', () => {

    describe('#constructor()', () => {

      it('should accept no options', () => {
        let manager = new TerminalManager();
        expect(manager).to.be.a(TerminalManager);
        manager.dispose();
      });

      it('should accept options', () => {
        let manager = new TerminalManager({
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
        let manager = new TerminalManager();
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
        let manager = new TerminalManager();
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
        let manager = new TerminalManager();
        tester.onRequest = () => {
          tester.respond(200, { name: '1' });
        };
        manager.startNew().then(s => {
          session = s;
          expect(session.name).to.be('1');
          done();
        }).catch(done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        let manager = new TerminalManager();
        tester.onRequest = () => {
          tester.respond(204, {});
        };
        manager.startNew({ name: 'foo' }).then(s => {
          session = s;
          return manager.shutdown('foo');
        }).then(() => {
          done();
        }).catch(done);
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted when the running terminals changed', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        let manager = new TerminalManager();
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
        let manager = new TerminalManager();
        manager.refreshRunning().then(models => {
          expect(deepEqual(data, toArray(models))).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

  describe('TerminalSession.ISession', () => {

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
        TerminalSession.startNew({ name: 'foo' }).then(s => {
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
