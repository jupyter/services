// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { MockXMLHttpRequest } from './mockxhr';


// stubs for node global variables
declare var global: any;


beforeEach(() => {
    MockXMLHttpRequest.requests = [];
});


describe('jupyter.services - mockXHR', () => {

  if (typeof window === 'undefined') {
    global.XMLHttpRequest = MockXMLHttpRequest;
  } else {
    (<any>window).XMLHttpRequest = MockXMLHttpRequest;
  }

  it('should make a request', () => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'test.com');
    xhr.send();
    expect(MockXMLHttpRequest.requests.length).to.be(1);
  });

  it('should yield a successful response', (done) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'test.com');
    xhr.onload = () => {
      expect(xhr.status).to.be(200);
      done();
    }
    xhr.send();
    var request = MockXMLHttpRequest.requests[0];
    request.respond(200, {}, '');
  });

  it('should yield an error response', (done) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'test.com');
    xhr.onerror = (evt: any) => {
      expect(evt.message).to.be("Invalid status code");
      done();
    }
    xhr.send();
    var request = MockXMLHttpRequest.requests[0];
    request.respond(500, {}, '');
  });

  it('should handle a response header', (done) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'test.com');
    xhr.onload = () => {
      expect(xhr.getResponseHeader('Location')).to.be("Somewhere");
      done();
    }
    xhr.send();
    var request = MockXMLHttpRequest.requests[0];
    request.respond(200, '', {'Location': 'Somewhere'});
  });

});
