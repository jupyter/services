// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  XMLHttpRequest as NodeXMLHttpRequest
} from 'xmlhttprequest';

import * as NodeWebSocket
  from 'ws';

import {
  listRunningKernels, connectToKernel, startNewKernel, listRunningSessions,
  connectToSession, startNewSession, getKernelSpecs, getConfigSection,
  ConfigWithDefaults, ContentsManager, KernelMessage, IContents
} from '../../lib';

// Stub for node global.
declare var global: any;
global.XMLHttpRequest = NodeXMLHttpRequest;
global.WebSocket = NodeWebSocket;


describe('jupyter.services - Integration', () => {

  describe('Kernel', () => {

    it('should start, restart and get kernel info', (done) => {
      // get info about the available kernels and connect to one
      getKernelSpecs().then((kernelSpecs) => {
        console.log('default spec:', kernelSpecs.default);
        console.log('available specs', Object.keys(kernelSpecs.kernelspecs));
        let options = {
          name: kernelSpecs.default
        };
        startNewKernel(options).then((kernel) => {
          console.log('Hello Kernel: ', kernel.name, kernel.id);
          kernel.restart().then(() => {
            console.log('Kernel restarted');
            kernel.kernelInfo().then((info) => {
              console.log('Got info: ', info.content.language_info);
              kernel.shutdown().then(() => {
                console.log('Kernel shut down');
                done();
              });
            });
         });
        });
      }).catch(done);
    });

    it('should connect to existing kernel and list running kernels', (done) => {
      startNewKernel().then((kernel) => {
        console.log('Hello Kernel: ', kernel.name, kernel.id);
        // should grab the same kernel object
        connectToKernel(kernel.id).then((kernel2) => {
          console.log('Should have gotten the same kernel');
          if (kernel2.clientId === kernel.clientId) {
            throw Error('Did create new kernel');
          }
          if (kernel2.id !== kernel.id) {
            throw Error('Did clone kernel');
          }
          listRunningKernels().then((kernels) => {
            if (!kernels.length) {
              throw Error('Should be one at least one running kernel');
            }
            kernel2.kernelInfo().then(() => {
              console.log('Final request');
              kernel.shutdown().then(() => { done(); });
            });
          });
        });
      }).catch(done);
    });

    it('should trigger a reconnect', (done) => {
      startNewKernel().then(kernel => {
        kernel.reconnect().then(() => {
          done();
        });
      }).catch(done);
    });

    it('should handle other kernel messages', (done) => {
      startNewKernel().then(kernel => {
        console.log('Kernel started');
        return kernel.complete({ code: 'impor', cursor_pos: 4 })
        .then(msg => {
          console.log('Got completions: ', msg.content.matches);
          return kernel.inspect({ code: 'hex', cursor_pos: 2, detail_level: 0 });
        }).then(msg => {
          console.log('Got inspect: ', msg.content.data);
          return kernel.isComplete({ code: 'from numpy import (\n' });
        }).then(msg => {
          console.log('Got isComplete: ', msg.content.status);
          let options: KernelMessage.IHistoryRequest = {
            output: true,
            raw: true,
            hist_access_type: 'search',
            session: 0,
            start: 1,
            stop: 2,
            n: 1,
            pattern: '*',
            unique: true,
          };
          return kernel.history(options);
        }).then(msg => {
          console.log('Got history');
          let future = kernel.execute({ code: 'a = 1\n' });
          future.onReply = (reply: KernelMessage.IExecuteReplyMsg) => {
            expect(reply.content.status).to.be('ok');
          };
          future.onDone = () => {
            console.log('Execute finished');
            return kernel.shutdown();
          };
        }).then(() => done()).catch(error => console.log(error));
      }).catch(done);
    });

  });

  describe('Session', () => {

    it('should start, connect to existing session and list running sessions', (done) => {
      let options = { path: 'Untitled1.ipynb' };
      startNewSession(options).then((session) => {
        console.log('Hello Session: ', session.id, session.path);
        session.rename('Untitled2.ipynb').then(() => {
          expect(session.path).to.be('Untitled2.ipynb');

          // should grab the same session object
          connectToSession(session.id, options).then((session2) => {
            console.log('Should have gotten the same kernel');
            if (session2.kernel.clientId === session.kernel.clientId) {
              throw Error('Did not clone the session');
            }
            if (session2.kernel.id !== session.kernel.id) {
              throw Error('Did not clone the session');
            }

            listRunningSessions().then((sessions) => {
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
      }).catch(done);
    });

    it('should connect to an existing kernel', (done) => {
      startNewKernel().then(kernel => {
        let sessionOptions = {
          kernelId: kernel.id,
          path: 'Untitled1.ipynb'
        };
        startNewSession(sessionOptions).then(session => {
          console.log('Hello Session: ', session.id);
          expect(session.kernel.id).to.be(kernel.id);
          session.shutdown().then(() => { done(); });
        });
      }).catch(done);
    });

    it('should be able to switch to an existing kernel by id', (done) => {
      startNewKernel().then(kernel => {
        let sessionOptions = { path: 'Untitled1.ipynb' };
        startNewSession(sessionOptions).then(session => {
          session.changeKernel({ id: kernel.id }).then(newKernel => {
            expect(newKernel.id).to.be(kernel.id);
            session.shutdown().then(() => { done(); });
          });
        });
      }).catch(done);
    });

    it('should be able to switch to a new kernel by name', (done) => {
      // Get info about the available kernels and connect to one.
      let options = { path: 'Untitled1.ipynb' };
      startNewSession(options).then(session => {
        let id = session.kernel.id;
        session.changeKernel({ name: session.kernel.name }).then(newKernel => {
          expect(newKernel.id).to.not.be(id);
          session.shutdown().then(() => { done(); });
        });
      }).catch(done);
    });

  });

  describe('Comm', () => {

    it('should start a comm from the server end', (done) => {
      startNewKernel().then((kernel) => {
        kernel.registerCommTarget('test', (comm, msg) => {
          let content = msg.content;
          expect(content.target_name).to.be('test');
          comm.onMsg = (msg) => {
            expect(msg.content.data).to.be('hello');
            comm.send('0');
            comm.send('1');
            comm.send('2');
          };
          comm.onClose = (msg) => {
            expect(msg.content.data).to.eql(['0', '1', '2']);
            done();
          };
        });
        let code = [
          'from ipykernel.comm import Comm',
          'comm = Comm(target_name="test")',
          'comm.send(data="hello")',
          'msgs = []',
          'def on_msg(msg):',
          '    msgs.append(msg["content"]["data"])',
          '    if len(msgs) == 3:',
          '       comm.close(msgs)',
          'comm.on_msg(on_msg)'
        ].join('\n');
        kernel.execute({ code: code });
      }).catch(done);
    });

  });

  describe('Config', () => {

    it('should get a config section on the server and update it', (done) => {
      startNewKernel().then((kernel) => {
        getConfigSection('notebook').then(section => {
          let defaults = { default_cell_type: 'code' };
          let config = new ConfigWithDefaults(section, defaults, 'Notebook');
          expect(config.get('default_cell_type')).to.be('code');
          config.set('foo', 'bar').then(() => {
            expect(config.get('foo')).to.be('bar');
            done();
          });
        });
      }).catch(done);
    });

  });

  describe('ContentManager', () => {

    it('should list a directory and get the file contents', (done) => {
      let contents = new ContentsManager();
      contents.get('src').then(listing => {
        let content = listing.content as IContents.IModel[];
        for (let i = 0; i < content.length; i++) {
          if (content[i].type === 'file') {
            contents.get(content[i].path, { type: 'file' }).then(msg => {
              expect(msg.path).to.be(content[i].path);
              done();
            });
            break;
          }
        }
      }).catch(done);
    });

    it('should create a new file, rename it, and delete it', (done) => {
      let contents = new ContentsManager();
      let options: IContents.ICreateOptions = { type: 'file', ext: '.ipynb' };
      contents.newUntitled(options).then(model0 => {
        contents.rename(model0.path, 'foo.ipynb').then(model1 => {
          expect(model1.path).to.be('foo.ipynb');
          contents.delete('foo.ipynb').then(done);
        });
      }).catch(done);
    });

    it('should create a file by name and delete it', (done) => {
      let contents = new ContentsManager();
      let options: IContents.IModel = {
        type: 'file', content: '', format: 'text'
      };
      contents.save('baz.txt', options).then(model0 => {
        contents.delete('baz.txt').then(done);
      }).catch(done);
    });

    it('should exercise the checkpoint API', (done) => {
      let contents = new ContentsManager();
      let options: IContents.IModel = {
        type: 'file', format: 'text', content: 'foo'
      };
      contents.save('baz.txt', options).then(model0 => {
        expect(model0.name).to.be('baz.txt');
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
      }).catch(done);
    });

  });

});
