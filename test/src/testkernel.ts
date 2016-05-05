// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  uuid
} from 'jupyter-js-utils';

import {
  MockSocket, MockSocketServer, overrideWebSocket
} from 'jupyter-js-utils/lib/mocksocket';

import {
  KernelManager, connectToKernel, createKernelMessage, getKernelSpecs,
  listRunningKernels, startNewKernel, findKernelById
} from '../../lib/kernel';

import {
  ICompleteRequest, IExecuteRequest, IInspectRequest, IIsCompleteRequest,
  IKernel, IKernelId, IKernelInfo, IKernelMessage, IKernelMessageOptions,
  IKernelOptions, IKernelSpecId, KernelStatus, IInspectReply,
  isExecuteResultMessage, isDisplayDataMessage, isExecuteInputMessage,
  isClearOutputMessage, isStreamMessage, isStatusMessage, isCommOpenMessage,
  isErrorMessage, IHistoryRequest
} from '../../lib/ikernel';

import {
  deserialize, serialize
} from '../../lib/serialize';

import {
  RequestHandler, ajaxSettings, doLater, expectFailure, createKernel,
  KernelTester, KERNEL_OPTIONS, AJAX_KERNEL_OPTIONS, EXAMPLE_KERNEL_INFO,
  PYTHON_SPEC
} from './utils';


// Abnormal websocket close.
const CLOSE_ABNORMAL = 1006;


let PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = "Python3";
PYTHON3_SPEC.spec.display_name = "python3"


describe('jupyter.services - kernel', () => {

  describe('listRunningKernels()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      let data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let options = {
        baseUrl: 'http://localhost:8888',
      }
      listRunningKernels(options).then(response => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      let handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      let options = {
        baseUrl: 'http://localhost:8888',
        ajaxSettings: ajaxSettings
      }
      listRunningKernels(options).then((response: IKernelId[]) => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      let handler = new RequestHandler(() => {
        let data = { id: uuid(), name: "test" };
        handler.respond(200, data);
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "Invalid kernel list");
    });

    it('should throw an error for an invalid response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "Invalid Status: 201");
    });

    it('should throw an error for an error response', (done) => {
      let handler = new RequestHandler(() => {
        handler.respond(500, { });
      });
      let list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "");
    });

  });

  describe('startNewKernel()', () => {

    it('should create an IKernel object', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        expect(kernel.status).to.be(KernelStatus.Unknown);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      let kernelPromise = startNewKernel(AJAX_KERNEL_OPTIONS);
      kernelPromise.then(kernel => {
        expect(kernel.status).to.be(KernelStatus.Unknown);
        done();
      });
    });

    it('should still start if the kernel dies', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      tester.initialStatus ='dead';
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        kernel.statusChanged.connect((kernel, state) => {
          if (state == KernelStatus.Dead) {
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
      expectFailure(kernelPromise, done, "Invalid Status: 200");
    });

    it('should throw an error for an error response', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(500, { });
      });
      let kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, "");
    });

    it('should auto-reconnect on websocket error', (done) => {
      let tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      startNewKernel(KERNEL_OPTIONS).then(kernel => {
        expect(kernel.status).to.be(KernelStatus.Unknown);
        kernel.statusChanged.connect(() => {
          if (kernel.status === KernelStatus.Reconnecting) {
            done();
            kernel.dispose();
            return;
          }
          if (kernel.status === KernelStatus.Starting) {
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
      })
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
            if (kernel.status === KernelStatus.Busy) {
              kernel.dispose();
              done();
            }
          });
          tester.sendStatus('busy');
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
          let msg = createKernelMessage({
            msgType: 'foo',
            channel: 'bar',
            session: kernel.clientId
          });
          msg.parent_header = msg.header;
          tester.send(msg);
        });
      });
    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.id).to.be('string');
          expect(() => { kernel.id = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#name', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.name).to.be('string');
          expect(() => { kernel.name = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#username', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.username).to.be('string');
          expect(() => { kernel.username = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#clientId', () => {

      it('should be a read only string', (done) => {
        createKernel().then(kernel => {
          expect(typeof kernel.clientId).to.be('string');
          expect(() => { kernel.clientId = "1"; }).to.throwError();
          done();
        });
      });
    });

    context('#status', () => {

      it('should get an idle status', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Idle) {
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
            if (kernel.status === KernelStatus.Restarting) {
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
            if (kernel.status === KernelStatus.Busy) {
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
            if (kernel.status === KernelStatus.Reconnecting) {
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
            if (kernel.status === KernelStatus.Dead) {
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
            if (kernel.status === KernelStatus.Idle) {
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
    });

    context('#sendShellMessage()', () => {

      it('should send a message to the kernel', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          let msg = createKernelMessage(options);
          let future = kernel.sendShellMessage(msg, true);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('custom');
            done();
          });
        });
      });

      it('should send a binary message', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          let encoder = new TextEncoder('utf8');
          let data = encoder.encode('hello');
          let msg = createKernelMessage(options, {}, {}, [data, data.buffer]);
          let future = kernel.sendShellMessage(msg, true);

          tester.onMessage((msg: any) => {
            let decoder = new TextDecoder('utf8');
            let item = <DataView>msg.buffers[0];
            expect(decoder.decode(item)).to.be('hello');
            done();
          });
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          let msg = createKernelMessage(options);
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            try {
              kernel.sendShellMessage(msg, true);
            } catch(err) {
              expect(err.message).to.be('Kernel is dead');
              done();
            }
          });
        });
      });

      it('should handle out of order messages', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          let msg = createKernelMessage(options);
          let future = kernel.sendShellMessage(msg, true);
          tester.onMessage((msg) => {
            // trigger onDone
            msg.channel = 'iopub';
            msg.header.msg_type = 'status';
            msg.content.execution_state = 'idle';
            msg.parent_header = msg.header
            tester.send(msg);

            future.onIOPub = () => {
              msg.channel = 'shell';
              tester.send(msg);
            }

            future.onDone = () => {
              done();
            }
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
          expectFailure(interrupt, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let interrupt = kernel.interrupt();
          expectFailure(interrupt, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Dead) {
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
          }
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
          expectFailure(restart, done, "Invalid Status: 204");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let restart = kernel.restart();
          expectFailure(restart, done, "");
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
          expectFailure(shutdown, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          let shutdown = kernel.shutdown();
          expectFailure(shutdown, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Dead) {
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
          kernel.kernelInfo().then((info) => {
            let name = info.language_info.name;
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
          let options: ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          }
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
          let options: ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          }
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Dead) {
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
          let options: IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          }
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
          let options: IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          }
          tester.triggerError('foo');
          let called = false;
          tester.onMessage((msg) => {
            called = true;
            expect(msg.header.msg_type).to.be('inspect_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          let promise: Promise<IInspectReply>;
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Reconnecting) {
              promise = kernel.inspect(options);
              tester.sendStatus('idle');
            }
            if (kernel.status === KernelStatus.Idle) {
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
          let options: IIsCompleteRequest = {
            code: 'hello'
          }
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
          let options: IHistoryRequest = {
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
            } catch(err) {
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
        createKernel(tester).then(kernel => {
          let options: IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          }
          let future = kernel.execute(options);
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
              // trigger onStdin
              msg.channel = 'stdin';
              tester.send(msg);
            }

            future.onStdin = () => {
              // trigger onIOPub with a 'stream' message
              msg.channel = 'iopub';
              msg.header.msg_type = 'stream';
              msg.content = { 'name': 'stdout', 'text': 'foo' };
              tester.send(msg);
            };

            future.onIOPub = () => {
              if (msg.header.msg_type === 'stream') {
                // trigger onDone
                msg.channel = 'iopub';
                msg.header.msg_type = 'status';
                msg.content.execution_state = 'idle';
                tester.send(msg);
              }
            }

            future.onDone = () => {
              doLater(() => {
                expect(future.isDisposed).to.be(true);
                done();
              });
            }

          });
        });
      });

      it('should have a read-only msg attribute', (done) => {
         createKernel().then(kernel => {
           let future = kernel.execute({ code: 'hello' });
           expect(typeof future.msg.header.msg_id).to.be('string');
           expect(() => { future.msg = null; }).to.throwError();
           done();
         });
      });

      it('should not dispose of KernelFuture when disposeOnDone=false', (done) => {
        let tester = new KernelTester();
        createKernel(tester).then(kernel => {
          let options: IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          }
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
            }

            future.onIOPub = () => {
              if (msg.header.msg_type === 'stream') {
                // trigger onDone
                msg.channel = 'iopub';
                msg.header.msg_type = 'status';
                msg.content.execution_state = 'idle';
                tester.send(msg);
              }
            }

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
            }

          });
        });
      });

    });

    describe('#getKernelSpec()', () => {

      it('should load the kernelspec', (done) => {
        let ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        }
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
        }
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
          { id: uuid(), name: "test" },
          { id: uuid(), name: "test2" }
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
          expect(kernel.status).to.be(KernelStatus.Unknown);
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Starting) {
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
      }
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
      }
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
      }
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
      expectFailure(promise, done, "Invalid Response: 201");
    });

  });

  describe('#isStreamMessage()', () => {

    it('should check for a stream message type', () => {
      let msg = createKernelMessage({
        msgType: 'stream', channel: 'bar', session: 'baz'
      });
      expect(isStreamMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isStreamMessage(msg)).to.be(false);
    });

  });

  describe('#isDisplayDataMessage()', () => {

    it('should check for a display data message type', () => {
      let msg = createKernelMessage({
        msgType: 'display_data', channel: 'bar', session: 'baz'
      });
      expect(isDisplayDataMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isDisplayDataMessage(msg)).to.be(false);
    });

  });

  describe('#isExecuteInputMessage()', () => {

    it('should check for a execute input message type', () => {
      let msg = createKernelMessage({
        msgType: 'execute_input', channel: 'bar', session: 'baz'
      });
      expect(isExecuteInputMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isExecuteInputMessage(msg)).to.be(false);
    });

  });

  describe('#isExecuteResultMessage()', () => {

    it('should check for an execute result message type', () => {
      let msg = createKernelMessage({
        msgType: 'execute_result', channel: 'bar', session: 'baz'
      });
      expect(isExecuteResultMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isExecuteResultMessage(msg)).to.be(false);
    });

  });

  describe('#isStatusMessage()', () => {

    it('should check for a status message type', () => {
      let msg = createKernelMessage({
        msgType: 'status', channel: 'bar', session: 'baz'
      });
      expect(isStatusMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isStatusMessage(msg)).to.be(false);
    });

  });

  describe('#isClearOutputMessage()', () => {

    it('should check for a clear output message type', () => {
      let msg = createKernelMessage({
        msgType: 'clear_output', channel: 'bar', session: 'baz'
      });
      expect(isClearOutputMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isClearOutputMessage(msg)).to.be(false);
    });

  });

  describe('#isCommOpenMessage()', () => {

    it('should check for a comm open message type', () => {
      let msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      });
      expect(isCommOpenMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isCommOpenMessage(msg)).to.be(false);
    });

  });

  describe('#isErrorMessage()', () => {

    it('should check for an message type', () => {
      let msg = createKernelMessage({
        msgType: 'error', channel: 'bar', session: 'baz'
      });
      expect(isErrorMessage(msg)).to.be(true);
       msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      });
      expect(isErrorMessage(msg)).to.be(false);
    });

  });

});

