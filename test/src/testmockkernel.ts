// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  KernelMessage
} from '../../lib/ikernel';

import {
  MockKernel, ERROR_INPUT
} from '../../lib/mockkernel';


describe('mockkernel', () => {

  describe('MockKernel', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let kernel = new MockKernel();
        expect(kernel).to.be.a(MockKernel);
      });

      it('should accept a kernel model', () => {
        let kernel = new MockKernel({ name: 'shell' });
        expect(kernel.name).to.be('shell');
      });

    });

    describe('#interrupt()', () => {

      it('should change the status to busy then idle', (done) => {
        let kernel = new MockKernel();
        kernel.interrupt().then(() => {
          expect(kernel.status).to.be('idle');
          done();
        });
        expect(kernel.status).to.be('busy');
      });

    });

    describe('#restart()', () => {

      it('should change the status to restarting then idle', (done) => {
        let kernel = new MockKernel();
        kernel.restart().then(() => {
          expect(kernel.status).to.be('idle');
          done();
        });
        expect(kernel.status).to.be('restarting');
      });

    });

    describe('#kernelInfo()', () => {

      it('should get the kernel info for the mock kernel', (done) => {
        let kernel = new MockKernel();
        expect(kernel.name).to.be('python');
        kernel.kernelInfo().then(reply => {
          expect(reply.content.language_info.name).to.be('python');
          done();
        });
      });

    });

    describe('#execute()', () => {

      it('should execute the code on the mock kernel', (done) => {
        let kernel = new MockKernel();
        let future = kernel.execute({ code: 'a = 1'});
        future.onReply = (reply: KernelMessage.IExecuteOkReplyMsg) => {
          expect(reply.content.status).to.be('ok');
          done();
        };
      });

      it('should emit one iopub stream message', (done) => {
        let kernel = new MockKernel();
        let future = kernel.execute({ code: 'a = 1'});
        let called = 0;
        let states: string[] = [];
        future.onIOPub = (msg) => {
          if (msg.header.msg_type !== 'status') {
            called++;
          } else {
            let statusMsg = msg as KernelMessage.IStatusMsg;
            expect(kernel.status).to.be(statusMsg.content.execution_state);
            states.push(kernel.status);
          }
        };
        future.onDone = () => {
          expect(called).to.be(1);
          expect(states).to.eql(['busy', 'idle']);
          done();
        };
      });

      it('should increment the execution count', (done) => {
        let kernel = new MockKernel();
        let future = kernel.execute({ code: 'a = 1' });
        future.onReply = (reply: KernelMessage.IExecuteReplyMsg)  => {
          expect(reply.content.execution_count).to.be(1);
        };
        future.onDone = () => {
          future = kernel.execute({ code: 'a = 1' });
          future.onReply = (reply: KernelMessage.IExecuteReplyMsg) => {
            expect(reply.content.execution_count).to.be(2);
            done();
          };
        };
      });

      it('should allow two executions in a row', (done) => {
        let kernel = new MockKernel();
        let future0 = kernel.execute({ code: 'a = 1' });
        let future1 = kernel.execute({ code: 'b = 2' });
        let called = false;
        future0.onDone = () => {
          called = true;
        };
        future1.onDone = () => {
          expect(called).to.be(true);
          done();
        };
      });

      it('should error remaining executes if `stop_on_error` and an error occurs', (done) => {
        let kernel = new MockKernel();
        let future0 = kernel.execute({ code: ERROR_INPUT, stop_on_error: true });
        let future1 = kernel.execute({ code: 'b = 2' });
        let called = false;
        future0.onReply = (reply: KernelMessage.IExecuteErrorReplyMsg) => {
          expect(reply.content.status).to.be('error');
          called = true;
        };
        future1.onReply = (reply: KernelMessage.IExecuteErrorReplyMsg) => {
          expect(called).to.be(true);
          expect(reply.content.status).to.be('error');
          done();
        };
      });


    });

    describe('#getKernelSpec()', () => {

      it('should get the kernel spec for the mock kernel', (done) => {
        let kernel = new MockKernel({ name: 'shell' });
        expect(kernel.name).to.be('shell');
        kernel.getKernelSpec().then(spec => {
          expect(spec.display_name).to.be('Shell');
          done();
        });
      });

    });

  });

});
