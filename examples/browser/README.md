Jupyter JS Services Browser Example
===================================

This example demonstrates using Jupyter JS Services from the browser using
Webpack. The python script `main.py` is used to start a Jupyter Notebook Server
and serve the Webpack bundle.  The example is written in TypeScript using ES6
imports.  Note the TypeScript compiler config in `tsconfig.json`, and that
a typings file is required for ES6 promises.

The base url of the notebook server is to the HTML template as part of a JSON
script tag.  The script starts a python notebook session and interacts
with it, printing messages to the browser console.

The example requires version 4.1+ of the Jupyter Notebook.

Note that this example requires its dependencies from the root directory of the
repo.

The example can be installed as `npm install` and run as `python main.py`.
