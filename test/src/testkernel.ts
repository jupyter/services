// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  PromiseDelegate, uuid
} from 'jupyter-js-utils';

import {
  KernelManager, connectToKernel, createKernelMessage, getKernelSpecs,
  listRunningKernels, startNewKernel
} from '../../lib/kernel';

import {
  ICompleteRequest, IExecuteRequest, IInspectRequest, IIsCompleteRequest,
  IKernel, IKernelId, IKernelInfo, IKernelMessage, IKernelMessageOptions,
  IKernelOptions, IKernelSpecId, KernelStatus
} from '../../lib/ikernel';

import {
  deserialize, serialize
} from '../../lib/serialize';

import {
  MockSocket, MockSocketServer, overrideWebSocket
} from './mocksocket';

import {
  RequestHandler, ajaxSettings, doLater, expectFailure
} from './utils';


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
  name: 'test',
  username: 'testUser',
}

const AJAX_KERNEL_OPTIONS: IKernelOptions = {
  baseUrl: 'http://localhost:8888',
  name: 'test',
  username: 'testUser',
  ajaxSettings: ajaxSettings
}

var PYTHON_SPEC: IKernelSpecId = {
  name: "Python",
  spec: {
    language: "python",
    argv: [],
    display_name: "python",
    codemirror_mode: "python",
    env: {},
    help_links: [ { text: "re", url: "reUrl" }]
  },
  resources: { foo: 'bar' },
}

var PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = "Python3";
PYTHON3_SPEC.spec.display_name = "python3"


/**
 * Kernel class test rig.
 */
export
class KernelTester extends RequestHandler {
  /**
   * Create a new Kernel tester.
   */
  constructor(onRequest?: (request: any) => void) {
    super(onRequest);
    this._promiseDelegate = new PromiseDelegate<void>();
    MockSocketServer.onConnect = (server: MockSocketServer) => {
      this._server = server;
      this.sendStatus(this._initialStatus);
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

  get initialStatus(): string {
    return this._initialStatus;
  }

  set initialStatus(status: string) {
    this._initialStatus = status;
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
  private _initialStatus = 'starting';
}


describe('jupyter.services - kernel', () => {

  describe('listRunningKernels()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      var data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      var handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      var options = {
        baseUrl: 'http://localhost:8888',
      }
      return listRunningKernels(options).then(response => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var data = [
        { id: uuid(), name: "test" },
        { id: uuid(), name: "test2" }
      ];
      var handler = new RequestHandler(() => {
        handler.respond(200, data);
      });
      var options = {
        baseUrl: 'http://localhost:8888',
        ajaxSettings: ajaxSettings
      }
      return listRunningKernels(options).then((response: IKernelId[]) => {
        expect(response[0]).to.eql(data[0]);
        expect(response[1]).to.eql(data[1]);
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler(() => {
        var data = { id: uuid(), name: "test" };
        handler.respond(200, data);
      });
      var list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "Invalid kernel list");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      var list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "Invalid Status: 201");
    });

    it('should throw an error for an error response', (done) => {
      var handler = new RequestHandler(() => {
        handler.respond(500, { });
      });
      var list = listRunningKernels('http://localhost:8888');
      expectFailure(list, done, "");
    });

  });

  describe('startNewKernel()', () => {

    it('should create an IKernel object', (done) => {
      var tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      return startNewKernel(KERNEL_OPTIONS).then(kernel => {
        expect(kernel.status).to.be(KernelStatus.Starting);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      var kernelPromise = startNewKernel(AJAX_KERNEL_OPTIONS);
      kernelPromise.then(kernel => {
        expect(kernel.status).to.be(KernelStatus.Starting);
        done();
      });
    });

    it('should throw an error if the kernel dies', (done) => {
      var tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      tester.initialStatus ='dead';
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, 'Kernel failed to start');
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var tester = new KernelTester(() => {
        var data = { id: uuid() };
        tester.respond(201, data);
      });
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      return expectFailure(kernelPromise, done, "Invalid kernel id");
    });

    it('should throw an error for another invalid kernel id', (done) => {
      var tester = new KernelTester(() => {
        var data = { id: uuid(), name: 1 };
        tester.respond(201, data);
      });
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      return expectFailure(kernelPromise, done, "Invalid kernel id");
    });

    it('should throw an error for an invalid response', (done) => {
      var tester = new KernelTester(() => {
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        tester.respond(200, data);
      });
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      return expectFailure(kernelPromise, done, "Invalid Status: 200");
    });

    it('should throw an error for an error response', (done) => {
      var tester = new KernelTester(() => {
        tester.respond(500, { });
      });
      var kernelPromise = startNewKernel(KERNEL_OPTIONS);
      return expectFailure(kernelPromise, done, "");
    });

    it('should auto-reconnect on websocket error', (done) => {
      var tester = new KernelTester(() => {
        tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
      });
      return startNewKernel(KERNEL_OPTIONS).then(kernel => {
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
      var id = uuid();
      var tester = new KernelTester(() => {
        tester.respond(200, [{ id: id, name: KERNEL_OPTIONS.name }]);
      });
      return connectToKernel(id, KERNEL_OPTIONS).then(kernel => {
        return connectToKernel(id).then(newKernel => {
          expect(newKernel.name).to.be(kernel.name);
          expect(newKernel.id).to.be(kernel.id);
          done();
        });
      });
    });

    it('should connect to a running kernel if given kernel options', (done) => {
      var id = uuid();
      var tester = new KernelTester(() => {
        tester.respond(200, [{ id: id, name: KERNEL_OPTIONS.name }]);
      });
      return connectToKernel(id, KERNEL_OPTIONS).then(kernel => {
        expect(kernel.name).to.be(KERNEL_OPTIONS.name);
        expect(kernel.id).to.be(id);
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var id = uuid();
      var tester = new KernelTester(() => {
        tester.respond(200, [{ id: id, name: KERNEL_OPTIONS.name }]);
      });
      return connectToKernel(id, AJAX_KERNEL_OPTIONS).then(kernel => {
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
      var id = uuid();
      var tester = new KernelTester(() => {
        tester.respond(200, [{ id: uuid(), name: KERNEL_OPTIONS.name }]);
      });
      var kernelPromise = connectToKernel(id, KERNEL_OPTIONS);
      expectFailure(kernelPromise, done, 'No running kernel with id: ' + id);
    });

  });

  describe('IKernel', () => {

    context('#statusChanged', () => {

      it('should be be an signal following the Kernel status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        return createKernel().then(kernel => {
          expect(typeof kernel.id).to.be('string');
          expect(() => { kernel.id = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#name', () => {

      it('should be a read only string', (done) => {
        return createKernel().then(kernel => {
          expect(typeof kernel.name).to.be('string');
          expect(() => { kernel.name = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#username', () => {

      it('should be a read only string', (done) => {
        return createKernel().then(kernel => {
          expect(typeof kernel.username).to.be('string');
          expect(() => { kernel.username = "1"; }).to.throwError();
          done();
        });
      });

    });

    context('#clientId', () => {

      it('should be a read only string', (done) => {
        return createKernel().then(kernel => {
          expect(typeof kernel.clientId).to.be('string');
          expect(() => { kernel.clientId = "1"; }).to.throwError();
          done();
        });
      });
    });

    context('#status', () => {

      it('should get an idle status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Idle);
            done();
          });
          tester.sendStatus('idle');
        });
      });

      it('should get an restarting status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Restarting);
            done();
          });
          tester.sendStatus('restarting');
        });
      });

      it('should get a busy status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Busy);
            done();
          });
          tester.sendStatus('busy');
        });
      });

      it('should get a reconnecting status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Reconnecting);
            done();
          });
          tester.triggerError('Error event');
        });
      });

      it('should get a dead status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          kernel.statusChanged.connect(() => {
            expect(kernel.status).to.be(KernelStatus.Dead);
            done();
          });
          tester.sendStatus('dead');
        });
      });

      it('should handle an invalid status', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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

      it('should be true after we dispose of the kernel', (done) => {
        return createKernel().then(kernel => {
          expect(kernel.isDisposed).to.be(false);
          kernel.dispose();
          expect(kernel.isDisposed).to.be(true);
          done();
        });
      });

      it('should be safe to call multiple times', (done) => {
        return createKernel().then(kernel => {
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
        return createKernel().then(kernel => {
          var future = kernel.execute({ code: 'foo' });
          var comm = kernel.connectToComm('foo');
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
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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

      it('should interrupt and resolve with a valid server response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204,  { id: kernel.id, name: kernel.name });
          };
          return kernel.interrupt().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        var data = { id: uuid(), name: KERNEL_OPTIONS.name };
        var tester = new KernelTester(() => {
          tester.respond(201, data);
        });
        return startNewKernel(AJAX_KERNEL_OPTIONS).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204,  { id: kernel.id, name: kernel.name });
          };
          return kernel.interrupt().then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200,  { id: kernel.id, name: kernel.name });
          };
          var interrupt = kernel.interrupt();
          expectFailure(interrupt, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          var interrupt = kernel.interrupt();
          expectFailure(interrupt, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            expectFailure(kernel.interrupt(), done, 'Kernel is dead');
          });
        });
      });
    });

    context('#restart()', () => {

      it('should restart and resolve with a valid server response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { id: kernel.id, name: kernel.name });
            tester.sendStatus('starting');
          }
          return kernel.restart().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200,  { id: kernel.id, name: kernel.name });
            tester.sendStatus('starting');
          };
          return kernel.restart().then(() => { done(); });
        });
      });

      it('should fail if the kernel does not restart', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, {});
          };
          var restart = kernel.restart();
          expectFailure(restart, done, '');
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, { id: kernel.id, name: kernel.name });
          };
          var restart = kernel.restart();
          expectFailure(restart, done, "Invalid Status: 204");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          var restart = kernel.restart();
          expectFailure(restart, done, "");
        });
      });

      it('should throw an error for an invalid id', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { });
          };
          var restart = kernel.restart();
          expectFailure(restart, done, "Invalid kernel id");
        });
      });

      it('should dispose of existing comm and future objects', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          var comm = kernel.connectToComm('test');
          var future = kernel.execute({ code: 'foo' });
          tester.onRequest = () => {
            tester.respond(200, { id: kernel.id, name: kernel.name });
          };
          return kernel.restart().then(() => {
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
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, { });
          };
          return kernel.shutdown().then(() => { done(); });
        });
      });

      it('should use ajax options', (done) => {
        let data = { id: uuid(), name: KERNEL_OPTIONS.name };
        let tester = new KernelTester(() => {
          tester.respond(201, data);
        });
        return startNewKernel(AJAX_KERNEL_OPTIONS).then(kernel => {
          tester.onRequest = () => {
            tester.respond(204, data);
          };
          return kernel.shutdown().then(() => { done(); });
        });
      });

      it('should throw an error for an invalid response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(200, { id: uuid(), name: KERNEL_OPTIONS.name });
          };
          var shutdown = kernel.shutdown();
          expectFailure(shutdown, done, "Invalid Status: 200");
        });
      });

      it('should throw an error for an error response', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.onRequest = () => {
            tester.respond(500, { });
          };
          var shutdown = kernel.shutdown();
          expectFailure(shutdown, done, "");
        });
      });

      it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          tester.sendStatus('dead');
          kernel.statusChanged.connect(() => {
            expectFailure(kernel.shutdown(), done, 'Kernel is dead');
          });
        });
      });
    });

    context('#kernelInfo()', () => {

      it('should resolve the promise', (done) => {
        return createKernel().then(kernel => {
          // resolved by KernelTester
          return kernel.kernelInfo().then((info) => {
            var name = info.language_info.name;
            expect(name).to.be(EXAMPLE_KERNEL_INFO.language_info.name);
            done();
          });
        });
      });
    });

    context('#complete()', () => {

      it('should resolve the promise', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          var options: ICompleteRequest = {
            code: 'hello',
            cursor_pos: 4
          }
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('complete_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          return kernel.complete(options).then(() => { done(); });
        });
      });

      it('should reject the promise if the kernel is dead', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          var options: IInspectRequest = {
            code: 'hello',
            cursor_pos: 4,
            detail_level: 0
          }
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('inspect_request');
            msg.parent_header = msg.header;
            tester.send(msg);
          });
          return kernel.inspect(options).then(() => { done(); });
        });
      });

      it('should reject the promise if the kernel is reconnecting', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
          kernel.sendInputReply({ value: 'test' });
          tester.onMessage((msg) => {
            expect(msg.header.msg_type).to.be('input_reply');
            done();
          });
        });
      });

     it('should fail if the kernel is dead', (done) => {
        let tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        return createKernel(tester).then(kernel => {
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

      it('should have a read-only msg attribute', (done) => {
         return createKernel().then(kernel => {
           var future = kernel.execute({ code: 'hello' });
           expect(typeof future.msg.header.msg_id).to.be('string');
           expect(() => { future.msg = null; }).to.throwError();
           done();
         });
      });

      it('should not dispose of KernelFuture when disposeOnDone=false', (done) => {
        var tester = new KernelTester();
        return createKernel(tester).then(kernel => {
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
        var ids = {
          'python': PYTHON_SPEC,
          'python3': PYTHON3_SPEC
        }
        let handler = new RequestHandler(() => {
          handler.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
        });
        return manager.getSpecs().then(specs => {
          var names = Object.keys(specs.kernelspecs);
          expect(names[0]).to.be('python');
          expect(names[1]).to.be('python3');
          done();
        });
      });

    });

    describe('#listRunning()', () => {

      it('should list the running kernels', (done) => {
        let manager = new KernelManager(KERNEL_OPTIONS);
        var data = [
          { id: uuid(), name: "test" },
          { id: uuid(), name: "test2" }
        ];
        let handler = new RequestHandler(() => {
          handler.respond(200, data);
        });
        return manager.listRunning().then(response => {
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
        return manager.startNew().then(kernel => {
          expect(kernel.status).to.be(KernelStatus.Starting);
          done();
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
        return manager.startNew().then(kernel => {
          return manager.connectTo(id).then(newKernel => {
            expect(newKernel.name).to.be(kernel.name);
            expect(newKernel.id).to.be(kernel.id);
            done();
          });
        });
      });

    });

  });

  describe('getKernelSpecs()', () => {

    it('should load the kernelspecs', (done) => {
      var ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      }
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'python',
                             'kernelspecs': ids });
      });
      return getKernelSpecs('localhost').then(specs => {
        var names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should accept ajax options', (done) => {
      var ids = {
        'python': PYTHON_SPEC,
        'python3': PYTHON3_SPEC
      }
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'python',
                               'kernelspecs': ids });
      });
      return getKernelSpecs({ ajaxSettings: ajaxSettings }).then(specs => {
        var names = Object.keys(specs.kernelspecs);
        expect(names[0]).to.be('python');
        expect(names[1]).to.be('python3');
        done();
      });
    });

    it('should throw an error for missing default parameter', (done) => {
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'kernelspecs': [PYTHON_SPEC, PYTHON3_SPEC] });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for missing kernelspecs parameter', (done) => {
      var handler = new RequestHandler();
      handler.onRequest = () => {
        handler.respond(200, { 'default': PYTHON_SPEC.name });
      }
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for incorrect kernelspecs parameter type', (done) => {
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': PYTHON_SPEC.name,
                             'kernelspecs': [ PYTHON_SPEC ]
                           });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpecs Model");
    });

    it('should throw an error for improper name', (done) => {
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 1;
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper language', (done) => {
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.language = 1;
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                             'kernelspecs': { 'R': R_SPEC } });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper argv', (done) => {
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.argv = 'hello';
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for improper display_name', (done) => {
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.display_name = ['hello'];
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                               'kernelspecs': { 'R': R_SPEC } });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for missing resources', (done) => {
      var R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.resources;
      var handler = new RequestHandler(() => {
        handler.respond(200, { 'default': 'R',
                             'kernelspecs': { 'R': R_SPEC } });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid KernelSpec Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler(() => {
        handler.respond(201, { });
      });
      var promise = getKernelSpecs('localhost');
      return expectFailure(promise, done, "Invalid Response: 201");
    });

  });

});


/**
 * Convenience function to start a kernel fully.
 */
export
function createKernel(tester?: KernelTester): Promise<IKernel> {
  var tester = tester || new KernelTester();
  tester.onRequest = () => {
    tester.respond(201, { id: uuid(), name: KERNEL_OPTIONS.name });
  };
  var kernelPromise = startNewKernel(KERNEL_OPTIONS);
  return kernelPromise;
}
