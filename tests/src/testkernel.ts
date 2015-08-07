/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

module tests {

import Kernel = jupyter.services.Kernel;


describe('jupyter.services', () => {

  describe('Kernel', () => {

    describe('#construct()', () => {

      it('should return true on success', () => {
        var kernel = new Kernel('baseUrl', 'wsUrl');
        expect(kernel.name).to.be("unknown");
      });

    });
   });
});

}  // module tests
