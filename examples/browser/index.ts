/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

import {
  listRunningSessions, connectToSession, startNewSession
} from 'jupyter-js-services';

import {
  getBaseUrl, getWsUrl
} from 'jupyter-js-utils';


const BASE_URL = getBaseUrl();
const WS_URL = getWsUrl();


function main() {
  // Get a list of available sessions and connect to one.
  listRunningSessions({ baseUrl: BASE_URL }).then(sessionModels => {
    let options = {
      baseUrl: BASE_URL,
      wsUrl: WS_URL,
      kernelName: sessionModels[0].kernel.name,
      notebookPath: sessionModels[0].notebook.path
    }
    return connectToSession(sessionModels[0].id, options);
  }).then(session => {
    console.log(session.kernel.name);
  });

  // Start a new session.
  let options = {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    kernelName: 'python',
    notebookPath: 'foo.ipynb'
  }
  startNewSession(options).then(session => {
    // Execute and handle replies on the kernel.
    let future = session.kernel.execute({ code: 'a = 1' });
    future.onDone = () => {
      console.log('Future is fulfilled');
    }

    // Register a callback for when the session dies.
    session.sessionDied.connect(() => {
      console.log('session died');
    });

    // Rename the notebook.
    session.renameNotebook('bar.ipynb').then(() => {
      console.log('Notebook renamed to', session.notebookPath);
      // Kill the session.
      session.shutdown().then(() => {
        console.log('Session shut down');
      });
    });
  });
}


window.onload = main;
