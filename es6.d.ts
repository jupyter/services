/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved. 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0  
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, 
MERCHANTABLITY OR NON-INFRINGEMENT. 
 
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

// Selected parts from and additions to the TypeScript lib.core.es6.d.ts definition file
// https://github.com/Microsoft/TypeScript/blob/81711f9388d1823761616bce83776846a3fea773/bin/lib.core.es6.d.ts

interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value?: V): Map<K, V>;
    size: number;
}

interface MapConstructor {
    new <K, V>(): Map<K, V>;
    prototype: Map<any, any>;
}

declare var Map: MapConstructor;

// Typescript has a bug in the DataView type: https://github.com/Microsoft/TypeScript/issues/3896
// so we correct it
interface DataView {
    getUint32(byteOffset: number, littleEndian?: boolean): number;
    setUint32(byteOffset: number, value: number, littleEndian?: boolean): void;
}
