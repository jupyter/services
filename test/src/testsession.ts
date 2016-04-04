// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  uuid
} from 'jupyter-js-utils';

import {
  KernelStatus
} from '../../lib/ikernel';

import {
  createKernelMessage
} from '../../lib/kernel';

import {
  NotebookSessionManager, connectToSession, listRunningSessions,
  startNewSession, findSessionById, findSessionByPath
} from '../../lib/session';

import {
  INotebookId, INotebookSession, ISessionId, ISessionOptions
} from '../../lib/isession';

import {
  deserialize, serialize
} from '../../lib/serialize';

import {
  RequestHandler, ajaxSettings, expectFailure, doLater, KernelTester,
  createKernel
} from './utils';


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
      let sessionIds = [createSessionId(), createSessionId()];
      let handler = new RequestHandler(() => {
        handler.respond(200, sessionIds);
      });
      let list = listRunningSessions('http://localhost:8888');
      list.then((response: ISessionId[]) => {
        expect(response[0]).to.eql(sessionIds[0]);
        expect(response[1]).to.eql(sessionIds[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let sessionIds = [createSessionId(), createSessionId()];
      let handler = new RequestHandler(() => {
        handler.respond(200, sessionIds);
      });
      let list = listRunningSessions({ ajaxSettings: ajaxSettings });
      list.then((response: ISessionId[]) => {
        expect(response[0]).to.eql(sessionIds[0]);
        expect(response[1]).to.eql(sessionIds[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      let data = { id: "1234", notebook: { path: "test" } };
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let list = listRunningSessions('http://localhost:8888');
      expectFailure(list, done, "Invalid Session list");
    });

    it('should throw an error for another invalid model', (done) => {
      let data = [{ id: "1234", kernel: { id: '', name: '' }, notebook: { } }];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let list = listRunningSessions('http://localhost:8888');
      expectFailure(list, done, "Invalid Notebook Model");
    });

    it('should fail for wrong response status', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, [createSessionId()]);
      });
      let list = listRunningSessions('http://localhost:8888');
      expectFailure(list, done, "Invalid Status: 201");
    });

    it('should fail for error response status', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(500, { });
      });
      let list = listRunningSessions('http://localhost:8888');
      expectFailure(list, done, '');
    });

  });

  describe('startNewSession()', () => {

    it('should start a session', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionId);
        } else {
          tester.respond(200, { name: sessionId.kernel.name,
                                  id: sessionId.kernel.id });
        }
      });
      let options = createSessionOptions(sessionId);
      startNewSession(options).then(session => {
        expect(session.id).to.be(sessionId.id);
        session.dispose();
        done();
      });
    });

    it('should be able connect to an existing kernel', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester();
      createKernel(tester).then(kernel => {
        sessionId.kernel.id = kernel.id;
        sessionId.kernel.name = kernel.name;
        tester.onRequest = request => {
          if (request.method === 'POST') {
            tester.respond(201, sessionId);
          } else {
            tester.respond(200, { name: sessionId.kernel.name,
                                    id: sessionId.kernel.id });
          }
        };
        let options = createSessionOptions(sessionId);
        startNewSession(options).then(session => {
          expect(session.id).to.be(sessionId.id);
          session.dispose();
          done();
        });
      });
    });

    it('should accept ajax options', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionId);
        } else {
          tester.respond(200, { name: sessionId.kernel.name,
                                  id: sessionId.kernel.id });
        }
      });
      let options = createSessionOptions(sessionId);
      options.ajaxSettings = ajaxSettings;
      startNewSession(options).then(session => {
        expect(session.id).to.be(sessionId.id);
        session.dispose();
        done();
      });
    });

    it('should start even if the websocket fails', (done) => {
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionId);
        } else {
          tester.respond(200, { name: sessionId.kernel.name,
                                  id: sessionId.kernel.id });
        }
      });
      tester.initialStatus = 'dead';
      let sessionId = createSessionId();
      let options = createSessionOptions(sessionId);
      startNewSession(options).then(session => {
        session.dispose();
        done();
      });
    });

    it('should fail for wrong response status', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(() => {
        tester.respond(200, sessionId);
      });
      let options = createSessionOptions(sessionId);
      let sessionPromise = startNewSession(options);
      expectFailure(sessionPromise, done, 'Invalid Status: 200');
    });

    it('should fail for error response status', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, {});
      });
      let sessionId = createSessionId();
      let options = createSessionOptions(sessionId);
      let sessionPromise = startNewSession(options);
      expectFailure(sessionPromise, done, '');
    });

    it('should fail for wrong response model', (done) => {
      let sessionId = createSessionId();
      let data = {
        id: 1, kernel: { name: '', id: '' }, notebook: { path: ''}
      };
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionId);
        } else {
          tester.respond(200, data);
        }
      });
      let options = createSessionOptions(sessionId);
      let sessionPromise = startNewSession(options);
      let msg = `Session failed to start: No running kernel with id: ${sessionId.kernel.id}`
      expectFailure(sessionPromise, done, msg);
    });

    it('should fail if the kernel is not running', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionId);
        } else {
          tester.respond(400, {});
        }
      });
      let options = createSessionOptions(sessionId);
      let sessionPromise = startNewSession(options);
      expectFailure(sessionPromise, done, 'Session failed to start');
    });
  });

  describe('findSessionByPath()', () => {

    it('should find an existing session by path', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        tester.respond(200, [sessionId]);
      });
      debugger;
      findSessionByPath(sessionId.notebook.path).then(newId => {
        expect(newId.notebook.path).to.be(sessionId.notebook.path);
        done();
      });
    });

  });

  describe('findSessionById()', () => {

    it('should find an existing session by id', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        tester.respond(200, sessionId);
      });
      findSessionById(sessionId.id).then(newId => {
        expect(newId.id).to.be(sessionId.id);
        done();
      });
    });

  });

  describe('connectToSession()', () => {

    it('should connect to a running session', (done) => {
      let tester = new KernelTester();
      let sessionId = createSessionId();
      startSession(sessionId).then(session => {
        connectToSession(sessionId.id).then((newSession) => {
          expect(newSession.id).to.be(sessionId.id);
          session.dispose();
          done();
        });
      });
    });

    it('should connect to a client session if given session options', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        if (request.url.indexOf('session') !== -1) {
          tester.respond(200, sessionId);
        } else {
          tester.respond(200, { name: sessionId.kernel.name,
                                id: sessionId.kernel.id });
        }
      });
      let options = createSessionOptions(sessionId);
      connectToSession(sessionId.id, options).then(session => {
        expect(session.id).to.be(sessionId.id);
        session.dispose();
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let sessionId = createSessionId();
      let tester = new KernelTester(request => {
        if (request.url.indexOf('session') !== -1) {
          tester.respond(200, sessionId);
        } else {
          tester.respond(200, { name: sessionId.kernel.name,
                                id: sessionId.kernel.id });
        }
      });
      let options = createSessionOptions(sessionId);
      options.ajaxSettings = ajaxSettings
      connectToSession(sessionId.id, options).then(session => {
        expect(session.id).to.be(sessionId.id);
        session.dispose();
        done();
      });
    });

    it('should fail if session is not available', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, {});
      });
      let sessionId = createSessionId();
      let options = createSessionOptions(sessionId);
      let sessionPromise = connectToSession(sessionId.id, options);
      expectFailure(
        sessionPromise, done, 'No running session with id: ' + sessionId.id
      );
    });
  });

  describe('INotebookSession', () => {

    context('#sessionDied', () => {

      it('should emit when the session is shut down', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          session.sessionDied.connect(() => {
            done();
          });
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          session.shutdown();
        });
      });
    });

    context('#kernelChanged', () => {

      it('should emit when the kernel changes', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newName = 'foo';
        startSession(id, tester).then(session => {
          session.changeKernel({ name: newName });
          id.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, id);
            } else {
              tester.respond(200, { name: id.kernel.name,
                                      id: id.kernel.id });
            }
          }
          session.kernelChanged.connect((s, kernel) => {
            expect(kernel.name).to.be(newName);
            session.dispose();
            done();
          });
        });
      });

    });

    context('#statusChanged', () => {

      it('should emit when the kernel status changes', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          session.statusChanged.connect((s, status) => {
            if (status === KernelStatus.Busy) {
              s.dispose();
              done();
            }
          });
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          tester.sendStatus('busy');
        });
      });
    });

    context('#unhandledMessage', () => {

      it('should be emitted for an unhandled message', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          session.unhandledMessage.connect((s, msg) => {
            expect(msg.header.msg_type).to.be('foo');
            session.dispose();
            done();
          });
          let msg = createKernelMessage({
            msgType: 'foo',
            channel: 'bar',
            session: 'baz'
          });
          tester.send(msg);
        });
      });
    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(typeof session.id).to.be('string');
          expect(() => { session.id = "1"; }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#notebookPath', () => {

      it('should be a read only string', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(typeof session.notebookPath).to.be('string');
          expect(() => { session.notebookPath = '' }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#kernel', () => {

      it('should be a read only IKernel object', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(typeof session.kernel.id).to.be('string');
          expect(() => { session.kernel = null }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#kernel', () => {

      it('should be a read only delegate to the kernel status', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(session.status).to.be(session.kernel.status);
          expect(() => { session.status = 0 }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#isDisposed', () => {

      it('should be true after we dispose of the session', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(session.isDisposed).to.be(false);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        });
      });

      it('should be safe to call multiple times', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          expect(session.isDisposed).to.be(false);
          expect(session.isDisposed).to.be(false);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          expect(session.isDisposed).to.be(true);
          done();
        });
      });
    });

    context('#dispose()', () => {

      it('should dispose of the resources held by the session', (done) => {
        let id = createSessionId();
        startSession(id).then(session => {
          session.dispose();
          expect(session.kernel).to.be(null);
          done();
        });
      });
    });

    context('#renameNotebook()', () => {

      it('should rename the notebook', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newPath = '/foo.ipynb';
        let newId = JSON.parse(JSON.stringify(id));
        newId.notebook.path = newPath;
        startSession(id, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(200, newId);
          };
          session.renameNotebook(newPath).then(() => {
            expect(session.notebookPath).to.be(newPath);
            session.dispose();
            done();
          });
        }, error => {
          console.log(error);
        });
      });

      it('should fail for improper response status', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newPath = '/foo.ipynb';
        startSession(id, tester).then(session => {
          let promise = session.renameNotebook(newPath);
          tester.onRequest = () => {
            tester.respond(201, { });
            expectFailure(promise, done, 'Invalid Status: 201');
          };
        })
      });

      it('should fail for error response status', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newPath = '/foo.ipynb';
        startSession(id, tester).then(session => {
          let promise = session.renameNotebook(newPath);
          tester.onRequest = () => {
            tester.respond(500, { });
            expectFailure(promise, done, '');
          };
        });
      });

      it('should fail for improper model', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newPath = '/foo.ipynb';
        startSession(id, tester).then(session => {
          let promise = session.renameNotebook(newPath);
          tester.onRequest = () => {
            tester.respond(200, { });
            expectFailure(promise, done, 'Invalid Session Model');
          }
        })
      });

      it('should fail if the session is disposed', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        startSession(id, tester).then(session => {
          session.dispose();
          let promise = session.renameNotebook('');
          expectFailure(promise, done, 'Session is disposed');
        });
      });

    });

    context('#changeKernel()', () => {

      it('should create a new kernel with the new name', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let newName = 'foo';
        startSession(id, tester).then(session => {
          let previous = session.kernel;
          id.kernel.id = uuid();
          id.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, id);
            } else {
              tester.respond(200, { name: id.kernel.name,
                                      id: id.kernel.id });
            }
          }
          session.changeKernel({ name: newName }).then(kernel => {
            expect(kernel.name).to.be(newName);
            expect(session.kernel).to.not.be(previous);
            session.dispose();
            done();
          });
        });
      });

      it('should accept the id of the new kernel', (done) => {
                let tester = new KernelTester();
        let id = createSessionId();
        let newName = 'foo';
        startSession(id, tester).then(session => {
          let previous = session.kernel;
          let newId = uuid();
          id.kernel.id = newId;
          id.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, id);
            } else {
              tester.respond(200, { name: id.kernel.name,
                                      id: id.kernel.id });
            }
          }
          session.changeKernel({ id: newId }).then(kernel => {
            expect(kernel.name).to.be(newName);
            expect(kernel.id).to.be(newId);
            expect(session.kernel).to.not.be(previous);
            session.dispose();
            done();
          });
        });
      });

    });

    context('#shutdown()', () => {

      it('should shut down properly', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          session.shutdown().then(() => {
            done();
          });
        });
      });

      it('should emit a sessionDied signal', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          let promise = session.shutdown();
          session.sessionDied.connect(() => {
            done();
          });
        });
      });

      it('should accept ajax options', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          session.ajaxSettings = ajaxSettings;
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          session.shutdown().then(() => {
            done();
          })
        });
      });

      it('should fail for an incorrect response status', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(200, { });
          }
          let promise = session.shutdown();
          expectFailure(promise, done, 'Invalid Status: 200');
        });
      });

      it('should handle a specific error status', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(410, { });
          }
          let promise = session.shutdown();
          expectFailure(
            promise, done, 'The kernel was deleted but the session was not'
          );
        });
      });

      it('should fail for an error response status', (done) => {
        let tester = new KernelTester();
        let sessionId = createSessionId();
        startSession(sessionId, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(500, { });
          }
          let promise = session.shutdown();
          expectFailure(promise, done, '');
        });
      });

      it('should fail if the session is disposed', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        startSession(id, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          }
          session.dispose();
          expectFailure(session.shutdown(), done, 'Session is disposed');
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

      it('should a list of session ids', (done) => {
        let handler = new RequestHandler();
        let manager = new NotebookSessionManager(createSessionOptions());
        let sessionIds = [createSessionId(), createSessionId()];
        handler.onRequest = () => {
          handler.respond(200, sessionIds);
        }
        let list = manager.listRunning();
        list.then((response: ISessionId[]) => {
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
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, id)
          } else {
            tester.respond(200, { name: id.kernel.name,
                                    id: id.kernel.id });
          }
        }
        manager.startNew({ notebookPath: 'test.ipynb'}).then(session => {
          expect(session.id).to.be(id.id);
          session.dispose();
          done();
        });
      });

    });

    describe('#findByPath()', () => {

      it('should find an existing session by path', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let manager = new NotebookSessionManager(createSessionOptions(id));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, id)
          } else {
            tester.respond(200, { name: id.kernel.name,
                                    id: id.kernel.id });
          }
        }
        manager.startNew({ notebookPath: 'test.ipynb' }
        ).then(session => {
          manager.findByPath(session.notebookPath).then(newId => {
            expect(newId.id).to.be(session.id);
            session.dispose();
            done();
          });
        });
      });

    });


    describe('#findById()', () => {

      it('should find an existing session by id', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let manager = new NotebookSessionManager(createSessionOptions(id));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, id)
          } else {
            tester.respond(200, { name: id.kernel.name,
                                    id: id.kernel.id });
          }
        }
        manager.startNew({ notebookPath: 'test.ipynb' }
        ).then(session => {
          manager.findById(session.id).then(newId => {
            expect(newId.id).to.be(session.id);
            session.dispose();
            done();
          });
        });
      });

    });

    describe('#connectTo()', () => {

      it('should connect to a running session', (done) => {
        let tester = new KernelTester();
        let id = createSessionId();
        let manager = new NotebookSessionManager(createSessionOptions(id));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, id)
          } else {
            tester.respond(200, { name: id.kernel.name,
                                    id: id.kernel.id });
          }
        }
        manager.startNew({ notebookPath: 'test.ipynb' }
        ).then(session => {
          manager.connectTo(session.id).then(newSession => {
            expect(newSession).to.be(session);
            session.dispose();
            done();
          });
        });
      });

    });

  });

});


/**
 * Start a session with the given options.
 */
function startSession(sessionId: ISessionId, tester?: KernelTester): Promise<INotebookSession> {
  tester = tester || new KernelTester();
  tester.onRequest = request => {
    if (request.method === 'POST') {
      tester.respond(201, sessionId);
    } else {
      tester.respond(200, { name: sessionId.kernel.name,
                              id: sessionId.kernel.id });
    }
  }
  let options = createSessionOptions(sessionId);
  return startNewSession(options);
}
