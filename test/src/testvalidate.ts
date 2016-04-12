// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import {
  createKernelMessage
} from '../../lib/kernel';

import {
  validateCommMessage
} from '../../lib/validate';


describe('jupyter.services', () => {

  describe('validateCommMessage()', () => {

    it('should validate a comm message', () => {
      let msg = createKernelMessage({
        msgType: 'comm_msg', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1 });
      expect(validateCommMessage(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'comm_close', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1 });
      expect(validateCommMessage(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1, target_name: 'baz' });
      expect(validateCommMessage(msg)).to.be(true);
      msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      }, {
        comm_id: 'foo', data: 1, target_name: 'baz', target_module: 'bar'
      });
      expect(validateCommMessage(msg)).to.be(true);
    });

    it('should fail if `comm_id` or `data` is missing', () => {
      let msg = createKernelMessage({
        msgType: 'comm_msg', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo' });
      expect(validateCommMessage(msg)).to.be(false);
      msg = createKernelMessage({
        msgType: 'comm_msg', channel: 'bar', session: 'baz'
      }, { data: 1 });
      expect(validateCommMessage(msg)).to.be(false);
    });

    it('should fail if is not of the right type', () => {
      let msg = createKernelMessage({
        msgType: 'foo', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1 });
      expect(validateCommMessage(msg)).to.be(false);
    });

    it('should fail for a comm open that does not have a proper target_name', () => {
      let msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1 });
      expect(validateCommMessage(msg)).to.be(false);
      msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1, target_name: 1 });
      expect(validateCommMessage(msg)).to.be(false);
    });

    it('should fail for a comm open that does not have a proper target_module', () => {
      let msg = createKernelMessage({
        msgType: 'comm_open', channel: 'bar', session: 'baz'
      }, { comm_id: 'foo', data: 1, target_name: 'foo', target_module: 1});
      expect(validateCommMessage(msg)).to.be(false);
    });

    it('should fail for a an improper comm_id', () => {
      let msg = createKernelMessage({
        msgType: 'comm_msg', channel: 'bar', session: 'baz'
      }, { comm_id: 1, data: 1 });
      expect(validateCommMessage(msg)).to.be(false);
    });

  });

});
