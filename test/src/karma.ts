// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import { 
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions, 
  connectToSession, startNewSession, getKernelSpecs, CommManager
} from '../../lib';


var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';


describe('jupyter.services - Integration', () => {

  describe('Kernel', () => {

    it('should start, restart and get kernel info', (done) => {
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
              done();
            });
         });
        });
      });
    });

    it('should connect to existing kernel and list running kernels', (done) => {
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

    it('should handle other kernel messages', (done) => {
      getKernelSpecs(BASEURL).then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        var options = {
          baseUrl: BASEURL,
          wsUrl: WSURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          console.log('Kernel started');
          kernel.complete({ code: 'impor', cursor_pos: 4 }).then((completions) => {
            console.log('Got completions: ', completions.matches);
            kernel.inspect({ code: 'hex', cursor_pos: 2, detail_level: 0 }).then((info) => {
              console.log('Got inspect: ', info.data);
              kernel.isComplete({ code: 'from numpy import (\n' }).then((result) => {
                console.log('Got isComplete: ', result.status);
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
  });

  describe('Session', () => {

    it('should start, connect to existing session and list running sessions', (done) => {
      getKernelSpecs(BASEURL).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          wsUrl: WSURL,
          kernelName: kernelSpecs.default,
          notebookPath: 'Untitled1.ipynb'
        }
        startNewSession(options).then((session) => {
          console.log('Hello Session: ', session.id, session.notebookPath);
          // should grab the same session object
          connectToSession(session.id, options).then((session2) => {
            console.log('Should have gotten the same kernel');
            if (session2.kernel.clientId !== session.kernel.clientId) {
              throw Error('Did not reuse session');
            }
            listRunningSessions(BASEURL).then((sessions) => {
              if (!sessions.length) {
                throw Error('Should be one at least one running session');
              }
              session2.kernel.interrupt().then(() => {
                console.log('Got interrupt');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('Comm', () => {

    it('should start a comm from the client end', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs(BASEURL).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          wsUrl: WSURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.open('initial state');
            comm.send('test');
            done();
          });
        });
      });
    });

    it('should start a comm from the server end', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs(BASEURL).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          wsUrl: WSURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.registerTarget('test2', (comm, data) => {
            done();
          });
          var code = [
            "from ipykernel.comm import Comm",
            "comm = Comm(target_name='test2')",
            "comm.send(data='hello')"
          ].join('\n')
          kernel.execute({ code: code });
        });
      });
    });
  });
});
