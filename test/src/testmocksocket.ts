// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { MockSocket, MockSocketServer, overrideWebSocket } from './mocksocket';


overrideWebSocket();


describe('jupyter.services - mocksocket', () => {

  it('should connect', (done) => {
    var ws = new WebSocket('socket1');
    expect(ws.readyState).to.be(WebSocket.CONNECTING);
    ws.onopen = () => {
      expect(ws.readyState).to.be(WebSocket.OPEN);
      done();
    };
  });

  it('should send a message', (done) => {
    var ws = new WebSocket('socket2');
    MockSocketServer.onConnect = (server) => {
      expect(server.url).to.be('socket2');
      server.onmessage = () => {
        done();
      }
    };
    ws.onopen = () => {
      ws.send('hi');
    };
  });

  it('should receive a message', (done) => {
    var ws = new WebSocket('socket3');
    ws.onmessage = () => {
      done();
    };
    MockSocketServer.onConnect = (server) => {
      expect(server.url).to.be('socket3');
      server.send('hi');
    };
  });

  it('should close the socket', (done) => {
    var ws = new WebSocket('socket4');
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
    var ws1 = new WebSocket('socket5');
    var ws2 = new WebSocket('socket5');
    ws1.onmessage = () => {
      done();
    };
    MockSocketServer.onConnect = (server) => {
      expect(server.url).to.be('socket5');
      ws2.onopen = () => {
        server.send('hi');
      }
    };
  });

  it('should open in the right order', (done) => {
    MockSocketServer.onConnect = (server) => {
      expect(server.url).to.be('socket6');
      expect(ws.readyState).to.be(WebSocket.OPEN);
      done();
    };
    var ws = new WebSocket('socket6');
  });

});
