// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import * as utils from '../../lib/utils';

import {
  IComm, ICommInfoReply, IKernel, IKernelMessageOptions
} from '../../lib/ikernel';

import {  createKernelMessage } from '../../lib/kernel';

import { createKernel, KernelTester } from './testkernel';

import { RequestHandler, expectFailure, doLater } from './utils';

// stub for node global
declare var global: any;


describe('jupyter.services - Comm', () => {

  describe('Kernel', () => {

    context('#connectToComm()', () => {

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          expect(comm.targetName).to.be('test');
          expect(typeof comm.commId).to.be('string');
          done();
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test', '1234');
          expect(comm.targetName).to.be('test');
          expect(comm.commId).to.be('1234');
          done();
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onClose = () => {
            done();
          }
          var comm2 = kernel.connectToComm('test', comm.commId);
          comm2.close();  // should trigger comm to close
        });
      });

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test', "1234");
          expect(comm.targetName).to.be('test');
          expect(comm.commId).to.be('1234');
          done();
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test', '1234');
          expect(comm.targetName).to.be('test');
          expect(comm.commId).to.be('1234');
          done();
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test', '1234');
          comm.onClose = () => {
            done();
          }
          var comm2 = kernel.connectToComm('test', '1234');
          comm2.close();  // should trigger comm to close
        });
      });
    });

    context('#setTargetHandler()', () => {

      it('should call the provided callback', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          kernel.commOpened.connect((kernel, msg) => {
            kernel.connectToComm(msg.target_name, msg.comm_id);
            done();
          });
          var contents = {
            target_name: 'test',
            comm_id: utils.uuid(),
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
        });
      });
    });

    context('#commInfo()', () => {

      it('should get the comm info', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          tester.onMessage((msg) => {
            msg.parent_header = msg.header;
            msg.content = {
              comms: {
                 '1234': 'test',
                 '5678': 'test2',
                 '4321': 'test'

              }
            }
            tester.send(msg);
          });
          kernel.commInfo({ }).then((info) => {
            var comms = info.comms as any;
            expect(comms['1234']).to.be('test');
            done();
          });
        });
      });

      it('should allow an optional target', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          tester.onMessage((msg) => {
            msg.parent_header = msg.header;
            msg.content = {
              comms: {
                 '1234': 'test',
                 '4321': 'test'
              }
            }
            tester.send(msg);
          });
          kernel.commInfo('test').then((info) => {
            var comms = info.comms as any;
            expect(comms['1234']).to.be('test');
            done();
          });
        });
      });
    });

    context('#isDisposed', () => {

      it('should be true after we dispose of the comm', () => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          expect(comm.isDisposed).to.be(false);
          comm.dispose();
          expect(comm.isDisposed).to.be(true);
        });
      });

      it('should be safe to call multiple times', () => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          expect(comm.isDisposed).to.be(false);
          expect(comm.isDisposed).to.be(false);
          comm.dispose();
          expect(comm.isDisposed).to.be(true);
          expect(comm.isDisposed).to.be(true);
        });
      });
    });

    context('#dispose()', () => {

      it('should dispose of the resources held by the comm', () => {
        createKernel().then((kernel: IKernel) => {
          var future = kernel.execute({ code: 'foo' });
          var comm = kernel.connectToComm('foo');
          comm.dispose();
          expect(comm.isDisposed).to.be(true);
        });
      });
    });

    describe('#_handleOpen()', () => {

      it('should load a required module', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var contents = {
            target_name: 'test',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          kernel.connectToComm('test', '1234');
          done();
        });
      });

      it('should fail to load the module', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var contents = {
            target_name: 'test2',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          kernel.connectToComm('test2', '1234');
          done();
        });
      });

      it('should fail to find the target', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var contents = {
            target_name: 'unavailable',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          kernel.connectToComm('test2', '1234');
          done();
        });
      });

    });
  });

  describe('IComm', () => {

    context('#commId', () => {
      it('should be a read only string', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          expect(typeof comm.commId).to.be('string');
          expect(() => { comm.commId = ''; }).to.throwError();
          done();
        });
      });
    });

    context('#targetName', () => {
      it('should be a read only string', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          expect(comm.targetName).to.be('test');
          expect(() => { comm.targetName = ''; }).to.throwError();
          done();
        });
      });
    });

    context('#onClose', () => {
      it('should be readable and writable function', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onClose = (data) => {
            done();
          }
          expect(typeof comm.onClose).to.be('function');
          comm.close();
        });
      });

      it('should be called when the server side closes', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onClose = (data) => {
            expect(data.foo).to.be('bar');
            done();
          }
          var content = {
            comm_id: comm.commId,
            target_name: comm.targetName,
            data: { foo: 'bar' }
          }
          sendCommMessage(tester, kernel, 'comm_close', content);
        });
      });

      it('should ignore a close message for an unregistered id', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          var content = {
            comm_id: '1234',
            target_name: comm.targetName
          }
          sendCommMessage(tester, kernel, 'comm_close', content);
          done();
        });
      });
    });

    context('#onMsg', () => {
      it('should be readable and writable function', (done) => {
        createKernel().then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onMsg = (data) => {
            done();
          }
          expect(typeof comm.onMsg).to.be('function');
          comm.onMsg({});
        });
      });

      it('should be called when the server side sends a message', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onMsg = (msg) => {
            expect(msg.foo).to.be('bar');
            done();
          }
          var content = {
            comm_id: comm.commId,
            target_name: comm.targetName,
            data: { foo: 'bar' }
          }
          sendCommMessage(tester, kernel, 'comm_msg', content);
        });
      });

      it('should ignore a message for an unregistered id', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          var content = {
            comm_id: '1234',
            target_name: comm.targetName
          }
          sendCommMessage(tester, kernel, 'comm_msg', content);
          done();
        });
      });
    });

    context('#open()', () => {

      it('should send a message to the server', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            expect(msg.content.data.foo).to.be('bar');
            done();
          });
          comm.open({ foo: 'bar' }, 'metadata');
        });
      });

      it('should yield a future', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            msg.parent_header = msg.header;
            msg.channel = 'iopub';
            tester.send(msg);
          });
          var future = comm.open();
          future.onIOPub = () => {
            done();
          }
        });
      });
    });

    context('#send()', () => {
      it('should send a message to the server', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            expect(msg.content.data.foo).to.be('bar');
            var decoder = new TextDecoder('utf8');
            var item = <DataView>msg.buffers[0];
            expect(decoder.decode(item)).to.be('hello');
            done();
          });
          var encoder = new TextEncoder('utf8');
          var data = encoder.encode('hello');
          comm.send({ foo: 'bar' }, 'metadata', [data, data.buffer]);
        });
      });

      it('should yield a future', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            msg.parent_header = msg.header;
            msg.channel = 'iopub';
            tester.send(msg);
          });
          var future = comm.send('foo');
          future.onIOPub = () => {
            done();
          }
        });
      });
    });

    context('#close()', () => {
      it('should send a message to the server', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            expect(msg.content.data.foo).to.be('bar');
            done();
          });
          comm.close({ foo: 'bar' }, 'metadata');
        });
      });

      it('should send trigger an onClose', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.onClose = (data) => {
            expect(data.foo).to.be('bar');
            done();
          }
          comm.close({ foo: 'bar' });
        });
      });

      it('should not send subsequent messages', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.close({ foo: 'bar' });
          expect(() => { comm.send('test'); }).to.throwError();
          done();
        });
      });

      it('should be a no-op if already closed', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          comm.close({ foo: 'bar' });
          comm.close();
          done();
        });
      });

      it('should yield a future', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var comm = kernel.connectToComm('test');
          tester.onMessage((msg) => {
            msg.parent_header = msg.header;
            msg.channel = 'iopub';
            tester.send(msg);
          });
          var future = comm.close();
          future.onIOPub = () => {
            done();
          }
        });
      });
    });

  });
});


function sendCommMessage(tester: KernelTester, kernel: IKernel, msgType: string, content: any) {
   var options: IKernelMessageOptions = {
    msgType: msgType,
    channel: 'iopub',
    username: kernel.username,
    session: kernel.clientId
  }
  var msg = createKernelMessage(options, content);
  tester.send(msg);
}
