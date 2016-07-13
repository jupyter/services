// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  request
} from 'mock-xhr';

import {
  ISignal
} from 'phosphor-signaling';

import {
  IKernel, KernelMessage
} from './ikernel';


/**
 * The default kernel spec models.
 */
export
const KERNELSPECS: IKernel.ISpecModels = {
  default: 'python',
  kernelspecs: {
    python: {
      name: 'python',
      spec: {
        language: 'python',
        argv: [],
        display_name: 'Python',
        env: {}
      },
      resources: {}
    },
    shell: {
      name: 'shell',
      spec: {
        language: 'shell',
        argv: [],
        display_name: 'Shell',
        env: {}
      },
      resources: {}
    }
  }
};


/**
 * The default language infos.
 */
const LANGUAGE_INFOS: { [key: string]: KernelMessage.ILanguageInfo } = {
  python: {
    name: 'python',
    version: '1',
    mimetype: 'text/x-python',
    file_extension: '.py',
    pygments_lexer: 'python',
    codemirror_mode: 'python',
    nbconverter_exporter: ''
  },
  shell: {
    name: 'shell',
    version: '1',
    mimetype: 'text/x-sh',
    file_extension: '.sh',
    pygments_lexer: 'shell',
    codemirror_mode: 'shell',
    nbconverter_exporter: ''
  }
};


/**
 * A mock notebook server.
 */
interface MockServer {
  /**
   * A signal emitted when an xml request is made.
   */
  requestReceived: ISignal<MockServer, request>;

  /**
   * A signal emitted when a websocket message is received.
   */
  messageReceived: ISignal<MockServer, MessageEvent>;

  /**
   * Send a message to a websocket url.
   */
  send(url: string, msg: string): void;
}






/**
 * Use dependency injection to give this to the kernel object.
 */
interface KernelHelper {
  /**
   * A signal emitted when a websocket message is received.
   */
  messageReceived: ISignal<MockServer, MessageEvent>;

  /**
   * Send a message to a kernel.
   */
  sendMessage(request: MessageEvent, msgType: string, channel: string,
    contents: any): void;

  /**
   * Send a kernel info reply.
   */
  sendInfo(request: MessageEvent, language: string): void;

  /**
   * Send a kernel status message.
   */
  sendStatus(request: MessageEvent, status: string): void;

  /**
   * Send a shell reply to the kernel.
   */
  sendReply(request: MessageEvent, content: any): void;

  /**
   * Handle an execute request.
   */
  handleExecute(request: MessageEvent): void;

  /**
   * Handle an execute request with error.
   */
  errorExecute(request: MessageEvent): void;
}




