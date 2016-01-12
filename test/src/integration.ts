// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions,
  connectToSession, startNewSession, getKernelSpecs, getConfigSection,
  ConfigWithDefaults, ContentsManager
} from '../../lib';


var BASEURL = 'http://localhost:8888';


describe('jupyter.services - Integration', () => {

  describe('Kernel', () => {

    it('should start, restart and get kernel info', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        var options = {
          baseUrl: BASEURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          console.log('Hello Kernel: ', kernel.name, kernel.id);
          kernel.restart().then(() => {
            console.log('Kernel restarted');
            kernel.kernelInfo().then((info) => {
              console.log('Got info: ', info.language_info);
              kernel.shutdown().then(() => {
                console.log('Kernel shut down');
                done();
              });
            });
         });
        });
      });
    });

    it('should connect to existing kernel and list running kernels', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        var options = {
          baseUrl: BASEURL,
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
            listRunningKernels({ baseUrl: BASEURL }).then((kernels) => {
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
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        var options = {
          baseUrl: BASEURL,
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
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          kernelName: kernelSpecs.default,
          notebookPath: 'Untitled1.ipynb'
        }
        startNewSession(options).then((session) => {
          console.log('Hello Session: ', session.id, session.notebookPath);
          session.renameNotebook('Untitled2.ipynb').then(() => {
            expect(session.notebookPath).to.be('Untitled2.ipynb');

            // should grab the same session object
            connectToSession(session.id, options).then((session2) => {
              console.log('Should have gotten the same kernel');
              if (session2.kernel.clientId !== session.kernel.clientId) {
                throw Error('Did not reuse session');
              }

              listRunningSessions({ baseUrl: BASEURL}).then((sessions) => {
                if (!sessions.length) {
                  throw Error('Should be one at least one running session');
                }
                session2.kernel.interrupt().then(() => {
                  console.log('Got interrupt');
                  session2.shutdown().then(() => {
                    console.log('Got shutdown');
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

  describe('Comm', () => {

    it('should start a comm from the server end', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          kernel.commOpened.connect((kernel, msg) => {
            expect(msg.target_name).to.be('test');
            var comm = kernel.connectToComm(msg.target_name, msg.comm_id);
            comm.onMsg = (msg) => {
              expect(msg).to.be('hello');
              comm.send('0');
              comm.send('1');
              comm.send('2');
            }
            comm.onClose = (msg) => {
              expect(msg).to.eql(['0', '1', '2']);
              done();
            }
          });
          var code = [
            "from ipykernel.comm import Comm",
            "comm = Comm(target_name='test')",
            "comm.send(data='hello')",
            "msgs = []",
            "def on_msg(msg):",
            "    msgs.append(msg['content']['data'])",
            "    if len(msgs) == 3:",
            "       comm.close(msgs)",
            "comm.on_msg(on_msg)"
          ].join('\n')
          kernel.execute({ code: code });
        });
      });
    });
  });

  describe('Config', () => {

    it('should get a config section on the server and update it', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var options = {
          baseUrl: BASEURL,
          name: kernelSpecs.default
        }
        startNewKernel(options).then((kernel) => {
          getConfigSection('notebook', BASEURL).then(section => {
            var defaults = { default_cell_type: 'code' };
            var config = new ConfigWithDefaults(section, defaults, 'Notebook');
            expect(config.get('default_cell_type')).to.be('code');
            config.set('foo', 'bar').then(() => {
              expect(config.get('foo')).to.be('bar');
              done();
            });
          });
        });
      });
    });

  });

  describe('ContentManager', () => {

    it('should list a directory and get the file contents', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var contents = new ContentsManager(BASEURL);
        contents.listContents('.').then(listing => {
          var content = listing.content as any;
          for (var i = 0; i < content.length; i++) {
            if (content[i].type === 'file') {
              contents.get(content[i].path, { type: "file" }).then(msg => {
                expect(msg.path).to.be(content[i].path);
                done();
              });
              break;
            }
          }
        });
      });
    });

    it('should create a new file, rename it, and delete it', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var contents = new ContentsManager(BASEURL);
        var options = { type: 'file', ext: '.ipynb' };
        contents.newUntitled('.', options).then(model0 => {
          contents.rename(model0.path, 'foo.ipynb').then(model1 => {
            expect(model1.path).to.be('foo.ipynb');
            contents.delete('foo.ipynb').then(done);
          });
        });
      });
    });

    it('should create a file by name and delete it', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var contents = new ContentsManager(BASEURL);
        var options = { type: 'file', content: '', format: 'text' };
        contents.save('baz.txt', options).then(model0 => {
          contents.delete('baz.txt').then(done);
        });
      });
    });

    it('should exercise the checkpoint API', (done) => {
      getKernelSpecs({ baseUrl: BASEURL }).then((kernelSpecs) => {
        var contents = new ContentsManager(BASEURL);
        var options = { type: 'file', contents: '' };
        contents.save('baz.txt', options).then(model0 => {
          contents.createCheckpoint('baz.txt').then(checkpoint => {
            contents.listCheckpoints('baz.txt').then(checkpoints => {
              expect(checkpoints[0]).to.eql(checkpoint);
              contents.restoreCheckpoint('baz.txt', checkpoint.id).then(() => {
                contents.deleteCheckpoint('baz.txt', checkpoint.id).then(() => {
                  contents.delete('baz.txt').then(done);
                });
              });
            });
          });
        });
      });
    });


  });
});
