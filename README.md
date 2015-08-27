Jupyter JS Services
===================

Javascript client for the Jupyter services REST APIs

[API Docs](http://jupyter.github.io/jupyter-js-services/)


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

// get a list of available kernels
var listPromise = Kernel.list('http://localhost:8000');

// start a specific kernel
var kernel = new Kernel('http://localhost:8000');
listPromise.then((kernelList) => {
  kernel.start(kernelList[0]);
});

// send a message and get replies
kernel.onReady.then(() => {
  var future = kernel.execute('a = 1');
  future.onDone(() => {
    console.log('Future is fulfilled');
  });
  future.onOutput((msg) => {
    console.log(msg.content);  // rich output data
  });
});

// restart the kernel and send an inspect message
kernel.restart().then(() => {
  var future = kernel.inspect('hello', 5);
  future.onReply((msg) => {
    console.log(msg.content);
  });
});

// interrupt the kernel and send a complete message
kernel.interrupt().then(() => {
  var future = kernel.complete('impor', 4);
  future.onReply((msg) => {
    console.log(msg.content);
  });
});

// register a callback for when the kernel changes state
kernel.statusChanged.connect((status) => {
  console.log('status', status);
});

// kill the kernel
kernel.shutdown();


```

**NoteBookSession**

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
