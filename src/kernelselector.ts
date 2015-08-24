// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import utils = require('./utils');


/**
 * The url for the kernelspec service.
 */
var SESSION_KERNELSPEC_URL = 'api/kernelspecs';


/**
 * KernelSpec help link interface.
 */
export 
interface IKernelSpecHelpLink {
  text: string;
  url: string;
}


/**
 * KernelSpecId interface.
 */
export
interface IKernelSpec {
  language: string;
  argv: string[];
  display_name: string;
  codemirror_mode: string;
  env: any;
  help_links: IKernelSpecHelpLink[];
}


/**
 * KernelSpecId interface.
 */
export
interface IKernelSpecId {
  name: string;
  spec: IKernelSpec;
  resources: { [key: string]: string; };
}


/**
 * Handler for available kernelspecs.
 */
export
class KernelSelector {
  
  /**
   * Create a kernel selector.
   */
  constructor(baseUrl: string) {
    this._kernelspecs = new Map<string, IKernelSpecId>();
    this._url = utils.urlJoinEncode(baseUrl, 
                                    SESSION_KERNELSPEC_URL);
  }

  /**
   * Get the list of kernelspec names.
   */
  get names(): string[] {
    return this._names;
  }

  /**
   * Request kernelspecs and return a list of kernel names.
   */
  load(): Promise<string[]> {
    var settings = {
      method: "GET",
      dataType: "json"
    }
    return utils.ajaxRequest(this._url, settings).then(
      (success: utils.IAjaxSuccess) => {
          var err = new Error('Invalid KernelSpecs info');
          if (success.xhr.status !== 200) {
            throw new Error('Invalid Response: ' + success.xhr.status);
          }
          var data = success.data;
          if (!data.hasOwnProperty('default') || 
              typeof data.default !== 'string') {
            throw err;
          }
          if (!data.hasOwnProperty('kernelspecs') ||
              !Array.isArray(data.kernelspecs)) {
            throw err;
          }
          for (var i = 0; i < data.kernelspecs.length; i++) {
            var ks = data.kernelspecs[i]
            validateKernelSpec(ks);
            this._kernelspecs.set(ks.name, ks);
          }
          this._names = _sortedNames(this._kernelspecs);
          return this._names;
      });
  }

  /**
   * Select a kernel by name.
   */
  select(name: string): IKernelSpecId {
    return this._kernelspecs.get(name);
  }

  /**
   * Find kernel names by language.
   */
  findByLanguage(language: string): string[] {
    var kernelspecs = this._kernelspecs;
    var matches: string[] = [];
    if (language && language.length > 0) {
      for (var i = 0; i < this._names.length; i++ ) {
        var name = this._names[i];
        if (kernelspecs.get(name).spec.language.toLowerCase() === language.toLowerCase()) {
            matches.push(name);
        }
      }
    }
    return matches;
  }

  private _kernelspecs: Map<string, IKernelSpecId>;
  private _names: string[] = [];
  private _url = "unknown";
}


/**
 * Sort kernel names by display name.
 */
function _sortedNames(kernelspecs: Map<string, IKernelSpecId>): string[] {
  var names: string[] = [];
  kernelspecs.forEach( (spec: IKernelSpecId) => {
    names.push(spec.name);
  });
  return names.sort((a, b) => {
    var da = kernelspecs.get(a).spec.display_name;
    var db = kernelspecs.get(b).spec.display_name;
    if (da === db) {
      return 0;
    } else if (da > db) {
      return 1;
    } else {
      return -1;
    }
  });
}


/**
 * Validate an object as being of IKernelSpecID type.
 */
function validateKernelSpec(info: IKernelSpecId): void {
  var err = new Error("Invalid KernelSpec Model");
  if (!info.hasOwnProperty('name') || typeof info.name !== 'string') {
    throw err;
  }
  if (!info.hasOwnProperty('spec') || !info.hasOwnProperty('resources')) {
    throw err;
  }
  var spec = info.spec;
  if (!spec.hasOwnProperty('language') || typeof spec.language !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('display_name') ||
      typeof spec.display_name !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('argv') || !Array.isArray(spec.argv)) {
    throw err;
  }
  if (!spec.hasOwnProperty('codemirror_mode') ||
      typeof spec.codemirror_mode !== 'string') {
    throw err;
  }
  if (!spec.hasOwnProperty('env') || !spec.hasOwnProperty('help_links')) {
    throw err;
  }
}
