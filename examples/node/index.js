/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

var services = require('jupyter-js-services');
var utils = require('jupyter-js-utils');
var ws = require('ws');
var xhr = require('xmlhttprequest');


// Override the global request and socket functions.
global.XMLHttpRequest = xhr.XMLHttpRequest;
global.WebSocket = ws;

// Retrieve the base url and websocket url based on t command line arguments.
var BASE_URL = utils.getBaseUrl();
var WS_URL = utils.getWsUrl();

// Start a new session.
var options = {
  baseUrl: BASE_URL,
  wsUrl: WS_URL,
  kernelName: 'python',
  notebookPath: 'foo.ipynb'
}
services.startNewSession(options).then(function(session) {
  // Rename the notebook.
  session.renameNotebook('bar.ipynb').then(function() {
    console.log('Notebook renamed to', session.notebookPath);
    // Execute and handle replies on the kernel.
    var future = session.kernel.execute({ code: 'a = 1' });
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

