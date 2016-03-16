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
See `examples/browser` for an example of using Webpack to bundle the library.


Usage from Node.js
------------------

Follow the package install instructions first.

```bash
npm install --save xmlhttprequest ws
```

Override the global `XMLHttpRequest` and `WebSocket` (in ES6 syntax):

```typescript
import { XMLHttpRequest } from "xmlhttprequest";
import { default as WebSocket } from 'ws';

global.XMLHttpRequest = XMLHttpRequest;
global.WebSocket = WebSocket;
```

See `examples/node` for an example of using an ES5 node script.


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. The
examples below are written in TypeScript using ES6 syntax.  Simply
omit the type declarations when using a language other than TypeScript.
A translator such as Babel can be used to convert from ES6 -> ES5.

**Kernel**

```typescript
import {
  listRunningKernels, connectToKernel, startNewKernel, getKernelSpecs
} from 'jupyter-js-services';

// The base url of the notebook server.
const BASE_URL = 'http://localhost:8000';


// Get a list of available kernels and connect to one.
listRunningKernels({ baseUrl: BASE_URL }).then(kernelModels => {
  let options = {
    baseUrl: BASE_URL,
    name: kernelModels[0].name
  }
  connectToKernel(kernelModels[0].id, options).then((kernel) => {
    console.log(kernel.name);
  });
});


// Get info about the available kernels and start a new one.
getKernelSpecs({ baseUrl: BASE_URL }).then(kernelSpecs => {
  console.log('Default spec:', kernelSpecs.default);
  console.log('Available specs', Object.keys(kernelSpecs.kernelspecs));
  // use the default name
  let options = {
    baseUrl: BASE_URL,
    name: kernelSpecs.default
  }
  startNewKernel(options).then(kernel => {
    // Execute and handle replies.
    let future = kernel.execute({ code: 'a = 1' } );
    future.onDone = () => {
      console.log('Future is fulfilled');
    }
    future.onIOPub = (msg) => {
      console.log(msg.content);  // Print rich output data.
    }

    // Restart the kernel and then send an inspect message.
    kernel.restart().then(() => {
      let request = { code: 'hello', cursor_pos: 4, detail_level: 0};
      kernel.inspect(request).then(reply => {
        console.log(reply.data);
      });
    });

    // Interrupt the kernel and then send a complete message.
    kernel.interrupt().then(() => {
      kernel.complete({ code: 'impor', cursor_pos: 4 } ).then((reply) => {
        console.log(reply.matches);
      });
    });

    // Register a callback for when the kernel changes state.
    kernel.statusChanged.connect((status) => {
      console.log('status', status);
    });

    // Kill the kernel.
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

// The base url of the notebook server.
const BASE_URL = 'http://localhost:8000';


// Get a list of available sessions and connect to one.
listRunningSessions({ baseUrl: BASE_URL }).then(sessionModels => {
  let options = {
    baseUrl: BASE_URL,
    kernelName: sessionModels[0].kernel.name,
    notebookPath: sessionModels[0].notebook.path
  }
  connectToSession(sessionModels[0].id, options).then((session) => {
    console.log(session.kernel.name);
  });
});

// Start a new session.
let options = {
  baseUrl: BASE_URL,
  kernelName: 'python',
  notebookPath: '/tmp/foo.ipynb'
}
startNewSession(options).then(session => {
  // Execute and handle replies on the kernel.
  let future = session.kernel.execute({ code: 'a = 1' });
  future.onDone = () => {
    console.log('Future is fulfilled');
  }

  // Rename the notebook.
  session.renameNotebook('/local/bar.ipynb').then(() => {
    console.log('Notebook renamed to', session.notebookPath);
  });

  // Register a callback for when the session dies.
  session.sessionDied.connect(() => {
    console.log('session died');
  });

  // Kill the session.
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

// The base url of the notebook server.
const BASE_URL = 'http://localhost:8000';


// Create a comm from the server side.
//
// Get info about the available kernels and connect to one.
getKernelSpecs({ baseUrl: BASE_URL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASE_URL,
    name: kernelSpecs.default,
  });
}).then(kernel => {
  let comm = kernel.connectToComm('test');
  comm.open('initial state');
  comm.send('test');
  comm.close('bye');
});

// Create a comm from the client side.
getKernelSpecs({ baseUrl: BASE_URL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASE_URL,
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
  let code = [
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

// The base url of the notebook server.
const BASE_URL = 'http://localhost:8000';


let contents = new ContentsManager(BASE_URL);

// Create a new python file.
contents.newUntitled("/foo", { type: "file", ext: "py" }).then(
  (model) => {
    console.log(model.path);
  }
);

// Get the contents of a directory.
contents.get("/foo", { type: "directory", name: "bar" }).then(
  (model) => {
    let files = model.content;
  }
)

// Rename a file.
contents.rename("/foo/bar.txt", "/foo/baz.txt");

// Save a file.
contents.save("/foo", { type: "file", name: "test.py" });

// Delete a file.
contents.delete("/foo/bar.txt");

// Copy a file.
contents.copy("/foo/bar.txt", "/baz").then((model) => {
    let newPath = model.path;
});

// Create a checkpoint.
contents.createCheckpoint("/foo/bar.ipynb").then((model) => {
  let checkpoint = model;

  // Restore a checkpoint.
  contents.restoreCheckpoint("/foo/bar.ipynb", checkpoint.id);

  // Delete a checkpoint.
  contents.deleteCheckpoint("/foo/bar.ipynb", checkpoint.id);
});

// List checkpoints for a file.
contents.listCheckpoints("/foo/bar.txt").then((models) => {
    console.log(models[0].id);
});
```

**Configuration**

```typescript
  startNewKernel, getKernelSpecs, getConfigSection, ConfigWithDefaults
} from 'jupyter-js-services';

// The base url of the notebook server.
const BASE_URL = 'http://localhost:8000';


getKernelSpecs({ baseUrl: BASE_URL }).then(kernelSpecs => {
  return startNewKernel({
    baseUrl: BASE_URL,
    name: kernelSpecs.default,
  });
}).then(kernel => {
  getConfigSection('notebook', BASE_URL).then(section => {
    let defaults = { default_cell_type: 'code' };
    let config = new ConfigWithDefaults(section, defaults, 'Notebook');
    console.log(config.get('default_cell_type'));   // 'code'
    config.set('foo', 'bar').then(data => {
       console.log(data.foo); // 'bar'
    });
  });
});
```
