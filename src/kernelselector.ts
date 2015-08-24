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
   * Request kernelspecs and return a list of kernel names.
   */
  load(): Promise<string[]> {
    var settings = {
      method: "GET",
      dataType: "json"
    }
    return utils.ajaxRequest(this._url, settings).then(
      (success: utils.IAjaxSuccess) => {
          var err = new Error('Invalid KernelSpec info');
          if (success.xhr.status !== 200) {
            throw err;
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
          var names: string[] = [];
          for (var i = 0; i < data.kernelspecslength; i++) {
            var ks = data.kernelspecs[i]
            validateKernelSpec(ks);
            this._kernelspecs.set(ks.name, ks);
            names.push(ks.name);
          }
          return names;
      });
  }

  /**
   * Select a kernel.
   */
  select(kernel: string | IKernelSpecId): IKernelSpecId {
    if (typeof kernel === 'string') {
      kernel = <IKernelSpecId>{name: kernel};
    }
    var selected = <IKernelSpecId>kernel;
    return this._kernelspecs.get(selected.name);
  }

  /**
   * Find kernel names by language.
   */
  findByLanguage(language: string): string[] {
    var kernelspecs = this._kernelspecs;
    var available = _sortedNames(kernelspecs);
    var matches: string[] = [];
    if (language && language.length > 0) {
      available.map((name: string) => {
        if (kernelspecs.get(name).spec.language.toLowerCase() === language.toLowerCase()) {
            matches.push(name);
        }
      });
    }
    return matches;
  }

  private _kernelspecs: Map<string, IKernelSpecId>;
  private _url = "unknown";
}


/**
 * Sort kernel names.
 */
function _sortedNames(kernelspecs: Map<string, IKernelSpecId>): string[] {
  return Object.keys(kernelspecs).sort((a, b) => {
    // sort by display_name
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
  var err = new Error("Invalid IKernelSpecId");
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
