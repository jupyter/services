Jupyter JS Services
===================

Javascript client for the Jupyter services REST APIs

[API Docs](http://jupyter.github.io/jupyter-js-services/)

[REST API Docs](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml)

Note: All functions and methods using the REST API allow an optional
`ajaxOptions` parameter to configure the request.


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
- [node 0.12+](http://nodejs.org/)

```bash
git clone https://github.com/jupyter/jupyter-js-services.git
cd jupyter-js-services
npm install
npm run build
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

- Node 0.12.7+
- IE 11+
- Firefox 32+
- Chrome 38+


Starting the Notebook Server
----------------------------
The library requires a running Jupyter Notebook server, v4.1+, launched as:

```bash
python -m notebook --NotebookApp.allow_origin="*"
```

The origin can be specified directly instead of using `*` if desired.


Bundling for the Browser
------------------------
Specify the following alias: `requirejs: 'requirejs/require'`.


Usage from Node.js
------------------

Follow the package install instructions first.

```bash
npm install --save xmlhttprequest ws
```

Override the global `XMLHttpRequest` and `WebSocket`:

```typescript
import { XMLHttpRequest } from "xmlhttprequest";
import { default as WebSocket } from 'ws';

global.XMLHttpRequest = XMLHttpRequest;
global.WebSocket = WebSocket;
```


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
listRunningKernels({ baseUrl: 'http://localhost:8000' }).then(kernelModels => {
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
getKernelSpecs({ baseUrl: 'http://localhost:8888' }).then(kernelSpecs => {
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
listRunningSessions({ baseUrl: 'http://localhost:8000' }
).then(sessionModels => {
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
  getKernelSpecs, startNewKernel
} from 'jupyter-js-services';

var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';

// Create a comm from the server side.
//
// get info about the available kernels and connect to one
getKernelSpecs({ baseUrl: BASEURL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelSpecs.default,
  });
}).then(kernel => {
  var comm = kernel.connectToComm('test');
  comm.open('initial state');
  comm.send('test');
  comm.close('bye');
});

// Create a comm from the client side.
getKernelSpecs({ baseUrl: BASEURL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelSpecs.default,
  });
}).then(kernel => {
  kernel.registerCommTarget('test2', (comm, commMsg) => {
    if (commMsg.content.target_name !== 'test2') {
       return;
    }
    comm.onMsg = (msg) => {
      console.log(msg);  // 'hello'
    }
    comm.onClose = (msg) => {
      console.log(msg);  // 'bye'
    }
  });
  var code = [
    "from ipykernel.comm import Comm",
    "comm = Comm(target_name='test2')",
    "comm.send(data='hello')",
    "comm.close(data='bye')"
  ].join('\n')
  kernel.execute({ code: code });
});
```

**Contents**

```typescript
import {
  ContentsManager
} from 'jupyter-js-services';

var contents = new ContentsManager('http://localhost:8000');

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
  startNewKernel, getKernelSpecs, getConfigSection, ConfigWithDefaults
} from 'jupyter-js-services';

var BASEURL = 'http://localhost:8888';
var WSURL = 'ws://localhost:8888';

getKernelSpecs({ baseUrl: BASEURL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASEURL,
    wsUrl: WSURL,
    name: kernelSpecs.default,
  });
}).then(kernel => {
  getConfigSection('notebook', BASEURL).then(section => {
    var defaults = { default_cell_type: 'code' };
    var config = new ConfigWithDefaults(section, defaults, 'Notebook');
    console.log(config.get('default_cell_type'));   // 'code'
    config.set('foo', 'bar').then(data => {
       console.log(data.foo); // 'bar'
    });
  });
});
```
