// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions, 
  connectToSession, startNewSession
} from '../../lib';


var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';


describe('jupyter.services - Kernel', () => {

  describe('listRunningKernels()', () => {

    it('should run through the demo', (done) => {
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
              done();
            }
          });
        });
      });
    });
  });
});
