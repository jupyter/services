/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

module tests {

import Kernel = jupyter.services.Kernel;
import IKernelId = jupyter.services.IKernelId;
declare var sinon: any;


class RequestHandler {

  constructor() {
    this._xhr = sinon.useFakeXMLHttpRequest();
    this._xhr.onCreate = (xhr: any) => {
      this._requests.push(xhr);
    }
  }

  respond(statusCode: number, header: any, data: any): void {
    this._requests[0].respond(statusCode, header, data);
  }

  restore(): void {
    this._xhr.restore();
  }

  private _requests: any[] = [];
  private _xhr: any = null;
}


describe('jupyter.services - Kernel', () => {

    describe('#list()', () => {

        it('should yield a list of valid kernel ids', () => {
          var handler = new RequestHandler();
          var list = Kernel.list('baseUrl');
          var data = JSON.stringify([{id: "1234", name: "test"},
                                      {id: "5678", name: "test2"}]);
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
          var data = JSON.stringify({id: "1234", name: "test"});
          handler.respond(200, { 'Content-Type': 'text/json' }, data);
          return list.then(() => {
            throw Error('should not reach this point');
          }).catch((err) => {
            expect(err.message).to.be("Invalid kernel list");
          });
          
        });

        it('should throw an error for an invalid response', () => {
          var handler = new RequestHandler();
          var list = Kernel.list('baseUrl');
          var data = JSON.stringify([{id: "1234", name: "test"},
                                     {id: "5678", name: "test2"}]);
          handler.respond(201, { 'Content-Type': 'text/json' }, data);
          return list.then(() => {
            throw Error('should not reach this point');
          }).catch((err) => {
            expect(err.message).to.be("Invalid Status: 201");
          });
          
        });

      });

    describe('#constructor()', () => {

      it('should set initial conditions', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        expect(kernel.name).to.be("unknown");
        kernel.name = "test";
        expect(kernel.name).to.be("test");
        expect(kernel.status).to.be("unknown");
        expect(kernel.isConnected).to.be(false);
      });

    });

    describe('#getInfo()', () => {

      it('should yield a valid kernel id', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        var handler = new RequestHandler();
        var info = kernel.getInfo();
        var data = JSON.stringify({id: "1234", name: "test"});
        handler.respond(200, { 'Content-Type': 'text/json' }, data);
        return info.then((response: IKernelId) => {
          expect(response.name).to.be("test");
          expect(response.id).to.be("1234");
          handler.restore();
        });
        
      });

      it('should throw an error for an invalid kernel id', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        var handler = new RequestHandler();
        var info = kernel.getInfo();
        var data = JSON.stringify({id: "1234"});
        handler.respond(200, { 'Content-Type': 'text/json' }, data);
        return info.then(() => {
          throw Error('should not reach this point');
        }).catch((err) => {
          expect(err.message).to.be("Invalid kernel id");
        });
        
      });

      it('should throw an error for an invalid response', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        var handler = new RequestHandler();
        var info = kernel.getInfo();
        var data = JSON.stringify({id: "1234", name: "test"});
        handler.respond(201, { 'Content-Type': 'text/json' }, data);
        return info.then(() => {
          throw Error('should not reach this point');
        }).catch((err) => {
          expect(err.message).to.be("Invalid Status: 201");
        });
        
      });

    });

});

}  // module tests
