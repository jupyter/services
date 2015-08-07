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


describe('jupyter.services', () => {

  describe('Kernel', () => {

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

      it('should throw an error for an invvalid kernel id', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        var handler = new RequestHandler();
        var info = kernel.getInfo();
        var data = JSON.stringify({id: "1234");
        handler.respond(200, { 'Content-Type': 'text/json' }, data);
        return info.then((response: IKernelId) => {
          expect(response.name).to.be("test");
          expect(response.id).to.be("1234");
          handler.restore();
        });
        
      });

    });

   });


});

}  // module tests
