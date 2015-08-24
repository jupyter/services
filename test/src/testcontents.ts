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
});
