// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as utils from './utils';


// Mock implementation of XMLHttpRequest following
// https://developer.mozilla.org/en-US/docs/Web/API/xmlhttprequest


/**
 * Mock XMLHttpRequest object.
 * Handles a global list of request, and adds the ability to respond()
 * to them.
 */
export
class MockXMLHttpRequest {

  static UNSENT = 0;            // open() has not been called yet.
  static OPENED = 1;            // send() has been called.
  static HEADERS_RECEIVED = 2;  // send() has been called, and headers and status are available.
  static LOADING = 3;           // Downloading; responseText holds partial data.
  static DONE = 4;              // The operation is complete.

  /**
   * Global list of XHRs.
   */
  static requests: MockXMLHttpRequest[] = [];

  /**
   * Register a callback for the next request.
   *
   * It is automatically cleared after the request.
   */
  static onRequest: (request: MockXMLHttpRequest) => void = null;

  /**
   * Ready state of the request.
   */
  get readyState(): number {
    return this._readyState;
  }

  /**
   * Response data for the request.
   */
  get response(): any {
    return this._response;
  }

  /**
   * Response data for the request as string.
   */
  get responseText(): string {
    return '' + this._response;
  }

  /**
   * Enumerated value that represents the response type.
   */
  get responseType(): string {
    return this._responseType;
  }

  /**
   * Status code of the response of the request.
   */
  get status(): number {
    return this._status;
  }

  /**
   * The status string returned by the server.
   */
  get statusText() {
    return this._statusText;
  }

  /**
   * Get the number of milliseconds to wait before a request is
   * automatically canceled.
   */
  get timeout(): number {
    return this._timeout;
  }

  /**
   * Set the number of milliseconds to wait before a request is
   * automatically canceled.
   */
  set timeout(timeout: number) {
    this._timeout = timeout;
  }

  /**
   * Set a callback for with the request is loaded.
   */
  set onload(cb: () => void) {
    this._onLoad = cb;
  }

  /**
   * Set a callback for when the request has an error.
   */
  set onerror(cb: (evt?: any) => void) {
    this._onError = cb;
  }

  /**
   * Set a callback for when the request is in progress.
   */
  set onprogress(cb: () => void) {
    throw Error('Not implemented');
    this._onProgress = cb;
  }

  /**
   * Set a callback for when the ready state changes.
   */
  set onreadystatechange(cb: () => void) {
    this._onReadyState = cb;
  }

  /**
   * Set a callback for when the ready state changes.
   */
  set ontimeout(cb: () => void) {
    this._onTimeout = cb;
  }

  /**
   * Get the method of the request.
   */
  get method(): string {
    return this._method;
  }

  /**
   * Get the url of the request.
   */
  get url(): string {
    return this._url;
  }

  /**
   * Initialize a request.
   */
  open(method: string, url: string, async?: boolean, user?: string, password?:string): void {
    this._method = method;
    this._url = url;
    if (async !== void 0) {
      this._async = async;
    }
    if (user !== void 0) {
      this._user = user;
    }
    if (password !== void 0) {
      this._password = password;
    }
    this._readyState = MockXMLHttpRequest.OPENED;
    utils.doLater(() => {
      var onReadyState = this._onReadyState;
      if (onReadyState) onReadyState();
    });
  }

  /**
   * Override the MIME type returned by the server.
   */
  overrideMimeType(mime: string): void {
    this._mimetype = mime;
  }

  /**
   * Sends the request.
   */
  send(data?: any) {
    if (data !== void 0) {
      this._data = data;
    }
    MockXMLHttpRequest.requests.push(this);
    requestAnimationFrame(() => {
      if (MockXMLHttpRequest.requests.indexOf(this) === -1) {
        console.error('Unhandled request:', JSON.stringify(this));
        throw Error(`Unhandled request: ${JSON.stringify(this)}`)
      }
      var onRequest = MockXMLHttpRequest.onRequest;
      if (onRequest) onRequest(this);
      if (this._timeout > 0) {
        setTimeout(() => {
          if (this._readyState != MockXMLHttpRequest.DONE) {
            var cb = this._onTimeout;
            if (cb) cb();
          }
        }, this._timeout);
      }
    });
  }

  /**
   * Set the value of an HTTP request header.
   */
  setRequestHeader(header: string, value: string) {
    this._requestHeader[header] = value;
  }

  /**
   * Returns the string containing the text of the specified header,
   * or null if either the response has not yet been received
   * or the header doesn't exist in the response.
   */
  getResponseHeader(header: string): string{
    if (this._responseHeader.hasOwnProperty(header)) {
      return this._responseHeader[header];
    }
  }

  /**
   * Respond to a Mock XHR.
   */
  respond(statusCode: number, response: any, header?: any) {
    if (header === void 0) {
      header = {'Content-Type': 'text/json'};
    }
    if (typeof response !== 'string') {
      response = JSON.stringify(response);
    }
    this._status = statusCode;
    this._response = response;
    this._responseHeader = header;
    this._readyState = MockXMLHttpRequest.DONE;
    utils.doLater(() => {
      if (statusCode >= 400) {
        var onError = this._onError;
        if (onError) onError({ message: 'Invalid status code' });
      } else {
        var onReadyState = this._onReadyState;
        if (onReadyState) onReadyState();
        var onLoad = this._onLoad;
        if (onLoad) onLoad();
      }
    });
  }

  private _readyState = MockXMLHttpRequest.UNSENT;
  private _response: any = '';
  private _responseType = '';
  private _status = -1;
  private _statusText = '';
  private _timeout = -1;
  private _mimetype = '';
  private _data: any;
  private _method = '';
  private _url = '';
  private _async = true;
  private _user = '';
  private _password = '';
  private _onLoad: () => void = null;
  private _onError: (evt?: any) => void = null;
  private _onProgress: () => void = null;
  private _requestHeader: any = {};
  private _responseHeader: any = {};
  private _onReadyState: () => void = null;
  private _onTimeout: () => void = null;
}
