// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  ICheckpointModel, IContentsModel, IContentsOpts, Contents, 
} from '../../lib/contents';


import { RequestHandler, expectFailure } from './utils';


var DEFAULT_FILE: IContentsModel = {
  name: "test",
  path: "",
  type: "file",
  created: "yesterday",
  last_modified: "today",
  mimetype: "text/plain",
  content: "hello, world!",
  format: "text"
}

var DEFAULT_DIR: IContentsModel = {
  name: "bar",
  path: "/foo/bar",
  type: "file",
  created: "yesterday",
  last_modified: "today",
  mimetype: "",
  content: "['buzz.txt', 'bazz.py']",
  format: "json"
}

var DEFAULT_CP: ICheckpointModel = {
  id: "1234",
  last_modified: "yesterday"
}


describe('jupyter.services - Contents', () => {

  describe('#constructor()', () => {

    it('should complete properly', (done) => {
      var contents = new Contents("localhost");
      done();
    });

  });

  describe('#get()', () => {

    it('should get a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var get = contents.get("/foo", { type: "file", name: "test" });
      handler.respond(200, DEFAULT_FILE);
      return get.then((model: IContentsModel) => {
        expect(model.path).to.be(DEFAULT_FILE.path);
        done();
      });
    });

    it('should get a directory', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var get = contents.get("/foo", { type: "directory", name: "bar" });
      handler.respond(200, DEFAULT_DIR);
      return get.then((model: IContentsModel) => {
        expect(model.content).to.be(DEFAULT_DIR.content);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var get = contents.get("/foo", { type: "directory", name: "bar",
                                       format: "json", content: false });
      var dir = JSON.parse(JSON.stringify(DEFAULT_DIR));
      dir.name = 1
      handler.respond(200, dir);
      expectFailure(get, done, 'Invalid Contents Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var get = contents.get("/foo", { name: "bar" });
      handler.respond(201, DEFAULT_DIR);
      expectFailure(get, done, 'Invalid Status: 201');
    });

  });

  describe('#newUntitled()', () => {

    it('should create a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var newFile = contents.newUntitled("/foo");
      handler.respond(201, DEFAULT_FILE);
      return newFile.then((model: IContentsModel) => {
        expect(model.path).to.be(DEFAULT_FILE.path);
        done();
      });
    });

    it('should create a directory', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var newDir = contents.newUntitled("/foo", { type: "directory", 
                                                  ext: "" });
      handler.respond(201, DEFAULT_DIR);
      return newDir.then((model: IContentsModel) => {
        expect(model.content).to.be(DEFAULT_DIR.content);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var newFile = contents.newUntitled("/foo", { type: "file", ext: "py" });
      var dir = JSON.parse(JSON.stringify(DEFAULT_DIR));
      dir.name = 1
      handler.respond(201, dir);
      expectFailure(newFile, done, 'Invalid Contents Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var newDir = contents.newUntitled("/foo", { name: "bar" });
      handler.respond(200, DEFAULT_DIR);
      expectFailure(newDir, done, 'Invalid Status: 200');
    });

  });

  describe('#delete()', () => {

    it('should delete a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var del = contents.delete("/foo/bar.txt");
      handler.respond(204, { });
      return del.then(() => {
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var del = contents.delete("/foo/bar.txt");
      handler.respond(200, { });
      expectFailure(del, done, 'Invalid Status: 200');
    });

    it('should throw a specific error', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var del = contents.delete("/foo/");
      handler.respond(400, { });
      expectFailure(del, done, 'Directory not found');
    });

  });

  describe('#rename()', () => {

    it('should rename a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var rename = contents.rename("/foo/bar.txt", "/foo/baz.txt");
      handler.respond(200, DEFAULT_FILE);
      return rename.then((obj: IContentsModel) => {
        expect(obj.created).to.be(DEFAULT_FILE.created);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var rename = contents.rename("/foo/bar.txt", "/foo/baz.txt");
      var dir = JSON.parse(JSON.stringify(DEFAULT_FILE));
      delete dir.name;
      handler.respond(200, dir);
      expectFailure(rename, done, 'Invalid Contents Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var rename = contents.rename("/foo/bar.txt", "/foo/baz.txt");
      handler.respond(201, DEFAULT_FILE);
      expectFailure(rename, done, 'Invalid Status: 201');
    });

  });

  describe('#save()', () => {

    it('should save a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var save = contents.save("/foo", { type: "file", name: "test" });
      handler.respond(200, DEFAULT_FILE);
      return save.then((obj: IContentsModel) => {
        expect(obj.created).to.be(DEFAULT_FILE.created);
        done();
      });
    });

    it('should create a new file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var save = contents.save("/foo", { type: "file", name: "test" });
      handler.respond(201, DEFAULT_FILE);
      return save.then((obj: IContentsModel) => {
        expect(obj.created).to.be(DEFAULT_FILE.created);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var save = contents.save("/foo", { type: "file", name: "test" });
      var file = JSON.parse(JSON.stringify(DEFAULT_FILE));
      delete file.format;
      handler.respond(200, file);
      expectFailure(save, done, 'Invalid Contents Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var save = contents.save("/foo", { type: "file", name: "test" });
      handler.respond(204, DEFAULT_FILE);
      expectFailure(save, done, 'Invalid Status: 204');
    });

  });

  describe('#copy()', () => {

    it('should copy a file', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var copy = contents.copy("/foo/bar.txt", "/baz");
      handler.respond(201, DEFAULT_FILE);
      return copy.then((obj: IContentsModel) => {
        expect(obj.created).to.be(DEFAULT_FILE.created);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var copy = contents.copy("/foo/bar.txt", "/baz");
      var file = JSON.parse(JSON.stringify(DEFAULT_FILE));
      delete file.type;
      handler.respond(201, file);
      expectFailure(copy, done, 'Invalid Contents Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var copy = contents.copy("/foo/bar.txt", "/baz");
      handler.respond(200, DEFAULT_FILE);
      expectFailure(copy, done, 'Invalid Status: 200');
    });

  });

  describe('#createCheckpoint()', () => {

    it('should create a checkpoint', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.createCheckpoint("/foo/bar.txt");
      handler.respond(201, DEFAULT_CP);
      return checkpoint.then((obj: ICheckpointModel) => {
        expect(obj.last_modified).to.be(DEFAULT_CP.last_modified);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.createCheckpoint("/foo/bar.txt");
      var cp = JSON.parse(JSON.stringify(DEFAULT_CP));
      delete cp.last_modified;
      handler.respond(201, cp);
      expectFailure(checkpoint, done, 'Invalid Checkpoint Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.createCheckpoint("/foo/bar.txt");
      handler.respond(200, DEFAULT_CP);
      expectFailure(checkpoint, done, 'Invalid Status: 200');
    });

  });

  describe('#listCheckpoints()', () => {

    it('should list the checkpoints', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoints = contents.listCheckpoints("/foo/bar.txt");
      handler.respond(200, [DEFAULT_CP, DEFAULT_CP]);
      return checkpoints.then((obj: ICheckpointModel[]) => {
        expect(obj[0].last_modified).to.be(DEFAULT_CP.last_modified);
        done();
      });
    });

    it('should fail for an incorrect model', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoints = contents.listCheckpoints("/foo/bar.txt");
      var cp = JSON.parse(JSON.stringify(DEFAULT_CP));
      delete cp.id;
      handler.respond(200, [cp, DEFAULT_CP]);

      var second = () => {
        var checkpoints = contents.listCheckpoints("/foo/bar.txt");
        handler.respond(200, DEFAULT_CP);
        expectFailure(checkpoints, done, 'Invalid Checkpoint list');
      }

      expectFailure(checkpoints, second, 'Invalid Checkpoint Model');
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoints = contents.listCheckpoints("/foo/bar.txt");
      handler.respond(201, { });
      expectFailure(checkpoints, done, 'Invalid Status: 201');
    });

  });

  describe('#restoreCheckpoint()', () => {

    it('should create a checkpoint', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.restoreCheckpoint("/foo/bar.txt",
                                                  DEFAULT_CP.id);
      handler.respond(204, { });
      return checkpoint.then(() => {
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.deleteCheckpoint("/foo/bar.txt",
                                                  DEFAULT_CP.id);
      handler.respond(200, { });
      expectFailure(checkpoint, done, 'Invalid Status: 200');
    });

  });

  describe('#deleteCheckpoint()', () => {

    it('should delete a checkpoint', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.deleteCheckpoint("/foo/bar.txt",
                                                  DEFAULT_CP.id);
      handler.respond(204, { });
      return checkpoint.then(() => {
        done();
      });
    });

    it('should fail for an incorrect response', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var checkpoint = contents.deleteCheckpoint("/foo/bar.txt",
                                                  DEFAULT_CP.id);
      handler.respond(200, { });
      expectFailure(checkpoint, done, 'Invalid Status: 200');
    });

  });

  describe('#listContents()', () => {

    it('should get a directory', (done) => {
      var contents = new Contents("localhost");
      var handler = new RequestHandler();
      var dir = contents.listContents("/foo");
      handler.respond(200, DEFAULT_FILE);
      return dir.then((model: IContentsModel) => {
        expect(model.path).to.be(DEFAULT_FILE.path);
        done();
      });
    });
  });
});
