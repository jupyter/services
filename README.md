Jupyter JS Services
===================

Javascript client for the Jupyter services REST APIs

[API Docs](http://jupyter.github.io/jupyter-js-services/)

[REST API Docs](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml)


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
  Contents
} from 'jupyter-js-services';

var contents = new Contents('http://localhost:8000');

// create a new python file
contents.newUntitled("/foo", { type: "file", ext: "py" }).then(
  (model) => {
    console.log(model.path);
  }
);

// get the contents of a directory
contents.get("/foo", { type: "directory", name: "bar" }).then(
  (model) => {
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
contents.copy("/foo/bar.txt", "/baz").then((model) => {
    var newPath = model.path;
});

// create a checkpoint
contents.createCheckpoint("/foo/bar.ipynb").then((model) => {
  var checkpoint = model;

  // restore a checkpoint
  contents.restoreCheckpoint("/foo/bar.ipynb", checkpoint.id);

  // delete a checkpoint
  contents.deleteCheckpoint("/foo/bar.ipynb", checkpoint.id);
});

// list checkpoints for a file
contents.listCheckpoints("/foo/bar.txt").then((models) => {
    console.log(models[0].id);
});
```

**Configuration**

```typescript
import {
  ConfigSection, ConfigWithDefaults
} from 'jupyter-js-services';

var section = new ConfigSection('mySection', 'http://localhost:8000');

// load from the server
section.load().then((data: any) => {
    console.log(data);
});

// update contents
section.update({ mySubSection: { 'fizz': 'buzz', spam: 'eggs' } });

console.log(section.data.mySubSection.fizz);  // 'buzz'

// create a config object based on our section with default values and a
// class of data
var config = new ConfigWithDefaults(section, { bar: 'baz' }, 'mySubSection');

// get the current value of fizz regardless of whether the section is loaded
config.getSync('bar');  // defaults to 'baz' if section is not loaded

// wait for the section to load and get our data
console.log(config.get('bar'));

// set a config value
config.set('fizz', 'bazz');  // sets section.data.mySubSection.fizz = 'bazz'

```

**KernelSelector**

```typescript
import {
  IKernelSpecId, KernelSelector
} from 'jupyter-js-services';

var selector = new KernelSelector('http://localhost:8000');
selector.load().then((kernelNames: string[]) => {
    var spec: IKernelSpecId = selector.select(kernelNames[0]);
    var pythonSpecs: string[] = selector.findByLanguage('python');
}

**Kernel**

```typescript
import { 
  listRunningKernels, connectToKernel, startNewKernel
} from '../../lib/kernel';

// get a list of available kernels
listRunningKernels('http://localhost:8000').then((kernelModels) => {
  console.log(kernelModels[0].name);
  console.log(kernelModels[0].id);
});

// start a kernel by name
var options = {
  baseUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost',
  name: 'python'
}
startNewKernel(options).then((kernel) => {
  // execute and handle replies
  var future = kernel.execute('a = 1');
  future.onDone = () => {
    console.log('Future is fulfilled');
  });
  future.onIOPub = (msg) => {
    console.log(msg.content);  // rich output data
  });

  // restart the kernel and then send an inspect message
  kernel.restart().then(() => {
    kernel.inspect('hello', 5).then((msg) => {
      console.log(msg.content);
    });
  });

  // interrupt the kernel and then send a complete message
  kernel.interrupt().then(() => {
    kernel.complete('impor', 4).then((msg) => {
      console.log(msg.content);
    });
  });

  // register a callback for when the kernel changes state
  kernel.statusChanged.connect((status) => {
    console.log('status', status);
  });

  // kill the kernel
  kernel.shutdown();
}

// connect to an existing kernel by id
var uid = "DEADBEEF";  // pretend this is the id of the running kernel above
connectToKernel(uid).then((kernel) => {
  console.log(kernel.name);  // python
});

// connect to a kernel running on the server by id
var options = {
  baseUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost',
  name: 'python'
}
var uid = "ABBA";
connectToKernel(uid).then((kernel) => {
  console.log(kernel.name);  // some other kernel
});

```

**NotebookSession**

```typescript
import {
  NotebookSession
} from 'jupyter-js-services';

// get a list of available sessions
var listPromise = NotebookSession.list('http://localhost:8000');

// start a specific session
var session = new NotebookSession('http://localhost:8000');
listPromise.then((sessionList) => {
  session.start(sessionList[0]);
});

// restart a session and send a complete message to the kernel
session.restart().then(() => {
  var future = session.kernel.complete('impor', 4);
  future.onReply((msg) => {
    console.log(msg.content);
  });
});

// rename the notebook
session.renameNotebook('/path/to/notebook.ipynb');

// register a callback for when the session changes state
session.statusChanged.connect((status) => {
  console.log('status', status);
});

// kill the session
session.shutdown();

```
