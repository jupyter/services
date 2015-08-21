// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { IKernelId, Kernel, IKernelInfo, IKernelExecute} from '../../lib/kernel';

import { MockWebSocketServer, MockWebSocket } from './mocksocket';

import { RequestHandler, expectFailure } from './utils';


// Abnormal websocket close.
const CLOSE_ABNORMAL = 1006;


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

/**
 * Kernel class test rig.
 */
class KernelTester extends RequestHandler {
  /**
   * Create a new Kernel tester.
   */
  constructor(kernel: Kernel) {
    super();
    this._kernel = kernel;
    kernel.name = "test";
    kernel.id = "1234";
    this._server = new MockWebSocketServer(this._kernel.wsUrl);
  }

  /**
   * Get the kernel for the tester.
   */
  get kernel(): Kernel {
    return this._kernel;
  }

  /**
   * Register a connection callback with the websocket server.
   */
  onConnect(cb: (ws: MockWebSocket) => void) {
    this._server.onconnect = cb;
  }

  /**
   * Register a message callback with the websocket server.
   */
  onMessage(cb: (msg: any) => void) {
    this._server.onmessage = cb;
  }

  /**
   * Register a close with the websocket server.
   */
  onClose(cb: (ws: MockWebSocket) => void) {
    this._server.onWSClose = cb;
  }

  /**
   * Send a message to the server.
   */
  send(msg: string | ArrayBuffer) {
    this._server.send(msg);
  }

  private _kernel: Kernel = null;
  private _server: MockWebSocketServer = null;
}


describe('jupyter.services - Kernel', () => {

  describe('#list()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      var handler = new RequestHandler();
      var list = Kernel.list('baseUrl');
      var data = [
        { id: "1234", name: "test" },
        { id: "5678", name: "test2" }
      ];
      handler.respond(200, data);
      return list.then((response: IKernelId[]) => {
        expect(response[0].name).to.be("test");
        expect(response[0].id).to.be("1234");
        expect(response[1].name).to.be("test2");
        expect(response[1].id).to.be("5678");
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler();
      var list = Kernel.list('baseUrl');
      var data = { id: "1234", name: "test" };
      handler.respond(200, data);
      expectFailure(list, done, "Invalid kernel list");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var list = Kernel.list('baseUrl');
      var data = [
        { id: "1234", name: "test" },
        { id: "5678", name: "test2" }
      ];
      handler.respond(201, data);
      expectFailure(list, done, "Invalid Status: 201");
    });

  });

  describe('#constructor()', () => {

    it('should set initial conditions', () => {
      var kernel = new Kernel('/localhost', 'ws://');
      expect(kernel.name).to.be("");
      kernel.name = "test";
      expect(kernel.name).to.be("test");
      expect(kernel.status).to.be("unknown");
      expect(kernel.isConnected).to.be(false);
    });

  });

  describe('#getInfo()', () => {

    it('should yield a valid kernel id', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var info = kernel.getInfo();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
      return info.then((response: IKernelId) => {
        expect(response.name).to.be("test");
        expect(response.id).to.be("1234");
        done();
      });
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var info = kernel.getInfo();
      var data = { id: "1234" };
      tester.respond(200, data);
      return expectFailure(info, done, "Invalid kernel id");
    });

    it('should throw an error for an invalid response', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var info = kernel.getInfo();
      var data = { id: "1234", name: "test" };
      tester.respond(201, data);
      return expectFailure(info, done, "Invalid Status: 201");
    });

  });

  describe('#connect()', () => {

    it('should start the websocket', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect(() => {
        expect(kernel.isConnected).to.be(true);
        expect(kernel.name).to.be("test");
        expect(kernel.id).to.be("1234");
        expectKernelInfo(tester, done);
      });

      kernel.connect();
      expect(kernel.status).to.be('created');
    });

    it('should throw an error for an uninitialized kernel id', () => {
      var kernel = new Kernel('/localhost', 'ws://');
      expect(kernel.connect).to.throwError(/You must set the kernel id before starting/);
    });

    it('should call the early close method cleanly', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        ws.close();
        ws.close();  // second call should have no effect
      });

      tester.onClose((ws: MockWebSocket) => {
        expect(kernel.isConnected).to.be(false);
        done();
      })

      kernel.connect();
    });

    it('should trigger a reconnect', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        ws.close(CLOSE_ABNORMAL);
        ws.close(CLOSE_ABNORMAL);  // should have no effect
      });

      tester.onClose((ws: MockWebSocket) => {
        // respond to the getInfo call
        var data = { id: "1234", name: "test" };
        tester.respond(200, data);
        // wait for another connnection to be made
        tester.onConnect((ws: MockWebSocket) => {
          done();
        });
      });

      kernel.connect();
    });

    it('should trigger a dead kernel', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        ws.close(CLOSE_ABNORMAL);
        ws.close(CLOSE_ABNORMAL);  // second one has no effect
      });

      tester.onClose((ws: MockWebSocket) => {
        // respond to the getInfo call with an error response
        tester.respond(400, {});
        setImmediate(() => {
          expect(kernel.status).to.be('dead');
          expect(kernel.isFullyDisconnected).to.be(true);
          done();
        });
      });

      kernel.connect();
    });

    it('should use a late binding restart', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        // trigger a late error close
        setTimeout(() => { 
           ws.close(CLOSE_ABNORMAL); 
           ws.close(CLOSE_ABNORMAL);  // second one has no effect
         }, 1001);
      });

      tester.onClose((ws: MockWebSocket) => {
        // wait for another connnection to be made
        tester.onConnect((ws: MockWebSocket) => {
          done();
        });
      });

      kernel.connect();
    });

    it('should trigger an error-based restart', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        // trigger an error
        ws.triggerError('forced restart');
      });

      tester.onClose((ws: MockWebSocket) => {
        // wait for another connnection to be made
        tester.onConnect((ws: MockWebSocket) => {
          done();
        });
      });

      kernel.connect();
    });

  });

  describe('#start()', () => {

    it('should start the kernel', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect(() => {
        expect(kernel.isConnected).to.be(true);
        expect(kernel.name).to.be("test");
        expect(kernel.id).to.be("1234");
        expectKernelInfo(tester, done);
      });

      var start = kernel.start();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var start = kernel.start( { name: "test", id: "1234" });
      var data = { id: "1234" };
      tester.respond(200, data);
      return expectFailure(start, done, "Invalid kernel id");
    });

    it('should throw an error for an invalid response', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var start = kernel.start();
      var data = { id: "1234" };
      tester.respond(201, data);
      return expectFailure(start, done, "Invalid Status: 201");
    });

    it('should throw an error for an uninitialized kernel id', () => {
      var kernel = new Kernel('/localhost', 'ws://');
      kernel.name = "test";
      expect(kernel.start).to.throwError(/You must set the kernel id before starting/);
    });

  });

  describe('#interrupt()', () => {

    it('should interrupt the kernel', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect(() => {
        var interrupt = kernel.interrupt();
        tester.respond(204, data);
        interrupt.then((id: any) => {
          setImmediate(() => {
            expect(kernel.isConnected).to.be(true);
            expect(kernel.id).to.be("1234");
            done();
          });
        });
      });

      var start = kernel.start();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
    });

    it('should throw an error for an invalid response', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var interrupt = kernel.interrupt();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
      return expectFailure(interrupt, done, "Invalid Status: 200");
    });

  });

  describe('#shutdown()', () => {

    it('should delete the kernel', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var data = { id: "1234", name: "test" };

      tester.onConnect(() => {
        var shutdown = kernel.shutdown();
        tester.respond(204, data);
        shutdown.then((id: any) => {
          setImmediate(() => {
            expect(kernel.isConnected).to.be(false);
            expect(kernel.id).to.be("1234");
            done();
          });
        });
      });

      var start = kernel.start();
      tester.respond(200, data);
    });

    it('should throw an error for an invalid response', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var shutdown = kernel.shutdown();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
      return expectFailure(shutdown, done, "Invalid response");
    });

  });

  describe('#disconnect()', () => {

    it('should disconnect the websocket', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect(() => {
        expect(kernel.isConnected).to.be(true);
        kernel.disconnect();
        setImmediate(() => {
          expect(kernel.isConnected).to.be(false);
          done();
        });
      });

      kernel.connect();
      expect(kernel.status).to.be('created');
    });

  });

  describe('#restart()', () => {

    it('should restart the kernel', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var data = { id: "1234", name: "test" };
      kernel.start();
      tester.respond(200, data);

      tester.onConnect(() => {
        tester.onConnect(() => {});
        var restart = kernel.restart();
        tester.respond(200, data);
        restart.then((id: any) => {
          expectKernelInfo(tester, done);
        });
      });
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      kernel.start();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
      
      tester.onConnect(() => {
        tester.onConnect(() => {});
        var restart = kernel.restart();
        tester.respond(200, { name: "test" });
        return expectFailure(restart, done, "Invalid kernel id");
      });
    });

    it('should throw an error for an invalid response', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      kernel.start();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);

      tester.onConnect(() => {
        tester.onConnect(() => {});
        var restart = kernel.restart();
        tester.respond(201, data);
        return expectFailure(restart, done, "Invalid Status: 201");
      });
    });

  });

  describe('#reconnect()', () => {

    it('should restart the websocket', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect(() => {
        expect(kernel.isConnected).to.be(true);
        expect(kernel.name).to.be("test");
        expect(kernel.id).to.be("1234");
        expectKernelInfo(tester, done);
      });

      kernel.reconnect();
      expect(kernel.status).to.be('reconnecting');
    });
  });

  describe('#kernelInfo()', () => {

    it('should get the kernelInfo', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      var onFullyConnect = () => {
        var info = kernel.kernelInfo();
        info.onReply(() => { done(); });
        expectKernelInfo(tester, () => { });
      }

      kernel.connect();
      expectKernelInfo(tester, onFullyConnect); 
    });
  });

  describe('#inspect()', () => {

    it('should send an inspect message', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      var onFullyConnect = () => {
        var inspect = kernel.inspect('hello', 2);
        inspect.onReply(() => { done(); });
        tester.onMessage((msg: any) => {
          var data = JSON.parse(msg.data);
          data.parentHeader = data.header;
          expect(data.channel).to.be('shell');
          expect(data.content.code).to.be('hello');
          expect(data.content.cursor_pos).to.be(2);
          tester.send(JSON.stringify(data));
        });
      }

      kernel.connect();
      expectKernelInfo(tester, onFullyConnect); 
    });
  });

  describe('#execute()', () => {

    it('should send an execute message', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      var onFullyConnect = () => {
        var options: IKernelExecute = {
          silent: false,
          user_expressions: { hello: 1 },
          allow_stdin: true,
          store_history: true
        }
        var execute = kernel.execute('hello', options);
        execute.onDone(() => { done(); });
        tester.onMessage((msg: any) => {
          var data = JSON.parse(msg.data);
          data.parentHeader = data.header;
          expect(data.channel).to.be('shell');
          expect(data.content.code).to.be('hello');
          expect(data.content.silent).to.be(false);
          expect(data.content.user_expressions.hello).to.be(1);
          expect(data.content.allow_stdin).to.be(true);
          tester.send(JSON.stringify(data));

          data.channel = 'iopub';
          data.msgType = 'status';
          data.content.execution_state = 'idle';
          tester.send(JSON.stringify(data));
        });
      }

      kernel.connect();
      expectKernelInfo(tester, onFullyConnect); 
    });
  });

  describe('#complete()', () => {

    it('should send a complete message', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      var onFullyConnect = () => {
        var complete = kernel.complete('hello', 2);
        complete.onReply(() => { done(); });
        tester.onMessage((msg: any) => {
          var data = JSON.parse(msg.data);
          data.parentHeader = data.header;
          expect(data.channel).to.be('shell');
          expect(data.content.code).to.be('hello');
          expect(data.content.cursor_pos).to.be(2);
          tester.send(JSON.stringify(data));
        });
      }

      kernel.connect();
      expectKernelInfo(tester, onFullyConnect); 
    });
  });

  describe('#sendInputReply()', () => {

    it('should send an input reply message', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      var onFullyConnect = () => {
        kernel.sendInputReply({ hello: 'world', foo: 100 });
        tester.onMessage((msg: any) => {
          var data = JSON.parse(msg.data);
          expect(data.channel).to.be('stdin');
          expect(data.content.value.hello).to.be('world');
          expect(data.content.value.foo).to.be(100);
          done();
        });
      }

      kernel.connect();
      expectKernelInfo(tester, onFullyConnect); 
    });
  });

});


function expectKernelInfo(tester: KernelTester, done: () => void) {
  var kernel = tester.kernel;
  // get the kernelinfo message
  tester.onMessage((msg: any) => {
    expect(kernel.isConnected).to.be(true);
    var data = JSON.parse(msg.data);
    expect(data.header.msgType).to.be('kernel_info_request');
    data.parentHeader = data.header;
    data.header.msgType = 'kernel_info_reply';
    expect(data.channel).to.be('shell');
    data.content = EXAMPLE_KERNEL_INFO;
    tester.send(JSON.stringify(data));
    setImmediate(() => {
      expect(kernel.status).to.be('ready');
      expect(kernel.infoReply.language_info.name).to.be("test");
      done();
    });
  });
}
