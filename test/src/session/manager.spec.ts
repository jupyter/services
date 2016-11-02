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


describe('session', () => {

  let tester: KernelTester;
  let session: Session.ISession;
  let manager: SessionManager;

  beforeEach(() => {
    tester = new KernelTester();
    manager = new SessionManager();
  });

  afterEach(() => {
    manager.dispose();
    if (session) {
      session.dispose();
    }
    tester.dispose();
  });

  describe('SessionManager', () => {

    describe('#constructor()', () => {

      it('should create a new session manager', () => {
        expect(manager instanceof SessionManager).to.be(true);
      });

      it('should trigger an update of running sessions', (done) => {
        let sessionModels = [createSessionModel(), createSessionModel()];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), sessionModels)).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, sessionModels);
        });
      });

    });

    describe('#baseUrl', () => {

      it('should get the base url of the server', () => {
        manager.dispose();
        manager = new SessionManager({ baseUrl: 'foo' });
        expect(manager.baseUrl).to.be('foo');
      });

    });

    describe('#wsUrl', () => {

      it('should get the ws url of the server', () => {
        manager.dispose();
        manager = new SessionManager({ wsUrl: 'bar' });
        expect(manager.wsUrl).to.be('bar');
      });

    });

    describe('#ajaxSettings', () => {

      it('should get the ajax sessions of the server', () => {
        manager.dispose();
        let ajaxSettings = { withCredentials: true };
        manager = new SessionManager({ ajaxSettings });
        expect(manager.ajaxSettings).to.eql(ajaxSettings);
      });

    });

    describe('#specs', () => {

      it('should get the kernel specs', (done) => {
        expect(manager.specs).to.be(null);
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager.specsChanged.connect(() => {
          expect(manager.specs.default).to.be(KERNELSPECS.default);
          done();
        });
        manager.fetchSpecs();
      });

    });

    describe('#running()', () => {

      it('should get the running sessions', (done) => {
        let sessionModels = [createSessionModel(), createSessionModel()];
        manager.runningChanged.connect(() => {
          let test = deepEqual(toArray(manager.running()), sessionModels);
          expect(test).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, sessionModels);
        });
      });

    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        manager.specsChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(args, KERNELSPECS)).to.be(false);
          expect(args.default).to.be(KERNELSPECS.default);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager.fetchSpecs();
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted in refreshRunning when the running sessions changed', (done) => {
        let sessionModels = [createSessionModel(), createSessionModel()];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), sessionModels)).to.be(true);
          done();
        });
        let handler = new RequestHandler(() => {
          handler.respond(200, sessionModels);
        });
        manager.refreshRunning();
      });

    });

    describe('#refreshRunning()', () => {

      it('should a return list of session ids', (done) => {
        let handler = new RequestHandler();
        let sessionModels = [createSessionModel(), createSessionModel()];
        handler.onRequest = () => {
          handler.respond(200, sessionModels);
        };
        manager.refreshRunning().then(response => {
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
        let handler = new RequestHandler(() => {
          handler.respond(204, { });
        });
        manager.shutdown('foo').then(done, done);
      });

    });

  });

});
