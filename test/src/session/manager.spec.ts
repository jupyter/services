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
  uuid
} from '../../../lib/utils';

import {
  SessionManager, Session
} from '../../../lib/session';

import {
  RequestHandler, KernelTester, KERNELSPECS
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

  let tester: KernelTester;
  let session: Session.ISession;

  beforeEach(() => {
    tester = new KernelTester();
  });

  afterEach(() => {
    if (session) {
      session.dispose();
    }
    tester.dispose();
  });

  describe('SessionManager', () => {

    describe('#constructor()', () => {

      it('should take the options as an argument', () => {
        let manager = new SessionManager(createSessionOptions());
        expect(manager instanceof SessionManager).to.be(true);
      });

    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        let manager = new SessionManager();
        manager.specsChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(args, KERNELSPECS)).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager.getSpecs();
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted in listRunning when the running sessions changed', (done) => {
        let manager = new SessionManager();
        let sessionModels = [createSessionModel(), createSessionModel()];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), sessionModels)).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, sessionModels);
        });
        manager.listRunning();
      });

    });

    describe('#listRunning()', () => {

      it('should a return list of session ids', (done) => {
        let handler = new RequestHandler();
        let manager = new SessionManager(createSessionOptions());
        let sessionModels = [createSessionModel(), createSessionModel()];
        handler.onRequest = () => {
          handler.respond(200, sessionModels);
        };
        manager.listRunning().then(response => {
          let running = toArray(response);
          expect(running[0]).to.eql(sessionModels[0]);
          expect(running[1]).to.eql(sessionModels[1]);
          done();
        });

      });

    });

    describe('#startNew()', () => {

      it('should start a session', (done) => {
        let model = createSessionModel();
        let manager = new SessionManager(createSessionOptions(model));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, model);
          } else {
            tester.respond(200, { name: model.kernel.name,
                                    id: model.kernel.id });
          }
        };
        manager.startNew({ path: 'test.ipynb'}).then(s => {
          session = s;
          expect(session.id).to.be(model.id);
          done();
        });
      });

    });

    describe('#findByPath()', () => {

      it('should find an existing session by path', (done) => {
        let model = createSessionModel();
        let manager = new SessionManager(createSessionOptions(model));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, model);
          } else {
            tester.respond(200, { name: model.kernel.name,
                                    id: model.kernel.id });
          }
        };
        manager.startNew({ path: 'test.ipynb' }
        ).then(s => {
          session = s;
          manager.findByPath(session.path).then(newModel => {
            expect(newModel.id).to.be(session.id);
            done();
          });
        });
      });

    });


    describe('#findById()', () => {

      it('should find an existing session by id', (done) => {
        let model = createSessionModel();
        let manager = new SessionManager(createSessionOptions(model));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, model)
          } else {
            tester.respond(200, { name: model.kernel.name,
                                    id: model.kernel.id });
          }
        };
        manager.startNew({ path: 'test.ipynb' }
        ).then(s => {
          session = s;
          manager.findById(session.id).then(newModel => {
            expect(newModel.id).to.be(session.id);
            done();
          });
        });
      });

    });

    describe('#connectTo()', () => {

      it('should connect to a running session', (done) => {
        let model = createSessionModel();
        let manager = new SessionManager(createSessionOptions(model));
        tester.onRequest = (request) => {
          if (request.method === 'POST') {
            tester.respond(201, model);
          } else {
            tester.respond(200, { name: model.kernel.name,
                                    id: model.kernel.id });
          }
        };
        manager.startNew({ path: 'test.ipynb' }
        ).then(s => {
          session = s;
          manager.connectTo(session.id).then(newSession => {
            expect(newSession.id).to.be(session.id);
            expect(newSession.kernel.id).to.be(session.kernel.id);
            expect(newSession).to.not.be(session);
            expect(newSession.kernel).to.not.be(session.kernel);
            newSession.dispose();
            done();
          });
        });
      });

    });

    describe('shutdown()', () => {

      it('should shut down a session by id', (done) => {
        let manager = new SessionManager();
        let handler = new RequestHandler(() => {
          handler.respond(204, { });
        });
        manager.shutdown('foo').then(done, done);
      });

    });

  });

});
