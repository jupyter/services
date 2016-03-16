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


global.XMLHttpRequest = xhr.XMLHttpRequest;
global.WebSocket = ws;

var BASE_URL = utils.getBaseUrl();
var WS_URL = utils.getWsUrl();

// Get a list of available sessions and connect to one.
services.listRunningSessions({ baseUrl: BASE_URL }).then(function(sessionModels) {
  var options = {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    kernelName: sessionModels[0].kernel.name,
    notebookPath: sessionModels[0].notebook.path
  }
  return services.connectToSession(sessionModels[0].id, options);
}).then(function(session) {
  console.log(session.kernel.name);
});

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

