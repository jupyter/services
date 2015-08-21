// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  ISessionId, ISessionOptions, NotebookSession
} from '../../lib/session';

import { deserialize, serialize } from '../../lib/serialize';

import { MockWebSocket, MockWebSocketServer } from './mocksocket';

import { RequestHandler, expectFailure } from './utils';


var DEFAULTS: ISessionOptions = {
  notebookPath: "test",
  kernelName: "python",
  baseUrl: "localhost",
  wsUrl: "ws://"
}

var DEFAULT_ID: ISessionId = {
  id: "1234", 
  notebook: { path: "test1" },
  kernel: { id: "1234", name: "test1" }
}


describe('jupyter.services - Session', () => {

  describe('#list()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data: ISessionId[] = [
        DEFAULT_ID,
        { id: "5678", 
          notebook: { path: "test2" },
          kernel: { id: "5678", name: "test2" }
        },
      ];
      handler.respond(200, data);
      return list.then((response: ISessionId[]) => {
        expect(response[0].kernel.id).to.be(DEFAULT_ID.kernel.id); 
        expect(response[0].kernel.name).to.be(DEFAULT_ID.kernel.name); 
        expect(response[0].notebook.path).to.be(DEFAULT_ID.notebook.path);
        expect(response[0].id).to.be(DEFAULT_ID.id);

        expect(response[1].kernel.id).to.be("5678"); 
        expect(response[1].kernel.name).to.be("test2");
        expect(response[1].notebook.path).to.be("test2");
        expect(response[1].id).to.be("5678");
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data = { id: "1234", notebook: { path: "test" } };
      handler.respond(200, data);
      expectFailure(list, done, "Invalid Session list");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data: ISessionId[] = [
        DEFAULT_ID,
        { id: "5678", 
          notebook: { path: "test2" },
          kernel: { id: "5678", name: "test2" }
        },
      ];
      handler.respond(201, data);
      expectFailure(list, done, "Invalid Status: 201");
    });

  });

  describe('#constructor()', () => {

    it('should set initial conditions', () => {
      var session = new NotebookSession(DEFAULTS);
      expect(session.kernel.name).to.be("python");
    });

  });

  describe('#start()', () => {

    it('should start a session', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      session.kernel.id = DEFAULT_ID.kernel.id;
      var server = new MockWebSocketServer(session.kernel.wsUrl);

      var start = session.start();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(201, data);
      return start.then(() => {
        expect(session.kernel.id).to.be(DEFAULT_ID.kernel.id);
        expect(session.kernel.status).to.be('connected');
        done();
      });
    });

    it('should throw an error for an invalid session id', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var start = session.start();
      var data = { id: "1234" };
      handler.respond(201, data);
      return expectFailure(start, done, "Invalid Session Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var start = session.start();
      handler.respond(200, DEFAULT_ID);
      return expectFailure(start, done, "Invalid response");
    });

  });


  describe('#getInfo()', () => {

    it('should get information about a session', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);

      var info = session.getInfo();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(200, data);
      return info.then((id: ISessionId) => {
        expect(id.kernel.id).to.be(DEFAULT_ID.kernel.id); 
        expect(id.kernel.name).to.be(DEFAULT_ID.kernel.name); 
        expect(id.notebook.path).to.be(DEFAULT_ID.notebook.path);
        expect(id.id).to.be(DEFAULT_ID.id);
        done();
      });
    });

    it('should throw an error for an invalid session id', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var info = session.getInfo();
      var data = { id: "1234" };
      handler.respond(200, data);
      return expectFailure(info, done, "Invalid Session Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var info = session.getInfo();
      handler.respond(201, DEFAULT_ID);
      return expectFailure(info, done, "Invalid response");
    });

  });

  describe('#delete()', () => {

    it('should kill a session', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      session.kernel.id = DEFAULT_ID.kernel.id;
      var server = new MockWebSocketServer(session.kernel.wsUrl);

      var start = session.start();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(201, data);
      return start.then(() => {
        var del = session.delete();
        handler.respond(204, DEFAULT_ID);
        del.then(() => {
          expect(session.kernel.status).to.be('disconnected');
          done();
        });
      });
    });

    it('should throw an error for an invalid session id', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var del = session.delete();
      var data = { id: "1234" };
      handler.respond(204, data);
      return expectFailure(del, done, "Invalid Session Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var del = session.delete();
      handler.respond(200, DEFAULT_ID);
      return expectFailure(del, done, "Invalid response");
    });

  });

  describe('#restart()', () => {

    it('should restart a session', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      session.kernel.id = DEFAULT_ID.kernel.id;
      var server = new MockWebSocketServer(session.kernel.wsUrl);

      var start = session.start();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(201, data);
      return start.then(() => {
        var restart = session.restart();
        handler.respond(204, DEFAULT_ID);
        setImmediate(() => {
          handler.respond(201, DEFAULT_ID);
          restart.then(() => { done(); });
        });
      });
    });

    it('should restart a session with different options', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      session.kernel.id = DEFAULT_ID.kernel.id;
      var server = new MockWebSocketServer(session.kernel.wsUrl);

      var start = session.start();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(201, data);
      return start.then((msg: ISessionId) => {
        var options: ISessionOptions = {
          kernelName: 'R',
          notebookPath: 'test2'
        }
        var restart = session.restart(options);
        handler.respond(204, DEFAULT_ID);
        setImmediate(() => {
          var newID: ISessionId = DEFAULT_ID;
          newID.kernel.name = 'R';
          newID.notebook.path = 'test2';
          handler.respond(201, newID);
          restart.then(() => { 
            expect(session.kernel.name).to.be('R');
            expect(session.notebookPath).to.be('test2');
            done(); 
          });
        });
      });
    });
  });

  describe('#renameNotebook()', () => {

    it('should rename the notebook', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);

      var path = 'new path';
      var rename = session.renameNotebook(path);

      var id = DEFAULT_ID;
      id.notebook.path = path;
      handler.respond(200, JSON.stringify(id));
      return rename.then(() => {
        expect(session.notebookPath).to.be(path);
        done();
      });
    });

    it('should throw an error for an invalid session id', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var rename = session.renameNotebook('new path');
      var data = { id: "1234" };
      handler.respond(200, data);
      return expectFailure(rename, done, "Invalid Session Model");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var rename = session.renameNotebook('new path');
      handler.respond(201, DEFAULT_ID);
      return expectFailure(rename, done, "Invalid response");
    });

  });
});
