// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { IKernelId, Kernel } from '../../lib/kernel';

import { MockWebSocketServer, MockWebSocket } from './mocksocket';

import { RequestHandler, expectFailure } from './utils';


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
   * Register a connection callback with the websocket server.
   */
  onConnect(cb: (ws: MockWebSocket) => void) {
    this._server.onconnect = cb;
  }

  /**
   * Register a message callback with the websocket server.
   */
  onMessage(cb: () => void) {
    this._server.onmessage = cb;
  }

  /**
   * Register a close with the websocket server.
   */
  onClose(cb: (ws: MockWebSocket) => void) {
    this._server.onWSClose = cb;
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
        setTimeout(() => {
          expect(kernel.status).to.be('connected');
          done();
        }, 10);
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
        ws.kill();
        ws.kill();  // should have no effect
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
        ws.kill();
        ws.kill();  // second one has no effect
      });

      tester.onClose((ws: MockWebSocket) => {
        // respond to the getInfo call with an error response
        tester.respond(400, {});
        setTimeout(() => {
          expect(kernel.status).to.be('dead');
          done();
        }, 10);
      });

      kernel.connect();
    });

    it('should use a late binding restart', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);

      tester.onConnect((ws: MockWebSocket) => {
        // trigger a late error close
        setTimeout(() => { 
           ws.kill(); 
           ws.kill();  // second one has no effect
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
        setTimeout(() => {
          expect(kernel.status).to.be('connected');
          done();
        }, 10);
      });

      var start = kernel.start();
      var data = { id: "1234", name: "test" };
      tester.respond(200, data);
    });

    it('should throw an error for an invalid kernel id', (done) => {
      var kernel = new Kernel('/localhost', 'ws://');
      var tester = new KernelTester(kernel);
      var start = kernel.start();
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
          setTimeout(() => {
            expect(kernel.isConnected).to.be(true);
            expect(kernel.id).to.be("1234");
            done();
          }, 10);
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

      tester.onConnect(() => {
        var shutdown = kernel.shutdown();
        tester.respond(204, data);
        shutdown.then((id: any) => {
          setTimeout(() => {
            expect(kernel.isConnected).to.be(false);
            expect(kernel.id).to.be("1234");
            done();
          }, 10);
        });
      });

      var start = kernel.start();
      var data = { id: "1234", name: "test" };
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
        setTimeout(() => {
          expect(kernel.isConnected).to.be(false);
          done();
        }, 10);
      });

      kernel.connect();
      expect(kernel.status).to.be('created');
    });

  });

});
