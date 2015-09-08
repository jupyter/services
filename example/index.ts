// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel
} from '../lib';


// get a list of available kernels and connect to one
listRunningKernels('http://localhost:8888').then((kernelModels) => {
  console.log('models:', kernelModels);
  var options = {
    baseUrl: 'http://localhost:8888',
    wsUrl: 'ws://localhost:8888',
    name: kernelModels[0].name
  }
  connectToKernel(kernelModels[0].id, options).then((kernel) => {
    console.log('Hello', kernel.name);
    kernel.kernelInfo().then((info) => {
      console.log('Got info', info);
    });
  });
});
