// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

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

  beforeEach(() => {
    tester = new TerminalTester();
  });

  afterEach(() => {
    tester.dispose();
  });

  describe('TerminalSession.open()', () => {

    it('should create a terminal session', (done) => {
      TerminalSession.open().then(session => {
        expect(session.name).to.be('1');
        done();
      }).catch(done);
    });

    it('should give back an existing session', (done) => {
      TerminalSession.open({ name: 'foo' }).then(session => {
        return TerminalSession.open({ name: 'foo' }).then(newSession => {
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

    describe('#create()', () => {

      it('should create a new terminal session', (done) => {
        let manager = new TerminalManager();
        tester.onRequest = () => {
          tester.respond(200, { name: '1' });
        };
        manager.create().then(session => {
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
        manager.create({ name: 'foo' }).then(session => {
          return manager.shutdown('foo');
        }).then(() => {
          done();
        }).catch(done);
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted in listRunning when the running terminals changed', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        let manager = new TerminalManager();
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(args, data)).to.be(true);
          done();
        });
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.listRunning();
      });

    });

    describe('#listRunning()', () => {

      it('should list the running session models', (done) => {
        let data: TerminalSession.IModel[] = [{ name: 'foo'}, { name: 'bar' }];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        let manager = new TerminalManager();
        manager.listRunning().then(models => {
          expect(deepEqual(data, models)).to.be(true);
          done();
        }).catch(done);
      });

    });

  });

  describe('ITerminalSession', () => {

    describe('#messageReceived', () => {

      it('should be emitted when a message is received', (done) => {
        tester.onConnect(ws => {
          ws.send(JSON.stringify(['stdout', 'foo bar']));
        });
        TerminalSession.open().then(session => {
          session.messageReceived.connect((sender, msg) => {
            expect(sender).to.be(session);
            expect(msg.type).to.be('stdout');
            expect(msg.content).to.eql(['foo bar']);
            done();
          });
        }).catch(done);
      });

    });

    describe('#name', () => {

      it('should be the name of the session', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          expect(session.name).to.be('foo');
          done();
        }).catch(done);
      });

      it('should be read-only', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          expect(() => { session.name = ''; }).to.throwError();
          done();
        }).catch(done);
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the object is disposed', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          expect(session.isDisposed).to.be(false);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

      it('should be read-only', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          expect(() => { session.isDisposed = false; }).to.throwError();
          done();
        }).catch(done);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources used by the session', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

      it('should be safe to call more than once', (done) => {
        TerminalSession.open({ name: 'foo' }).then(session => {
          session.dispose();
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        }).catch(done);
      });

    });

    describe('#send()', () => {

      it('should send a message to the socket', (done) => {
        tester.onConnect(ws => {
          ws.send(JSON.stringify(['stdout', 'foo bar']));
          ws.on('message', msg => {
            let data = JSON.parse(msg) as any[];
            expect(data).to.eql(['stdin', 1, 2]);
            done();
          });
        });
        TerminalSession.open().then(session => {
          session.send({ type: 'stdin', content: [1, 2] });
        }).catch(done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down the terminal session', (done) => {
        tester.onRequest = () => {
          tester.respond(204, {});
        };
        TerminalSession.open({ name: 'foo' }).then(session => {
          return session.shutdown();
        }).then(done, done);
      });

    });

  });

});
