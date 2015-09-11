// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { MockWebSocket, MockWebSocketServer } from './mocksocket';


describe('jupyter.services - mocksocket', () => {

  it('should connect', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    expect(ws.readyState).to.be(WebSocket.CONNECTING);
    ws.onopen = () => {
      expect(ws.readyState).to.be(WebSocket.OPEN);
      done();
    };
  });

  it('should send a message', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    server.onmessage = () => {
      done();
    };
    ws.onopen = () => {
      ws.send('hi');
    };
  });

  it('should receive a message', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    ws.onmessage = () => {
      done();
    };
    ws.onopen = () => {
      server.send('hi');
    };
  });

  it('should close the socket', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws = new WebSocket('hello');
    ws.onclose = () => {
      expect(ws.readyState).to.be(WebSocket.CLOSED);
      done();
    };
    ws.onopen = () => {
      ws.close();
      expect(ws.readyState).to.be(WebSocket.CLOSING);
    }
  });

  it('should handle multiple connections', (done) => {
    var server = new MockWebSocketServer('hello');
    var ws1 = new WebSocket('hello');
    var ws2 = new WebSocket('hello');
    ws1.onmessage = () => {
      done();
    };
    ws2.onopen = () => {
      server.send('hi');
    }
  });

  it('should open in the right order', (done) => {
    var server = new MockWebSocketServer('hello');
    server.onconnect = (ws: MockWebSocket) => {
      expect(ws.readyState).to.be(WebSocket.OPEN);
      done();
    }
    var ws = new WebSocket('hello');
  });

});
