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
  Kernel
} from '../../../lib/kernel';

import {
  SessionManager, Session
} from '../../../lib/session';

import {
  uuid, copy
} from '../../../lib/utils';

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


describe('session/manager', () => {

  let tester: KernelTester;
  let session: Session.ISession;
  let manager: SessionManager;
  let data: Session.IModel[];

  beforeEach((done) => {
    data = [createSessionModel(), createSessionModel()];
    tester = new KernelTester();
    tester.onRequest = () => {
      tester.respond(200, KERNELSPECS);
      tester.onRequest = () => {
        tester.respond(200, data);
      };
    };
    manager = new SessionManager();
    expect(manager.specs).to.be(null);
    expect(manager.running().next()).to.be(void 0);
    manager.ready().then(done, done);
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

      it('should be the kernel specs', () => {
        expect(manager.specs.default).to.be(KERNELSPECS.default);
      });

    });

    describe('#ready()', () => {

      it('should resolve when the manager is ready', (done) => {
        manager.ready().then(done, done);
      });

    });

    describe('#running()', () => {

      it('should get the running sessions', () => {
        let test = deepEqual(toArray(manager.running()), data);
        expect(test).to.be(true);
      });

    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        let specs = copy(KERNELSPECS) as Kernel.ISpecModels;
        specs.default = 'shell';
        manager.specsChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(args.default).to.be(specs.default);
          done();
        });

        let handler = new RequestHandler(() => {
          handler.respond(200, specs);
        });
        manager.refreshSpecs();
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

      it('should refresh the list of session ids', (done) => {
        let handler = new RequestHandler();
        let sessionModels = [createSessionModel(), createSessionModel()];
        handler.onRequest = () => {
          handler.respond(200, sessionModels);
        };
        manager.refreshRunning().then(() => {
          let running = toArray(manager.running());
          expect(running[0]).to.eql(sessionModels[0]);
          expect(running[1]).to.eql(sessionModels[1]);
          done();
        });

      });

    });

    describe('#refreshSpecs()', () => {

      it('should refresh the specs', (done) => {
        let specs = copy(KERNELSPECS) as Kernel.ISpecModels;
        specs.default = 'shell';
        let handler = new RequestHandler(() => {
          handler.respond(200, specs);
        });
        manager.refreshSpecs().then(() => {
          expect(manager.specs.default).to.be(specs.default);
          done();
        }).catch(done);
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
