// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import requirejs = require('requirejs');

import * as utils from '../../lib/utils';

import {  IComm, ICommInfo, CommManager } from '../../lib/comm';

import {  IKernel, IKernelMessageOptions } from '../../lib/ikernel';

import {  createKernelMessage } from '../../lib/kernel';

import { createKernel, KernelTester } from './testkernel';

import { RequestHandler, expectFailure, doLater } from './utils';

// stub for node global
declare var global: any;


if (typeof window === 'undefined') {
  global.requirejs = requirejs;
}


describe('jupyter.services - Comm', () => {

  describe('CommManager', () => {

    context('#constructor', () => {

      it('should create an instance of CommManager', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          expect(manager instanceof CommManager).to.be(true);
          done()
        });
      });
    });

    context('#connect', () => {

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(typeof comm.commId).to.be('string');
            done();
          });
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test', '1234').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.onClose = () => {
              done();
            }
            manager.connect('test', comm.commId).then((comm2) => {
              comm2.close();  // should trigger comm to close
            });
          });
        });
      });

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test', "1234").then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test', '1234').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test', '1234').then((comm) => {
            comm.onClose = () => {
              done();
            }
            manager.connect('test', '1234').then((comm2) => {
              comm2.close();  // should trigger comm to close
            });
          });
        });
      });
    });

    context('#registerTarget', () => {

      it('should call the provided callback', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.registerTarget('test', (comm, data) => {
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

    context('#commInfo', () => {

      it('should get the comm info', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
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
          manager.commInfo().then((info) => {
            var comms = info.comms as any;
            expect(comms['1234']).to.be('test');
            done();
          });
        });
      });

      it('should allow an optional target', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
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
          manager.commInfo('test').then((info) => {
            var comms = info.comms as any;
            expect(comms['1234']).to.be('test');
            done();
          });
        });
      });
    });

    describe('#_handleOpen()', () => {

      it('should load a required module', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          var contents = {
            target_name: 'test',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          manager.connect('test', '1234').then(() => {
            done();
          });
        });
      });

      it('should fail to load the module', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          var contents = {
            target_name: 'test2',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          manager.connect('test2', '1234').then(() => {
            done();
          });
        });
      });

      it('should fail to find the target', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          var contents = {
            target_name: 'unavailable',
            target_module: '../../../test/build/target',
            comm_id: "1234",
            data: { foo: 'bar'}
          }
          sendCommMessage(tester, kernel, 'comm_open', contents);
          manager.connect('test2', '1234').then(() => {
            done();
          });
        });
      });

    });
  });

  describe('IComm', () => {

    context('#commId', () => {
      it('should be a read only string', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            expect(typeof comm.commId).to.be('string');
            expect(() => { comm.commId = ''; }).to.throwError();
            done();
          });
        });
      });
    });

    context('#targetName', () => {
      it('should be a read only string', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(() => { comm.targetName = ''; }).to.throwError();
            done();
          });
        });
      });
    });

    context('#onClose', () => {
      it('should be readable and writable function', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.onClose = (data) => {
              done();
            }
            expect(typeof comm.onClose).to.be('function');
            comm.close();
          });
        });
      });

      it('should be called when the server side closes', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.onClose = (data) => {
              done();
            }
            var content = {
              comm_id: comm.commId,
              target_name: comm.targetName
            }
            sendCommMessage(tester, kernel, 'comm_close', content);
          });
        });
      });

      it('should ignore a close message for an unregistered id', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            var content = {
              comm_id: '1234',
              target_name: comm.targetName
            }
            sendCommMessage(tester, kernel, 'comm_close', content);
            done();
          });
        });
      });
    });

    context('#onMsg', () => {
      it('should be readable and writable function', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.onMsg = (data) => {
              done();
            }
            expect(typeof comm.onMsg).to.be('function');
            comm.onMsg({});
          });
        });
      });

      it('should be called when the server side sends a message', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
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
      });

      it('should ignore a message for an unregistered id', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            var content = {
              comm_id: '1234',
              target_name: comm.targetName
            }
            sendCommMessage(tester, kernel, 'comm_msg', content);
            done();
          });
        });
      });
    });

    context('#send()', () => {
      it('should send a message to the server', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            tester.onMessage((msg) => {
              expect(msg.content.data.foo).to.be('bar');
              done();
            });
            comm.send({ foo: 'bar' });
          });
        });
      });
    });

    context('#close()', () => {
      it('should send a message to the server', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            tester.onMessage((msg) => {
              expect(msg.content.data.foo).to.be('bar');
              done();
            });
            comm.close({ foo: 'bar' });
          });
        });
      });

      it('should send trigger an onClose', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.onClose = (data) => {
              expect(data.foo).to.be('bar');
              done();
            }
            comm.close({ foo: 'bar' });
          });
        });
      });

      it('should not send subsequent messages', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.close({ foo: 'bar' });
            expect(() => { comm.send('test'); }).to.throwError();
            done();
          });
        });
      });

      it('should be a no-op if already closed', (done) => {
        var tester = new KernelTester();
        createKernel(tester).then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connect('test').then((comm) => {
            comm.close({ foo: 'bar' });
            comm.close();
            done();
          });
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
