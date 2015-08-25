Jupyter JS Services
===================

Javascript client for the Jupyter services REST APIs

[API Docs](http://jupyter.github.io/jupyter-js-services/)

[REST API Docs](http://petstore.swagger.io/?url=https://github.com/jupyter/jupyter-js-services/blob/master/rest_api.yaml)


Package Install
---------------

**Prerequisites**
- [node](http://nodejs.org/)

```bash
npm install --save jupyter-js-services
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org/)

```bash
git clone https://github.com/jupyter/jupyter-js-services.git
cd jupyter-js-services
npm install
```

**Rebuild**
```bash
npm run clean
npm run build
```


Run Tests
---------

Follow the source build instructions first.

```bash
npm test
```


Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`.


Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- IE 11+
- Firefox 32+
- Chrome 38+


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simply
omit the type declarations when using a language other than TypeScript.

**Contents**

```typescript
import {
  IContentsModel, ICheckpointModel, Contents
} from 'jupyter-js-services';

var contents = new Contents('http://localhost:8000');

// create a new python file
contents.newUntitled("/foo", { type: "file", ext: "py" }).then(
  (model: IContentsModel) => {
    console.log(model.path);
  }
);

// get the contents of a directory
contents.get("/foo", { type: "directory", name: "bar" }).then(
  (model: IContentsModel) => {
    var files = model.content;
  }
)

// rename a file
contents.rename("/foo/bar.txt", "/foo/baz.txt");

// save a file
contents.save("/foo", { type: "file", name: "test.py" });

// delete a file
contents.delete("/foo/bar.txt");

// copy a file
contents.copy("/foo/bar.txt", "/baz").then((model: IContentsModel) => {
    var newPath = model.path;
});

// create a checkpoint
contents.createCheckpoint("/foo/bar.ipynb").then((model: ICheckpointModel) => {
    var checkpoint = model;
}

// restore a checkpoint
contents.restoreCheckpoint("/foo/bar.ipynb", checkpoint.id);

// delete a checkpoint
contents.deleteCheckpoint("/foo/bar.ipynb", checkpoint.id);

// list checkpoints for a file
contents.listCheckpoints("/foo/bar.txt").then((models: ICheckpointModel[]) => {
    console.log(models[0].id);
});
```
