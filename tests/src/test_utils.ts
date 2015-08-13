// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

export
class RequestHandler {

  constructor() {
    this._xhr = sinon.useFakeXMLHttpRequest();
    this._xhr.onCreate = (xhr: any) => {
      this._requests.push(xhr);
    }
  }

  respond(statusCode: number, data: any, header?: any): void {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    if (header === void 0) {
      header = {'Content-Type': 'text/json'};
    }
    this._requests[this._requests.length - 1].respond(statusCode, header, data);
  }

  restore(): void {
    this._xhr.restore();
  }

  private _requests: any[] = [];
  private _xhr: any = null;
}


export
function expectFailure(promise: Promise<any>, done: () => void, message: string): Promise<any> {
  return promise.then(() => {
    throw Error('Should not reach this point');
  }).catch((err) => {
    expect(err.message).to.be(message);
    done();
  });
}
