// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions, 
  connectToSession, startNewSession, getKernelSpecs
} from '../../lib';


var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';


describe('jupyter.services - Karma', () => {

  describe('Kernel', () => {

    it('should run through the demo', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs(BASEURL).then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        var options = {
          baseUrl: BASEURL,
          wsUrl: WSURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
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
            // should grab the same kernel object
            connectToKernel(kernel.id, options).then((kernel2) => {
              console.log('Should have gotten the same kernel');
              if (kernel2.clientId !== kernel.clientId) {
                throw Error('Did not reuse kernel');
              }
              listRunningKernels(BASEURL).then((kernels) => {
                if (!kernels.length) {
                  throw Error('Should be one at least one running kernel');
                }
                kernel2.kernelInfo().then(() => {
                  console.log('Final request');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});
