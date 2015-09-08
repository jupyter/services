// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions, 
  connectToSession, startNewSession
} from '../lib';


var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';


// get a list of available kernels and connect to one
listRunningKernels(BASEURL).then((kernelModels) => {
  console.log('models:', kernelModels);
  var options = {
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelModels[0].name
  }
  connectToKernel(kernelModels[0].id, options).then((kernel) => {
    console.log('Hello Kernel: ', kernel.name, kernel.id);
    kernel.restart().then(() => {
      console.log('Kernel restarted');
      kernel.kernelInfo().then((info) => {
        console.log('Got info: ', info.language_info);
      });
      kernel.complete({ code: 'impor', cursor_pos: 4 }).then((completions) => {
        console.log('Got completions: ', completions.matches);
      });
      kernel.inspect({ code: 'hex', cursor_pos: 2, detail_level: 0 }).then((info) => {
        console.log('Got inspect: ', info.data);
      });
      kernel.isComplete({ code: 'from numpy import (\n' }).then((result) => {
        console.log('Got isComplete: ', result.status);
      });
      var future = kernel.execute({ code: 'a = 1\n' });
      future.onDone = () => {
        console.log('Execute finished');
      }
      var future2 = kernel.execute({ code: 'a = 2\n', allow_stdin: true });
      future2.onStdin = () => {
        console.log('Got a stdin request');
      }
      future2.onDone = () => {
        console.log('Execute2 finished');
      }
    });
  });
});


// get a list of available sessions and connect to one
listRunningSessions(BASEURL).then((sessionModels) => {
  var options = {
    baseUrl: BASEURL,
    wsUrl: WSURL,
    kernelName: sessionModels[0].kernel.name,
    notebookPath: sessionModels[0].notebook.path
  }
  connectToSession(sessionModels[0].id, options).then((session) => {
    console.log('Hello Session: ', session.kernel.name);
    session.renameNotebook('New Title.ipynb').then(() => {
      console.log('Notebook renamed to: ', session.notebookPath);
    });
  });
});

