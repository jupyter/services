// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

define(() => {
  var myModule = {
    test: () => { console.log('Yay!'); },
    test2: () => { throw Error('Nope'); }
  }
  return myModule;
});
