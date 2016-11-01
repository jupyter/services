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
  KernelManager, Kernel
} from '../../../lib/kernel';

import {
  RequestHandler, KernelTester, KERNEL_OPTIONS, PYTHON_SPEC, KERNELSPECS
} from '../utils';



let PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = 'Python3';
PYTHON3_SPEC.display_name = 'python3';


describe('kernel/manager', () => {

  let tester: KernelTester;
  let manager: KernelManager;

  beforeEach(() => {
    tester = new KernelTester();
    manager = new KernelManager();
  });

  afterEach(() => {
    manager.dispose();
    tester.dispose();
  });

  describe('KernelManager', () => {

    describe('#constructor()', () => {

      it('should take the options as an argument', () => {
        manager = new KernelManager(KERNEL_OPTIONS);
        expect(manager instanceof KernelManager).to.be(true);
      });

      it('should trigger an update of running sessions', (done) => {
        let data: Kernel.IModel[] = [
          { id: uuid(), name: 'test' },
          { id: uuid(), name: 'test2' }
        ];
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

    describe('#baseUrl', () => {

      it('should get the base url of the server', () => {
        manager.dispose();
        manager = new KernelManager({ baseUrl: 'foo' });
        expect(manager.baseUrl).to.be('foo');
      });

    });

    describe('#wsUrl', () => {

      it('should get the ws url of the server', () => {
        manager.dispose();
        manager = new KernelManager({ wsUrl: 'bar' });
        expect(manager.wsUrl).to.be('bar');
      });

    });

    describe('#ajaxSettings', () => {

      it('should get the ajax sessions of the server', () => {
        manager.dispose();
        let ajaxSettings = { withCredentials: true };
        manager = new KernelManager({ ajaxSettings });
        expect(manager.ajaxSettings).to.eql(ajaxSettings);
      });

    });

    describe('#specs()', () => {

      it('should get the kernel specs', (done) => {
        let handler = new RequestHandler(() => {
          handler.respond(200, KERNELSPECS);
        });
        manager.specs().then(specs => {
          expect(specs.default).to.be(KERNELSPECS.default);
          done();
        }).catch(done);
      });

    });

    describe('#running()', () => {

      it('should get the running sessions', (done) => {
        let data: Kernel.IModel[] = [
          { id: uuid(), name: 'test' },
          { id: uuid(), name: 'test2' }
        ];
        manager.runningChanged.connect((sender, args) => {
          let test = deepEqual(toArray(args), toArray(manager.running()));
          expect(test).to.be(true);
          done();
        });
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.refreshRunning();
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
        manager.updateSpecs();
      });

    });

    describe('#runningChanged', () => {

      it('should be emitted in refreshRunning when the running kernels changed', (done) => {
        let data: Kernel.IModel[] = [
          { id: uuid(), name: 'test' },
          { id: uuid(), name: 'test2' }
        ];
        manager.runningChanged.connect((sender, args) => {
          expect(sender).to.be(manager);
          expect(deepEqual(toArray(args), data)).to.be(true);
          done();
        });
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.refreshRunning();
      });

    });

    describe('#updateSpecs()', () => {

      it('should get the list of kernel specs', (done) => {
        let ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        };
        tester.onRequest = () => {
          tester.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
        };
        manager.updateSpecs().then(specs => {
          let names = Object.keys(specs.kernelspecs);
          expect(names[0]).to.be('python');
          expect(names[1]).to.be('python3');
          done();
        });
      });

    });

    describe('#refreshRunning()', () => {

      it('should list the running kernels', (done) => {
        let data = [
          { id: uuid(), name: 'test' },
          { id: uuid(), name: 'test2' }
        ];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.refreshRunning().then(response => {
          let running = toArray(response);
          expect(running[0]).to.eql(data[0]);
          expect(running[1]).to.eql(data[1]);
          done();
        });
      });

    });

    describe('#startNew()', () => {

      it('should start a new kernel', (done) => {
        tester.onRequest = () => {
          tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
          tester.onRequest = () => {
            tester.respond(204, { });
          };
        };
        manager.startNew().then(kernel => {
          expect(kernel.status).to.be('unknown');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'starting') {
              kernel.shutdown().then(done, done);
            }
          });
        });

      });

    });

    describe('#findById()', () => {

      it('should find an existing kernel by id', (done) => {
        let id = uuid();
        tester.onRequest = () => {
          tester.respond(200, { id, name: KERNEL_OPTIONS.name });
        };
        manager.findById(id).then(model => {
          expect(model.name).to.be(KERNEL_OPTIONS.name);
          expect(model.id).to.be(id);
        }).then(done, done);
      });

    });

    describe('#connectTo()', () => {

      it('should connect to an existing kernel', (done) => {
        let id = uuid();
        tester.onRequest = () => {
          tester.respond(200, { id, name: KERNEL_OPTIONS.name });
          tester.onRequest = () => {
            tester.respond(204, { });
          };
        };
        return manager.connectTo(id).then(kernel => {
          expect(kernel.name).to.be(kernel.name);
          expect(kernel.id).to.be(kernel.id);
          return kernel.shutdown();
        }).then(done, done);
      });

    });

    describe('shutdown()', () => {

      it('should shut down a kernel by id', (done) => {
        tester.onRequest = () => {
          tester.respond(204, { });
        };
        manager.shutdown('foo').then(done, done);
      });

    });

  });

});

