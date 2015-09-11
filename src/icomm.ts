// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

/**
 * A manager for Comm objects.
 */
export
interface ICommManager {
  startNewComm(targetName: string, data: any, commId?: string): Promise<IComm>;
  connectToComm(targetName: string, commId: string): Promise<IComm>;
  registerTarget(targetName: string, cb: (comm: IComm, data: any) => any): void;
  commInfo(targetName?: string): Promise<ICommInfo>
}


/**
 * A client side Comm interface.
 */
export
interface IComm {
  commId: string;
  targetName: string;
  send(data: any): void;
  close(data?: any): void;
  onClose: (data?: any) => void;
  onMsg: (data: any) => void;
}


/**
 * Contents of `comm_info` message, a mapping of comm ids to target names.
 */
export
interface ICommInfo {
  comms: Map<string, string>;
}
