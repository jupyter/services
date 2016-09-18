// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  deepEqual
} from 'phosphor/lib/algorithm/json';

import {
  TerminalSession
} from '../../lib/terminal';

import {
  MockTerminalManager, MockTerminalSession
} from '../../lib/mockterminals';


describe('mockterminals', () => {

  describe('MockTerminalManager', () => {

    describe('#constructor()', () => {

      it('should accept no options', () => {
        let manager = new MockTerminalManager();
        expect(manager).to.be.a(MockTerminalManager);
      });

    });

    describe('#create()', () => {

      it('should create a new terminal session', (done) => {
        let manager = new MockTerminalManager();
        manager.create().then(session => {
          expect(session).to.be.a(MockTerminalSession);
          expect(session.name).to.be('1');
          return session.shutdown();
        }).then(done, done);
      });

      it('should increment the session numbers', (done) => {
        let manager = new MockTerminalManager();
        manager.create().then(session => {
          expect(session.name).to.be('1');
          return manager.create();
        }).then(session => {
          expect(session.name).to.be('2');
        }).then(done, done);
      });

      it('should accept a terminal name', (done) => {
        let manager = new MockTerminalManager();
        manager.create({ name: 'foo' }).then(session => {
          expect(session.name).to.be('foo');
        }).then(done, done);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down a terminal session by name', (done) => {
        let manager = new MockTerminalManager();
        manager.create({ name: 'foo' }).then(session => {
          return manager.shutdown('foo');
        }).then(done, done);
      });

    });

    describe('#listRunning()', () => {

      it('should list the running session models', (done) => {
        let manager = new MockTerminalManager();
        let models: TerminalSession.IModel[] = [];
        manager.create().then(session => {
          models.push({ name: session.name });
          return manager.create();
        }).then(session => {
          models.push({ name: session.name });
          return manager.listRunning();
        }).then(running => {
          let length = running.length;
          expect(deepEqual(running[length - 2], models[0])).to.be(true);
          expect(deepEqual(running[length - 1], models[1])).to.be(true);
        }).then(done, done);
      });

    });

  });

  describe('MockTerminalSession', () => {

    describe('#messageReceived', () => {

      it('should be emitted when a message is received', () => {
        let session = new MockTerminalSession('foo');
        let called = false;
        session.messageReceived.connect((sender, msg) => {
          expect(sender).to.be(session);
          expect(msg.type).to.be('stdout');
          expect(msg.content).to.eql(['stdin: foo,1,2']);
          called = true;
        });
        session.send({ type: 'stdin', content: ['foo', 1, 2] });
        expect(called).to.be(true);
      });

    });

    describe('#name', () => {

      it('should be the name of the session', () => {
        let session = new MockTerminalSession('foo');
        expect(session.name).to.be('foo');
      });

      it('should be read-only', () => {
        let session = new MockTerminalSession('foo');
        expect(() => { session.name = ''; }).to.throwError();
      });

    });

    describe('#isDisposed', () => {

      it('should test whether the object is disposed', () => {
        let session = new MockTerminalSession('foo');
        expect(session.isDisposed).to.be(false);
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

      it('should be read-only', () => {
        let session = new MockTerminalSession('foo');
        expect(() => { session.isDisposed = false; }).to.throwError();
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources used by the session', () => {
        let session = new MockTerminalSession('foo');
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

      it('should be safe to call more than once', () => {
        let session = new MockTerminalSession('foo');
        session.dispose();
        session.dispose();
        expect(session.isDisposed).to.be(true);
      });

    });

    describe('#send()', () => {

      it('should send a message to the session', () => {
        let session = new MockTerminalSession('foo');
        let called = false;
        session.messageReceived.connect(() => {
          called = true;
        });
        session.send({ type: 'stdin', content: ['foo', 1, 2] });
        expect(called).to.be(true);
      });

    });

    describe('#shutdown()', () => {

      it('should shut down the terminal session', (done) => {
        let session = new MockTerminalSession('foo');
        session.shutdown().then(() => {
          expect(session.isDisposed).to.be(true);
        }).then(done, done);
      });

    });

  });

});
