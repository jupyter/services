/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

// Polyfill for ES6 Promises
import 'es6-promise';

import {
  Session
} from 'jupyter-js-services';

import {
  getBaseUrl, getWsUrl
} from 'jupyter-js-utils';


const BASE_URL = getBaseUrl();
const WS_URL = getWsUrl();


function main() {
  // Start a new session.
  let options: Session.IOptions = {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    kernelName: 'python',
    path: 'foo.ipynb'
  };
  Session.startNew(options).then(session => {
    // Rename the session.
    session.rename('bar.ipynb').then(() => {
      console.log('Session renamed to', session.path);
      // Execute and handle replies on the kernel.
      let future = session.kernel.execute({ code: 'a = 1' });
      future.onReply = (reply) => {
        console.log('Got execute reply');
      };
      future.onDone = () => {
        console.log('Future is fulfilled');
        // Shut down the session.
        session.shutdown().then(() => {
          console.log('Session shut down');
          alert('Test Complete!  See the console output for details');
        });
      };
    });
  });
}


window.onload = main;
