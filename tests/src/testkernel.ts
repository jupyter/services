// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

module tests {

import Kernel = jupyter.services.Kernel;
import IKernelId = jupyter.services.IKernelId;


class RequestHandler {

  constructor() {
    this._xhr = sinon.useFakeXMLHttpRequest();
    this._xhr.onCreate = (xhr: any) => {
      this._requests.push(xhr);
    }
  }

  respond(statusCode: number, header: any, data: any): void {
    var payload = JSON.stringify(data);
    this._requests[0].respond(statusCode, header, payload);
  }

  restore(): void {
    this._xhr.restore();
  }

  private _requests: any[] = [];
  private _xhr: any = null;
}


class KernelTester {

  constructor(kernel: Kernel) {
    (<any>window).WebSocket = MockWebSocket;
    this._kernel = kernel;
    this._handler = new RequestHandler();
  }

  startServer() {
    this._server = new MockServer(this._kernel.wsUrl)
  }

  respond(statusCode: number, header: any, data: any): void {
    this._handler.respond(statusCode, header, data);
  }

  private _kernel: Kernel = null;
  private _handler: RequestHandler = null;
  private _server: MockServer = null;
}


function expectFailure(promise: Promise<any>, message: string): Promise<any> {
  return promise.then(() => {
    throw Error('Should not reach this point');
  }).catch((err) => {
    expect(err.message).to.be(message);
  });
}


describe('jupyter.services - Kernel', () => {

    describe('#list()', () => {

        it('should yield a list of valid kernel ids', () => {
          var handler = new RequestHandler();
          var list = Kernel.list('baseUrl');
          var data = [{id: "1234", name: "test"},
                      {id: "5678", name: "test2"}];
          handler.respond(200, { 'Content-Type': 'text/json' }, data);
          return list.then((response: IKernelId[]) => {
            expect(response[0].name).to.be("test");
            expect(response[0].id).to.be("1234");
            handler.restore();
          });
          
        });

        it('should throw an error for an invalid model', () => {
          var handler = new RequestHandler();
          var list = Kernel.list('baseUrl');
          var data = {id: "1234", name: "test"};
          handler.respond(200, { 'Content-Type': 'text/json' }, data);
          expectFailure(list, "Invalid kernel list");
        });

        it('should throw an error for an invalid response', () => {
          var handler = new RequestHandler();
          var list = Kernel.list('baseUrl');
          var data = [{id: "1234", name: "test"},
                      {id: "5678", name: "test2"}];
          handler.respond(201, { 'Content-Type': 'text/json' }, data);
          expectFailure(list, "Invalid Status: 201");
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

      it('should yield a valid kernel id', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        var info = kernel.getInfo();
        var data = {id: "1234", name: "test"};
        tester.respond(200, { 'Content-Type': 'text/json' }, data);
        return info.then((response: IKernelId) => {
          expect(response.name).to.be("test");
          expect(response.id).to.be("1234");
        });
        
      });

      it('should throw an error for an invalid kernel id', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        var info = kernel.getInfo();
        var data = {id: "1234"};
        tester.respond(200, { 'Content-Type': 'text/json' }, data);
        return expectFailure(info, "Invalid kernel id");
      });

      it('should throw an error for an invalid response', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        var info = kernel.getInfo();
        var data = {id: "1234", name: "test"};
        tester.respond(201, { 'Content-Type': 'text/json' }, data);
        return expectFailure(info, "Invalid Status: 201");
      });

    });

    describe('#connect()', () => {

      it('should start the websocket', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        kernel.id = "1234";
        kernel.name = "test";
        tester.startServer();
        kernel.connect();
        expect(kernel.status).to.be('created');

        setTimeout(function() {
          expect(kernel.isConnected).to.be(true);
          expect(kernel.name).to.be("test");
          expect(kernel.id).to.be("1234");
          expect(kernel.status).to.be('connected');
        }, 100);
        
      });

      it('should throw an error for an uninitialized kernel id', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        expect(kernel.connect).to.throwError(/You must set the kernel id before starting/);
      });

    });

    describe('#start()', () => {

      it('should start the kernel', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        kernel.name = "test";
        kernel.id = "1234";
        tester.startServer();
        var start = kernel.start();
        var data = {id: "1234", name: "test"};
        tester.respond(200, { 'Content-Type': 'text/json' }, data);

        return start.then((id: any) => {
          setTimeout(function() {
            expect(kernel.isConnected).to.be(true);
            expect(kernel.name).to.be("test");
            expect(kernel.id).to.be("1234");
            expect(kernel.status).to.be('connected');
          }, 100);
        });
      });

      it('should throw an error for an invalid kernel id', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        kernel.name = "test";
        kernel.id = "1234";
        var start = kernel.start();
        var data = {id: "1234"};
        tester.respond(200, { 'Content-Type': 'text/json' }, data);
        return expectFailure(start, "Invalid kernel id");
      });

      it('should throw an error for an invalid response', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        var tester = new KernelTester(kernel);
        kernel.name = "test";
        kernel.id = "1234";
        var start = kernel.start();
        var data = {id: "1234"};
        tester.respond(201, { 'Content-Type': 'text/json' }, data);
        return expectFailure(start, "Invalid Status: 201");
      });

      it('should throw an error for an uninitialized kernel id', () => {
        var kernel = new Kernel('/localhost', 'ws://');
        kernel.name = "test";
        expect(kernel.start).to.throwError(/You must set the kernel id before starting/);
      });
    });
    
});

}  // module tests
