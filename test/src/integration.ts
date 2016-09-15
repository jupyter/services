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
  ConfigWithDefaults, ContentsManager, KernelMessage, IContents, IKernel,
  ISession, TerminalManager, connectToSession, startNewSession,
  createTerminalSession, getConfigSection,
  listRunningSessions, Kernel
} from '../../lib';

import {
  JSONObject
} from 'phosphor/lib/algorithm/json';


// Stub for node global.
declare var global: any;
global.XMLHttpRequest = NodeXMLHttpRequest;
global.WebSocket = NodeWebSocket;


describe('jupyter.services - Integration', () => {

  describe('Kernel', () => {

    it('should get kernel specs and start', (done) => {
      // get info about the available kernels and connect to one
      Kernel.getSpecs().then((specs) => {
        return Kernel.startNew({ name: specs.default });
      }).then(kernel => {
        return kernel.shutdown();
      }).then(done, done);
    });

    it('should interrupt and restart', (done) => {
      let kernel: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        return kernel.interrupt();
      }).then(() => {
        return kernel.restart();
      }).then(() => {
        return kernel.shutdown();
      }).then(done, done);
    });

    it('should get info', (done) => {
      let kernel: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        return kernel.kernelInfo();
      }).then((info) => {
        return kernel.shutdown();
      }).then(done, done);
    });

    it('should connect to existing kernel and list running kernels', (done) => {
      let kernel: IKernel;
      let kernel2: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        // should grab the same kernel object
        return Kernel.connectTo(kernel.id);
      }).then(value => {
        kernel2 = value;
        if (kernel2.clientId === kernel.clientId) {
          throw Error('Did create new kernel');
        }
        if (kernel2.id !== kernel.id) {
          throw Error('Did clone kernel');
        }
        return Kernel.listRunning();
      }).then(kernels => {
        if (!kernels.length) {
          throw Error('Should be one at least one running kernel');
        }
        return kernel.shutdown();
      }).then(done, done);
    });

    it('should trigger a reconnect', (done) => {
      let kernel: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        return kernel.reconnect();
      }).then(() => {
        return kernel.shutdown();
      }).then(done, done);
    });

    it('should handle other kernel messages', (done) => {
      let kernel: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        return kernel.complete({ code: 'impor', cursor_pos: 4 });
      }).then(msg => {
        return kernel.inspect({ code: 'hex', cursor_pos: 2, detail_level: 0 });
      }).then(msg => {
        return kernel.isComplete({ code: 'from numpy import (\n' });
      }).then(msg => {
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
        let future = kernel.execute({ code: 'a = 1\n' });
        future.onReply = (reply: KernelMessage.IExecuteReplyMsg) => {
          expect(reply.content.status).to.be('ok');
        };
        future.onDone = () => {
          console.log('Execute finished');
          return kernel.shutdown();
        };
      }).then(done, done);
    });

  });

  describe('Session', () => {

    it('should start, connect to existing session and list running sessions', (done) => {
      let options: ISession.IOptions = { path: 'Untitled1.ipynb' };
      let session: ISession;
      let session2: ISession;
      startNewSession(options).then(value => {
        session = value;
        return session.rename('Untitled2.ipynb');
      }).then(() => {
        expect(session.path).to.be('Untitled2.ipynb');
        // should grab the same session object
        return connectToSession(session.id);
      }).then(value => {
        expect(value.path).to.be(options.path);
        session2 = value;
        if (session2.kernel.clientId === session.kernel.clientId) {
          throw Error('Did not clone the session');
        }
        if (session2.kernel.id !== session.kernel.id) {
          throw Error('Did not clone the session');
        }
        return listRunningSessions();
      }).then(sessions => {
        if (!sessions.length) {
          throw Error('Should be one at least one running session');
        }
        return session.shutdown();
      }).then(done, done);
    });

    it('should connect to an existing kernel', (done) => {
      let kernel: IKernel;
      Kernel.startNew().then(value => {
        kernel = value;
        let sessionOptions: ISession.IOptions = {
          kernelId: kernel.id,
          path: 'Untitled1.ipynb'
        };
        return startNewSession(sessionOptions);
      }).then(session => {
        expect(session.kernel.id).to.be(kernel.id);
        return session.shutdown();
      }).then(done, done);
    });

    it('should be able to switch to an existing kernel by id', (done) => {
      let kernel: IKernel;
      let session: ISession;
      Kernel.startNew().then(value => {
        kernel = value;
        let sessionOptions: ISession.IOptions = { path: 'Untitled1.ipynb' };
        return startNewSession(sessionOptions);
      }).then(value => {
        session = value;
        return session.changeKernel({ id: kernel.id });
      }).then(newKernel => {
        expect(newKernel.id).to.be(kernel.id);
        return session.shutdown();
      }).then(done, done);
    });

    it('should be able to switch to a new kernel by name', (done) => {
      // Get info about the available kernels and connect to one.
      let options: ISession.IOptions = { path: 'Untitled1.ipynb' };
      let id: string;
      let session: ISession;
      startNewSession(options).then(value => {
        session = value;
        id = session.kernel.id;
        return session.changeKernel({ name: session.kernel.name });
      }).then(newKernel => {
        expect(newKernel.id).to.not.be(id);
        return session.shutdown();
      }).then(done, done);
    });

  });

  describe('Comm', () => {

    it('should start a comm from the server end', (done) => {
      Kernel.startNew().then((kernel) => {
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
      let config: ConfigWithDefaults;
      getConfigSection({ name: 'notebook' }).then(section => {
        let defaults: JSONObject = { default_cell_type: 'code' };
        config = new ConfigWithDefaults({ section, defaults, className: 'Notebook' });
        expect(config.get('default_cell_type')).to.be('code');
        return config.set('foo', 'bar');
      }).then(() => {
        expect(config.get('foo')).to.be('bar');
        done();
      }).catch(done);
    });

  });

  describe('ContentManager', () => {

    it('should list a directory and get the file contents', (done) => {
      let contents = new ContentsManager();
      let content: IContents.IModel[];
      let path = '';
      contents.get('src').then(listing => {
        content = listing.content as IContents.IModel[];
        for (let i = 0; i < content.length; i++) {
          if (content[i].type === 'file') {
            path = content[i].path;
            return contents.get(path, { type: 'file' });
          }
        }
      }).then(msg => {
        expect(msg.path).to.be(path);
        done();
      }).catch(done);
    });

    it('should create a new file, rename it, and delete it', (done) => {
      let contents = new ContentsManager();
      let options: IContents.ICreateOptions = { type: 'file', ext: '.ipynb' };
      contents.newUntitled(options).then(model0 => {
        return contents.rename(model0.path, 'foo.ipynb');
      }).then(model1 => {
        expect(model1.path).to.be('foo.ipynb');
        return contents.delete('foo.ipynb');
      }).then(done, done);
    });

    it('should create a file by name and delete it', (done) => {
      let contents = new ContentsManager();
      let options: IContents.IModel = {
        type: 'file', content: '', format: 'text'
      };
      contents.save('baz.txt', options).then(model0 => {
        return contents.delete('baz.txt');
      }).then(done, done);
    });

    it('should exercise the checkpoint API', (done) => {
      let contents = new ContentsManager();
      let options: IContents.IModel = {
        type: 'file', format: 'text', content: 'foo'
      };
      let checkpoint: IContents.ICheckpointModel;
      contents.save('baz.txt', options).then(model0 => {
        expect(model0.name).to.be('baz.txt');
        return contents.createCheckpoint('baz.txt');
      }).then(value => {
        checkpoint = value;
        return contents.listCheckpoints('baz.txt');
      }).then(checkpoints => {
        expect(checkpoints[0]).to.eql(checkpoint);
        return contents.restoreCheckpoint('baz.txt', checkpoint.id);
      }).then(() => {
        return contents.deleteCheckpoint('baz.txt', checkpoint.id);
      }).then(() => {
        return contents.delete('baz.txt');
      }).then(done, done);
    });

  });

  describe('createTerminalSession', () => {

    it('should create and shut down a terminal session', (done) => {
      createTerminalSession().then(session => {
        return session.shutdown();
      }).then(done, done);
    });

  });

  describe('TerminalManager', () => {

    it('should create, list, and shutdown by name', (done) => {
      let manager = new TerminalManager();
      manager.create().then(session => {
        return manager.listRunning();
      }).then(running => {
        expect(running.length).to.be(1);
        return manager.shutdown(running[0].name);
      }).then(() => {
        return manager.listRunning();
      }).then(running => {
        expect(running.length).to.be(0);
        done();
      }).catch(done);
    });

  });

});
