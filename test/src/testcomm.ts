// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import * as utils from '../../lib/utils';

import {  IComm, ICommInfo, CommManager } from '../../lib/comm';

import {  IKernel, IKernelMessageOptions } from '../../lib/ikernel';

import {  createKernelMessage } from '../../lib/kernel';

import { createKernel, KernelTester } from './testkernel';

import { RequestHandler, expectFailure } from './utils';



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

    context('#startNewComm', () => {

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.startNewComm('test', {}).then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(typeof comm.commId).to.be('string');
            done();
          });
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.startNewComm('test', { foo: 'bar' }, '1234').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.startNewComm('test', {}).then((comm) => {
            comm.onClose = () => {
              done();
            }
            manager.startNewComm('test', {}, comm.commId).then((comm2) => {
              comm2.close();  // should trigger comm to close
            });
          });
        });
      });
    });

    context('#connectToComm', () => {

      it('should create an instance of IComm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connectToComm('test', "1234").then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should use the given commId', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connectToComm('test', '1234').then((comm) => {
            expect(comm.targetName).to.be('test');
            expect(comm.commId).to.be('1234');
            done();
          });
        });
      });

      it('should reuse an existing comm', (done) => {
        createKernel().then((kernel) => {
          var manager = new CommManager(kernel);
          manager.connectToComm('test', '1234').then((comm) => {
            comm.onClose = () => {
              done();
            }
            manager.connectToComm('test', '1234').then((comm2) => {
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

  });
});


function sendCommMessage(tester: KernelTester, kernel: IKernel, msgType: string, contents: any) {
   var options: IKernelMessageOptions = {
    msgType: msgType,
    channel: 'iopub',
    username: kernel.username,
    session: kernel.clientId
  }
  var msg = createKernelMessage(options, contents);
  tester.send(msg);
}

