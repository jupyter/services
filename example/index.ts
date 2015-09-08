// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel
} from '../src';


function main(): void {
  console.log('hello, world!');
  // get a list of available kernels and connect to one
  listRunningKernels('localhost:8888').then((kernelModels) => {
    console.log('models:', kernelModels);
    var options = {
      baseUrl: 'localhost:8888',
      wsUrl: 'ws://',
      name: kernelModels[0].name
    }
    connectToKernel(kernelModels[0].id, options).then((kernel) => {
      console.log(kernel.name);
    });
  });
}


window.onload = main;
