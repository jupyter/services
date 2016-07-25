// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as minimist
  from 'minimist';

import * as url
  from 'url';

import * as urljoin
  from 'url-join';

import {
  JSONObject
} from './json';


/**
 * Copy the contents of one object to another, recursively.
 *
 * From [stackoverflow](http://stackoverflow.com/a/12317051).
 */
export
function extend(target: any, source: any): any {
  target = target || {};
  for (let prop in source) {
    if (typeof source[prop] === 'object') {
      target[prop] = extend(target[prop], source[prop]);
    } else {
      target[prop] = source[prop];
    }
  }
  return target;
}


/**
 * Get a deep copy of a JSON object.
 */
export
function copy(object: JSONObject): JSONObject {
  return JSON.parse(JSON.stringify(object));
}


/**
 * Get a random 32 character hex string (not a formal UUID)
 */
export
function uuid(): string {
  let s: string[] = [];
  let hexDigits = '0123456789abcdef';
  let nChars = hexDigits.length;
  for (let i = 0; i < 32; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * nChars));
  }
  return s.join('');
}


/**
 * Resolve a url.
 *
 * Take a base URL, and a href URL, and resolve them as a browser would for
 * an anchor tag.
 */
export
function urlResolve(from: string, to: string): string {
  return url.resolve(from, to);
}


/**
 * Join a sequence of url components and resolve them from a base URL.
 *
 * #### Notes
 * Joins urls and normalizes as in node `path.join` to form the href URL.
 * Then takes the base URL, and the href URL, and resolves them as a browser
 * would for an anchor tag.
 */
export
function urlPathJoin(...parts: string[]): string {
  return urljoin(...parts);
}


/**
 * Encode the components of a multi-segment url.
 *
 * #### Notes
 * Preserves the `'/'` separators.
 * Should not include the base url, since all parts are escaped.
 */
export
function urlEncodeParts(uri: string): string {
  // Normalize and join, split, encode, then join.
  uri = urljoin(uri);
  let parts = uri.split('/').map(encodeURIComponent);
  return urljoin(...parts);
}


/**
 * Return a serialized object string suitable for a query.
 *
 * From [stackoverflow](http://stackoverflow.com/a/30707423).
 */
export
function jsonToQueryString(json: JSONObject): string {
  return '?' + Object.keys(json).map(key =>
    encodeURIComponent(key) + '=' + encodeURIComponent(String(json[key]))
  ).join('&');
}


/**
 * Input settings for an AJAX request.
 */
export
interface IAjaxSettings extends JSONObject {
  /**
   * The HTTP method to use.  Defaults to `'GET'`.
   */
  method?: string;

  /**
   * The return data type (used to parse the return data).
   */
  dataType?: string;

  /**
   * The outgoing content type, used to set the `Content-Type` header.
   */
  contentType?: string;

  /**
   * The request data.
   */
  data?: any;

  /**
   * Whether to cache the response. Defaults to `true`.
   */
  cache?: boolean;

  /**
   * The number of milliseconds a request can take before automatically
   * being terminated.  A value of 0 (which is the default) means there is
   * no timeout.
   */
  timeout?: number;

  /**
   * A mapping of request headers, used via `setRequestHeader`.
   */
  requestHeaders?: { [key: string]: string; };

  /**
   * Is a Boolean that indicates whether or not cross-site Access-Control
   * requests should be made using credentials such as cookies or
   * authorization headers.  Defaults to `false`.
   */
  withCredentials?: boolean;

  /**
   * The user name associated with the request.  Defaults to `''`.
   */
  user?: string;

  /**
   * The password associated with the request.  Defaults to `''`.
   */
  password?: string;
}


/**
 * Success handler for AJAX request.
 */
export
interface IAjaxSuccess {
  /**
   * The data returned by the ajax call.
   */
  data: any;

  /**
   * The status text of the response.
   */
  statusText: string;

  /**
   * The XHR object.
   */
  xhr: XMLHttpRequest;
}


/**
 * Error handler for AJAX request.
 */
export
interface IAjaxError {
  /**
   * The XHR object.
   */
  xhr: XMLHttpRequest;

  /**
   * The status text of the response.
   */
  statusText: string;

  /**
   * The response error object.
   */
  error: ErrorEvent;
}


/**
 * Asynchronous XMLHTTPRequest handler.
 *
 * @param url - The url to request.
 *
 * @param settings - The settings to apply to the request and response.
 *
 * #### Notes
 * Based on this [example](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest).
 */
export
function ajaxRequest(url: string, settings: IAjaxSettings): Promise<IAjaxSuccess> {
  let method = settings.method || 'GET';
  let user = settings.user || '';
  let password = settings.password || '';
  if (!settings.cache) {
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache.
    url += ((/\?/).test(url) ? '&' : '?') + (new Date()).getTime();
  }

  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open(method, url, true, user, password);

    if (settings.contentType !== void 0) {
      req.setRequestHeader('Content-Type', settings.contentType);
    }
    if (settings.timeout !== void 0) {
      req.timeout = settings.timeout;
    }
    if (!!settings.withCredentials) {
      req.withCredentials = true;
    }
    if (settings.requestHeaders !== void 0) {
       for (let prop in settings.requestHeaders) {
         req.setRequestHeader(prop, (settings as any).requestHeaders[prop]);
       }
    }

    req.onload = () => {
      if (req.status >= 400) {
        let error = new Error(req.statusText);
        reject({ xhr: req, statusText: req.statusText, error: error });
        return;
      }
      let response = req.responseText;
      if (settings.dataType === 'json' && response) {
        response = JSON.parse(response);
      }
      resolve({ data: response, statusText: req.statusText, xhr: req });
    };

    req.onerror = (err: ErrorEvent) => {
      reject({ xhr: req, statusText: req.statusText, error: err });
    };

    req.ontimeout = () => {
      reject({ xhr: req, statusText: req.statusText,
               error: new Error('Operation Timed Out') });
    };

    if (settings.data) {
      req.send(settings.data);
    } else {
      req.send();
    }
  });
}


/**
 * Try to load an object from a module or a registry.
 *
 * Try to load an object from a module asynchronously if a module
 * is specified, otherwise tries to load an object from the global
 * registry, if the global registry is provided.
 */
export
function loadObject(name: string, moduleName: string, registry?: { [key: string]: any }): Promise<any> {
  return new Promise((resolve, reject) => {
    // Try loading the view module using require.js
    if (moduleName) {
      if (typeof requirejs === 'undefined') {
        throw new Error('requirejs not found');
      }
      requirejs([moduleName], (mod: any) => {
        if (mod[name] === void 0) {
          let msg = `Object '${name}' not found in module '${moduleName}'`;
          reject(new Error(msg));
        } else {
          resolve(mod[name]);
        }
      }, reject);
    } else {
      if (registry && registry[name]) {
        resolve(registry[name]);
      } else {
        reject(new Error(`Object '${name}' not found in registry`));
      }
    }
  });
};


/**
 * A Promise that can be resolved or rejected by another object.
 */
export
class PromiseDelegate<T> {

  /**
   * Construct a new Promise delegate.
   */
  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * Get the underlying Promise.
   */
  get promise(): Promise<T> {
    return this._promise;
  }

  /**
   * Resolve the underlying Promise with an optional value or another Promise.
   */
  resolve(value?: T | Thenable<T>): void {
    // Note: according to the Promise spec, and the `this` context for resolve
    // and reject are ignored
    this._resolve(value);
  }

  /**
   * Reject the underlying Promise with an optional reason.
   */
  reject(reason?: any): void {
    // Note: according to the Promise spec, the `this` context for resolve
    // and reject are ignored
    this._reject(reason);
  }

  private _promise: Promise<T>;
  private _resolve: (value?: T | Thenable<T>) => void;
  private _reject: (reason?: any) => void;
}



/**
 * Global config data for the Jupyter application.
 */
let configData: any = null;


/**
 * Declare a stub for the node process variable.
 */
declare var process: any;


/**
 *  Make an object fully immutable by freezing each object in it.
 */
function deepFreeze(obj: any): any {

  // Freeze properties before freezing self
  Object.getOwnPropertyNames(obj).forEach(function(name) {
    let prop = obj[name];

    // Freeze prop if it is an object
    if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  });

  // Freeze self
  return Object.freeze(obj);
}


/**
 * Get global configuration data for the Jupyter application.
 *
 * @param name - The name of the configuration option.
 *
 * @returns The config value or `undefined` if not found.
 *
 * #### Notes
 * For browser based applications, it is assumed that the page HTML
 * includes a script tag with the id `jupyter-config-data` containing the
 * configuration as valid JSON.
 */
export
function getConfigOption(name: string): string;

export
function getConfigOption(name: string): any {
  if (configData) {
    return configData[name];
  }
  if (typeof document === 'undefined') {
    configData = minimist(process.argv.slice(2));
  } else {
    let el = document.getElementById('jupyter-config-data');
    if (el) {
      configData = JSON.parse(el.textContent);
    } else {
      configData = {};
    }
  }
  configData = deepFreeze(configData);
  return configData[name];
}


/**
 * Get the base URL for a Jupyter application.
 */
export
function getBaseUrl(): string {
  let baseUrl = getConfigOption('baseUrl');
  if (!baseUrl || baseUrl === '/') {
    baseUrl = (typeof location === 'undefined' ?
               'http://localhost:8888/' : location.origin + '/');
  }
  return baseUrl;
}


/**
 * Get the base websocket URL for a Jupyter application.
 */
export
function getWsUrl(baseUrl?: string): string {
  let wsUrl = getConfigOption('wsUrl');
  if (!wsUrl) {
    baseUrl = baseUrl || getBaseUrl();
    if (baseUrl.indexOf('http') !== 0) {
      if (typeof location !== 'undefined') {
        baseUrl = urlPathJoin(location.origin, baseUrl);
      } else {
        baseUrl = urlPathJoin('http://localhost:8888/', baseUrl);
      }
    }
    wsUrl = 'ws' + baseUrl.slice(4);
  }
  return wsUrl;
}
