// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

/**
 * A manager for Comm objects.
 */
export
interface ICommManager {
  /**
   * Start a new Comm, sending a "comm_open" message.
   *
   * If commId is given, and a client-side comm with that id exists,
   * that comm is returned.
   */
  startNewComm(targetName: string, data: any, commId?: string): Promise<IComm>;

  /**
   * Connect to an existing server side comm.
   *
   * If a client-side comm already exists, it is returned.
   */
  connectToComm(targetName: string, commId: string): Promise<IComm>;

  /**
   * Register the handler for a "comm_open" message on a given targetName.
   */
  registerTarget(targetName: string, cb: (comm: IComm, data: any) => any): void;

  /**
   * Send a 'comm_info_request', and return the contents of the
   * 'comm_info_reply'.
   */
  commInfo(targetName?: string): Promise<ICommInfo>
}


/**
 * A client side Comm interface.
 */
export
interface IComm {
  /**
   * The uuid for the comm channel.
   *
   * Read-only
   */
  commId: string;

  /** 
   * The target name for the comm channel.
   *
   * Read-only
   */
  targetName: string;

  /**
   * The onClose handler.
   */
  onClose: (data?: any) => void;

  /**
   * The onMsg handler.
   */
  onMsg: (data: any) => void;

  /**
   * Send a comm message to the kernel.
   */
  send(data: any): void;

  /**
   * Close the comm.
   */
  close(data?: any): void;
}


/**
 * Contents of `comm_info` message.
 */
export
interface ICommInfo {
  /**
   * Mapping of comm ids to target names.
   */
  comms: Map<string, string>;
}
