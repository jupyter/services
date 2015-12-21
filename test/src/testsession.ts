// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  KernelStatus
} from '../../lib/ikernel';

import {
  NotebookSessionManager, connectToSession, listRunningSessions,
  startNewSession
} from '../../lib/session';

import {
  INotebookId, INotebookSession, ISessionId, ISessionOptions
} from '../../lib/isession';

import { deserialize, serialize } from '../../lib/serialize';

import { uuid } from '../../lib/utils';

import { KernelTester } from './testkernel';

import { RequestHandler, ajaxSettings, expectFailure, doLater } from './utils';


/**
 * Create a unique session id.
 */
function createSessionId(): ISessionId {
  return {
    id: uuid(),
    notebook: { path: uuid() },
    kernel: { id: uuid(), name: uuid() }
  }
}


/**
 * Create session options based on a sessionId.
 */
function createSessionOptions(sessionId?: ISessionId): ISessionOptions {
  sessionId = sessionId || createSessionId();
  return {
    notebookPath: sessionId.notebook.path,
    kernelName: sessionId.kernel.name,
    baseUrl: "http://localhost:8888",
    wsUrl: "ws://localhost:8888"
  }
}


describe('jupyter.services - session', () => {

  describe('listRunningSessions()', () => {

    it('should yield a list of valid session ids', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions('http://localhost:8888');
      var sessionIds = [createSessionId(), createSessionId()];
      handler.respond(200, sessionIds);
      return list.then((response: ISessionId[]) => {
        expect(response[0]).to.eql(sessionIds[0]);
        expect(response[1]).to.eql(sessionIds[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions({ ajaxSettings: ajaxSettings });
      var sessionIds = [createSessionId(), createSessionId()];
      handler.respond(200, sessionIds);
      return list.then((response: ISessionId[]) => {
        expect(response[0]).to.eql(sessionIds[0]);
        expect(response[1]).to.eql(sessionIds[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions('http://localhost:8888');
      var data = { id: "1234", notebook: { path: "test" } };
      handler.respond(200, data);
      expectFailure(list, done, "Invalid Session list");
    });

    it('should throw an error for another invalid model', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions('http://localhost:8888');
      var data = [{ id: "1234", kernel: { id: '', name: '' }, notebook: { } }];
      handler.respond(200, data);
      expectFailure(list, done, "Invalid Notebook Model");
    });

    it('should fail for wrong response status', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions('http://localhost:8888');
      handler.respond(201, [createSessionId()]);
      expectFailure(list, done, "Invalid Status: 201");
    });

    it('should fail for error response status', (done) => {
      var handler = new RequestHandler();
      var list = listRunningSessions('http://localhost:8888');
      handler.respond(500, {});
      expectFailure(list, done, '');
    });

  });

  describe('startNewSession()', () => {

    it('should start a session', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      tester.respond(201, sessionId)
      tester.onRequest = () => {
        tester.respond(200, [ { name: sessionId.kernel.name,
                                id: sessionId.kernel.id }]);
      }
      return sessionPromise.then((session) => {
        expect(session.id).to.be(sessionId.id);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      options.ajaxSettings = ajaxSettings
      var sessionPromise = startNewSession(options);
      tester.respond(201, sessionId)
      tester.onRequest = () => {
        tester.respond(200, [ { name: sessionId.kernel.name,
                                id: sessionId.kernel.id }]);
      }
      return sessionPromise.then((session) => {
        expect(session.id).to.be(sessionId.id);
        done();
      });
    });

    it('should fail if the websocket fails', (done) => {
      var tester = new KernelTester('dead');
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      tester.respond(201, sessionId);
      tester.onRequest = () => {
        tester.respond(200, [ { name: sessionId.kernel.name,
                                id: sessionId.kernel.id }]);
      }
      expectFailure(sessionPromise, done, 'Session failed to start');
    });

    it('should fail for wrong response status', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      tester.respond(200, sessionId);
      expectFailure(sessionPromise, done, 'Invalid Status: 200');
    });

    it('should fail for error response status', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      tester.respond(500, {});
      expectFailure(sessionPromise, done, '');
    });

    it('should fail for wrong response model', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      var data = {
        id: 1, kernel: { name: '', id: '' }, notebook: { path: ''}
      };
      tester.respond(201, data);
      expectFailure(sessionPromise, done, 'Invalid Session Model');
    });

    it('should fail if the kernel is not running', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = startNewSession(options);
      tester.respond(201, sessionId)
      tester.onRequest = () => {
        tester.respond(200, []);
      }
      expectFailure(sessionPromise, done, 'Session failed to start');
    });
  });

  describe('connectToSession()', () => {

    it('should connect to a running session', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      startSession(sessionId).then((session) => {
        connectToSession(sessionId.id).then((newSession) => {
          expect(newSession.id).to.be(sessionId.id);
          done();
        });
      });
    });

    it('should connect to a client session if given session options', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = connectToSession(sessionId.id, options);
      tester.respond(200, [sessionId]);
      tester.onRequest = () => {
        tester.respond(200, [ { name: sessionId.kernel.name,
                                id: sessionId.kernel.id }]);
      }
      sessionPromise.then((session) => {
        expect(session.id).to.be(sessionId.id);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      options.ajaxSettings = ajaxSettings
      var sessionPromise = connectToSession(sessionId.id, options);
      tester.respond(200, [sessionId]);
      tester.onRequest = () => {
        tester.respond(200, [ { name: sessionId.kernel.name,
                                id: sessionId.kernel.id }]);
      }
      sessionPromise.then((session) => {
        expect(session.id).to.be(sessionId.id);
        done();
      });
    });

    it('should fail if not given session options', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var sessionPromise = connectToSession(sessionId.id);
      expectFailure(sessionPromise, done, 'Please specify session options');
    });

    it('should fail if session is not available', (done) => {
      var tester = new KernelTester();
      var sessionId = createSessionId();
      var options = createSessionOptions(sessionId);
      var sessionPromise = connectToSession(sessionId.id, options);
      tester.respond(200, []);
      expectFailure(
        sessionPromise, done, 'No running session with id: ' + sessionId.id
      );
    });
  });

  describe('INotebookSession', () => {

    context('#sessionDied', () => {

      it('should emit when the session dies', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          session.sessionDied.connect(() => {
            done();
          });
          tester.sendStatus('dead');
          tester.onRequest = () => {
            tester.respond(204, { });
          }
        });
      });
    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        var id = createSessionId();
        startSession(id).then((session) => {
          expect(typeof session.id).to.be('string');
          expect(() => { session.id = "1"; }).to.throwError();
          done();
        });
      });
    });

    context('#notebookPath', () => {

      it('should be a read only string', (done) => {
        var id = createSessionId();
        startSession(id).then((session) => {
          expect(typeof session.notebookPath).to.be('string');
          expect(() => { session.notebookPath = '' }).to.throwError();
          done();
        });
      });
    });

    context('#kernel', () => {

      it('should be a read only IKernel object', (done) => {
        var id = createSessionId();
        startSession(id).then((session) => {
          expect(typeof session.kernel.id).to.be('string');
          expect(() => { session.kernel = null }).to.throwError();
          done();
        });
      });
    });

    context('#kernel', () => {

      it('should be a read only delegate to the kernel status', (done) => {
        var id = createSessionId();
        startSession(id).then((session) => {
          expect(session.status).to.be(session.kernel.status);
          expect(() => { session.status = 0 }).to.throwError();
          done();
        });
      });
    });

    context('#renameNotebook()', () => {

      it('should rename the notebook', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        var newPath = '/foo.ipynb';
        startSession(id, tester).then((session) => {
          var promise = session.renameNotebook(newPath);
          var newId = JSON.parse(JSON.stringify(id));
          newId.notebook.path = newPath;
          tester.respond(200, newId);
          promise.then(() => {
            expect(session.notebookPath).to.be(newPath);
            done();
          })
        })
      });

      it('should accept ajax options', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        var newPath = '/foo.ipynb';
        startSession(id, tester).then((session) => {
          var promise = session.renameNotebook(newPath, ajaxSettings);
          var newId = JSON.parse(JSON.stringify(id));
          newId.notebook.path = newPath;
          tester.respond(200, newId);
          promise.then(() => {
            expect(session.notebookPath).to.be(newPath);
            done();
          })
        })
      });

      it('should fail for improper response status', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        var newPath = '/foo.ipynb';
        startSession(id, tester).then((session) => {
          var promise = session.renameNotebook(newPath);
          tester.respond(201, { });
          expectFailure(promise, done, 'Invalid Status: 201');
        })
      });

      it('should fail for error response status', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        var newPath = '/foo.ipynb';
        startSession(id, tester).then((session) => {
          var promise = session.renameNotebook(newPath);
          tester.respond(500, { });
          expectFailure(promise, done, '');
        })
      });

      it('should fail for improper model', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        var newPath = '/foo.ipynb';
        startSession(id, tester).then((session) => {
          var promise = session.renameNotebook(newPath);
          tester.respond(200, { });
          expectFailure(promise, done, 'Invalid Session Model');
        })
      });

      it('should fail if the session is dead', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        startSession(id, tester).then((session) => {
          var shutdown = session.shutdown();
          expectFailure(session.renameNotebook(''), done, 'Session is dead');
        });
      });
    });

    context('#shutdown()', () => {

      it('should shut down properly', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown();
          tester.respond(204, { });
          promise.then(() => {
            done();
          })
        });
      });

      it('should emit a sessionDied signal', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown();
          session.sessionDied.connect(() => {
            done();
          })
          tester.respond(204, { });
        });
      });

      it('should accept ajax options', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown(ajaxSettings);
          tester.respond(204, { });
          promise.then(() => {
            done();
          })
        });
      });

      it('should fail for an incorrect response status', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown();
          tester.respond(200, { });
          expectFailure(promise, done, 'Invalid Status: 200');
        });
      });

      it('should handle a specific error status', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown();
          tester.respond(410, { });
          expectFailure(
            promise, done, 'The kernel was deleted but the session was not'
          );
        });
      });

      it('should fail for an error response status', (done) => {
        var tester = new KernelTester();
        var sessionId = createSessionId();
        startSession(sessionId, tester).then((session) => {
          var promise = session.shutdown();
          tester.respond(500, { });
          expectFailure(promise, done, '');
        });
      });

      it('should fail if the session is dead', (done) => {
        var tester = new KernelTester();
        var id = createSessionId();
        startSession(id, tester).then((session) => {
          var shutdown = session.shutdown();
          tester.respond(204, { });
          shutdown.then(() => {
            expectFailure(session.shutdown(), done, 'Session is dead');
          });
        });
      });
    });
  });

  describe('NotebookSessionManager', () => {

    describe('#constructor()', () => {

      it('should take the options as an argument', () => {
        let manager = new NotebookSessionManager(createSessionOptions());
        expect(manager instanceof NotebookSessionManager).to.be(true);
      });

    });

    describe('#listRunning()', () => {

      it('should return a list of session ids', (done) => {
        let handler = new RequestHandler();
        let manager = new NotebookSessionManager(createSessionOptions());
        let list = manager.listRunning();
        let sessionIds = [createSessionId(), createSessionId()];
        handler.respond(200, sessionIds);
        return list.then((response: ISessionId[]) => {
          expect(response[0]).to.eql(sessionIds[0]);
          expect(response[1]).to.eql(sessionIds[1]);
          done();
        });

      });

    });

    describe('#startNew()', () => {

      it('should start a session', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let manager = new NotebookSessionManager(createSessionOptions(id));
        let sessionPromise = manager.startNew({ notebookPath: 'test.ipynb'});
        tester.respond(201, id)
        tester.onRequest = () => {
          tester.respond(200, [ { name: id.kernel.name,
                                  id: id.kernel.id }]);
        }
        return sessionPromise.then(session => {
          expect(session.id).to.be(id.id);
          done();
        });
      });

    });

    describe('#connectTo()', () => {

      it('should connect to a running session', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let manager = new NotebookSessionManager(createSessionOptions(id));
        manager.startNew({ notebookPath: 'test.ipynb' }
        ).then(session => {
          manager.connectTo(session.id).then(newSession => {
            expect(newSession).to.be(session);
            done();
          });
        });

        tester.respond(201, id);
        tester.onRequest = () => {
          tester.respond(200, [ { name: id.kernel.name,
                                  id: id.kernel.id }]);
        }

      });

    });

  });

});


/**
 * Start a session with the given options.
 */
function startSession(sessionId: ISessionId, tester?: KernelTester): Promise<INotebookSession> {
  var tester = tester || new KernelTester();
  var options = createSessionOptions(sessionId);
  var sessionPromise = startNewSession(options);
  tester.respond(201, sessionId);
  tester.onRequest = () => {
    tester.respond(200, [ { name: sessionId.kernel.name,
                            id: sessionId.kernel.id }]);
  }
  return sessionPromise;
}
