// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  uuid
} from 'jupyter-js-utils';

import {
  KernelManager, connectToKernel, createKernelMessage, createShellMessage,
  getKernelSpecs, listRunningKernels, startNewKernel
} from '../../lib/kernel';

import {
  IKernel, KernelMessage
} from '../../lib/ikernel';

import {
  JSONObject
} from '../../lib/json';

import {
  RequestHandler, ajaxSettings, doLater, expectFailure, createKernel,
  KernelTester, KERNEL_OPTIONS, AJAX_KERNEL_OPTIONS, EXAMPLE_KERNEL_INFO,
  PYTHON_SPEC
} from './utils';



let PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = 'Python3';
PYTHON3_SPEC.spec.display_name = 'python3';

let createMsg = (channel: KernelMessage.Channel, parent_header: JSONObject): KernelMessage.IMessage => {
  return {
    channel: channel,
    parent_header: JSON.parse(JSON.stringify(parent_header)),
    content: {},
    header: JSON.parse(JSON.stringify(parent_header)),
    metadata: {},
    buffers: []
  }
}

describe('jupyter.services - kernel', () => {

  describe('listRunningKernels()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      let data = [
        { id: uuid(), name: 'test' },
        { id: uuid(), name: 'test2' }
      ];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let options = {
        baseUrl: 'http://localhost:8888',
      };
      listRunningKernels(options).then(response => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let data = [
        { id: uuid(), name: 'test' },
        { id: uuid(), name: 'test2' }
      ];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let options = {
        baseUrl: 'http://localhost:8888',
        ajaxSettings: ajaxSettings
      };
      listRunningKernels(options).then((response: IKernel.IModel[]) => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      let handler = new RequestHandler(() => {
        let data = { id: uuid(), name: 'test' };
        handler.respond(200, data);
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, 'Invalid kernel list');
    });

    it('should throw an error for an invalid response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, 'Invalid Status: 201');
    });

    it('should throw an error for an error response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(500, { });
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, '');
    });

  });

  describe('startNewKernel()', () => {

    it('should create an IKernel object', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        expect(kernel.status).to.be('unknown');
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      let kernelPromise = startNewKernel(AJAX_KERNEL_OPTIONS);
      kernelPromise.then(kernel => {
        expect(kernel.status).to.be('unknown');
        done();
      });
    });

    it('should still start if the kernel dies', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      tester.initialStatus = 'dead';
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        kernel.statusChanged.connect((sender, state) => {
          if (state === 'dead') {
            done();
          }
        });
      });
    });

    it('should throw an error for an invalid kernel id', (done) => {
      let tester = new KernelTester(() => {
        let data = { id: uuid() };
        tester.respond(201, data);
      });
      let kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done);
    });

    it('should throw an error for another invalid kernel id', (done) => {
      let tester = new KernelTester(() => {
        let data = { id: uuid(), name: 1 };
        tester.respond(201, data);
      });
      let kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done);
    });

    it('should throw an error for an invalid response', (done) => {
      let tester = new KernelTester(() => {
        let data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(200, data);
      });
      let kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, 'Invalid Status: 200');
    });

    it('should throw an error for an error response', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, { });
      });
      let kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, '');
    });

    it('should auto-reconnect on websocket error', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        expect(kernel.status).to.be('unknown');
        kernel.statusChanged.connect(() => {
          if (kernel.status === 'reconnecting') {
            done();
            kernel.dispose();
            return;
          }
          if (kernel.status === 'starting') {
            tester.triggerError('Error event');
          }
        });
      });

    });

  });

  describe('findKernelById()', () => {

    it('should find an existing kernel by id', (done) => {
      let manager = new KernelManager(KERNEL_OPTIONS);
      let id = uuid();
      let tester = new KernelTester(() => {
        tester.respond(200, { id: id, name: KERNEL_OPTIONS.name });
      });
      manager.findById(id).then(newKernel => {
        expect(newKernel.name).to.be(KERNEL_OPTIONS.name);
        expect(newKernel.id).to.be(id);
        done();
      });
    });

  });

  describe('connectToKernel()', () => {

    it('should reuse an exisiting kernel', (done) => {
      let id = uuid();
      let tester = new KernelTester(() => {
        tester.respond(200, { id: id, name: KERNEL_OPTIONS.name });
      });
      connectToKernel(id, KERNEL_OPTIONS).then(kernel => {
        connectToKernel(id).then(newKernel => {
          expect(newKernel.name).to.be(kernel.name);
          expect(newKernel.id).to.be(kernel.id);
          done();
        });
      });
    });

    it('should connect to a running kernel if given kernel options', (done) => {
      let id = uuid();
      let tester = new KernelTester(() => {
        tester.respond(200, { id: id, name: KERNEL_OPTIONS.name });
      });
      connectToKernel(id, KERNEL_OPTIONS).then(kernel => {
        expect(kernel.name).to.be(KERNEL_OPTIONS.name);
        expect(kernel.id).to.be(id);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let id = uuid();
      let tester = new KernelTester(() => {
        tester.respond(200, { id: id, name: KERNEL_OPTIONS.name });
      });
      connectToKernel(id, AJAX_KERNEL_OPTIONS).then(kernel => {
        expect(kernel.name).to.be(KERNEL_OPTIONS.name);
        expect(kernel.id).to.be(id);
        done();
      });
    });

    it('should fail if no running kernel available', (done) => {
      let id = uuid();
      let tester = new KernelTester(() => {
        tester.respond(400, { });
      });
      let kernelPromise = connectToKernel(id, KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, 'No running kernel with id: ' + id);
    });

  });

  describe('IKernel', () => {

    context('#statusChanged', () => {

      it('should be a signal following the Kernel status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'busy') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('busy');
        });
      });
    });

    context('#iopubMessage', () => {

      it('should be emitted for an iopub message', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.iopubMessage.connect((k, msg) => {
            expect(msg.header.msg_type).to.be('status');
            kernel.dispose();
            done();
          });
          let msg = createKernelMessage({
            msgType: 'status',
            channel: 'iopub',
            session: kernel.clientId
          }) as KernelMessage.IStatusMsg;
          msg.content.execution_state = 'idle';
          msg.parent_header = msg.header;
          tester.send(msg);
        });
      });

      it('should be emitted regardless of the sender', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.iopubMessage.connect((k, msg) => {
            expect(msg.header.msg_type).to.be('status');
            kernel.dispose();
            done();
          });
          let msg = createKernelMessage({
            msgType: 'status',
            channel: 'iopub',
            session: 'baz'
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
        createKernel(tester).then(kernel => {
          kernel.unhandledMessage.connect((k, msg) => {
            expect(msg.header.msg_type).to.be('foo');
            done();
          });
          let msg = createShellMessage({
            msgType: 'foo',
            channel: 'shell',
            session: kernel.clientId
          });
          msg.parent_header = msg.header;
          tester.send(msg);
        });
      });

      it('should not be emitted for an iopub signal', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let called = false;
          kernel.unhandledMessage.connect((k, msg) => {
            called = true;
          });
          let msg = createKernelMessage({
            msgType: 'status',
            channel: 'iopub',
            session: kernel.clientId
          }) as KernelMessage.IStatusMsg;
          msg.content.execution_state = 'idle';
          msg.parent_header = msg.header;
          tester.send(msg);
          expect(called).to.be(false);
          done();
        });
      });

      it('should not be emitted for a different client session', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let called = false;
          kernel.unhandledMessage.connect((k, msg) => {
            called = true;
          });
          let msg = createShellMessage({
            msgType: 'foo',
            channel: 'shell',
            session: 'baz'
          });
          msg.parent_header = msg.header;
          tester.send(msg);
          expect(called).to.be(false);
          done();
        });
      });

    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.id).to.be('string');
          expect(() => { kernel.id = '1'; }).to.throwError();
          done();
        });
      });

    });

    context('#name', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.name).to.be('string');
          expect(() => { kernel.name = '1'; }).to.throwError();
          done();
        });
      });

    });

    context('#username', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.username).to.be('string');
          expect(() => { kernel.username = '1'; }).to.throwError();
          done();
        });
      });

    });

    context('#clientId', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.clientId).to.be('string');
          expect(() => { kernel.clientId = '1'; }).to.throwError();
          done();
        });
      });
    });

    context('#status', () => {

      it('should get an idle status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'idle') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('idle');
        });
      });

      it('should get a restarting status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'restarting') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('restarting');
        });
      });

      it('should get a busy status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'busy') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('busy');
        });
      });

      it('should get a reconnecting status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'reconnecting') {
              kernel.dispose();
              done();
            }
          });
          tester.triggerError('Error event');
        });
      });

      it('should get a dead status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'dead') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('dead');
        });
      });

      it('should handle an invalid status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'idle') {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('celebrating');
          tester.sendStatus('idle');
        });
      });
    });

    context('#isDisposed', () => {

      it('should be true after we dispose of the kernel', (done) => {
        createKernel().then(kernel => {
          expect(kernel.isDisposed).to.be(false);
          kernel.dispose();
          expect(kernel.isDisposed).to.be(true);
          done();
        });
      });

      it('should be safe to call multiple times', (done) => {
        createKernel().then(kernel => {
          expect(kernel.isDisposed).to.be(false);
          expect(kernel.isDisposed).to.be(false);
          kernel.dispose();
          expect(kernel.isDisposed).to.be(true);
          expect(kernel.isDisposed).to.be(true);
          done();
        });
      });
    });

    context('#dispose()', () => {

      it('should dispose of the resources held by the kernel', (done) => {
        createKernel().then(kernel => {
          let future = kernel.execute({ code: 'foo' });
          let comm = kernel.connectToComm('foo');
          expect(future.isDisposed).to.be(false);
          expect(comm.isDisposed).to.be(false);
          kernel.dispose();
          expect(future.isDisposed).to.be(true);
          expect(comm.isDisposed).to.be(true);
          done();
        });
      });

      it('should be save to call twice', (done) => {
         createKernel().then(kernel => {
          let future = kernel.execute({ code: 'foo' });
          let comm = kernel.connectToComm('foo');
          expect(future.isDisposed).to.be(false);
          expect(comm.isDisposed).to.be(false);
          kernel.dispose();
          expect(future.isDisposed).to.be(true);
          expect(comm.isDisposed).to.be(true);
          expect(kernel.isDisposed).to.be(true);
          kernel.dispose();
          expect(future.isDisposed).to.be(true);
          expect(comm.isDisposed).to.be(true);
          expect(kernel.isDisposed).to.be(true);
          done();
        });
      });
    });

    context('#sendShellMessage()', () => {

      it('should send a message to the kernel', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IOptions = {
            msgType: 'custom',
            channel: 'shell',
            username: kernel.username,
            session: kernel.clientId
          };
          let msg = createShellMessage(options);
          kernel.sendShellMessage(msg, true);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('custom');
            done();
          });
        });
      });

      it('should send a binary message', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IOptions = {
            msgType: 'custom',
            channel: 'shell',
            username: kernel.username,
            session: kernel.clientId
          };
          let encoder = new TextEncoder('utf8');
          let data = encoder.encode('hello');
          let msg = createShellMessage(options, {}, {}, [data, data.buffer]);
          kernel.sendShellMessage(msg, true);

          tester.onMessage((msg: any) => {
            let decoder = new TextDecoder('utf8');
            let item = msg.buffers[0] as DataView;
            expect(decoder.decode(item)).to.be('hello');
            done();
          });
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IOptions = {
            msgType: 'custom',
            channel: 'shell',
            username: kernel.username,
            session: kernel.clientId
          };
          let msg = createShellMessage(options);
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            try {
              kernel.sendShellMessage(msg, true);
            } catch (err) {
              expect(err.message).to.be('Kernel is dead');
              done();
            }
          });
        });
      });

      it('should handle out of order messages', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IOptions = {
            msgType: 'custom',
            channel: 'shell',
            username: kernel.username,
            session: kernel.clientId
          };
          let msg = createShellMessage(options);
          let future = kernel.sendShellMessage(msg, true);
          let newMsg: KernelMessage.IMessage;

          tester.onMessage((msg) => {
            // trigger onDone
            options.msgType = 'status';
            options.channel = 'iopub';
            newMsg = createKernelMessage(options, { execution_state: 'idle' });
            newMsg.parent_header = msg.header;
            tester.send(newMsg);

            future.onIOPub = () => {
              options.msgType = 'custom';
              options.channel = 'shell';
              newMsg = createShellMessage(options);
              newMsg.parent_header = msg.header;
              tester.send(newMsg);
            };

            future.onDone = () => {
              done();
            };
          });
        });
      });
    });

    context('#interrupt()', () => {

      it('should interrupt and resolve with a valid server response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204,  { id: kernel.id, name: kernel.name });
          };
          kernel.interrupt().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        let data = { id: uuid(), name: KERNEL_OPTIONS.name };
        let tester = new KernelTester(() => {
          tester.respond(201, data);
        });
        startNewKernel(AJAX_KERNEL_OPTIONS).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204,  { id: kernel.id, name: kernel.name });
          };
          kernel.interrupt().then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200,  { id: kernel.id, name: kernel.name });
          };
          let interrupt = kernel.interrupt();
          expectFailure(interrupt, done, 'Invalid Status: 200');
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let interrupt = kernel.interrupt();
          expectFailure(interrupt, done, '');
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'dead') {
              expectFailure(kernel.interrupt(), done, 'Kernel is dead');
            }
          });
        });
      });
    });

    context('#restart()', () => {

      it('should restart and resolve with a valid server response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { id: kernel.id, name: kernel.name });
            tester.sendStatus('starting');
          };
          kernel.restart().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200,  { id: kernel.id, name: kernel.name });
            tester.sendStatus('starting');
          };
          kernel.restart().then(() => { done(); });
        });
      });

      it('should fail if the kernel does not restart', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, {});
          };
          let restart = kernel.restart();
          expectFailure(restart, done, '');
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, { id: kernel.id, name: kernel.name });
          };
          let restart = kernel.restart();
          expectFailure(restart, done, 'Invalid Status: 204');
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let restart = kernel.restart();
          expectFailure(restart, done, '');
        });
      });

      it('should throw an error for an invalid id', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { });
          };
          let restart = kernel.restart();
          expectFailure(restart, done);
        });
      });

      it('should dispose of existing comm and future objects', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let comm = kernel.connectToComm('test');
          let future = kernel.execute({ code: 'foo' });
          tester.onRequest = () => {
            tester.respond(200, { id: kernel.id, name: kernel.name });
          };
          kernel.restart().then(() => {
            expect(comm.isDisposed).to.be(true);
            expect(future.isDisposed).to.be(true);
            done();
          });
        });
      });

    });

    describe('#reconnect()', () => {

      it('should reconnect the websocket', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.reconnect().then(() => {
            done();
          });
        });
      });

      it("should emit a `'reconnecting'` status", (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.reconnect().then(() => {
            done();
          });
          expect(kernel.status).to.be('reconnecting');
        });
      });

    });

    context('#shutdown()', () => {

      it('should shut down and resolve with a valid server response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          kernel.shutdown().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        let data = { id: uuid(), name: KERNEL_OPTIONS.name };
        let tester = new KernelTester(() => {
          tester.respond(201, data);
        });
        startNewKernel(AJAX_KERNEL_OPTIONS).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, data);
          };
          kernel.shutdown().then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { id: uuid(), name: KERNEL_OPTIONS.name });
          };
          let shutdown = kernel.shutdown();
          expectFailure(shutdown, done, 'Invalid Status: 200');
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let shutdown = kernel.shutdown();
          expectFailure(shutdown, done, '');
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'dead') {
              expectFailure(kernel.shutdown(), done, 'Kernel is dead');
            }
          });
        });
      });
    });

    context('#kernelInfo()', () => {

      it('should resolve the promise', (done) => {
        createKernel().then(kernel => {
          // resolved by KernelTester
          kernel.kernelInfo().then((msg) => {
            let name = msg.content.language_info.name;
            expect(name).to.be(EXAMPLE_KERNEL_INFO.language_info.name);
            done();
          });
        });
      });
    });

    context('#complete()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          };
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('complete_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          kernel.complete(options).then(() => { done(); });
        });
      });

      it('should reject the promise if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          };
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'dead') {
              let promise = kernel.complete(options);
              expectFailure(promise, done, 'Kernel is dead');
            }
          });
        });
      });
    });

    context('#inspect()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          };
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('inspect_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          kernel.inspect(options).then(() => { done(); });
        });
      });

      it('should delay the promise if the kernel is reconnecting', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          };
          tester.triggerError('foo');
          let called = false;
          tester.onMessage((msg) => {
            called = true;
            expect(msg.header.msg_type).to.be('inspect_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          let promise: Promise<KernelMessage.IInspectReplyMsg>;
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'reconnecting') {
              promise = kernel.inspect(options);
              tester.sendStatus('idle');
            }
            if (kernel.status === 'idle') {
              expect(called).to.be(false);
              promise.then(() => {
                expect(called).to.be(true);
                done();
              });
            }
          });
        });
      });
    });

    context('#isComplete()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IIsCompleteRequest = {
            code: 'hello'
          };
          let promise = kernel.isComplete(options);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('is_complete_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          promise.then(() => { done(); });
        });
      });
    });

    context('#history()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IHistoryRequest = {
            output: true,
            raw: true,
            hist_access_type: 'search',
            session: 0,
            start: 1,
            stop: 2,
            n: 1,
            pattern: '*',
            unique: true,
          };
          let promise = kernel.history(options);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('history_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          promise.then(() => { done(); });
        });
      });
    });

    context('#sendInputReply()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.sendInputReply({ value: 'test' });
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('input_reply');
            done();
          });
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            try {
              kernel.sendInputReply({ value: 'test' });
            } catch (err) {
              expect(err.message).to.be('Kernel is dead');
              done();
            }
          });
        });
      });
    });

    context('#execute()', () => {

      it('should send and handle incoming messages', (done) => {
        let tester = new KernelTester();
        let newMsg: KernelMessage.IMessage;
        createKernel(tester).then(kernel => {
          let content: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(content);
          expect(future.onDone).to.be(null);
          expect(future.onStdin).to.be(null);
          expect(future.onReply).to.be(null);
          expect(future.onIOPub).to.be(null);

          let options: KernelMessage.IOptions = {
            msgType: 'custom',
            channel: 'shell',
            username: kernel.username,
            session: kernel.clientId
          };

          tester.onMessage((msg) => {
            expect(msg.channel).to.be('shell');

            // send a reply
            options.channel = 'shell';
            newMsg = createKernelMessage(options);
            newMsg.parent_header = msg.header;
            tester.send(newMsg);

            future.onReply = () => {
              // trigger onStdin
              options.channel = 'stdin';
              newMsg = createKernelMessage(options);
              newMsg.parent_header = msg.header;
              tester.send(newMsg);
            };

            future.onStdin = () => {
              // trigger onIOPub with a 'stream' message
              options.channel = 'iopub';
              options.msgType = 'stream';
              let streamContent: JSONObject = { name: 'stdout', text: '' };
              newMsg = createKernelMessage(options, streamContent);
              newMsg.parent_header = msg.header;
              tester.send(newMsg);
            };

            future.onIOPub = (ioMsg) => {
              if (ioMsg.header.msg_type === 'stream') {
                // trigger onDone
                options.msgType = 'status';
                newMsg = createKernelMessage(options, { execution_state: 'idle' });
                newMsg.parent_header = msg.header;
                tester.send(newMsg);
              }
            };

            future.onDone = () => {
              doLater(() => {
                expect(future.isDisposed).to.be(true);
                done();
              });
            };

          });
        });
      });

      it('should not dispose of KernelFuture when disposeOnDone=false', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          expect(future.onDone).to.be(null);
          expect(future.onStdin).to.be(null);
          expect(future.onReply).to.be(null);
          expect(future.onIOPub).to.be(null);

          tester.onMessage((msg) => {
            expect(msg.channel).to.be('shell');

            // send a reply
            msg.parent_header = msg.header;
            msg.channel = 'shell';
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              msg.channel = 'iopub';
              msg.header.msg_type = 'stream';
              msg.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msg);
            };

            future.onIOPub = () => {
              if (msg.header.msg_type === 'stream') {
                // trigger onDone
                msg.header.msg_type = 'status';
                (msg as KernelMessage.IStatusMsg).content.execution_state = 'idle';
                tester.send(msg);
              }
            };

            future.onDone = () => {
              doLater(() => {
                expect(future.isDisposed).to.be(false);
                expect(future.onDone).to.be(null);
                expect(future.onIOPub).to.not.be(null);
                future.dispose();
                expect(future.onIOPub).to.be(null);
                expect(future.isDisposed).to.be(true);
                done();
              });
            };

          });
        });
      });

    });

    describe('#getKernelSpec()', () => {

      it('should load the kernelspec', (done) => {
        let ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        };
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { 'default': 'python',
                                 'kernelspecs': ids });
          };
          kernel.getKernelSpec().then(spec => {
            expect(spec.language).to.be('python');
            done();
          });
        });
      });

    });

    context('#registerMessageHook()', () => {

      it('should have the most recently registered hook run first', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              calls.push('last');
              return true;
            });

            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              calls.push('first');
              // not returning should also continue handling
              return void 0;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              // the last hook was called for the stream and the status message.
              expect(calls).to.eql(['first', 'last', 'iopub', 'first', 'last', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should abort processing if a hook returns false, but the done logic should still work', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              calls.push('last');
              return true;
            });

            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              calls.push('first');
              return false;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              // the last hook was called for the stream and the status message.
              expect(calls).to.eql(['first', 'first']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should process additions on the next run', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              calls.push('last');
              kernel.registerMessageHook(parent_header.msg_id, (msg) => {
                calls.push('first');
                return true;
              });
              return true;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              expect(calls).to.eql(['last', 'iopub', 'first', 'last', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should deactivate a hook immediately on removal', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            let toDelete = (msg: KernelMessage.IIOPubMessage) => {
              calls.push('delete');
              return true;
            }
            let toDeleteHook = kernel.registerMessageHook(parent_header.msg_id, toDelete);

            kernel.registerMessageHook(parent_header.msg_id, (msg) => {
              if (calls.length > 0) {
                // delete the hook the second time around
                toDeleteHook.dispose();
              }
              calls.push('first');
              return true;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              expect(calls).to.eql(['first', 'delete', 'iopub', 'first', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });
    });
  });

  describe('IFuture', () => {

    it('should have a read-only msg attribute', (done) => {
      createKernel().then(kernel => {
        let future = kernel.execute({ code: 'hello' });
        expect(typeof future.msg.header.msg_id).to.be('string');
        expect(() => { future.msg = null; }).to.throwError();
        done();
      });
    });

    describe('Message hooks', () => {

      it('should have the most recently registered hook run first', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            future.registerMessageHook((msg) => {
              calls.push('last');
              return true;
            });

            future.registerMessageHook((msg) => {
              calls.push('first');
              // Check to make sure we actually got the messages we expected.
              if (msg.header.msg_type === 'stream') {
                expect((msg as KernelMessage.IStreamMsg).content.text).to.be('foo1');
              } else {
                expect((msg as KernelMessage.IStatusMsg).content.execution_state).to.be('idle');
              }
              // not returning should also continue handling
              return void 0;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              // the last hook was called for the stream and the status message.
              expect(calls).to.eql(['first', 'last', 'iopub', 'first', 'last', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should abort processing if a hook returns false, but the done logic should still work', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            future.registerMessageHook((msg) => {
              calls.push('last');
              return true;
            });

            future.registerMessageHook((msg) => {
              calls.push('first');
              return false;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              // the last hook was called for the stream and the status message.
              expect(calls).to.eql(['first', 'first']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should process additions on the next run', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            future.registerMessageHook((msg) => {
              calls.push('last');
              future.registerMessageHook((msg) => {
                calls.push('first');
                return true;
              });
              return true;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              expect(calls).to.eql(['last', 'iopub', 'first', 'last', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });

      it('should deactivate message hooks immediately on removal', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: KernelMessage.IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          };
          let future = kernel.execute(options, false);
          tester.onMessage((message) => {
            // send a reply
            let parent_header = message.header;
            let msg = createMsg('shell', parent_header);
            tester.send(msg);

            future.onReply = () => {
              // trigger onIOPub with a 'stream' message
              let msgStream = createMsg('iopub', parent_header);
              msgStream.header.msg_type = 'stream';
              msgStream.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msgStream);
              // trigger onDone
              let msgDone = createMsg('iopub', parent_header);
              msgDone.header.msg_type = 'status';
              (msgDone as KernelMessage.IStatusMsg).content.execution_state = 'idle';
              tester.send(msgDone);
            };

            let calls: string[] = [];
            let toDelete = (msg: KernelMessage.IIOPubMessage) => {
              calls.push('delete');
              return true;
            }
            future.registerMessageHook(toDelete);

            future.registerMessageHook((msg) => {
              if (calls.length > 0) {
                // delete the hook the second time around
                future.removeMessageHook(toDelete);
              }
              calls.push('first');
              return true;
            });

            future.onIOPub = () => {
              calls.push('iopub')
            };

            future.onDone = () => {
              expect(calls).to.eql(['first', 'delete', 'iopub', 'first', 'iopub']);
              doLater(() => {
                done();
              });
            };
          });
        });
      });
    });
  });

  describe('KernelManager', () => {

    describe('#constructor()', () => {

      it('should take the options as an argument', () => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        expect(manager instanceof KernelManager).to.be(true);
      });

    });

    describe('#getSpecs()', () => {

      it('should get the list of kernel specs', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        };
        let handler = new RequestHandler(() => {
          handler.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
        });
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
        let handler = new RequestHandler(() => {
          handler.respond(200, data);
        });
        manager.listRunning().then(response => {
          expect(response[0]).to.eql(data[0]);
          expect(response[1]).to.eql(data[1]);
          done();
        });
      });

    });

    describe('#startNew()', () => {

      it('should start a new kernel', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        let tester = new KernelTester(() => {
          tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        });
        manager.startNew().then(kernel => {
          expect(kernel.status).to.be('unknown');
          kernel.statusChanged.connect(() => {
            if (kernel.status === 'starting') {
              kernel.dispose();
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
        let tester = new KernelTester(() => {
          tester.respond(201, { id: id, name: KERNEL_OPTIONS.name });
        });
        manager.startNew().then(kernel => {
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
        let tester = new KernelTester(() => {
          tester.respond(201, { id: id, name: KERNEL_OPTIONS.name });
        });
        manager.startNew().then(kernel => {
          manager.connectTo(id).then(newKernel => {
            expect(newKernel.name).to.be(kernel.name);
            expect(newKernel.id).to.be(kernel.id);
            expect(newKernel).to.not.be(kernel);
            done();
          });
        });
      });

    });

  });

  describe('getKernelSpecs()', () => {

    it('should load the kernelspecs', (done) => {
      let ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      };
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'python',
                             'kernelspecs': ids });
      });
      getKernelSpecs('localhost').then(specs => {
        let names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      };
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
      });
      getKernelSpecs({ ajaxSettings: ajaxSettings }).then(specs => {
        let names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should throw an error for missing default parameter', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for missing kernelspecs parameter', (done) => {
      let handler = new RequestHandler();
      handler.onRequest = () => {
        handler.respond(200, { 'default': PYTHON_SPEC.name });
      };
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for incorrect kernelspecs parameter type', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [ PYTHON_SPEC ]
                           });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for improper name', (done) => {
      let R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 1;
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for improper language', (done) => {
      let R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.language = 1;
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                             'kernelspecs': { 'R': R_SPEC } });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for improper argv', (done) => {
      let R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.argv = 'hello';
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for improper display_name', (done) => {
      let R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.display_name = ['hello'];
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for missing resources', (done) => {
      let R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.resources;
      let handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                             'kernelspecs': { 'R': R_SPEC } });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done);
    });

    it('should throw an error for an invalid response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      let promise = getKernelSpecs('localhost');
      expectFailure(promise, done, 'Invalid Response: 201');
    });

  });

  describe('#isStreamMsg()', () => {

    it('should check for a stream message type', () => {
      let msg = createKernelMessage({
        msgType: 'stream', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isStreamMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isStreamMsg(msg)).to.be(false);
    });

  });

  describe('#isDisplayDataMsg()', () => {

    it('should check for a display data message type', () => {
      let msg = createKernelMessage({
        msgType: 'display_data', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isDisplayDataMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isDisplayDataMsg(msg)).to.be(false);
    });

  });

  describe('#isExecuteInputMsg()', () => {

    it('should check for a execute input message type', () => {
      let msg = createKernelMessage({
        msgType: 'execute_input', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isExecuteInputMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isExecuteInputMsg(msg)).to.be(false);
    });

  });

  describe('#isExecuteResultMsg()', () => {

    it('should check for an execute result message type', () => {
      let msg = createKernelMessage({
        msgType: 'execute_result', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isExecuteResultMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isExecuteResultMsg(msg)).to.be(false);
    });

  });

  describe('#isStatusMsg()', () => {

    it('should check for a status message type', () => {
      let msg = createKernelMessage({
        msgType: 'status', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isStatusMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isStatusMsg(msg)).to.be(false);
    });

  });

  describe('#isClearOutputMsg()', () => {

    it('should check for a clear output message type', () => {
      let msg = createKernelMessage({
        msgType: 'clear_output', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isClearOutputMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isClearOutputMsg(msg)).to.be(false);
    });

  });

  describe('#isCommOpenMsg()', () => {

    it('should check for a comm open message type', () => {
      let msg = createKernelMessage({
        msgType: 'comm_open', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isCommOpenMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isCommOpenMsg(msg)).to.be(false);
    });

  });

  describe('#isErrorMsg()', () => {

    it('should check for an message type', () => {
      let msg = createKernelMessage({
        msgType: 'error', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isErrorMsg(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'foo', channel: 'iopub', session: 'baz'
      });
      expect(KernelMessage.isErrorMsg(msg)).to.be(false);
    });

  });

});

