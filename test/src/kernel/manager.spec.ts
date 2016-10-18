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
  KernelManager, Kernel, IKernel
} from '../../../lib/kernel';

import {
  RequestHandler, KernelTester, KERNEL_OPTIONS, PYTHON_SPEC, KERNELSPECS
} from '../utils';



let PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = 'Python3';
PYTHON3_SPEC.spec.display_name = 'python3';


describe('kernel/manager', () => {

  let tester: KernelTester;
  let kernel: IKernel;

  beforeEach(() => {
    tester = new KernelTester();
  });

  afterEach(() => {
    if (kernel) {
      kernel.dispose();
    }
    tester.dispose();
  });

  describe('KernelManager', () => {

    describe('#constructor()', () => {

      it('should take the options as an argument', () => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        expect(manager instanceof KernelManager).to.be(true);
      });

    });

    describe('#specsChanged', () => {

      it('should be emitted when the specs change', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
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

      it('should be emitted in listRunning when the running kernels changed', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
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
        manager.listRunning();
      });

    });

    describe('#getSpecs()', () => {

      it('should get the list of kernel specs', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        };
        tester.onRequest = () => {
          tester.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
        };
        manager.getSpecs().then(specs => {
          let names = Object.keys(specs.kernelspecs);
          expect(names[0]).to.be('python');
          expect(names[1]).to.be('python3');
          done();
        });
      });

    });

    describe('#listRunning()', () => {

      it('should list the running kernels', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let data = [
          { id: uuid(), name: 'test' },
          { id: uuid(), name: 'test2' }
        ];
        tester.onRequest = () => {
          tester.respond(200, data);
        };
        manager.listRunning().then(response => {
          let running = toArray(response);
          expect(running[0]).to.eql(data[0]);
          expect(running[1]).to.eql(data[1]);
          done();
        });
      });

    });

    describe('#startNew()', () => {

      it('should start a new kernel', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        tester.onRequest = () => {
          tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        };
        manager.startNew().then(k => {
          kernel = k;
          expect(kernel.status).to.be('unknown');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'starting') {
              done();
            }
          });
        });

      });

    });

    describe('#findById()', () => {

      it('should find an existing kernel by id', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let id = uuid();
        tester.onRequest = () => {
          tester.respond(201, { id: id, name: KERNEL_OPTIONS.name });
        };
        manager.startNew().then(k => {
          kernel = k;
          manager.findById(id).then(newKernel => {
            expect(newKernel.name).to.be(kernel.name);
            expect(newKernel.id).to.be(kernel.id);
            done();
          });
        });
      });

    });

    describe('#connectTo()', () => {

      it('should connect to an existing kernel', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let id = uuid();
        tester.onRequest = () => {
          tester.respond(201, { id: id, name: KERNEL_OPTIONS.name });
        };
        manager.startNew().then(k => {
          kernel = k;
          manager.connectTo(id).then(newKernel => {
            expect(newKernel.name).to.be(kernel.name);
            expect(newKernel.id).to.be(kernel.id);
            expect(newKernel).to.not.be(kernel);
            newKernel.dispose();
            done();
          });
        });
      });

    });

    describe('shutdown()', () => {

      it('should shut down a kernel by id', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        tester.onRequest = () => {
          tester.respond(204, { });
        };
        manager.shutdown('foo').then(done, done);
      });

    });

  });

});

