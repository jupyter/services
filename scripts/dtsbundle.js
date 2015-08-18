/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
require('dts-generator').generate({
  name: 'jupyter-js-services',
  main: 'jupyter-js-services/index',
  baseDir: 'lib',
  files: ['index.d.ts'],
  out: 'lib/jupyter-js-services.d.ts'
});
