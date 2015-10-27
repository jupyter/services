// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  listRunningKernels, connectToKernel, startNewKernel, createKernelMessage
} from '../../lib/kernel';

import { 
  ICompleteRequest, IExecuteRequest, IInspectRequest, IIsCompleteRequest, 
  IKernel, IKernelId, IKernelInfo, IKernelMessage, IKernelMessageOptions, 
  IKernelOptions, KernelStatus
} from '../../lib/ikernel';

import { deserialize, serialize } from '../../lib/serialize';

import { PromiseDelegate, uuid } from '../../lib/utils';

import { MockSocket, MockSocketServer, overrideWebSocket } from './mocksocket';

import { RequestHandler, ajaxOptions, expectFailure, doLater } from './utils';


// Abnormal websocket close.
const CLOSE_ABNORMAL = 1006;


overrideWebSocket();


const EXAMPLE_KERNEL_INFO: IKernelInfo = {
  protocol_version: '1',
  implementation: 'a',
  implementation_version: '1',
  language_info: {
    name: 'test',
    version: '',
    mimetype: '',
    file_extension: '',
    pygments_lexer: '',
    codemirror_mode: '',
    nbconverter_exporter: ''
  },
  banner: '',
  help_links: {
  }
}


const KERNEL_OPTIONS: IKernelOptions = {
  baseUrl: 'http://localhost:8888',
  wsUrl: 'ws://localhost:8888',
  name: 'test',
  username: 'testUser'
}


/**
 * Kernel class test rig.
 */
export
class KernelTester extends RequestHandler {
  /**
   * Create a new Kernel tester.
   */
  constructor(initial_status='starting') {
    super();
    this._promiseDelegate = new PromiseDelegate<void>();
    MockSocketServer.onConnect = (server: MockSocketServer) => {
      this._server = server;
      this.sendStatus(initial_status);
      this._promiseDelegate.resolve();
      this._server.onmessage = (msg: any) => {
        var data = deserialize(msg.data);
        if (data.header.msg_type === 'kernel_info_request') {
          data.parent_header = data.header;
          data.header.msg_type = 'kernel_info_reply';
          data.content = EXAMPLE_KERNEL_INFO;
          this.send(data);
        } else {
          var onMessage = this._onMessage;
          if (onMessage) onMessage(data);
        }
      }
    }
  }

  sendStatus(status: string) {
    var options: IKernelMessageOptions = {
      msgType: 'status',
      channel: 'iopub',
      session: uuid(),
    }
    var msg = createKernelMessage(options, { execution_state: status } );
    this.send(msg);
  }

  /**
   * Register a connection callback with the websocket server.
   */
  onConnect(cb: (server: MockSocketServer) => void) {
    this._promiseDelegate.promise.then(() => {
      cb(this._server);
    });
  }

  /**
   * Register a message callback with the websocket server.
   */
  onMessage(cb: (msg: IKernelMessage) => void) {
    this._onMessage = cb;
  }

  /**
   * Register a close with the websocket server.
   */
  onClose(cb: (ws: MockSocket) => void) {
    this._promiseDelegate.promise.then(() => {
      this._server.onWSClose = cb;
    });
  }

  /**
   * Send a message to the server.
   */
  send(msg: IKernelMessage) {
    this._promiseDelegate.promise.then(() => {
      this._server.send(serialize(msg));
    });
  }

  /**
   * Trigger an error on the server.
   */
  triggerError(msg: string) {
    this._promiseDelegate.promise.then(() => {
      this._server.triggerError(msg);
    })
  }

  private _server: MockSocketServer = null;
  private _onMessage: (msg: IKernelMessage) => void = null;
  private _promiseDelegate: PromiseDelegate<void> = null;
}


describe('jupyter.services - kernel', () => {

  describe('listRunningKernels()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      var handler = new RequestHandler();
      var list = listRunningKernels('http://localhost:8888');
      var data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      handler.respond(200, data);
      return list.then((response: IKernelId[]) => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var handler = new RequestHandler();
      var list = listRunningKernels('http://localhost:8888', ajaxOptions);
      var data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      handler.respond(200, data);
      return list.then((response: IKernelId[]) => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler();
      var list = listRunningKernels('http://localhost:8888');
      var data = { id: uuid(), name: "test" };
      handler.respond(200, data);
      expectFailure(list, done, "Invalid kernel list");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var list = listRunningKernels('http://localhost:8888');
      handler.respond(201, { });
      expectFailure(list, done, "Invalid Status: 201");
    });

    it('should throw an error for an error response', (done) => {
      var handler = new RequestHandler();
      var list = listRunningKernels('http://localhost:8888');
      handler.respond(500, { });
      expectFailure(list, done, "");
    });

  });

  describe('startNewKernel()', () => {

    it('should create an IKernel object', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      kernelPromise.then((kernel: IKernel) => {
        expect(kernel.status).to.be(KernelStatus.Starting);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS, ajaxOptions);
      tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      kernelPromise.then((kernel: IKernel) => {
        expect(kernel.status).to.be(KernelStatus.Starting);
        done();
      });
    });

    it('should throw an error if the kernel dies', (done) => {
      var tester = new KernelTester('dead');
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      expectFailure(kernelPromise, done, 'Kernel failed to start');
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      var data = { id: uuid() };
      tester.respond(201, data);
      return expectFailure(kernelPromise, done, "Invalid kernel id");
    });

    it('should throw an error for another invalid kernel id', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      var data = { id: uuid(), name: 1 };
      tester.respond(201, data);
      return expectFailure(kernelPromise, done, "Invalid kernel id");
    });

    it('should throw an error for an invalid response', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      var data = { id: uuid(), name: KERNEL_OPTIONS.name };
      tester.respond(200, data);
      return expectFailure(kernelPromise, done, "Invalid Status: 200");
    });

    it('should throw an error for an error response', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      var data = { id: uuid(), name: KERNEL_OPTIONS.name };
      tester.respond(500, { });
      return expectFailure(kernelPromise, done, "");
    });

    it('should auto-reconnect on websocket error', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      kernelPromise.then((kernel: IKernel) => {
        expect(kernel.status).to.be(KernelStatus.Starting);
        kernel.statusChanged.connect(() => {
          if (kernel.status === KernelStatus.Starting) {
            done();
          }
        });
        tester.triggerError('Error event');
      });
    });
  });

  describe('connectToKernel()', () => {

    it('should reuse an exisiting kernel', (done) => {
      var tester = new KernelTester();
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      var id = uuid();
      tester.respond(201, { id: id, name: KERNEL_OPTIONS.name });
      kernelPromise.then((kernel: IKernel) => {
        connectToKernel(id).then((newKernel) => {
          expect(newKernel.name).to.be(kernel.name);
          expect(newKernel.id).to.be(kernel.id);
          done();
        });
      });
    });

    it('should connect to a running kernel if given kernel options', (done) => {
      var tester = new KernelTester();
      var id = uuid();
      var kernelPromise = connectToKernel(id, KERNEL_OPTIONS);
      tester.respond(200, [{ id: id, name: KERNEL_OPTIONS.name }]);
      kernelPromise.then((kernel: IKernel) => {
        expect(kernel.name).to.be(KERNEL_OPTIONS.name);
        expect(kernel.id).to.be(id);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var tester = new KernelTester();
      var id = uuid();
      var kernelPromise = connectToKernel(id, KERNEL_OPTIONS, ajaxOptions);
      tester.respond(200, [{ id: id, name: KERNEL_OPTIONS.name }]);
      kernelPromise.then((kernel: IKernel) => {
        expect(kernel.name).to.be(KERNEL_OPTIONS.name);
        expect(kernel.id).to.be(id);
        done();
      });
    });


    it('should fail if no existing kernel and no options', (done) => {
      var tester = new KernelTester();
      var id = uuid();
      var kernelPromise = connectToKernel(id);
      expectFailure(kernelPromise, done, 'Please specify kernel options');
    });

    it('should fail if no running kernel available', (done) => {
      var tester = new KernelTester();
      var id = uuid();
      var kernelPromise = connectToKernel(id, KERNEL_OPTIONS);
      tester.respond(200, [{ id: uuid(), name: KERNEL_OPTIONS.name }]);
      expectFailure(kernelPromise, done, 'No running kernel with id: ' + id);
    });

  });

  describe('IKernel', () => {

    context('#statusChanged', () => {

      it('should be be an signal following the Kernel status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            done();
          });
          tester.sendStatus('busy');
        });
      });
    });

    context('#id', () => {

      it('should be a read only string', (done) => {
        createKernel().then((kernel: IKernel) => {
          expect(typeof kernel.id).to.be('string');
          expect(() => { kernel.id = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#name', () => {

      it('should be a read only string', (done) => {
        createKernel().then((kernel: IKernel) => {
          expect(typeof kernel.name).to.be('string');
          expect(() => { kernel.name = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#username', () => {

      it('should be a read only string', (done) => {
        createKernel().then((kernel: IKernel) => {
          expect(typeof kernel.username).to.be('string');
          expect(() => { kernel.username = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#clientId', () => {

      it('should be a read only string', (done) => {
        createKernel().then((kernel: IKernel) => {
          expect(typeof kernel.clientId).to.be('string');
          expect(() => { kernel.clientId = "1"; }).to.throwError();
          done();
        });
      });
    });

    context('#status', () => {

      it('should get an idle status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Idle);
            done();
          });
          tester.sendStatus('idle');
        });
      });

      it('should get an restarting status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Restarting);
            done();
          });
          tester.sendStatus('restarting');
        });
      });

      it('should get a busy status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Busy);
            done();
          });
          tester.sendStatus('busy');
        });
      });

      it('should get a reconnecting status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Reconnecting);
            done();
          });
          tester.triggerError('Error event');
        });
      });

      it('should get a dead status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Dead);
            done();
          });
          tester.sendStatus('dead');
        });
      });

      it('should handle an invalid status', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Idle);
            done();
          });
          tester.sendStatus('celebrating');
          tester.sendStatus('idle');
        });
      });
    });

    context('#isDisposed', () => {

      it('should be true after we dispose of the kernel', () => {
        createKernel().then((kernel: IKernel) => {
          expect(kernel.isDisposed).to.be(false);
          kernel.dispose();
          expect(kernel.isDisposed).to.be(true);
        });
      });

      it('should be safe to call multiple times', () => {
        createKernel().then((kernel: IKernel) => {
          expect(kernel.isDisposed).to.be(false);
          expect(kernel.isDisposed).to.be(false);
          kernel.dispose();
          expect(kernel.isDisposed).to.be(true);
          expect(kernel.isDisposed).to.be(true);
        });
      });
    });

    context('#dispose()', () => {

      it('should dispose of the resources held by the kernel', () => {
        createKernel().then((kernel: IKernel) => {
          var future = kernel.execute({ code: 'foo' });
          var comm = kernel.connectToComm('foo');
          expect(future.isDisposed).to.be(false);
          expect(comm.isDisposed).to.be(false);
          kernel.dispose();
          expect(future.isDisposed).to.be(true);
          expect(comm.isDisposed).to.be(true);
        });
      });
    });

    context('#sendShellMessage()', () => {

      it('should send a message to the kernel', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          var options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          var msg = createKernelMessage(options);
          var future = kernel.sendShellMessage(msg, true);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('custom');
            done();
          });
        });
      });

      it('should send a binary message', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          var options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          var encoder = new TextEncoder('utf8');
          var data = encoder.encode('hello');
          var msg = createKernelMessage(options, {}, {}, [data, data.buffer]);
          var future = kernel.sendShellMessage(msg, true);

          tester.onMessage((msg: any) => {
            var decoder = new TextDecoder('utf8');
            var item = <DataView>msg.buffers[0];
            expect(decoder.decode(item)).to.be('hello');
            done();
          });
        });
      });

      it('should fail if the kernel is closed', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          var options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          var msg = createKernelMessage(options);
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            try {
              kernel.sendShellMessage(msg, true);
            } catch(err) {
              expect(err.message).to.be(
                'Kernel is not ready to send a message'
              );
              done();
            }
          });
        });
      });

      it('should handle out of order messages', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
        kernelPromise.then((kernel: IKernel) => {
          var options: IKernelMessageOptions = {
            msgType: "custom",
            channel: "shell",
            username: kernel.username,
            session: kernel.clientId
          }
          var msg = createKernelMessage(options);
          var future = kernel.sendShellMessage(msg, true);
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

      it('should resolve the promise with a valid server response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var interrupt = kernel.interrupt();
          tester.respond(204, data);
          interrupt.then(() => { done(); });
        });
      });

      it('should accept ajax options', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var interrupt = kernel.interrupt(ajaxOptions);
          tester.respond(204, data);
          interrupt.then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var interrupt = kernel.interrupt();
          tester.respond(200, data);
          expectFailure(interrupt, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var interrupt = kernel.interrupt();
          tester.respond(500, { });
          expectFailure(interrupt, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            expectFailure(kernel.interrupt(), done, 'Kernel is dead');
          });
        });
      });
    });

    context('#restart()', () => {

      it('should resolve the promise with a valid server response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart();
          tester.respond(200, data);
          tester.sendStatus('starting');
          restart.then(() => { done(); });
        });
      });

      it('should accept ajax options', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart(ajaxOptions);
          tester.respond(200, data);
          tester.sendStatus('starting');
          restart.then(() => { done(); });
        });
      });

      it('should fail if the kernel does not restart', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart();
          tester.respond(500, {});
          expectFailure(restart, done, '');
        });
      });

      it('should throw an error for an invalid response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart();
          tester.respond(204, data);
          expectFailure(restart, done, "Invalid Status: 204");
        });
      });

      it('should throw an error for an error response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart();
          tester.respond(500, { });
          expectFailure(restart, done, "");
        });
      });

      it('should throw an error for an invalid id', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var restart = kernel.restart();
          tester.respond(200, { });
          expectFailure(restart, done, "Invalid kernel id");
        });
      });

      it('should dispose of existing comm and future objects', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var comm = kernel.connectToComm('test');
          var future = kernel.execute({ code: 'foo' });
          var restart = kernel.restart();
          expect(comm.isDisposed).to.be(true);
          expect(future.isDisposed).to.be(true);
          done();
        });
      });

    });

    context('#shutdown()', () => {

      it('should resolve the promise with a valid server response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var shutdown = kernel.shutdown();
          tester.respond(204, data);
          shutdown.then(() => { done(); });
        });
      });

      it('should accept ajax options', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var shutdown = kernel.shutdown(ajaxOptions);
          tester.respond(204, data);
          shutdown.then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var shutdown = kernel.shutdown();
          tester.respond(200, data);
          expectFailure(shutdown, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var shutdown = kernel.shutdown();
          tester.respond(500, { });
          expectFailure(shutdown, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            expectFailure(kernel.shutdown(), done, 'Kernel is dead');
          });
        });
      });
    });

    context('#kernelInfo()', () => {

      it('should resolve the promise', (done) => {
        createKernel().then((kernel: IKernel) => {
          // resolved by KernelTester
          kernel.kernelInfo().then((info) => {
            var name = info.language_info.name;
            expect(name).to.be(EXAMPLE_KERNEL_INFO.language_info.name);
            done();
          });
        });
      });
    });

    context('#complete()', () => {

      it('should resolve the promise', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var options: ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          }
          var promise = kernel.complete(options);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('complete_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          promise.then(() => { done(); });
        });
      });

      it('should reject the promise if the kernel is dead', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var options: ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          }
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Dead) {
              var promise = kernel.complete(options);
              expectFailure(promise, done, 
                            'Kernel is not ready to send a message');
            }
          });
        });
      });
    });

    context('#inspect()', () => {

      it('should resolve the promise', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var options: IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          }
          var promise = kernel.inspect(options);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('inspect_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          promise.then(() => { done(); });
        });
      });

      it('should reject the promise if the kernel is reconnecting', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var options: IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          }
          tester.triggerError('foo');
          kernel.statusChanged.connect(() => {
            if (kernel.status === KernelStatus.Reconnecting) {
              var promise = kernel.inspect(options);
              expectFailure(promise, done,
                            'Kernel is not ready to send a message');
            }
          });
        });
      });
    });

    context('#isComplete()', () => {

      it('should resolve the promise', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          var options: IIsCompleteRequest = {
            code: 'hello'
          }
          var promise = kernel.isComplete(options);
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('is_complete_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          promise.then(() => { done(); });
        });
      });
    });

    context('#sendInputReply()', () => {

      it('should resolve the promise', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          kernel.sendInputReply({ value: 'test' });
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('input_reply');
            done();
          });
        });
      });

     it('should fail if the kernel is dead', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);
        kernelPromise.then((kernel: IKernel) => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            try {
              kernel.sendInputReply({ value: 'test' });
            } catch(err) {
              expect(err.message).to.be(
                'Kernel is not ready to send a message'
              );
              done();
            }
          });
        });
      });
    });

    context('#execute()', () => {

      it('should send and handle incoming messages', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);

        kernelPromise.then((kernel) => {
          var options: IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          }
          var future = kernel.execute(options);
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

      it('should not dispose of KernelFuture when disposeOnDone=false', (done) => {
        var tester = new KernelTester();
        var kernelPromise = startNewKernel(KERNEL_OPTIONS);
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(201, data);

        kernelPromise.then((kernel) => {
          var options: IExecuteRequest = {
            code: 'test',
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: false
          }
          var future = kernel.execute(options, false);
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
  });

});


/**
 * Convenience function to start a kernel fully.
 */
export
function createKernel(tester?: KernelTester): Promise<IKernel> {
  var tester = tester || new KernelTester();
  var kernelPromise = startNewKernel(KERNEL_OPTIONS);
  tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
  return kernelPromise;
}
