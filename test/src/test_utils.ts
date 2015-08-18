// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {MockXMLHttpRequest} from './mockXHR';


export
class RequestHandler {

  /**
   * Create a new RequestHandler.
   */
  constructor() {
    MockXMLHttpRequest.requests = [];
  }

  /**
   * Respond to the latest Ajax request.
   */
  respond(statusCode: number, data: any, header?: any): void {
    var request = MockXMLHttpRequest.requests[-1];
    request.respond(statusCode, header, data);
  }
}


/**
 * Expect a failure on a promise with the given message, then call 
   a mocha done() callback.
 */
export
function expectFailure(promise: Promise<any>, done: () => void, message: string): Promise<any> {
  return promise.then(() => {
    throw Error('Should not reach this point');
  }).catch((err) => {
    expect(err.message).to.be(message);
    done();
  });
}
