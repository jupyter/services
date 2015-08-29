// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import encoding = require('text-encoding');

import { MockXMLHttpRequest } from './mockxhr';


// stub for node global
declare var global: any;


export
class RequestHandler {
  /**
   * Create a new RequestHandler.
   */
  constructor() {
    if (typeof window === 'undefined') {
      global.XMLHttpRequest = MockXMLHttpRequest;
      global.TextEncoder = encoding.TextEncoder;
      global.TextDecoder = encoding.TextDecoder;
    } else {
      (<any>window).XMLHttpRequest = MockXMLHttpRequest;
    }
    MockXMLHttpRequest.requests = [];
  }

  /**
   * Respond to the latest Ajax request.
   */
  respond(statusCode: number, data: any, header?: any): void {
    var len = MockXMLHttpRequest.requests.length;
    var request = MockXMLHttpRequest.requests[len - 1];
    request.respond(statusCode, data, header);
  }
}


/**
 * Expect a failure on a promise with the given message, then call `done`.
 */
export
function expectFailure(promise: Promise<any>, done: () => void, message: string): Promise<any> {
  return promise.then((msg: any) => {
    console.error('***should not reach this point');
    throw Error('Should not reach this point');
  }).catch((err) => {
    console.log('****in expect failure', err);
    if (err.message !== message) {
      console.error(err.message, ' != ', message);
    }
    expect(err.message).to.be(message);
    done();
  });
}


/**
 * Do something in the future ensuring total ordering wrt to Promises.
 */
export
function doLater(cb: () => void): void {
  Promise.resolve().then(cb);
}
