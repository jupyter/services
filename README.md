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
```
