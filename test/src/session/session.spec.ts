// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

import {
  uuid, IAjaxError
} from '../../../lib/utils';

import {
  KernelMessage
} from '../../../lib/kernel';

import {
  ISession, Session
} from '../../../lib/session';

import {
  RequestHandler, ajaxSettings, expectFailure, KernelTester,
  createKernel
} from '../utils';


/**
 * Create a unique session id.
 */
function createSessionModel(): Session.IModel {
  return {
    id: uuid(),
    notebook: { path: uuid() },
    kernel: { id: uuid(), name: uuid() }
  };
}


/**
 * Create session options based on a sessionModel.
 */
function createSessionOptions(sessionModel?: Session.IModel): Session.IOptions {
  sessionModel = sessionModel || createSessionModel();
  return {
    path: sessionModel.notebook.path,
    kernelName: sessionModel.kernel.name,
    baseUrl: 'http://localhost:8888',
    wsUrl: 'ws://localhost:8888'
  };
}


describe('session', () => {

  describe('Session.listRunning()', () => {

    it('should yield a list of valid session models', (done) => {
      let sessionModels = [createSessionModel(), createSessionModel()];
      let handler = new RequestHandler(() => {
        handler.respond(200, sessionModels);
      });
      let list = Session.listRunning({ baseUrl: 'http://localhost:8888' });
      list.then((response: Session.IModel[]) => {
        expect(response[0]).to.eql(sessionModels[0]);
        expect(response[1]).to.eql(sessionModels[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let sessionModels = [createSessionModel(), createSessionModel()];
      let handler = new RequestHandler(() => {
        handler.respond(200, sessionModels);
      });
      let list = Session.listRunning({ ajaxSettings: ajaxSettings });
      list.then((response: Session.IModel[]) => {
        expect(response[0]).to.eql(sessionModels[0]);
        expect(response[1]).to.eql(sessionModels[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      let data = { id: '1234', notebook: { path: 'test' } };
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let list = Session.listRunning({ baseUrl: 'http://localhost:8888' });
      expectFailure(list, done);
    });

    it('should throw an error for another invalid model', (done) => {
      let data = [{ id: '1234', kernel: { id: '', name: '' }, notebook: { } }];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let list = Session.listRunning();
      expectFailure(list, done);
    });

    it('should fail for wrong response status', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, [createSessionModel()]);
      });
      let list = Session.listRunning();
      expectFailure(list, done);
    });

    it('should fail for error response status', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(500, { });
      });
      let list = Session.listRunning();
      expectFailure(list, done, '');
    });

    it('should update an existing session', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester();
      let newKernel = { name: 'fizz', id: 'buzz' };
      startSession(sessionModel, tester).then(session => {
        tester.onRequest = request => {
          tester.respond(200, [ {
            id: sessionModel.id,
            notebook: { path : 'foo/bar.ipynb' },
            kernel: newKernel
          } ]);
          tester.onRequest = request => {
            tester.respond(200, newKernel);
          };
        };
        session.kernelChanged.connect((s, kernel) => {
          expect(kernel.name).to.be(newKernel.name);
          expect(kernel.id).to.be(newKernel.id);
          expect(s.path).to.be('foo/bar.ipynb');
          done();
        });
        Session.listRunning();
      });
    });

  });

  describe('Session.startNew()', () => {

    it('should start a session', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionModel);
        } else {
          tester.respond(200, { name: sessionModel.kernel.name,
                                  id: sessionModel.kernel.id });
        }
      });
      let options = createSessionOptions(sessionModel);
      Session.startNew(options).then(session => {
        expect(session.id).to.be(sessionModel.id);
        session.dispose();
        done();
      });
    });

    it('should be able connect to an existing kernel', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester();
      createKernel(tester).then(kernel => {
        sessionModel.kernel.id = kernel.id;
        sessionModel.kernel.name = kernel.name;
        tester.onRequest = request => {
          if (request.method === 'POST') {
            tester.respond(201, sessionModel);
          } else {
            tester.respond(200, { name: sessionModel.kernel.name,
                                    id: sessionModel.kernel.id });
          }
        };
        let options = createSessionOptions(sessionModel);
        Session.startNew(options).then(session => {
          expect(session.id).to.be(sessionModel.id);
          session.dispose();
          done();
        });
      });
    });

    it('should accept ajax options', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionModel);
        } else {
          tester.respond(200, { name: sessionModel.kernel.name,
                                  id: sessionModel.kernel.id });
        }
      });
      let options = createSessionOptions(sessionModel);
      options.ajaxSettings = ajaxSettings;
      Session.startNew(options).then(session => {
        expect(session.id).to.be(sessionModel.id);
        session.dispose();
        done();
      });
    });

    it('should start even if the websocket fails', (done) => {
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionModel);
        } else {
          tester.respond(200, { name: sessionModel.kernel.name,
                                  id: sessionModel.kernel.id });
        }
      });
      tester.initialStatus = 'dead';
      let sessionModel = createSessionModel();
      let options = createSessionOptions(sessionModel);
      Session.startNew(options).then(session => {
        session.dispose();
        done();
      });
    });

    it('should fail for wrong response status', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(() => {
        tester.respond(200, sessionModel);
      });
      let options = createSessionOptions(sessionModel);
      let sessionPromise = Session.startNew(options);
      expectFailure(sessionPromise, done);
    });

    it('should fail for error response status', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, {});
      });
      let sessionModel = createSessionModel();
      let options = createSessionOptions(sessionModel);
      let sessionPromise = Session.startNew(options);
      expectFailure(sessionPromise, done, '');
    });

    it('should fail for wrong response model', (done) => {
      let sessionModel = createSessionModel();
      let data = {
        id: 1, kernel: { name: '', id: '' }, notebook: { path: ''}
      };
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionModel);
        } else {
          tester.respond(200, data);
        }
      });
      let options = createSessionOptions(sessionModel);
      let sessionPromise = Session.startNew(options);
      let msg = `Session failed to start: No running kernel with id: ${sessionModel.kernel.id}`;
      expectFailure(sessionPromise, done, msg);
    });

    it('should fail if the kernel is not running', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        if (request.method === 'POST') {
          tester.respond(201, sessionModel);
        } else {
          tester.respond(400, {});
        }
      });
      let options = createSessionOptions(sessionModel);
      let sessionPromise = Session.startNew(options);
      expectFailure(sessionPromise, done, 'Session failed to start');
    });
  });

  describe('Session.findByPath()', () => {

    it('should find an existing session by path', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        tester.respond(200, [sessionModel]);
      });
      Session.findByPath(sessionModel.notebook.path).then(newId => {
        expect(newId.notebook.path).to.be(sessionModel.notebook.path);
        done();
      });
    });

  });

  describe('Session.findById()', () => {

    it('should find an existing session by id', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        tester.respond(200, sessionModel);
      });
      Session.findById(sessionModel.id).then(newId => {
        expect(newId.id).to.be(sessionModel.id);
        done();
      });
    });

  });

  describe('Session.connectTo()', () => {

    it('should connect to a running session', (done) => {
      let sessionModel = createSessionModel();
      startSession(sessionModel).then(session => {
        Session.connectTo(sessionModel.id).then((newSession) => {
          expect(newSession.id).to.be(sessionModel.id);
          expect(newSession.kernel.id).to.be(sessionModel.kernel.id);
          expect(newSession).to.not.be(session);
          expect(newSession.kernel).to.not.be(session.kernel);
          session.dispose();
          done();
        });
      });
    });

    it('should connect to a client session if given session options', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        if (request.url.indexOf('session') !== -1) {
          tester.respond(200, sessionModel);
        } else {
          tester.respond(200, { name: sessionModel.kernel.name,
                                id: sessionModel.kernel.id });
        }
      });
      let options = createSessionOptions(sessionModel);
      Session.connectTo(sessionModel.id, options).then(session => {
        expect(session.id).to.be(sessionModel.id);
        session.dispose();
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let sessionModel = createSessionModel();
      let tester = new KernelTester(request => {
        if (request.url.indexOf('session') !== -1) {
          tester.respond(200, sessionModel);
        } else {
          tester.respond(200, { name: sessionModel.kernel.name,
                                id: sessionModel.kernel.id });
        }
      });
      let options = createSessionOptions(sessionModel);
      options.ajaxSettings = ajaxSettings;
      Session.connectTo(sessionModel.id, options).then(session => {
        expect(session.id).to.be(sessionModel.id);
        session.dispose();
        done();
      });
    });

    it('should fail if session is not available', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, {});
      });
      let sessionModel = createSessionModel();
      let options = createSessionOptions(sessionModel);
      let sessionPromise = Session.connectTo(sessionModel.id, options);
      expectFailure(
        sessionPromise, done, 'No running session with id: ' + sessionModel.id
      );
    });
  });

  describe('Session.shutdown()', () => {

    it('should shut down a kernel by id', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(204, { });
      });
      Session.shutdown('foo').then(done, done);
    });

  });


  describe('ISession', () => {

    context('#sessionDied', () => {

      it('should emit when the session is shut down', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          session.sessionDied.connect(() => {
            done();
          });
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          session.shutdown();
        });
      });
    });

    context('#kernelChanged', () => {

      it('should emit when the kernel changes', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newName = 'foo';
        startSession(model, tester).then(session => {
          session.changeKernel({ name: newName });
          model.kernel.name = newName;
          model.kernel.id = 'baz';
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, model);
            } else {
              tester.respond(200, { name: model.kernel.name,
                                      id: model.kernel.id });
            }
          };
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
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          session.statusChanged.connect((s, status) => {
            if (status === 'busy') {
              s.dispose();
              done();
            }
          });
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          tester.sendStatus('busy');
        });
      });
    });

    context('#iopubMessage', () => {

      it('should be emitted for an iopub message', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          session.iopubMessage.connect((s, msg) => {
            expect(msg.header.msg_type).to.be('status');
            session.dispose();
            done();
          });
          let msg = KernelMessage.createMessage({
            msgType: 'status',
            channel: 'iopub',
            session: ''
          }) as KernelMessage.IStatusMsg;
          msg.content.execution_state = 'idle';
          msg.parent_header = msg.header;
          tester.send(msg);
        });
      });
    });

    context('#unhandledMessage', () => {

      it('should be emitted for an unhandled message', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          session.unhandledMessage.connect((s, msg) => {
            expect(msg.header.msg_type).to.be('foo');
            session.dispose();
            done();
          });
          let msg = KernelMessage.createMessage({
            msgType: 'foo',
            channel: 'shell',
            session: session.kernel.clientId
          });
          msg.parent_header = msg.header;
          tester.send(msg);
        });
      });
    });

    context('#pathChanged', () => {

      it('should be emitted when the session path changes', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newPath = '/foo.ipynb';
        let newModel = JSON.parse(JSON.stringify(model));
        newModel.notebook.path = newPath;
        startSession(model, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(200, newModel);
          };
          session.pathChanged.connect((s, path) => {
            expect(path).to.be(newPath);
            done();
          });
          session.rename(newPath);
        });
      });

    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          expect(typeof session.id).to.be('string');
          expect(() => { session.id = '1'; }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#path', () => {

      it('should be a read only string', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          expect(typeof session.path).to.be('string');
          expect(() => { session.path = ''; }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#path', () => {

      it('should be a read only IModel', (done) => {
        startSession(createSessionModel()).then(session => {
          let model = session.model;
          expect(typeof model.id).to.be('string');
          expect(typeof model.notebook.path).to.be('string');
          expect(typeof model.kernel.name).to.be('string');
          expect(typeof model.kernel.id).to.be('string');
          expect(() => { session.model = null; }).to.throwError();
          done();
        }).catch(done);
      });

    });

    context('#kernel', () => {

      it('should be a read only IKernel object', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          expect(typeof session.kernel.id).to.be('string');
          expect(() => { session.kernel = null; }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#kernel', () => {

      it('should be a read only delegate to the kernel status', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          expect(session.status).to.be(session.kernel.status);
          expect(() => { session.status = 'idle'; }).to.throwError();
          session.dispose();
          done();
        });
      });
    });

    context('#isDisposed', () => {

      it('should be true after we dispose of the session', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          expect(session.isDisposed).to.be(false);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          done();
        });
      });

      it('should be safe to call multiple times', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
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
        let model = createSessionModel();
        startSession(model).then(session => {
          session.dispose();
          expect(session.kernel).to.be(null);
          done();
        });
      });

      it('should be safe to call twice', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          session.dispose();
          expect(session.isDisposed).to.be(true);
          expect(session.kernel).to.be(null);
          session.dispose();
          expect(session.isDisposed).to.be(true);
          expect(session.kernel).to.be(null);
          done();
        });
      });

      it('should be safe to call if the kernel is disposed', (done) => {
        let model = createSessionModel();
        startSession(model).then(session => {
          session.kernel.dispose();
          session.dispose();
          expect(session.kernel).to.be(null);
          done();
        });
      });

    });

    context('#rename()', () => {

      it('should rename the session', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newPath = '/foo.ipynb';
        let newModel = JSON.parse(JSON.stringify(model));
        newModel.notebook.path = newPath;
        startSession(model, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(200, newModel);
          };
          session.rename(newPath).then(() => {
            expect(session.path).to.be(newPath);
            session.dispose();
            done();
          });
        }, error => {
          console.log(error);
        });
      });

      it('should fail for improper response status', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newPath = '/foo.ipynb';
        startSession(model, tester).then(session => {
          let promise = session.rename(newPath);
          tester.onRequest = () => {
            tester.respond(201, { });
            expectFailure(promise, done);
          };
        });
      });

      it('should fail for error response status', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newPath = '/foo.ipynb';
        startSession(model, tester).then(session => {
          let promise = session.rename(newPath);
          tester.onRequest = () => {
            tester.respond(500, { });
            expectFailure(promise, done, '');
          };
        });
      });

      it('should fail for improper model', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newPath = '/foo.ipynb';
        startSession(model, tester).then(session => {
          let promise = session.rename(newPath);
          tester.onRequest = () => {
            tester.respond(200, { });
            expectFailure(promise, done);
          };
        });
      });

      it('should fail if the session is disposed', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        startSession(model, tester).then(session => {
          session.dispose();
          let promise = session.rename('');
          expectFailure(promise, done, 'Session is disposed');
        });
      });

    });

    context('#changeKernel()', () => {

      it('should create a new kernel with the new name', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newName = 'foo';
        startSession(model, tester).then(session => {
          let previous = session.kernel;
          model.kernel.id = uuid();
          model.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, model);
            } else {
              tester.respond(200, { name: model.kernel.name,
                                      id: model.kernel.id });
            }
          };
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
        let model = createSessionModel();
        let newName = 'foo';
        startSession(model, tester).then(session => {
          let previous = session.kernel;
          let newId = uuid();
          model.kernel.id = newId;
          model.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, model);
            } else {
              tester.respond(200, { name: model.kernel.name,
                                      id: model.kernel.id });
            }
          };
          session.changeKernel({ id: newId }).then(kernel => {
            expect(kernel.name).to.be(newName);
            expect(kernel.id).to.be(newId);
            expect(session.kernel).to.not.be(previous);
            session.dispose();
            done();
          });
        });
      });

      it('should work when there is no current kernel', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newName = 'foo';
        startSession(model, tester).then(session => {
          session.kernel.dispose();
          model.kernel.id = uuid();
          model.kernel.name = newName;
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, model);
            } else {
              tester.respond(200, { name: model.kernel.name,
                                      id: model.kernel.id });
            }
          };
          session.changeKernel({ name: newName }).then(kernel => {
            expect(kernel.name).to.be(newName);
            session.dispose();
            done();
          });
        });
      });

      it('should update the session path if it has changed', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        let newName = 'foo';
        startSession(model, tester).then(session => {
          session.kernel.dispose();
          model.kernel.id = uuid();
          model.kernel.name = newName;
          model.notebook.path = 'fizz/buzz.ipynb';
          tester.onRequest = request => {
            if (request.method === 'PATCH') {
              tester.respond(200, model);
            } else {
              tester.respond(200, { name: model.kernel.name,
                                      id: model.kernel.id });
            }
          };
          session.changeKernel({ name: newName }).then(kernel => {
            expect(kernel.name).to.be(newName);
            expect(session.path).to.be(model.notebook.path);
            session.dispose();
            done();
          });
        });
      });

    });

    context('#shutdown()', () => {

      it('should shut down properly', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          session.shutdown().then(() => {
            done();
          });
        });
      });

      it('should emit a sessionDied signal', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          let promise = session.shutdown();
          session.sessionDied.connect(() => {
            done();
          });
        });
      });

      it('should accept ajax options', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          session.ajaxSettings = ajaxSettings;
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          session.shutdown().then(() => {
            done();
          });
        });
      });

      it('should fail for an incorrect response status', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(200, { });
          };
          let promise = session.shutdown();
          expectFailure(promise, done);
        });
      });

      it('should handle a specific error status', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(410, { });
          };
          session.shutdown().catch((err: IAjaxError) => {
            let text ='The kernel was deleted but the session was not';
            expect(err.throwError).to.contain(text);
          }).then(done, done);
        });
      });

      it('should fail for an error response status', (done) => {
        let tester = new KernelTester();
        let sessionModel = createSessionModel();
        startSession(sessionModel, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let promise = session.shutdown();
          expectFailure(promise, done, '');
        });
      });

      it('should fail if the session is disposed', (done) => {
        let tester = new KernelTester();
        let model = createSessionModel();
        startSession(model, tester).then(session => {
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          session.dispose();
          expectFailure(session.shutdown(), done, 'Session is disposed');
        });
      });
    });
  });

});


/**
 * Start a session with the given options.
 */
function startSession(sessionModel: Session.IModel, tester?: KernelTester): Promise<ISession> {
  tester = tester || new KernelTester();
  tester.onRequest = request => {
    tester.respond(200, sessionModel);
    tester.onRequest = request => {
      tester.respond(200, { name: sessionModel.kernel.name,
                              id: sessionModel.kernel.id });
    };
  };
  let options = createSessionOptions(sessionModel);
  return Session.connectTo(sessionModel.id, options);
}
