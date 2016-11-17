/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

var services = require('@jupyterlab/services');
var ws = require('ws');
var xhr = require('xmlhttprequest');
var requirejs = require('requirejs');

// Set up the global requirejs.
// Normally this would then be configured.
global.requirejs = requirejs;


// Override the global request and socket functions.
global.XMLHttpRequest = xhr.XMLHttpRequest;
global.WebSocket = ws;

// Retrieve the base url and websocket url based on t command line arguments.
var utils = services.utils;
var BASE_URL = utils.getBaseUrl();
var WS_URL = utils.getWsUrl();

// Start a new session.
var options = {
  baseUrl: BASE_URL,
  wsUrl: WS_URL,
  kernelName: 'python',
  path: 'foo.ipynb',
  token: 'secret',
}

services.Session.startNew(options).then(function(session) {
  // Rename the session.
  session.rename('bar.ipynb').then(function() {
    console.log('Session renamed to', session.path);
    // Execute and handle replies on the kernel.
    var future = session.kernel.requestExecute({ code: 'a = 1' });
    future.onReply = function(reply) {
      console.log('Got execute reply');
    }
    future.onDone = function() {
      console.log('Future is fulfilled');
      // Shut down the session.
      session.shutdown().then(function() {
        console.log('Session shut down');
        process.exit(0);
      });
    }

  });
});

