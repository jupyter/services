// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  ITerminalSession
} from './terminals';


/**
 * A mock terminal session manager.
 */
export
class MockTerminalManager implements ITerminalSession.IManager {
  /**
   * Construct a new mock terminal manager.
   */
  constructor() { }

  /**
   * Create a new terminal session or connect to an existing session.
   */
  create(options: ITerminalSession.IOptions = {}): Promise<MockTerminalSession> {
    let name = options.name;
    if (name in Private.running) {
      return Promise.resolve(Private.running[name]);
    }
    if (!name) {
      let i = 1;
      while (String(i) in Private.running) {
        i++;
      }
      name = String(i);
    }
    let session = new MockTerminalSession(name);
    Private.running[name] = session;
    return Promise.resolve(session);
  }

  /**
   * Shut down a terminal session by name.
   */
  shutdown(name: string): Promise<void> {
    if (!(name in Private.running)) {
      return Promise.resolve(void 0);
    }
    Private.running[name].shutdown();
    return Promise.resolve(void 0);
  }

  /**
   * Get the list of models for the terminals running on the server.
   */
  listRunning(): Promise<ITerminalSession.IModel[]> {
    let models: ITerminalSession.IModel[] = [];
    for (let name in Private.running) {
      models.push({ name });
    }
    return Promise.resolve(models);
  }
}


/**
 * A mock implementation of a terminal interface.
 */
export
class MockTerminalSession implements ITerminalSession {
  /**
   * Construct a new terminal session.
   */
  constructor(name: string) {
    this._name = name;
    this._url = `mockterminals/{name}`;
  }

  /**
   * A signal emitted when a message is received from the server.
   */
  get messageReceived(): ISignal<ITerminalSession, ITerminalSession.IMessage> {
    return Private.messageReceivedSignal.bind(this);
  }

  /**
   * Get the name of the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the websocket url used by the terminal session.
   *
   * #### Notes
   * This is a read-only property.
   */
  get url(): string {
    return this._url;
  }

  /**
   * Test whether the session is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the session.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    delete Private.running[this._name];
    clearSignalData(this);
  }

  /**
   * Send a message to the terminal session.
   */
  send(message: ITerminalSession.IMessage): void {
    // Echo the message back on stdout.
    message.content = [`${message.type}: ${message.content}`];
    message.type = 'stdout';
    this.messageReceived.emit(message);
  }

  /**
   * Shut down the terminal session.
   */
  shutdown(): Promise<void> {
    this.dispose();
    return Promise.resolve(void 0);
  }

  private _name: string;
  private _url: string;
  private _isDisposed = false;
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A mapping of running terminals by name.
   */
  export
  var running: { [key: string]: MockTerminalSession } = Object.create(null);

  /**
   * A signal emitted when the terminal is fully connected.
   */
  export
  const connectedSignal = new Signal<MockTerminalSession, void>();

  /**
   * A signal emitted when a message is received.
   */
  export
  const messageReceivedSignal = new Signal<MockTerminalSession, ITerminalSession.IMessage>();
}
