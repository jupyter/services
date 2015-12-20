// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

/**
 * Default base URL.
 */
 export
const DEFAULT_BASE_URL = (typeof location === 'undefined' ?
                          'http://localhost:8888/': location.origin + '/');

/**
 * Copy the contents of one object to another, recursively.
 *
 * From [stackoverflow](http://stackoverflow.com/a/12317051).
 */
export
function extend(target: any, source: any): any {
  target = target || {};
  for (var prop in source) {
    if (typeof source[prop] === 'object') {
      target[prop] = extend(target[prop], source[prop]);
    } else {
      target[prop] = source[prop];
    }
  }
  return target;
}


/**
 * Get a copy of an object, or null.
 */
export
function copy(object: any): any {
  if (object !== null && typeof object === 'object') {
    return JSON.parse(JSON.stringify(object));
  }
  return null;
}


/**
 * Get a random 128b hex string (not a formal UUID)
 */
export
function uuid(): string {
  var s: string[] = [];
  var hexDigits = "0123456789abcdef";
  var nChars = hexDigits.length;
  for (var i = 0; i < 32; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * nChars));
  }
  return s.join("");
}


/**
 * Join a sequence of url components with `'/'`.
 */
export
function urlPathJoin(...paths: string[]): string {
  var url = '';
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (path === '') {
      continue;
    }
    if (i > 0) {
      path = path.replace(/\/\/+/, '/');
    }
    if (url.length > 0 && url.charAt(url.length - 1) != '/') {
      url = url + '/' + paths[i];
    } else {
      url = url + paths[i];
    }
  }
  return url
}


/**
 * Encode just the components of a multi-segment uri.
 *
 * Preserves the `'/'` separators.
 */
export
function encodeURIComponents(uri: string): string {
  return uri.split('/').map(encodeURIComponent).join('/');
}


/**
 * Encode and join a sequence of url components with `'/'`.
 */
export
function urlJoinEncode(...args: string[]): string {
  return encodeURIComponents(urlPathJoin.apply(null, args));
}


/**
 * Return a serialized object string suitable for a query.
 *
 * From [stackoverflow](http://stackoverflow.com/a/30707423).
 */
export
function jsonToQueryString(json: any): string {
  return '?' + Object.keys(json).map(key =>
    encodeURIComponent(key) + '=' + encodeURIComponent(json[key])
  ).join('&');
}


/**
 * Input settings for an AJAX request.
 */
export
interface IAjaxSettings {
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
  data: any;
  statusText: string;
  xhr: XMLHttpRequest;
}


/**
 * Error handler for AJAX request.
 */
export
interface IAjaxError {
  xhr: XMLHttpRequest;
  statusText: string;
  error: ErrorEvent;
}


/**
 * Asynchronous XMLHTTPRequest handler.
 *
 * Based on this [example](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest).
 */
export
function ajaxRequest(url: string, settings: IAjaxSettings): Promise<IAjaxSuccess> {
  let method = settings.method || 'GET';
  let user = settings.user || '';
  let password = settings.password || '';
  if (!!settings.cache) {
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache.
    url += ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
  }

  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open(method, url, true, user, password);

    if (settings.contentType !== void 0) {
      req.setRequestHeader('Content-Type', settings.contentType);
    }
    if (settings.timeout !== void 0) req.timeout = settings.timeout;
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
    }

    if (settings.data) {
      req.send(settings.data);
    } else {
      req.send();
    }
  });
}


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
