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


**Kernel**

```typescript
import { 
  listRunningKernels, connectToKernel, startNewKernel, getKernelSpecs
} from 'jupyter-js-services';

// get a list of available kernels and connect to one
listRunningKernels('http://localhost:8000').then((kernelModels) => {
  var options = {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000',
    name: kernelModels[0].name
  }
  connectToKernel(kernelModels[0].id, options).then((kernel) => {
    console.log(kernel.name);
  });
});


// get info about the available kernels and start a new one
getKernelSpecs('http://localhost:8888').then((kernelSpecs) => {
  console.log('Default spec:', kernelSpecs.default);
  console.log('Available specs', Object.keys(kernelSpecs.kernelspecs));
  // use the default name
  var options = {
    baseUrl: 'http://localhost:8888',
    wsUrl: 'ws://localhost:8888',
    name: kernelSpecs.default
  }
  startNewKernel(options).then((kernel) => {
    // execute and handle replies
    var future = kernel.execute({ code: 'a = 1' } );
    future.onDone = () => {
      console.log('Future is fulfilled');
    }
    future.onIOPub = (msg) => {
      console.log(msg.content);  // rich output data
    }

    // restart the kernel and then send an inspect message
    kernel.restart().then(() => {
      var request = { code: 'hello', cursor_pos: 4, detail_level: 0};
      kernel.inspect(request).then((reply) => {
        console.log(reply.data);
      });
    });

    // interrupt the kernel and then send a complete message
    kernel.interrupt().then(() => {
      kernel.complete({ code: 'impor', cursor_pos: 4 } ).then((reply) => {
        console.log(reply.matches);
      });
    });

    // register a callback for when the kernel changes state
    kernel.statusChanged.connect((status) => {
      console.log('status', status);
    });

    // kill the kernel
    kernel.shutdown().then(() => {
      console.log('Kernel shut down');
    });
  });
});
```

**NotebookSession**

```typescript
import {
  listRunningSessions, connectToSession, startNewSession
} from 'jupyter-js-services';

// get a list of available sessions and connect to one
listRunningSessions('http://localhost:8000').then((sessionModels) => {
  var options = {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000',
    kernelName: sessionModels[0].kernel.name,
    notebookPath: sessionModels[0].notebook.path
  }
  connectToSession(sessionModels[0].id, options).then((session) => {
    console.log(session.kernel.name);
  });
});

// start a new session
var options = {
  baseUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000',
  kernelName: 'python',
  notebookPath: '/tmp/foo.ipynb'
}
startNewSession(options).then((session) => {
  // execute and handle replies on the kernel
  var future = session.kernel.execute({ code: 'a = 1' });
  future.onDone = () => {
    console.log('Future is fulfilled');
  }

  // rename the notebook
  session.renameNotebook('/local/bar.ipynb').then(() => {
    console.log('Notebook renamed to', session.notebookPath);
  });

  // register a callback for when the session dies
  session.sessionDied.connect(() => {
    console.log('session died');
  });

  // kill the session
  session.shutdown().then(() => {
    console.log('session closed');
  });

});
```

**Comm**

```typescript
import {
  getKernelSpecs, startNewKernel, CommManager
} from 'jupyter-js-services';

var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';

// Create a comm from the server side.
//
// get info about the available kernels and connect to one
getKernelSpecs(BASEURL).then((kernelSpecs) => {
  var options = {
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelSpecs.default
  }
  startNewKernel(options).then((kernel) => {
    var manager = new CommManager(kernel);
    manager.connect('test').then((comm) => {
      comm.open('initial content');
      comm.send('test');
      console.log('Done!');
    });
  });
});


// Create a comm from the client side.
getKernelSpecs(BASEURL).then((kernelSpecs) => {
  var options = {
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelSpecs.default
  }
  startNewKernel(options).then((kernel) => {
    var manager = new CommManager(kernel);
    manager.registerTarget('test2', (comm, data) => {
      console.log('Hello, test2!');
    });
    var code = [
      "from ipykernel.comm import Comm",
      "comm = Comm(target_name='test2')",
      "comm.send(data='hello')"
    ].join('\n')
    kernel.execute({ code: code });
  });
});
```

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
