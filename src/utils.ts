// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


/**
 * Copy the contents of one object to another, recursively.
 *
 * http://stackoverflow.com/questions/12317003/something-like-jquery-extend-but-standalone
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
 * Get a uuid as a string.
 *
 * http://www.ietf.org/rfc/rfc4122.txt
 */
export
function uuid(): string {
  var s: string[] = [];
  var hexDigits = "0123456789ABCDEF";
  for (var i = 0; i < 32; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
  }
  s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[16] = hexDigits.charAt((Number(s[16]) & 0x3) | 0x8);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  return s.join("");
}


/**
 * Join a sequence of url components with '/'.
 */
export
function urlPathJoin(...paths: string[]): string {
  var url = '';
  for (var i = 0; i < paths.length; i++) {
    if (paths[i] === '') {
      continue;
    }
    if (url.length > 0 && url.charAt(url.length - 1) != '/') {
      url = url + '/' + paths[i];
    } else {
      url = url + paths[i];
    }
  }
  return url.replace(/\/\/+/, '/');
}


/**
 * Encode just the components of a multi-segment uri,
 * leaving '/' separators.
 */
export
function encodeURIComponents(uri: string): string {
  return uri.split('/').map(encodeURIComponent).join('/');
}


/**
 * Join a sequence of url components with '/',
 * encoding each component with encodeURIComponent.
 */
export
function urlJoinEncode(...args: string[]): string {
  return encodeURIComponents(urlPathJoin.apply(null, args));
}


/**
 * Properly detect the current browser.
 * http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
 */
export
var browser: string[] = (() => {
  if (typeof navigator === 'undefined') {
    // navigator undefined in node
    return ['None'];
  }
  var N: string = navigator.appName;
  var ua: string = navigator.userAgent
  var tem: RegExpMatchArray;
  var M: RegExpMatchArray = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1];
  M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
  return M;
})();


/** 
 * Return a serialized object string suitable for a query.
 *
 * http://stackoverflow.com/a/30707423
 */
export
function jsonToQueryString(json: any): string {
  return '?' +
    Object.keys(json).map((key: string): any => {
      return encodeURIComponent(key) + '=' +
        encodeURIComponent(json[key]);
    }).join('&');
}


/**
 * Input settings for an AJAX request.
 */
export
interface IAjaxSetttings {
  method: string;
  dataType: string;
  contentType?: string;
  data?: any;
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
 * http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
 */
export
function ajaxRequest(url: string, settings: IAjaxSetttings): Promise<any> {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.open(settings.method, url);
    if (settings.contentType) {
      req.overrideMimeType(settings.contentType);
    }
    req.onload = () => {
      var response = req.response;
      if (settings.dataType === 'json') {
        response = JSON.parse(req.response);
      }
      resolve({data: response, statusText: req.statusText, xhr: req});
    }
    req.onerror = (err: ErrorEvent) => {
      reject({xhr: req, statusText: req.statusText, error: err});
    }
    if (settings.data) {
      req.send(settings.data);
    } else {
      req.send();
    }
  });
}
