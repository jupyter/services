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
  // Start a new session.
  let options = {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    kernelName: 'python',
    notebookPath: 'foo.ipynb'
  }
  startNewSession(options).then(session => {
    // Rename the notebook.
    session.renameNotebook('bar.ipynb').then(() => {
      console.log('Notebook renamed to', session.notebookPath);
      // Execute and handle replies on the kernel.
      var future = session.kernel.execute({ code: 'a = 1' });
      future.onReply = (reply) => {
        console.log('Got execute reply');
      }
      future.onDone = () => {
        console.log('Future is fulfilled');
        // Shut down the session.
        session.shutdown().then(() => {
          console.log('Session shut down');
        });
      }
    });
  });
}


window.onload = main;
