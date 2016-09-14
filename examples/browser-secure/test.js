(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("jupyter-js-services", [], factory);
	else if(typeof exports === 'object')
		exports["jupyter-js-services"] = factory();
	else
		root["jupyter-js-services"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "https://npmcdn.com/jupyter-js-services@0.16.3/dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(1));
	__export(__webpack_require__(13));
	__export(__webpack_require__(19));
	__export(__webpack_require__(20));
	__export(__webpack_require__(27));
	__export(__webpack_require__(28));
	__export(__webpack_require__(29));
	var utils = __webpack_require__(2);
	exports.utils = utils;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	"use strict";
	var utils = __webpack_require__(2);
	/**
	 * The url for the config service.
	 */
	var SERVICE_CONFIG_URL = 'api/config';
	/**
	 * Create a config section.
	 *
	 * @returns A Promise that is fulfilled with the config section is loaded.
	 */
	function getConfigSection(options) {
	    var section = new ConfigSection(options);
	    return section.load().then(function () {
	        return section;
	    });
	}
	exports.getConfigSection = getConfigSection;
	/**
	 * Implementation of the Configurable data section.
	 */
	var ConfigSection = (function () {
	    /**
	     * Construct a new config section.
	     */
	    function ConfigSection(options) {
	        this._url = 'unknown';
	        this._data = null;
	        this._ajaxSettings = null;
	        var baseUrl = options.baseUrl || utils.getBaseUrl();
	        this.ajaxSettings = options.ajaxSettings || {};
	        this._url = utils.urlPathJoin(baseUrl, SERVICE_CONFIG_URL, encodeURIComponent(options.name));
	    }
	    Object.defineProperty(ConfigSection.prototype, "ajaxSettings", {
	        /**
	         * Get a copy of the default ajax settings for the section.
	         */
	        get: function () {
	            return utils.copy(this._ajaxSettings);
	        },
	        /**
	         * Set the default ajax settings for the section.
	         */
	        set: function (value) {
	            this._ajaxSettings = utils.copy(value);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ConfigSection.prototype, "data", {
	        /**
	         * Get the data for this section.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._data;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Load the initial data for this section.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     */
	    ConfigSection.prototype.load = function () {
	        var _this = this;
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(this._url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            _this._data = success.data;
	        });
	    };
	    /**
	     * Modify the stored config values.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     *
	     * Updates the local data immediately, sends the change to the server,
	     * and updates the local data with the response, and fulfils the promise
	     * with that data.
	     */
	    ConfigSection.prototype.update = function (newdata) {
	        var _this = this;
	        this._data = utils.extend(this._data, newdata);
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'PATCH';
	        ajaxSettings.data = JSON.stringify(newdata);
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.contentType = 'application/json';
	        return utils.ajaxRequest(this._url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            _this._data = success.data;
	            return _this._data;
	        });
	    };
	    return ConfigSection;
	}());
	/**
	 * Configurable object with defaults.
	 */
	var ConfigWithDefaults = (function () {
	    /**
	     * Create a new config with defaults.
	     */
	    function ConfigWithDefaults(options) {
	        this._section = null;
	        this._defaults = null;
	        this._className = '';
	        this._section = options.section;
	        this._defaults = options.defaults || {};
	        this._className = options.className || '';
	    }
	    /**
	     * Get data from the config section or fall back to defaults.
	     */
	    ConfigWithDefaults.prototype.get = function (key) {
	        return this._classData()[key] || this._defaults[key];
	    };
	    /**
	     * Set a config value.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     *
	     * Sends the update to the server, and changes our local copy of the data
	     * immediately.
	     */
	    ConfigWithDefaults.prototype.set = function (key, value) {
	        var d = {};
	        d[key] = value;
	        if (this._className) {
	            var d2 = {};
	            d2[this._className] = d;
	            return this._section.update(d2);
	        }
	        else {
	            return this._section.update(d);
	        }
	    };
	    /**
	     * Get data from the Section with our classname, if available.
	     *
	     * #### Notes
	     * If we have no classname, get all of the data in the Section
	     */
	    ConfigWithDefaults.prototype._classData = function () {
	        if (this._className) {
	            return this._section.data[this._className] || {};
	        }
	        else {
	            return this._section.data;
	        }
	    };
	    return ConfigWithDefaults;
	}());
	exports.ConfigWithDefaults = ConfigWithDefaults;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	var minimist = __webpack_require__(4);
	var url = __webpack_require__(5);
	var urljoin = __webpack_require__(12);
	/**
	 * Copy the contents of one object to another, recursively.
	 *
	 * From [stackoverflow](http://stackoverflow.com/a/12317051).
	 */
	function extend(target, source) {
	    target = target || {};
	    for (var prop in source) {
	        if (typeof source[prop] === 'object') {
	            target[prop] = extend(target[prop], source[prop]);
	        }
	        else {
	            target[prop] = source[prop];
	        }
	    }
	    return target;
	}
	exports.extend = extend;
	/**
	 * Get a deep copy of a JSON object.
	 */
	function copy(object) {
	    return JSON.parse(JSON.stringify(object));
	}
	exports.copy = copy;
	/**
	 * Get a random 32 character hex string (not a formal UUID)
	 */
	function uuid() {
	    var s = [];
	    var hexDigits = '0123456789abcdef';
	    var nChars = hexDigits.length;
	    for (var i = 0; i < 32; i++) {
	        s[i] = hexDigits.charAt(Math.floor(Math.random() * nChars));
	    }
	    return s.join('');
	}
	exports.uuid = uuid;
	/**
	 * Resolve a url.
	 *
	 * Take a base URL, and a href URL, and resolve them as a browser would for
	 * an anchor tag.
	 */
	function urlResolve(from, to) {
	    return url.resolve(from, to);
	}
	exports.urlResolve = urlResolve;
	/**
	 * Join a sequence of url components and normalizes as in node `path.join`.
	 */
	function urlPathJoin() {
	    var parts = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        parts[_i - 0] = arguments[_i];
	    }
	    return urljoin.apply(void 0, parts);
	}
	exports.urlPathJoin = urlPathJoin;
	/**
	 * Encode the components of a multi-segment url.
	 *
	 * #### Notes
	 * Preserves the `'/'` separators.
	 * Should not include the base url, since all parts are escaped.
	 */
	function urlEncodeParts(uri) {
	    // Normalize and join, split, encode, then join.
	    uri = urljoin(uri);
	    var parts = uri.split('/').map(encodeURIComponent);
	    return urljoin.apply(void 0, parts);
	}
	exports.urlEncodeParts = urlEncodeParts;
	/**
	 * Return a serialized object string suitable for a query.
	 *
	 * From [stackoverflow](http://stackoverflow.com/a/30707423).
	 */
	function jsonToQueryString(json) {
	    return '?' + Object.keys(json).map(function (key) {
	        return encodeURIComponent(key) + '=' + encodeURIComponent(String(json[key]));
	    }).join('&');
	}
	exports.jsonToQueryString = jsonToQueryString;
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
	function ajaxRequest(url, ajaxSettings) {
	    var method = ajaxSettings.method || 'GET';
	    var user = ajaxSettings.user || '';
	    var password = ajaxSettings.password || '';
	    if (!ajaxSettings.cache) {
	        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache.
	        url += ((/\?/).test(url) ? '&' : '?') + (new Date()).getTime();
	    }
	    return new Promise(function (resolve, reject) {
	        var xhr = new XMLHttpRequest();
	        xhr.open(method, url, true, user, password);
	        if (ajaxSettings.contentType !== void 0) {
	            xhr.setRequestHeader('Content-Type', ajaxSettings.contentType);
	        }
	        if (ajaxSettings.timeout !== void 0) {
	            xhr.timeout = ajaxSettings.timeout;
	        }
	        if (!!ajaxSettings.withCredentials) {
	            xhr.withCredentials = true;
	        }
	        if (ajaxSettings.requestHeaders !== void 0) {
	            for (var prop in ajaxSettings.requestHeaders) {
	                xhr.setRequestHeader(prop, ajaxSettings.requestHeaders[prop]);
	            }
	        }
	        xhr.onload = function (event) {
	            if (xhr.status >= 300) {
	                reject({ event: event, xhr: xhr, ajaxSettings: ajaxSettings, throwError: xhr.statusText });
	            }
	            var data = xhr.responseText;
	            if (ajaxSettings.dataType === 'json' && data) {
	                try {
	                    data = JSON.parse(data);
	                }
	                catch (err) {
	                    // no-op
	                }
	            }
	            resolve({ xhr: xhr, ajaxSettings: ajaxSettings, data: data, event: event });
	        };
	        xhr.onabort = function (event) {
	            reject({ xhr: xhr, event: event, ajaxSettings: ajaxSettings });
	        };
	        xhr.onerror = function (event) {
	            reject({ xhr: xhr, event: event, ajaxSettings: ajaxSettings });
	        };
	        xhr.ontimeout = function (ev) {
	            reject({ xhr: xhr, event: event, ajaxSettings: ajaxSettings });
	        };
	        if (ajaxSettings.data) {
	            xhr.send(ajaxSettings.data);
	        }
	        else {
	            xhr.send();
	        }
	    });
	}
	exports.ajaxRequest = ajaxRequest;
	/**
	 * Create an ajax error from an ajax success.
	 *
	 * @param success - The original success object.
	 *
	 * @param throwError - The optional new error name.  If not given
	 *  we use "Invalid Status: <xhr.status>"
	 */
	function makeAjaxError(success, throwError) {
	    var xhr = success.xhr;
	    var ajaxSettings = success.ajaxSettings;
	    var event = success.event;
	    throwError = throwError || "Invalid Status: " + xhr.status;
	    return Promise.reject({ xhr: xhr, ajaxSettings: ajaxSettings, event: event, throwError: throwError });
	}
	exports.makeAjaxError = makeAjaxError;
	/**
	 * Try to load an object from a module or a registry.
	 *
	 * Try to load an object from a module asynchronously if a module
	 * is specified, otherwise tries to load an object from the global
	 * registry, if the global registry is provided.
	 */
	function loadObject(name, moduleName, registry) {
	    return new Promise(function (resolve, reject) {
	        // Try loading the view module using require.js
	        if (moduleName) {
	            if (typeof requirejs === 'undefined') {
	                throw new Error('requirejs not found');
	            }
	            requirejs([moduleName], function (mod) {
	                if (mod[name] === void 0) {
	                    var msg = "Object '" + name + "' not found in module '" + moduleName + "'";
	                    reject(new Error(msg));
	                }
	                else {
	                    resolve(mod[name]);
	                }
	            }, reject);
	        }
	        else {
	            if (registry && registry[name]) {
	                resolve(registry[name]);
	            }
	            else {
	                reject(new Error("Object '" + name + "' not found in registry"));
	            }
	        }
	    });
	}
	exports.loadObject = loadObject;
	;
	/**
	 * A Promise that can be resolved or rejected by another object.
	 */
	var PromiseDelegate = (function () {
	    /**
	     * Construct a new Promise delegate.
	     */
	    function PromiseDelegate() {
	        var _this = this;
	        this._promise = new Promise(function (resolve, reject) {
	            _this._resolve = resolve;
	            _this._reject = reject;
	        });
	    }
	    Object.defineProperty(PromiseDelegate.prototype, "promise", {
	        /**
	         * Get the underlying Promise.
	         */
	        get: function () {
	            return this._promise;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Resolve the underlying Promise with an optional value or another Promise.
	     */
	    PromiseDelegate.prototype.resolve = function (value) {
	        // Note: according to the Promise spec, and the `this` context for resolve
	        // and reject are ignored
	        this._resolve(value);
	    };
	    /**
	     * Reject the underlying Promise with an optional reason.
	     */
	    PromiseDelegate.prototype.reject = function (reason) {
	        // Note: according to the Promise spec, the `this` context for resolve
	        // and reject are ignored
	        this._reject(reason);
	    };
	    return PromiseDelegate;
	}());
	exports.PromiseDelegate = PromiseDelegate;
	/**
	 * Global config data for the Jupyter application.
	 */
	var configData = null;
	/**
	 *  Make an object fully immutable by freezing each object in it.
	 */
	function deepFreeze(obj) {
	    // Freeze properties before freezing self
	    Object.getOwnPropertyNames(obj).forEach(function (name) {
	        var prop = obj[name];
	        // Freeze prop if it is an object
	        if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
	            deepFreeze(prop);
	        }
	    });
	    // Freeze self
	    return Object.freeze(obj);
	}
	function getConfigOption(name) {
	    if (configData) {
	        return configData[name];
	    }
	    if (typeof document === 'undefined') {
	        configData = minimist(process.argv.slice(2));
	    }
	    else {
	        var el = document.getElementById('jupyter-config-data');
	        if (el) {
	            configData = JSON.parse(el.textContent);
	        }
	        else {
	            configData = {};
	        }
	    }
	    configData = deepFreeze(configData);
	    return configData[name];
	}
	exports.getConfigOption = getConfigOption;
	/**
	 * Get the base URL for a Jupyter application.
	 */
	function getBaseUrl() {
	    var baseUrl = getConfigOption('baseUrl');
	    if (!baseUrl || baseUrl === '/') {
	        baseUrl = (typeof location === 'undefined' ?
	            'http://localhost:8888/' : location.origin + '/');
	    }
	    return baseUrl;
	}
	exports.getBaseUrl = getBaseUrl;
	/**
	 * Get the base websocket URL for a Jupyter application.
	 */
	function getWsUrl(baseUrl) {
	    var wsUrl = getConfigOption('wsUrl');
	    if (!wsUrl) {
	        baseUrl = baseUrl || getBaseUrl();
	        if (baseUrl.indexOf('http') !== 0) {
	            if (typeof location !== 'undefined') {
	                baseUrl = urlPathJoin(location.origin, baseUrl);
	            }
	            else {
	                baseUrl = urlPathJoin('http://localhost:8888/', baseUrl);
	            }
	        }
	        wsUrl = 'ws' + baseUrl.slice(4);
	    }
	    return wsUrl;
	}
	exports.getWsUrl = getWsUrl;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	(function () {
	  try {
	    cachedSetTimeout = setTimeout;
	  } catch (e) {
	    cachedSetTimeout = function () {
	      throw new Error('setTimeout is not defined');
	    }
	  }
	  try {
	    cachedClearTimeout = clearTimeout;
	  } catch (e) {
	    cachedClearTimeout = function () {
	      throw new Error('clearTimeout is not defined');
	    }
	  }
	} ())
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = cachedSetTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    cachedClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        cachedSetTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = function (args, opts) {
	    if (!opts) opts = {};
	    
	    var flags = { bools : {}, strings : {}, unknownFn: null };
	
	    if (typeof opts['unknown'] === 'function') {
	        flags.unknownFn = opts['unknown'];
	    }
	
	    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
	      flags.allBools = true;
	    } else {
	      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
	          flags.bools[key] = true;
	      });
	    }
	    
	    var aliases = {};
	    Object.keys(opts.alias || {}).forEach(function (key) {
	        aliases[key] = [].concat(opts.alias[key]);
	        aliases[key].forEach(function (x) {
	            aliases[x] = [key].concat(aliases[key].filter(function (y) {
	                return x !== y;
	            }));
	        });
	    });
	
	    [].concat(opts.string).filter(Boolean).forEach(function (key) {
	        flags.strings[key] = true;
	        if (aliases[key]) {
	            flags.strings[aliases[key]] = true;
	        }
	     });
	
	    var defaults = opts['default'] || {};
	    
	    var argv = { _ : [] };
	    Object.keys(flags.bools).forEach(function (key) {
	        setArg(key, defaults[key] === undefined ? false : defaults[key]);
	    });
	    
	    var notFlags = [];
	
	    if (args.indexOf('--') !== -1) {
	        notFlags = args.slice(args.indexOf('--')+1);
	        args = args.slice(0, args.indexOf('--'));
	    }
	
	    function argDefined(key, arg) {
	        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
	            flags.strings[key] || flags.bools[key] || aliases[key];
	    }
	
	    function setArg (key, val, arg) {
	        if (arg && flags.unknownFn && !argDefined(key, arg)) {
	            if (flags.unknownFn(arg) === false) return;
	        }
	
	        var value = !flags.strings[key] && isNumber(val)
	            ? Number(val) : val
	        ;
	        setKey(argv, key.split('.'), value);
	        
	        (aliases[key] || []).forEach(function (x) {
	            setKey(argv, x.split('.'), value);
	        });
	    }
	
	    function setKey (obj, keys, value) {
	        var o = obj;
	        keys.slice(0,-1).forEach(function (key) {
	            if (o[key] === undefined) o[key] = {};
	            o = o[key];
	        });
	
	        var key = keys[keys.length - 1];
	        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
	            o[key] = value;
	        }
	        else if (Array.isArray(o[key])) {
	            o[key].push(value);
	        }
	        else {
	            o[key] = [ o[key], value ];
	        }
	    }
	    
	    function aliasIsBoolean(key) {
	      return aliases[key].some(function (x) {
	          return flags.bools[x];
	      });
	    }
	
	    for (var i = 0; i < args.length; i++) {
	        var arg = args[i];
	        
	        if (/^--.+=/.test(arg)) {
	            // Using [\s\S] instead of . because js doesn't support the
	            // 'dotall' regex modifier. See:
	            // http://stackoverflow.com/a/1068308/13216
	            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
	            var key = m[1];
	            var value = m[2];
	            if (flags.bools[key]) {
	                value = value !== 'false';
	            }
	            setArg(key, value, arg);
	        }
	        else if (/^--no-.+/.test(arg)) {
	            var key = arg.match(/^--no-(.+)/)[1];
	            setArg(key, false, arg);
	        }
	        else if (/^--.+/.test(arg)) {
	            var key = arg.match(/^--(.+)/)[1];
	            var next = args[i + 1];
	            if (next !== undefined && !/^-/.test(next)
	            && !flags.bools[key]
	            && !flags.allBools
	            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
	                setArg(key, next, arg);
	                i++;
	            }
	            else if (/^(true|false)$/.test(next)) {
	                setArg(key, next === 'true', arg);
	                i++;
	            }
	            else {
	                setArg(key, flags.strings[key] ? '' : true, arg);
	            }
	        }
	        else if (/^-[^-]+/.test(arg)) {
	            var letters = arg.slice(1,-1).split('');
	            
	            var broken = false;
	            for (var j = 0; j < letters.length; j++) {
	                var next = arg.slice(j+2);
	                
	                if (next === '-') {
	                    setArg(letters[j], next, arg)
	                    continue;
	                }
	                
	                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
	                    setArg(letters[j], next.split('=')[1], arg);
	                    broken = true;
	                    break;
	                }
	                
	                if (/[A-Za-z]/.test(letters[j])
	                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
	                    setArg(letters[j], next, arg);
	                    broken = true;
	                    break;
	                }
	                
	                if (letters[j+1] && letters[j+1].match(/\W/)) {
	                    setArg(letters[j], arg.slice(j+2), arg);
	                    broken = true;
	                    break;
	                }
	                else {
	                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
	                }
	            }
	            
	            var key = arg.slice(-1)[0];
	            if (!broken && key !== '-') {
	                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
	                && !flags.bools[key]
	                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
	                    setArg(key, args[i+1], arg);
	                    i++;
	                }
	                else if (args[i+1] && /true|false/.test(args[i+1])) {
	                    setArg(key, args[i+1] === 'true', arg);
	                    i++;
	                }
	                else {
	                    setArg(key, flags.strings[key] ? '' : true, arg);
	                }
	            }
	        }
	        else {
	            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
	                argv._.push(
	                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
	                );
	            }
	            if (opts.stopEarly) {
	                argv._.push.apply(argv._, args.slice(i + 1));
	                break;
	            }
	        }
	    }
	    
	    Object.keys(defaults).forEach(function (key) {
	        if (!hasKey(argv, key.split('.'))) {
	            setKey(argv, key.split('.'), defaults[key]);
	            
	            (aliases[key] || []).forEach(function (x) {
	                setKey(argv, x.split('.'), defaults[key]);
	            });
	        }
	    });
	    
	    if (opts['--']) {
	        argv['--'] = new Array();
	        notFlags.forEach(function(key) {
	            argv['--'].push(key);
	        });
	    }
	    else {
	        notFlags.forEach(function(key) {
	            argv._.push(key);
	        });
	    }
	
	    return argv;
	};
	
	function hasKey (obj, keys) {
	    var o = obj;
	    keys.slice(0,-1).forEach(function (key) {
	        o = (o[key] || {});
	    });
	
	    var key = keys[keys.length - 1];
	    return key in o;
	}
	
	function isNumber (x) {
	    if (typeof x === 'number') return true;
	    if (/^0x[0-9a-f]+$/i.test(x)) return true;
	    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
	}
	


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	var punycode = __webpack_require__(6);
	var util = __webpack_require__(8);
	
	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;
	
	exports.Url = Url;
	
	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}
	
	// Reference: RFC 3986, RFC 1808, RFC 2396
	
	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,
	
	    // Special case for a simple path URL
	    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
	
	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
	
	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
	
	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(9);
	
	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && util.isObject(url) && url instanceof Url) return url;
	
	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}
	
	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!util.isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }
	
	  // Copy chrome, IE, opera backslash-handling behavior.
	  // Back slashes before the query string get converted to forward slashes
	  // See: https://code.google.com/p/chromium/issues/detail?id=25916
	  var queryIndex = url.indexOf('?'),
	      splitter =
	          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
	      uSplit = url.split(splitter),
	      slashRegex = /\\/g;
	  uSplit[0] = uSplit[0].replace(slashRegex, '/');
	  url = uSplit.join(splitter);
	
	  var rest = url;
	
	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();
	
	  if (!slashesDenoteHost && url.split('#').length === 1) {
	    // Try fast path regexp
	    var simplePath = simplePathPattern.exec(rest);
	    if (simplePath) {
	      this.path = rest;
	      this.href = rest;
	      this.pathname = simplePath[1];
	      if (simplePath[2]) {
	        this.search = simplePath[2];
	        if (parseQueryString) {
	          this.query = querystring.parse(this.search.substr(1));
	        } else {
	          this.query = this.search.substr(1);
	        }
	      } else if (parseQueryString) {
	        this.search = '';
	        this.query = {};
	      }
	      return this;
	    }
	  }
	
	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }
	
	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }
	
	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {
	
	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c
	
	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.
	
	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	
	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }
	
	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }
	
	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;
	
	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);
	
	    // pull out port.
	    this.parseHost();
	
	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';
	
	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';
	
	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }
	
	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }
	
	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a punycoded representation of "domain".
	      // It only converts parts of the domain name that
	      // have non-ASCII characters, i.e. it doesn't matter if
	      // you call it with a domain that already is ASCII-only.
	      this.hostname = punycode.toASCII(this.hostname);
	    }
	
	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;
	
	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }
	
	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {
	
	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      if (rest.indexOf(ae) === -1)
	        continue;
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }
	
	
	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }
	
	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }
	
	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};
	
	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (util.isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}
	
	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }
	
	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';
	
	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }
	
	  if (this.query &&
	      util.isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }
	
	  var search = this.search || (query && ('?' + query)) || '';
	
	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';
	
	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }
	
	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;
	
	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');
	
	  return protocol + host + pathname + search + hash;
	};
	
	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}
	
	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};
	
	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}
	
	Url.prototype.resolveObject = function(relative) {
	  if (util.isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }
	
	  var result = new Url();
	  var tkeys = Object.keys(this);
	  for (var tk = 0; tk < tkeys.length; tk++) {
	    var tkey = tkeys[tk];
	    result[tkey] = this[tkey];
	  }
	
	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;
	
	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }
	
	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    var rkeys = Object.keys(relative);
	    for (var rk = 0; rk < rkeys.length; rk++) {
	      var rkey = rkeys[rk];
	      if (rkey !== 'protocol')
	        result[rkey] = relative[rkey];
	    }
	
	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }
	
	    result.href = result.format();
	    return result;
	  }
	
	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      var keys = Object.keys(relative);
	      for (var v = 0; v < keys.length; v++) {
	        var k = keys[v];
	        result[k] = relative[k];
	      }
	      result.href = result.format();
	      return result;
	    }
	
	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }
	
	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];
	
	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }
	
	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!util.isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especially happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }
	
	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }
	
	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host || srcPath.length > 1) &&
	      (last === '.' || last === '..') || last === '');
	
	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last === '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }
	
	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }
	
	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }
	
	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');
	
	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especially happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }
	
	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);
	
	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }
	
	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }
	
	  //to support request.http
	  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};
	
	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {
	
		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}
	
		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,
	
		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1
	
		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'
	
		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators
	
		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},
	
		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,
	
		/** Temporary variable */
		key;
	
		/*--------------------------------------------------------------------------*/
	
		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}
	
		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}
	
		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}
	
		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}
	
		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}
	
		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}
	
		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}
	
		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}
	
		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;
	
			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.
	
			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}
	
			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}
	
			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.
	
			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {
	
				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {
	
					if (index >= inputLength) {
						error('invalid-input');
					}
	
					digit = basicToDigit(input.charCodeAt(index++));
	
					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}
	
					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
	
					if (digit < t) {
						break;
					}
	
					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}
	
					w *= baseMinusT;
	
				}
	
				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);
	
				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}
	
				n += floor(i / out);
				i %= out;
	
				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);
	
			}
	
			return ucs2encode(output);
		}
	
		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;
	
			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);
	
			// Cache the length
			inputLength = input.length;
	
			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;
	
			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}
	
			handledCPCount = basicLength = output.length;
	
			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.
	
			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}
	
			// Main encoding loop:
			while (handledCPCount < inputLength) {
	
				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}
	
				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}
	
				delta += (m - n) * handledCPCountPlusOne;
				n = m;
	
				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];
	
					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}
	
					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}
	
						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}
	
				++delta;
				++n;
	
			}
			return output.join('');
		}
	
		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}
	
		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}
	
		/*--------------------------------------------------------------------------*/
	
		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};
	
		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}
	
	}(this));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)(module), (function() { return this; }())))

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = {
	  isString: function(arg) {
	    return typeof(arg) === 'string';
	  },
	  isObject: function(arg) {
	    return typeof(arg) === 'object' && arg !== null;
	  },
	  isNull: function(arg) {
	    return arg === null;
	  },
	  isNullOrUndefined: function(arg) {
	    return arg == null;
	  }
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.decode = exports.parse = __webpack_require__(10);
	exports.encode = exports.stringify = __webpack_require__(11);


/***/ },
/* 10 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};
	
	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }
	
	  var regexp = /\+/g;
	  qs = qs.split(sep);
	
	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }
	
	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }
	
	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;
	
	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }
	
	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);
	
	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }
	
	  return obj;
	};


/***/ },
/* 11 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;
	
	    case 'boolean':
	      return v ? 'true' : 'false';
	
	    case 'number':
	      return isFinite(v) ? v : '';
	
	    default:
	      return '';
	  }
	};
	
	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }
	
	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);
	
	  }
	
	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (name, context, definition) {
	  if (typeof module !== 'undefined' && module.exports) module.exports = definition();
	  else if (true) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (definition), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  else context[name] = definition();
	})('urljoin', this, function () {
	
	  function normalize (str, options) {
	
	    // make sure protocol is followed by two slashes
	    str = str.replace(/:\//g, '://');
	
	    // remove consecutive slashes
	    str = str.replace(/([^:\s])\/+/g, '$1/');
	
	    // remove trailing slash before parameters or hash
	    str = str.replace(/\/(\?|&|#[^!])/g, '$1');
	
	    // replace ? in parameters with &
	    str = str.replace(/(\?.+)\?/g, '$1&');
	
	    return str;
	  }
	
	  return function () {
	    var input = arguments;
	    var options = {};
	
	    if (typeof arguments[0] === 'object') {
	      // new syntax with array and options
	      input = arguments[0];
	      options = arguments[1] || {};
	    }
	
	    var joined = [].slice.call(input, 0).join('/');
	    return normalize(joined, options);
	  };
	
	});


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var posix = __webpack_require__(14);
	var utils = __webpack_require__(2);
	var validate = __webpack_require__(18);
	/**
	 * The url for the contents service.
	 */
	var SERVICE_CONTENTS_URL = 'api/contents';
	/**
	 * The url for the file access.
	 */
	var FILES_URL = 'files';
	/**
	 * A contents manager that passes file operations to the server.
	 *
	 * This includes checkpointing with the normal file operations.
	 */
	var ContentsManager = (function () {
	    /**
	     * Construct a new contents manager object.
	     *
	     * @param options - The options used to initialize the object.
	     */
	    function ContentsManager(options) {
	        if (options === void 0) { options = {}; }
	        this._baseUrl = '';
	        this._ajaxSettings = null;
	        this._baseUrl = options.baseUrl || utils.getBaseUrl();
	        options.ajaxSettings = options.ajaxSettings || {};
	        this._ajaxSettings = utils.copy(options.ajaxSettings);
	    }
	    Object.defineProperty(ContentsManager.prototype, "ajaxSettings", {
	        /**
	         * Get a copy of the default ajax settings for the contents manager.
	         */
	        get: function () {
	            return utils.copy(this._ajaxSettings);
	        },
	        /**
	         * Set the default ajax settings for the contents manager.
	         */
	        set: function (value) {
	            this._ajaxSettings = utils.copy(value);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Get a file or directory.
	     *
	     * @param path: The path to the file.
	     *
	     * @param options: The options used to fetch the file.
	     *
	     * @returns A promise which resolves with the file content.
	     *
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.get = function (path, options) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        var url = this._getUrl(path);
	        if (options) {
	            // The notebook type cannot take an format option.
	            if (options.type === 'notebook') {
	                delete options['format'];
	            }
	            var params = utils.copy(options);
	            params.content = options.content ? '1' : '0';
	            url += utils.jsonToQueryString(params);
	        }
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateContentsModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Get an encoded download url given a file path.
	     *
	     * @param path - An absolute POSIX file path on the server.
	     *
	     * #### Notes
	     * It is expected that the path contains no relative paths,
	     * use [[ContentsManager.getAbsolutePath]] to get an absolute
	     * path if necessary.
	     */
	    ContentsManager.prototype.getDownloadUrl = function (path) {
	        return utils.urlPathJoin(this._baseUrl, FILES_URL, utils.urlEncodeParts(path));
	    };
	    /**
	     * Create a new untitled file or directory in the specified directory path.
	     *
	     * @param options: The options used to create the file.
	     *
	     * @returns A promise which resolves with the created file content when the
	     *    file is created.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.newUntitled = function (options) {
	        if (options === void 0) { options = {}; }
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        if (options) {
	            ajaxSettings.data = JSON.stringify(options);
	            ajaxSettings.contentType = 'application/json';
	        }
	        var url = this._getUrl(options.path || '');
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 201) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateContentsModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Delete a file.
	     *
	     * @param path - The path to the file.
	     *
	     * @returns A promise which resolves when the file is deleted.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
	     */
	    ContentsManager.prototype.delete = function (path) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'DELETE';
	        ajaxSettings.dataType = 'json';
	        var url = this._getUrl(path);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        }, function (error) {
	            // Translate certain errors to more specific ones.
	            // TODO: update IPEP27 to specify errors more precisely, so
	            // that error types can be detected here with certainty.
	            if (error.xhr.status === 400) {
	                var err = JSON.parse(error.xhr.response);
	                if (err.message) {
	                    error.throwError = err.message;
	                }
	            }
	            return Promise.reject(error);
	        });
	    };
	    /**
	     * Rename a file or directory.
	     *
	     * @param path - The original file path.
	     *
	     * @param newPath - The new file path.
	     *
	     * @returns A promise which resolves with the new file contents model when
	     *   the file is renamed.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.rename = function (path, newPath) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'PATCH';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.data = JSON.stringify({ path: newPath });
	        var url = this._getUrl(path);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateContentsModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Save a file.
	     *
	     * @param path - The desired file path.
	     *
	     * @param options - Optional overrrides to the model.
	     *
	     * @returns A promise which resolves with the file content model when the
	     *   file is saved.
	     *
	     * #### Notes
	     * Ensure that `model.content` is populated for the file.
	     *
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.save = function (path, options) {
	        if (options === void 0) { options = {}; }
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'PUT';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.data = JSON.stringify(options);
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.cache = false;
	        var url = this._getUrl(path);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            // will return 200 for an existing file and 201 for a new file
	            if (success.xhr.status !== 200 && success.xhr.status !== 201) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateContentsModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Copy a file into a given directory.
	     *
	     * @param path - The original file path.
	     *
	     * @param toDir - The destination directory path.
	     *
	     * @returns A promise which resolves with the new contents model when the
	     *  file is copied.
	     *
	     * #### Notes
	     * The server will select the name of the copied file.
	     *
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.copy = function (fromFile, toDir) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'POST';
	        ajaxSettings.data = JSON.stringify({ copy_from: fromFile });
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.dataType = 'json';
	        var url = this._getUrl(toDir);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 201) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateContentsModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Create a checkpoint for a file.
	     *
	     * @param path - The path of the file.
	     *
	     * @returns A promise which resolves with the new checkpoint model when the
	     *   checkpoint is created.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.createCheckpoint = function (path) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        var url = this._getUrl(path, 'checkpoints');
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 201) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateCheckpointModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return success.data;
	        });
	    };
	    /**
	     * List available checkpoints for a file.
	     *
	     * @param path - The path of the file.
	     *
	     * @returns A promise which resolves with a list of checkpoint models for
	     *    the file.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
	     */
	    ContentsManager.prototype.listCheckpoints = function (path) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        var url = this._getUrl(path, 'checkpoints');
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            if (!Array.isArray(success.data)) {
	                return utils.makeAjaxError(success, 'Invalid Checkpoint list');
	            }
	            for (var i = 0; i < success.data.length; i++) {
	                try {
	                    validate.validateCheckpointModel(success.data[i]);
	                }
	                catch (err) {
	                    return utils.makeAjaxError(success, err.message);
	                }
	            }
	            return success.data;
	        });
	    };
	    /**
	     * Restore a file to a known checkpoint state.
	     *
	     * @param path - The path of the file.
	     *
	     * @param checkpointID - The id of the checkpoint to restore.
	     *
	     * @returns A promise which resolves when the checkpoint is restored.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
	     */
	    ContentsManager.prototype.restoreCheckpoint = function (path, checkpointID) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        var url = this._getUrl(path, 'checkpoints', checkpointID);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        });
	    };
	    /**
	     * Delete a checkpoint for a file.
	     *
	     * @param path - The path of the file.
	     *
	     * @param checkpointID - The id of the checkpoint to delete.
	     *
	     * @returns A promise which resolves when the checkpoint is deleted.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
	     */
	    ContentsManager.prototype.deleteCheckpoint = function (path, checkpointID) {
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'DELETE';
	        ajaxSettings.dataType = 'json';
	        var url = this._getUrl(path, 'checkpoints', checkpointID);
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        });
	    };
	    /**
	     * Get a REST url for a file given a path.
	     */
	    ContentsManager.prototype._getUrl = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var parts = args.map(function (path) { return utils.urlEncodeParts(path); });
	        return utils.urlPathJoin.apply(utils, [this._baseUrl, SERVICE_CONTENTS_URL].concat(parts));
	    };
	    return ContentsManager;
	}());
	exports.ContentsManager = ContentsManager;
	/**
	 * A namespace for ContentsManager statics.
	 */
	var ContentsManager;
	(function (ContentsManager) {
	    /**
	     * Get the absolute POSIX path to a file on the server.
	     *
	     * @param relativePath - The relative POSIX path to the file.
	     *
	     * @param cwd - The optional POSIX current working directory.  The default is
	     *  an empty string.
	     *
	     * #### Notes
	     * Absolute path in this context is equivalent to a POSIX path without
	     * the initial `'/'` because IPEP 27 paths denote `''` as the root.
	     * If the resulting path is not contained within the server root,
	     * returns `null`, since it cannot be served.
	     */
	    function getAbsolutePath(relativePath, cwd) {
	        if (cwd === void 0) { cwd = ''; }
	        var norm = posix.normalize(posix.join(cwd, relativePath));
	        if (norm.indexOf('../') === 0) {
	            return null;
	        }
	        return posix.resolve('/', cwd, relativePath).slice(1);
	    }
	    ContentsManager.getAbsolutePath = getAbsolutePath;
	    /**
	     * Get the last portion of a path, similar to the Unix basename command.
	     */
	    function basename(path, ext) {
	        return posix.basename(path, ext);
	    }
	    ContentsManager.basename = basename;
	    /**
	     * Get the directory name of a path, similar to the Unix dirname command.
	     */
	    function dirname(path) {
	        return posix.dirname(path);
	    }
	    ContentsManager.dirname = dirname;
	    /**
	     * Get the extension of the path.
	     *
	     * #### Notes
	     * The extension is the string from the last occurance of the `.`
	     * character to end of string in the last portion of the path.
	     * If there is no `.` in the last portion of the path, or if the first
	     * character of the basename of path [[basename]] is `.`, then an
	     * empty string is returned.
	     */
	    function extname(path) {
	        return posix.extname(path);
	    }
	    ContentsManager.extname = extname;
	})(ContentsManager = exports.ContentsManager || (exports.ContentsManager = {}));


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	var util = __webpack_require__(15);
	var isString = function (x) {
	  return typeof x === 'string';
	};
	
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  var res = [];
	  for (var i = 0; i < parts.length; i++) {
	    var p = parts[i];
	
	    // ignore empty parts
	    if (!p || p === '.')
	      continue;
	
	    if (p === '..') {
	      if (res.length && res[res.length - 1] !== '..') {
	        res.pop();
	      } else if (allowAboveRoot) {
	        res.push('..');
	      }
	    } else {
	      res.push(p);
	    }
	  }
	
	  return res;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var posix = {};
	
	
	function posixSplitPath(filename) {
	  return splitPathRe.exec(filename).slice(1);
	}
	
	
	// path.resolve([from ...], to)
	// posix version
	posix.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (!isString(path)) {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(resolvedPath.split('/'),
	                                !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	posix.normalize = function(path) {
	  var isAbsolute = posix.isAbsolute(path),
	      trailingSlash = path.substr(-1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(path.split('/'), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	posix.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	posix.join = function() {
	  var path = '';
	  for (var i = 0; i < arguments.length; i++) {
	    var segment = arguments[i];
	    if (!isString(segment)) {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    if (segment) {
	      if (!path) {
	        path += segment;
	      } else {
	        path += '/' + segment;
	      }
	    }
	  }
	  return posix.normalize(path);
	};
	
	
	// path.relative(from, to)
	// posix version
	posix.relative = function(from, to) {
	  from = posix.resolve(from).substr(1);
	  to = posix.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	
	posix._makeLong = function(path) {
	  return path;
	};
	
	
	posix.dirname = function(path) {
	  var result = posixSplitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	posix.basename = function(path, ext) {
	  var f = posixSplitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	posix.extname = function(path) {
	  return posixSplitPath(path)[3];
	};
	
	
	posix.format = function(pathObject) {
	  if (!util.isObject(pathObject)) {
	    throw new TypeError(
	        "Parameter 'pathObject' must be an object, not " + typeof pathObject
	    );
	  }
	
	  var root = pathObject.root || '';
	
	  if (!isString(root)) {
	    throw new TypeError(
	        "'pathObject.root' must be a string or undefined, not " +
	        typeof pathObject.root
	    );
	  }
	
	  var dir = pathObject.dir ? pathObject.dir + posix.sep : '';
	  var base = pathObject.base || '';
	  return dir + base;
	};
	
	
	posix.parse = function(pathString) {
	  if (!isString(pathString)) {
	    throw new TypeError(
	        "Parameter 'pathString' must be a string, not " + typeof pathString
	    );
	  }
	  var allParts = posixSplitPath(pathString);
	  if (!allParts || allParts.length !== 4) {
	    throw new TypeError("Invalid path '" + pathString + "'");
	  }
	  allParts[1] = allParts[1] || '';
	  allParts[2] = allParts[2] || '';
	  allParts[3] = allParts[3] || '';
	
	  return {
	    root: allParts[0],
	    dir: allParts[0] + allParts[1].slice(0, allParts[1].length - 1),
	    base: allParts[2],
	    ext: allParts[3],
	    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
	  };
	};
	
	
	posix.sep = '/';
	posix.delimiter = ':';
	
	  module.exports = posix;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }
	
	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};
	
	
	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }
	
	  if (process.noDeprecation === true) {
	    return fn;
	  }
	
	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }
	
	  return deprecated;
	};
	
	
	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};
	
	
	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;
	
	
	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};
	
	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};
	
	
	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];
	
	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}
	
	
	function stylizeNoColor(str, styleType) {
	  return str;
	}
	
	
	function arrayToHash(array) {
	  var hash = {};
	
	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });
	
	  return hash;
	}
	
	
	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }
	
	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }
	
	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);
	
	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }
	
	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }
	
	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }
	
	  var base = '', array = false, braces = ['{', '}'];
	
	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }
	
	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }
	
	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }
	
	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }
	
	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }
	
	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }
	
	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }
	
	  ctx.seen.push(value);
	
	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }
	
	  ctx.seen.pop();
	
	  return reduceToSingleString(output, base, braces);
	}
	
	
	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}
	
	
	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}
	
	
	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}
	
	
	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }
	
	  return name + ': ' + str;
	}
	
	
	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);
	
	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }
	
	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}
	
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = __webpack_require__(16);
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	
	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}
	
	
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];
	
	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}
	
	
	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};
	
	
	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(17);
	
	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;
	
	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};
	
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(3)))

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 17 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 18 */
/***/ function(module, exports) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	/**
	 * Required fields for `IKernelHeader`.
	 */
	var HEADER_FIELDS = ['username', 'version', 'session', 'msg_id', 'msg_type'];
	/**
	 * Requred fields and types for contents of various types of `kernel.IMessage`
	 * messages on the iopub channel.
	 */
	var IOPUB_CONTENT_FIELDS = {
	    stream: { name: 'string', text: 'string' },
	    display_data: { data: 'object', metadata: 'object' },
	    execute_input: { code: 'string', execution_count: 'number' },
	    execute_result: { execution_count: 'number', data: 'object',
	        metadata: 'object' },
	    error: { ename: 'string', evalue: 'string', traceback: 'object' },
	    status: { execution_state: 'string' },
	    clear_output: { wait: 'boolean' },
	    comm_open: { comm_id: 'string', target_name: 'string', data: 'object' },
	    comm_msg: { comm_id: 'string', data: 'object' },
	    comm_close: { comm_id: 'string' },
	    shutdown_reply: { restart: 'boolean' } // Emitted by the IPython kernel.
	};
	/**
	 * Validate a property as being on an object, and optionally
	 * of a given type.
	 */
	function validateProperty(object, name, typeName) {
	    if (!object.hasOwnProperty(name)) {
	        throw Error("Missing property '" + name + "'");
	    }
	    if (typeName !== void 0) {
	        var valid = true;
	        var value = object[name];
	        switch (typeName) {
	            case 'array':
	                valid = Array.isArray(value);
	                break;
	            case 'object':
	                valid = typeof value !== 'undefined';
	                break;
	            default:
	                valid = typeof value === typeName;
	        }
	        if (!valid) {
	            throw new Error("Property '" + name + "' is not of type '" + typeName);
	        }
	    }
	}
	/**
	 * Validate the header of a kernel message.
	 */
	function validateKernelHeader(header) {
	    for (var i = 0; i < HEADER_FIELDS.length; i++) {
	        validateProperty(header, HEADER_FIELDS[i], 'string');
	    }
	}
	/**
	 * Validate a kernel message object.
	 */
	function validateKernelMessage(msg) {
	    validateProperty(msg, 'metadata', 'object');
	    validateProperty(msg, 'content', 'object');
	    validateProperty(msg, 'channel', 'string');
	    validateProperty(msg, 'buffers', 'array');
	    validateKernelHeader(msg.header);
	    if (Object.keys(msg.parent_header).length > 0) {
	        validateKernelHeader(msg.parent_header);
	    }
	    if (msg.channel === 'iopub') {
	        validateIOPubContent(msg);
	    }
	}
	exports.validateKernelMessage = validateKernelMessage;
	/**
	 * Validate content an kernel message on the iopub channel.
	 */
	function validateIOPubContent(msg) {
	    if (msg.channel === 'iopub') {
	        var fields = IOPUB_CONTENT_FIELDS[msg.header.msg_type];
	        if (fields === void 0) {
	            throw Error("Invalid Kernel message: iopub message type " + msg.header.msg_type + " not recognized");
	        }
	        var names = Object.keys(fields);
	        var content = msg.content;
	        for (var i = 0; i < names.length; i++) {
	            validateProperty(content, names[i], fields[names[i]]);
	        }
	    }
	}
	/**
	 * Validate an `IKernel.IModel` object.
	 */
	function validateKernelModel(model) {
	    validateProperty(model, 'name', 'string');
	    validateProperty(model, 'id', 'string');
	}
	exports.validateKernelModel = validateKernelModel;
	/**
	 * Validate an `ISession.IModel` object.
	 */
	function validateSessionModel(model) {
	    validateProperty(model, 'id', 'string');
	    validateProperty(model, 'notebook', 'object');
	    validateProperty(model, 'kernel', 'object');
	    validateKernelModel(model.kernel);
	    validateProperty(model.notebook, 'path', 'string');
	}
	exports.validateSessionModel = validateSessionModel;
	/**
	 * Validate an `IKernel.ISpecModel` object.
	 */
	function validateKernelSpecModel(info) {
	    validateProperty(info, 'name', 'string');
	    validateProperty(info, 'spec', 'object');
	    validateProperty(info, 'resources', 'object');
	    var spec = info.spec;
	    validateProperty(spec, 'language', 'string');
	    validateProperty(spec, 'display_name', 'string');
	    validateProperty(spec, 'argv', 'array');
	}
	exports.validateKernelSpecModel = validateKernelSpecModel;
	/**
	 * Validate an `IContents.IModel` object.
	 */
	function validateContentsModel(model) {
	    validateProperty(model, 'name', 'string');
	    validateProperty(model, 'path', 'string');
	    validateProperty(model, 'type', 'string');
	    validateProperty(model, 'created', 'string');
	    validateProperty(model, 'last_modified', 'string');
	    validateProperty(model, 'mimetype', 'object');
	    validateProperty(model, 'content', 'object');
	    validateProperty(model, 'format', 'object');
	}
	exports.validateContentsModel = validateContentsModel;
	/**
	 * Validate an `IContents.ICheckpointModel` object.
	 */
	function validateCheckpointModel(model) {
	    validateProperty(model, 'id', 'string');
	    validateProperty(model, 'last_modified', 'string');
	}
	exports.validateCheckpointModel = validateCheckpointModel;


/***/ },
/* 19 */
/***/ function(module, exports) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	/**
	 * A namespace for kernel messages.
	 */
	var KernelMessage;
	(function (KernelMessage) {
	    /**
	     * Test whether a kernel message is a `'stream'` message.
	     */
	    function isStreamMsg(msg) {
	        return msg.header.msg_type === 'stream';
	    }
	    KernelMessage.isStreamMsg = isStreamMsg;
	    /**
	     * Test whether a kernel message is an `'display_data'` message.
	     */
	    function isDisplayDataMsg(msg) {
	        return msg.header.msg_type === 'display_data';
	    }
	    KernelMessage.isDisplayDataMsg = isDisplayDataMsg;
	    /**
	     * Test whether a kernel message is an `'execute_input'` message.
	     */
	    function isExecuteInputMsg(msg) {
	        return msg.header.msg_type === 'execute_input';
	    }
	    KernelMessage.isExecuteInputMsg = isExecuteInputMsg;
	    /**
	     * Test whether a kernel message is an `'execute_result'` message.
	     */
	    function isExecuteResultMsg(msg) {
	        return msg.header.msg_type === 'execute_result';
	    }
	    KernelMessage.isExecuteResultMsg = isExecuteResultMsg;
	    /**
	     * Test whether a kernel message is an `'error'` message.
	     */
	    function isErrorMsg(msg) {
	        return msg.header.msg_type === 'error';
	    }
	    KernelMessage.isErrorMsg = isErrorMsg;
	    /**
	     * Test whether a kernel message is a `'status'` message.
	     */
	    function isStatusMsg(msg) {
	        return msg.header.msg_type === 'status';
	    }
	    KernelMessage.isStatusMsg = isStatusMsg;
	    /**
	     * Test whether a kernel message is a `'clear_output'` message.
	     */
	    function isClearOutputMsg(msg) {
	        return msg.header.msg_type === 'clear_output';
	    }
	    KernelMessage.isClearOutputMsg = isClearOutputMsg;
	    /**
	     * Test whether a kernel message is a `'comm_open'` message.
	     */
	    function isCommOpenMsg(msg) {
	        return msg.header.msg_type === 'comm_open';
	    }
	    KernelMessage.isCommOpenMsg = isCommOpenMsg;
	    /**
	     * Test whether a kernel message is a `'comm_close'` message.
	     */
	    function isCommCloseMsg(msg) {
	        return msg.header.msg_type === 'comm_close';
	    }
	    KernelMessage.isCommCloseMsg = isCommCloseMsg;
	    /**
	     * Test whether a kernel message is a `'comm_msg'` message.
	     */
	    function isCommMsgMsg(msg) {
	        return msg.header.msg_type === 'comm_msg';
	    }
	    KernelMessage.isCommMsgMsg = isCommMsgMsg;
	    ;
	    /**
	     * Test whether a kernel message is an `'input_request'` message.
	     */
	    function isInputRequestMsg(msg) {
	        return msg.header.msg_type === 'input_request';
	    }
	    KernelMessage.isInputRequestMsg = isInputRequestMsg;
	})(KernelMessage = exports.KernelMessage || (exports.KernelMessage = {}));


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var utils = __webpack_require__(2);
	var phosphor_disposable_1 = __webpack_require__(21);
	var phosphor_signaling_1 = __webpack_require__(22);
	var json_1 = __webpack_require__(23);
	var kernelfuture_1 = __webpack_require__(24);
	var serialize = __webpack_require__(26);
	var validate = __webpack_require__(18);
	/**
	 * The url for the kernel service.
	 */
	var KERNEL_SERVICE_URL = 'api/kernels';
	/**
	 * The url for the kernelspec service.
	 */
	var KERNELSPEC_SERVICE_URL = 'api/kernelspecs';
	/**
	 * An implementation of a kernel manager.
	 */
	var KernelManager = (function () {
	    /**
	     * Construct a new kernel manager.
	     *
	     * @param options - The default options for kernel.
	     */
	    function KernelManager(options) {
	        this._options = null;
	        this._running = [];
	        this._specs = null;
	        this._isDisposed = false;
	        this._options = utils.copy(options || {});
	    }
	    Object.defineProperty(KernelManager.prototype, "specsChanged", {
	        /**
	         * A signal emitted when the specs change.
	         */
	        get: function () {
	            return Private.specsChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelManager.prototype, "runningChanged", {
	        /**
	         * A signal emitted when the running kernels change.
	         */
	        get: function () {
	            return Private.runningChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelManager.prototype, "isDisposed", {
	        /**
	         * Test whether the terminal manager is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._isDisposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the resources used by the manager.
	     */
	    KernelManager.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._isDisposed = true;
	        phosphor_signaling_1.clearSignalData(this);
	        this._specs = null;
	        this._running = [];
	    };
	    /**
	     * Get the kernel specs.  See also [[getKernelSpecs]].
	     *
	     * @param options - Overrides for the default options.
	     */
	    KernelManager.prototype.getSpecs = function (options) {
	        var _this = this;
	        return getKernelSpecs(this._getOptions(options)).then(function (specs) {
	            if (!json_1.deepEqual(specs, _this._specs)) {
	                _this._specs = specs;
	                _this.specsChanged.emit(specs);
	            }
	            return specs;
	        });
	    };
	    /**
	     * List the running kernels.  See also [[listRunningKernels]].
	     *
	     * @param options - Overrides for the default options.
	     */
	    KernelManager.prototype.listRunning = function (options) {
	        var _this = this;
	        return listRunningKernels(this._getOptions(options)).then(function (running) {
	            if (!json_1.deepEqual(running, _this._running)) {
	                _this._running = running.slice();
	                _this.runningChanged.emit(running);
	            }
	            return running;
	        });
	    };
	    /**
	     * Start a new kernel.  See also [[startNewKernel]].
	     *
	     * @param options - Overrides for the default options.
	     *
	     * #### Notes
	     * This will emit [[runningChanged]] if the running kernels list
	     * changes.
	     */
	    KernelManager.prototype.startNew = function (options) {
	        return startNewKernel(this._getOptions(options));
	    };
	    /**
	     * Find a kernel by id.
	     *
	     * @param options - Overrides for the default options.
	     */
	    KernelManager.prototype.findById = function (id, options) {
	        return findKernelById(id, this._getOptions(options));
	    };
	    /**
	     * Connect to a running kernel.  See also [[connectToKernel]].
	     *
	     * @param options - Overrides for the default options.
	     */
	    KernelManager.prototype.connectTo = function (id, options) {
	        return connectToKernel(id, this._getOptions(options));
	    };
	    /**
	     * Shut down a kernel by id.
	     *
	     * @param options - Overrides for the default options.
	     *
	     * #### Notes
	     * This will emit [[runningChanged]] if the running kernels list
	     * changes.
	     */
	    KernelManager.prototype.shutdown = function (id, options) {
	        return shutdownKernel(id, this._getOptions(options));
	    };
	    /**
	     * Get optionally overidden options.
	     */
	    KernelManager.prototype._getOptions = function (options) {
	        if (options) {
	            options = utils.extend(utils.copy(this._options), options);
	        }
	        else {
	            options = this._options;
	        }
	        return options;
	    };
	    return KernelManager;
	}());
	exports.KernelManager = KernelManager;
	/**
	 * Find a kernel by id.
	 *
	 * #### Notes
	 * If the kernel was already started via `startNewKernel`, we return its
	 * `IKernel.IModel`.
	 *
	 * Otherwise, if `options` are given, we attempt to find to the existing
	 * kernel.
	 * The promise is fulfilled when the kernel is found,
	 * otherwise the promise is rejected.
	 */
	function findKernelById(id, options) {
	    var kernels = Private.runningKernels;
	    for (var clientId in kernels) {
	        var kernel = kernels[clientId];
	        if (kernel.id === id) {
	            var result = { id: kernel.id, name: kernel.name };
	            return Promise.resolve(result);
	        }
	    }
	    return Private.getKernelModel(id, options).catch(function () {
	        return Private.typedThrow("No running kernel with id: " + id);
	    });
	}
	exports.findKernelById = findKernelById;
	/**
	 * Fetch the kernel specs.
	 *
	 * #### Notes
	 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernelspecs).
	 */
	function getKernelSpecs(options) {
	    if (options === void 0) { options = {}; }
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var url = utils.urlPathJoin(baseUrl, KERNELSPEC_SERVICE_URL);
	    var ajaxSettings = utils.copy(options.ajaxSettings || {});
	    ajaxSettings.method = 'GET';
	    ajaxSettings.dataType = 'json';
	    return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	        if (success.xhr.status !== 200) {
	            return utils.makeAjaxError(success);
	        }
	        var data = success.data;
	        if (!data.hasOwnProperty('kernelspecs')) {
	            return utils.makeAjaxError(success, 'No kernelspecs found');
	        }
	        var keys = Object.keys(data.kernelspecs);
	        for (var i = 0; i < keys.length; i++) {
	            var ks = data.kernelspecs[keys[i]];
	            try {
	                validate.validateKernelSpecModel(ks);
	            }
	            catch (err) {
	                // Remove the errant kernel spec.
	                console.warn("Removing errant kernel spec: " + keys[i]);
	                delete data.kernelspecs[keys[i]];
	            }
	        }
	        keys = Object.keys(data.kernelspecs);
	        if (!keys.length) {
	            return utils.makeAjaxError(success, 'No valid kernelspecs found');
	        }
	        if (!data.hasOwnProperty('default') ||
	            typeof data.default !== 'string' ||
	            !data.kernelspecs.hasOwnProperty(data.default)) {
	            data.default = keys[0];
	            console.warn("Default kernel not found, using '" + keys[0] + "'");
	        }
	        return data;
	    });
	}
	exports.getKernelSpecs = getKernelSpecs;
	/**
	 * Fetch the running kernels.
	 *
	 * #### Notes
	 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
	 *
	 * The promise is fulfilled on a valid response and rejected otherwise.
	 */
	function listRunningKernels(options) {
	    if (options === void 0) { options = {}; }
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
	    var ajaxSettings = utils.copy(options.ajaxSettings || {});
	    ajaxSettings.method = 'GET';
	    ajaxSettings.dataType = 'json';
	    ajaxSettings.cache = false;
	    return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	        if (success.xhr.status !== 200) {
	            return utils.makeAjaxError(success);
	            ;
	        }
	        if (!Array.isArray(success.data)) {
	            return utils.makeAjaxError(success, 'Invalid kernel list');
	        }
	        for (var i = 0; i < success.data.length; i++) {
	            try {
	                validate.validateKernelModel(success.data[i]);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	        }
	        return success.data;
	    }, Private.onKernelError);
	}
	exports.listRunningKernels = listRunningKernels;
	/**
	 * Start a new kernel.
	 *
	 * #### Notes
	 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
	 *
	 * If no options are given or the kernel name is not given, the
	 * default kernel will by started by the server.
	 *
	 * Wraps the result in a Kernel object. The promise is fulfilled
	 * when the kernel is started by the server, otherwise the promise is rejected.
	 */
	function startNewKernel(options) {
	    options = options || {};
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
	    var ajaxSettings = utils.copy(options.ajaxSettings || {});
	    ajaxSettings.method = 'POST';
	    ajaxSettings.data = JSON.stringify({ name: options.name });
	    ajaxSettings.dataType = 'json';
	    ajaxSettings.contentType = 'application/json';
	    ajaxSettings.cache = false;
	    return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	        if (success.xhr.status !== 201) {
	            return utils.makeAjaxError(success);
	        }
	        validate.validateKernelModel(success.data);
	        return new Kernel(options, success.data.id);
	    }, Private.onKernelError);
	}
	exports.startNewKernel = startNewKernel;
	/**
	 * Connect to a running kernel.
	 *
	 * #### Notes
	 * If the kernel was already started via `startNewKernel`, the existing
	 * Kernel object info is used to create another instance.
	 *
	 * Otherwise, if `options` are given, we attempt to connect to the existing
	 * kernel found by calling `listRunningKernels`.
	 * The promise is fulfilled when the kernel is running on the server,
	 * otherwise the promise is rejected.
	 *
	 * If the kernel was not already started and no `options` are given,
	 * the promise is rejected.
	 */
	function connectToKernel(id, options) {
	    for (var clientId in Private.runningKernels) {
	        var kernel = Private.runningKernels[clientId];
	        if (kernel.id === id) {
	            return Promise.resolve(kernel.clone());
	        }
	    }
	    return Private.getKernelModel(id, options).then(function (model) {
	        return new Kernel(options, id);
	    }).catch(function () {
	        return Private.typedThrow("No running kernel with id: " + id);
	    });
	}
	exports.connectToKernel = connectToKernel;
	/**
	 * Shut down a kernel by id.
	 */
	function shutdownKernel(id, options) {
	    if (options === void 0) { options = {}; }
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var ajaxSettings = options.ajaxSettings || {};
	    return Private.shutdownKernel(id, baseUrl, ajaxSettings);
	}
	exports.shutdownKernel = shutdownKernel;
	/**
	 * Create a well-formed kernel message.
	 */
	function createKernelMessage(options, content, metadata, buffers) {
	    if (content === void 0) { content = {}; }
	    if (metadata === void 0) { metadata = {}; }
	    if (buffers === void 0) { buffers = []; }
	    return {
	        header: {
	            username: options.username || '',
	            version: '5.0',
	            session: options.session,
	            msg_id: options.msgId || utils.uuid(),
	            msg_type: options.msgType
	        },
	        parent_header: {},
	        channel: options.channel,
	        content: content,
	        metadata: metadata,
	        buffers: buffers
	    };
	}
	exports.createKernelMessage = createKernelMessage;
	/**
	 * Create a well-formed kernel shell message.
	 */
	function createShellMessage(options, content, metadata, buffers) {
	    if (content === void 0) { content = {}; }
	    if (metadata === void 0) { metadata = {}; }
	    if (buffers === void 0) { buffers = []; }
	    var msg = createKernelMessage(options, content, metadata, buffers);
	    return msg;
	}
	exports.createShellMessage = createShellMessage;
	/**
	 * Implementation of the Kernel object
	 */
	var Kernel = (function () {
	    /**
	     * Construct a kernel object.
	     */
	    function Kernel(options, id) {
	        this._id = '';
	        this._name = '';
	        this._baseUrl = '';
	        this._wsUrl = '';
	        this._status = 'unknown';
	        this._clientId = '';
	        this._ws = null;
	        this._username = '';
	        this._ajaxSettings = '{}';
	        this._reconnectLimit = 7;
	        this._reconnectAttempt = 0;
	        this._isReady = false;
	        this._futures = null;
	        this._commPromises = null;
	        this._comms = null;
	        this._targetRegistry = Object.create(null);
	        this._spec = null;
	        this._pendingMessages = [];
	        this._connectionPromise = null;
	        this.ajaxSettings = options.ajaxSettings || {};
	        this._name = options.name;
	        this._id = id;
	        this._baseUrl = options.baseUrl || utils.getBaseUrl();
	        this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
	        this._clientId = options.clientId || utils.uuid();
	        this._username = options.username || '';
	        this._futures = new Map();
	        this._commPromises = new Map();
	        this._comms = new Map();
	        this._createSocket();
	        Private.runningKernels[this._clientId] = this;
	    }
	    Object.defineProperty(Kernel.prototype, "statusChanged", {
	        /**
	         * A signal emitted when the kernel status changes.
	         */
	        get: function () {
	            return Private.statusChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "iopubMessage", {
	        /**
	         * A signal emitted for iopub kernel messages.
	         */
	        get: function () {
	            return Private.iopubMessageSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "unhandledMessage", {
	        /**
	         * A signal emitted for unhandled kernel message.
	         */
	        get: function () {
	            return Private.unhandledMessageSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "id", {
	        /**
	         * The id of the server-side kernel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._id;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "name", {
	        /**
	         * The name of the server-side kernel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._name;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "model", {
	        /**
	         * Get the model associated with the kernel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return { name: this.name, id: this.id };
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "username", {
	        /**
	         * The client username.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._username;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "clientId", {
	        /**
	         * The client unique id.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._clientId;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "status", {
	        /**
	         * The current status of the kernel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._status;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "ajaxSettings", {
	        /**
	         * Get a copy of the default ajax settings for the kernel.
	         */
	        get: function () {
	            return JSON.parse(this._ajaxSettings);
	        },
	        /**
	         * Set the default ajax settings for the kernel.
	         */
	        set: function (value) {
	            this._ajaxSettings = JSON.stringify(value);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Kernel.prototype, "isDisposed", {
	        /**
	         * Test whether the kernel has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property which is always safe to access.
	         */
	        get: function () {
	            return this._futures === null;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Clone the current kernel with a new clientId.
	     */
	    Kernel.prototype.clone = function () {
	        var options = {
	            baseUrl: this._baseUrl,
	            wsUrl: this._wsUrl,
	            name: this._name,
	            username: this._username,
	            ajaxSettings: this.ajaxSettings
	        };
	        return new Kernel(options, this._id);
	    };
	    /**
	     * Dispose of the resources held by the kernel.
	     */
	    Kernel.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._status = 'dead';
	        if (this._ws !== null) {
	            this._ws.close();
	        }
	        this._ws = null;
	        this._futures.forEach(function (future, key) {
	            future.dispose();
	        });
	        this._comms.forEach(function (comm, key) {
	            comm.dispose();
	        });
	        this._futures = null;
	        this._commPromises = null;
	        this._comms = null;
	        this._status = 'dead';
	        this._targetRegistry = null;
	        phosphor_signaling_1.clearSignalData(this);
	        delete Private.runningKernels[this._clientId];
	    };
	    /**
	     * Send a shell message to the kernel.
	     *
	     * #### Notes
	     * Send a message to the kernel's shell channel, yielding a future object
	     * for accepting replies.
	     *
	     * If `expectReply` is given and `true`, the future is disposed when both a
	     * shell reply and an idle status message are received. If `expectReply`
	     * is not given or is `false`, the future is resolved when an idle status
	     * message is received.
	     * If `disposeOnDone` is not given or is `true`, the Future is disposed at this point.
	     * If `disposeOnDone` is given and `false`, it is up to the caller to dispose of the Future.
	     *
	     * All replies are validated as valid kernel messages.
	     *
	     * If the kernel status is `Dead`, this will throw an error.
	     */
	    Kernel.prototype.sendShellMessage = function (msg, expectReply, disposeOnDone) {
	        var _this = this;
	        if (expectReply === void 0) { expectReply = false; }
	        if (disposeOnDone === void 0) { disposeOnDone = true; }
	        if (this.status === 'dead') {
	            throw new Error('Kernel is dead');
	        }
	        if (!this._isReady) {
	            this._pendingMessages.push(msg);
	        }
	        else {
	            this._ws.send(serialize.serialize(msg));
	        }
	        var future = new kernelfuture_1.KernelFutureHandler(function () {
	            _this._futures.delete(msg.header.msg_id);
	        }, msg, expectReply, disposeOnDone);
	        this._futures.set(msg.header.msg_id, future);
	        return future;
	    };
	    /**
	     * Interrupt a kernel.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels).
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     *
	     * It is assumed that the API call does not mutate the kernel id or name.
	     *
	     * The promise will be rejected if the kernel status is `Dead` or if the
	     * request fails or the response is invalid.
	     */
	    Kernel.prototype.interrupt = function () {
	        return Private.interruptKernel(this, this._baseUrl, this.ajaxSettings);
	    };
	    /**
	     * Restart a kernel.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels) and validates the response model.
	     *
	     * Any existing Future or Comm objects are cleared.
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     *
	     * It is assumed that the API call does not mutate the kernel id or name.
	     *
	     * The promise will be rejected if the request fails or the response is
	     * invalid.
	     */
	    Kernel.prototype.restart = function () {
	        this._clearState();
	        this._updateStatus('restarting');
	        return Private.restartKernel(this, this._baseUrl, this.ajaxSettings);
	    };
	    /**
	     * Reconnect to a disconnected kernel.
	     *
	     * #### Notes
	     * Used when the websocket connection to the kernel is lost.
	     */
	    Kernel.prototype.reconnect = function () {
	        if (this._ws !== null) {
	            // Clear the websocket event handlers and the socket itself.
	            this._ws.onclose = null;
	            this._ws.onerror = null;
	            this._ws.close();
	            this._ws = null;
	        }
	        this._isReady = false;
	        this._updateStatus('reconnecting');
	        this._createSocket();
	        return this._connectionPromise.promise;
	    };
	    /**
	     * Shutdown a kernel.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/kernels).
	     *
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     *
	     * On a valid response, closes the websocket and disposes of the kernel
	     * object, and fulfills the promise.
	     *
	     * The promise will be rejected if the kernel status is `Dead` or if the
	     * request fails or the response is invalid.
	     */
	    Kernel.prototype.shutdown = function () {
	        var _this = this;
	        if (this.status === 'dead') {
	            return Promise.reject(new Error('Kernel is dead'));
	        }
	        this._clearState();
	        return Private.shutdownKernel(this.id, this._baseUrl, this.ajaxSettings)
	            .then(function () {
	            _this.dispose();
	        });
	    };
	    /**
	     * Send a `kernel_info_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
	     *
	     * Fulfills with the `kernel_info_response` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.kernelInfo = function () {
	        var options = {
	            msgType: 'kernel_info_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send a `complete_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
	     *
	     * Fulfills with the `complete_reply` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.complete = function (content) {
	        var options = {
	            msgType: 'complete_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options, content);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send an `inspect_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
	     *
	     * Fulfills with the `inspect_reply` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.inspect = function (content) {
	        var options = {
	            msgType: 'inspect_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options, content);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send a `history_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#history).
	     *
	     * Fulfills with the `history_reply` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.history = function (content) {
	        var options = {
	            msgType: 'history_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options, content);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send an `execute_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
	     *
	     * Future `onReply` is called with the `execute_reply` content when the
	     * shell reply is received and validated. The future will resolve when
	     * this message is received and the `idle` iopub status is received.
	     * The future will also be disposed at this point unless `disposeOnDone`
	     * is specified and `false`, in which case it is up to the caller to dispose
	     * of the future.
	     *
	     * **See also:** [[IExecuteReply]]
	     */
	    Kernel.prototype.execute = function (content, disposeOnDone) {
	        if (disposeOnDone === void 0) { disposeOnDone = true; }
	        var options = {
	            msgType: 'execute_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var defaults = {
	            silent: false,
	            store_history: true,
	            user_expressions: {},
	            allow_stdin: true,
	            stop_on_error: false
	        };
	        content = utils.extend(defaults, content);
	        var msg = createShellMessage(options, content);
	        return this.sendShellMessage(msg, true, disposeOnDone);
	    };
	    /**
	     * Send an `is_complete_request` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
	     *
	     * Fulfills with the `is_complete_response` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.isComplete = function (content) {
	        var options = {
	            msgType: 'is_complete_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options, content);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send a `comm_info_request` message.
	     *
	     * #### Notes
	     * Fulfills with the `comm_info_reply` content when the shell reply is
	     * received and validated.
	     */
	    Kernel.prototype.commInfo = function (content) {
	        var options = {
	            msgType: 'comm_info_request',
	            channel: 'shell',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createShellMessage(options, content);
	        return Private.handleShellMessage(this, msg);
	    };
	    /**
	     * Send an `input_reply` message.
	     *
	     * #### Notes
	     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
	     */
	    Kernel.prototype.sendInputReply = function (content) {
	        if (this.status === 'dead') {
	            throw new Error('Kernel is dead');
	        }
	        var options = {
	            msgType: 'input_reply',
	            channel: 'stdin',
	            username: this._username,
	            session: this._clientId
	        };
	        var msg = createKernelMessage(options, content);
	        if (!this._isReady) {
	            this._pendingMessages.push(msg);
	        }
	        else {
	            this._ws.send(serialize.serialize(msg));
	        }
	    };
	    /**
	     * Register an IOPub message hook.
	     *
	     * @param msg_id - The parent_header message id the hook will intercept.
	     *
	     * @param hook - The callback invoked for the message.
	     *
	     * @returns A disposable used to unregister the message hook.
	     *
	     * #### Notes
	     * The IOPub hook system allows you to preempt the handlers for IOPub messages with a
	     * given parent_header message id. The most recently registered hook is run first.
	     * If the hook returns false, any later hooks and the future's onIOPub handler will not run.
	     * If a hook throws an error, the error is logged to the console and the next hook is run.
	     * If a hook is registered during the hook processing, it won't run until the next message.
	     * If a hook is disposed during the hook processing, it will be deactivated immediately.
	     *
	     * See also [[IFuture.registerMessageHook]].
	     */
	    Kernel.prototype.registerMessageHook = function (msg_id, hook) {
	        var _this = this;
	        var future = this._futures && this._futures.get(msg_id);
	        if (future) {
	            future.registerMessageHook(hook);
	        }
	        return new phosphor_disposable_1.DisposableDelegate(function () {
	            var future = _this._futures && _this._futures.get(msg_id);
	            if (future) {
	                future.removeMessageHook(hook);
	            }
	        });
	    };
	    /**
	     * Register a comm target handler.
	     *
	     * @param targetName - The name of the comm target.
	     *
	     * @param callback - The callback invoked for a comm open message.
	     *
	     * @returns A disposable used to unregister the comm target.
	     *
	     * #### Notes
	     * Only one comm target can be registered at a time, an existing
	     * callback will be overidden.  A registered comm target handler will take
	     * precedence over a comm which specifies a `target_module`.
	     */
	    Kernel.prototype.registerCommTarget = function (targetName, callback) {
	        var _this = this;
	        this._targetRegistry[targetName] = callback;
	        return new phosphor_disposable_1.DisposableDelegate(function () {
	            if (!_this.isDisposed) {
	                delete _this._targetRegistry[targetName];
	            }
	        });
	    };
	    /**
	     * Connect to a comm, or create a new one.
	     *
	     * #### Notes
	     * If a client-side comm already exists, it is returned.
	     */
	    Kernel.prototype.connectToComm = function (targetName, commId) {
	        var _this = this;
	        if (commId === void 0) {
	            commId = utils.uuid();
	        }
	        var comm = this._comms.get(commId);
	        if (!comm) {
	            comm = new Comm(targetName, commId, this, function () { _this._unregisterComm(commId); });
	            this._comms.set(commId, comm);
	        }
	        return comm;
	    };
	    /**
	     * Get the kernel spec associated with the kernel.
	     *
	     * #### Notes
	     * This value is cached and only fetched the first time it is requested.
	     */
	    Kernel.prototype.getKernelSpec = function () {
	        var _this = this;
	        if (this._spec) {
	            return Promise.resolve(this._spec);
	        }
	        var name = this.name;
	        var options = {
	            baseUrl: this._baseUrl, ajaxSettings: this.ajaxSettings
	        };
	        return getKernelSpecs(options).then(function (ids) {
	            var id = ids.kernelspecs[name];
	            if (!id) {
	                throw new Error("Could not find kernel spec for " + name);
	            }
	            _this._spec = id.spec;
	            return _this._spec;
	        });
	    };
	    /**
	     * Create the kernel websocket connection and add socket status handlers.
	     */
	    Kernel.prototype._createSocket = function () {
	        var _this = this;
	        var partialUrl = utils.urlPathJoin(this._wsUrl, KERNEL_SERVICE_URL, encodeURIComponent(this._id));
	        // Strip any authentication from the display string.
	        var display = partialUrl.replace(/^((?:\w+:)?\/\/)(?:[^@\/]+@)/, '$1');
	        console.log('Starting WebSocket:', display);
	        var url = utils.urlPathJoin(partialUrl, 'channels?session_id=' + encodeURIComponent(this._clientId));
	        this._connectionPromise = new utils.PromiseDelegate();
	        this._ws = new WebSocket(url);
	        // Ensure incoming binary messages are not Blobs
	        this._ws.binaryType = 'arraybuffer';
	        this._ws.onmessage = function (evt) { _this._onWSMessage(evt); };
	        this._ws.onopen = function (evt) { _this._onWSOpen(evt); };
	        this._ws.onclose = function (evt) { _this._onWSClose(evt); };
	        this._ws.onerror = function (evt) { _this._onWSClose(evt); };
	    };
	    /**
	     * Handle a websocket open event.
	     */
	    Kernel.prototype._onWSOpen = function (evt) {
	        var _this = this;
	        this._reconnectAttempt = 0;
	        // Allow the message to get through.
	        this._isReady = true;
	        // Get the kernel info, signaling that the kernel is ready.
	        this.kernelInfo().then(function () {
	            _this._connectionPromise.resolve(void 0);
	        });
	        this._isReady = false;
	    };
	    /**
	     * Handle a websocket message, validating and routing appropriately.
	     */
	    Kernel.prototype._onWSMessage = function (evt) {
	        if (this.status === 'dead') {
	            // If the socket is being closed, ignore any messages
	            return;
	        }
	        var msg = serialize.deserialize(evt.data);
	        try {
	            validate.validateKernelMessage(msg);
	        }
	        catch (error) {
	            console.error(error.message);
	            return;
	        }
	        if (msg.parent_header) {
	            var parentHeader = msg.parent_header;
	            var future = this._futures && this._futures.get(parentHeader.msg_id);
	            if (future) {
	                future.handleMsg(msg);
	            }
	            else {
	                // If the message was sent by us and was not iopub, it is orphaned.
	                var owned = parentHeader.session === this.clientId;
	                if (msg.channel !== 'iopub' && owned) {
	                    this.unhandledMessage.emit(msg);
	                }
	            }
	        }
	        if (msg.channel === 'iopub') {
	            switch (msg.header.msg_type) {
	                case 'status':
	                    this._updateStatus(msg.content.execution_state);
	                    break;
	                case 'comm_open':
	                    this._handleCommOpen(msg);
	                    break;
	                case 'comm_msg':
	                    this._handleCommMsg(msg);
	                    break;
	                case 'comm_close':
	                    this._handleCommClose(msg);
	                    break;
	            }
	            this.iopubMessage.emit(msg);
	        }
	    };
	    /**
	     * Handle a websocket close event.
	     */
	    Kernel.prototype._onWSClose = function (evt) {
	        if (this.status === 'dead') {
	            return;
	        }
	        // Clear the websocket event handlers and the socket itself.
	        this._ws.onclose = null;
	        this._ws.onerror = null;
	        this._ws = null;
	        if (this._reconnectAttempt < this._reconnectLimit) {
	            this._updateStatus('reconnecting');
	            var timeout = Math.pow(2, this._reconnectAttempt);
	            console.error('Connection lost, reconnecting in ' + timeout + ' seconds.');
	            setTimeout(this._createSocket.bind(this), 1e3 * timeout);
	            this._reconnectAttempt += 1;
	        }
	        else {
	            this._updateStatus('dead');
	        }
	    };
	    /**
	     * Handle status iopub messages from the kernel.
	     */
	    Kernel.prototype._updateStatus = function (status) {
	        switch (status) {
	            case 'starting':
	            case 'idle':
	            case 'busy':
	                this._isReady = true;
	                break;
	            case 'restarting':
	            case 'reconnecting':
	            case 'dead':
	                this._isReady = false;
	                break;
	            default:
	                console.error('invalid kernel status:', status);
	                return;
	        }
	        if (status !== this._status) {
	            this._status = status;
	            Private.logKernelStatus(this);
	            this.statusChanged.emit(status);
	            if (status === 'dead') {
	                this.dispose();
	            }
	        }
	        if (this._isReady) {
	            this._sendPending();
	        }
	    };
	    /**
	     * Send pending messages to the kernel.
	     */
	    Kernel.prototype._sendPending = function () {
	        // We shift the message off the queue
	        // after the message is sent so that if there is an exception,
	        // the message is still pending.
	        while (this._pendingMessages.length > 0) {
	            var msg = serialize.serialize(this._pendingMessages[0]);
	            this._ws.send(msg);
	            this._pendingMessages.shift();
	        }
	    };
	    /**
	     * Clear the internal state.
	     */
	    Kernel.prototype._clearState = function () {
	        this._isReady = false;
	        this._pendingMessages = [];
	        this._futures.forEach(function (future, key) {
	            future.dispose();
	        });
	        this._comms.forEach(function (comm, key) {
	            comm.dispose();
	        });
	        this._futures = new Map();
	        this._commPromises = new Map();
	        this._comms = new Map();
	    };
	    /**
	     * Handle a `comm_open` kernel message.
	     */
	    Kernel.prototype._handleCommOpen = function (msg) {
	        var _this = this;
	        var content = msg.content;
	        var promise = utils.loadObject(content.target_name, content.target_module, this._targetRegistry).then(function (target) {
	            var comm = new Comm(content.target_name, content.comm_id, _this, function () { _this._unregisterComm(content.comm_id); });
	            var response;
	            try {
	                response = target(comm, msg);
	            }
	            catch (e) {
	                comm.close();
	                console.error('Exception opening new comm');
	                throw (e);
	            }
	            return Promise.resolve(response).then(function () {
	                _this._commPromises.delete(comm.commId);
	                _this._comms.set(comm.commId, comm);
	                return comm;
	            });
	        });
	        this._commPromises.set(content.comm_id, promise);
	    };
	    /**
	     * Handle 'comm_close' kernel message.
	     */
	    Kernel.prototype._handleCommClose = function (msg) {
	        var _this = this;
	        var content = msg.content;
	        var promise = this._commPromises.get(content.comm_id);
	        if (!promise) {
	            var comm = this._comms.get(content.comm_id);
	            if (!comm) {
	                console.error('Comm not found for comm id ' + content.comm_id);
	                return;
	            }
	            promise = Promise.resolve(comm);
	        }
	        promise.then(function (comm) {
	            _this._unregisterComm(comm.commId);
	            try {
	                var onClose = comm.onClose;
	                if (onClose) {
	                    onClose(msg);
	                }
	                comm.dispose();
	            }
	            catch (e) {
	                console.error('Exception closing comm: ', e, e.stack, msg);
	            }
	        });
	    };
	    /**
	     * Handle a 'comm_msg' kernel message.
	     */
	    Kernel.prototype._handleCommMsg = function (msg) {
	        var content = msg.content;
	        var promise = this._commPromises.get(content.comm_id);
	        if (!promise) {
	            var comm = this._comms.get(content.comm_id);
	            if (!comm) {
	                console.error('Comm not found for comm id ' + content.comm_id);
	                return;
	            }
	            else {
	                var onMsg = comm.onMsg;
	                if (onMsg) {
	                    onMsg(msg);
	                }
	            }
	        }
	        else {
	            promise.then(function (comm) {
	                try {
	                    var onMsg = comm.onMsg;
	                    if (onMsg) {
	                        onMsg(msg);
	                    }
	                }
	                catch (e) {
	                    console.error('Exception handling comm msg: ', e, e.stack, msg);
	                }
	                return comm;
	            });
	        }
	    };
	    /**
	     * Unregister a comm instance.
	     */
	    Kernel.prototype._unregisterComm = function (commId) {
	        this._comms.delete(commId);
	        this._commPromises.delete(commId);
	    };
	    return Kernel;
	}());
	/**
	 * Comm channel handler.
	 */
	var Comm = (function (_super) {
	    __extends(Comm, _super);
	    /**
	     * Construct a new comm channel.
	     */
	    function Comm(target, id, kernel, disposeCb) {
	        _super.call(this, disposeCb);
	        this._target = '';
	        this._id = '';
	        this._kernel = null;
	        this._onClose = null;
	        this._onMsg = null;
	        this._id = id;
	        this._target = target;
	        this._kernel = kernel;
	    }
	    Object.defineProperty(Comm.prototype, "commId", {
	        /**
	         * The unique id for the comm channel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._id;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Comm.prototype, "targetName", {
	        /**
	         * The target name for the comm channel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._target;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Comm.prototype, "onClose", {
	        /**
	         * Get the callback for a comm close event.
	         *
	         * #### Notes
	         * This is called when the comm is closed from either the server or
	         * client.
	         *
	         * **See also:** [[ICommClose]], [[close]]
	         */
	        get: function () {
	            return this._onClose;
	        },
	        /**
	         * Set the callback for a comm close event.
	         *
	         * #### Notes
	         * This is called when the comm is closed from either the server or
	         * client.
	         *
	         * **See also:** [[close]]
	         */
	        set: function (cb) {
	            this._onClose = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Comm.prototype, "onMsg", {
	        /**
	         * Get the callback for a comm message received event.
	         */
	        get: function () {
	            return this._onMsg;
	        },
	        /**
	         * Set the callback for a comm message received event.
	         */
	        set: function (cb) {
	            this._onMsg = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Comm.prototype, "isDisposed", {
	        /**
	         * Test whether the comm has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property which is always safe to access.
	         */
	        get: function () {
	            return (this._kernel === null);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Open a comm with optional data and metadata.
	     *
	     * #### Notes
	     * This sends a `comm_open` message to the server.
	     *
	     * **See also:** [[ICommOpen]]
	     */
	    Comm.prototype.open = function (data, metadata) {
	        if (this.isDisposed || this._kernel.isDisposed) {
	            return;
	        }
	        var options = {
	            msgType: 'comm_open',
	            channel: 'shell',
	            username: this._kernel.username,
	            session: this._kernel.clientId
	        };
	        var content = {
	            comm_id: this._id,
	            target_name: this._target,
	            data: data || {}
	        };
	        var msg = createShellMessage(options, content, metadata);
	        return this._kernel.sendShellMessage(msg, false, true);
	    };
	    /**
	     * Send a `comm_msg` message to the kernel.
	     *
	     * #### Notes
	     * This is a no-op if the comm has been closed.
	     *
	     * **See also:** [[ICommMsg]]
	     */
	    Comm.prototype.send = function (data, metadata, buffers, disposeOnDone) {
	        if (buffers === void 0) { buffers = []; }
	        if (disposeOnDone === void 0) { disposeOnDone = true; }
	        if (this.isDisposed || this._kernel.isDisposed) {
	            return;
	        }
	        var options = {
	            msgType: 'comm_msg',
	            channel: 'shell',
	            username: this._kernel.username,
	            session: this._kernel.clientId
	        };
	        var content = {
	            comm_id: this._id,
	            data: data
	        };
	        var msg = createShellMessage(options, content, metadata, buffers);
	        return this._kernel.sendShellMessage(msg, false, true);
	    };
	    /**
	     * Close the comm.
	     *
	     * #### Notes
	     * This will send a `comm_close` message to the kernel, and call the
	     * `onClose` callback if set.
	     *
	     * This is a no-op if the comm is already closed.
	     *
	     * **See also:** [[ICommClose]], [[onClose]]
	     */
	    Comm.prototype.close = function (data, metadata) {
	        if (this.isDisposed || this._kernel.isDisposed) {
	            return;
	        }
	        var options = {
	            msgType: 'comm_msg',
	            channel: 'shell',
	            username: this._kernel.username,
	            session: this._kernel.clientId
	        };
	        var content = {
	            comm_id: this._id,
	            data: data || {}
	        };
	        var msg = createShellMessage(options, content, metadata);
	        var future = this._kernel.sendShellMessage(msg, false, true);
	        options.channel = 'iopub';
	        var ioMsg = createKernelMessage(options, content, metadata);
	        var onClose = this._onClose;
	        if (onClose) {
	            onClose(ioMsg);
	        }
	        this.dispose();
	        return future;
	    };
	    /**
	     * Dispose of the resources held by the comm.
	     */
	    Comm.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._onClose = null;
	        this._onMsg = null;
	        this._kernel = null;
	        _super.prototype.dispose.call(this);
	    };
	    return Comm;
	}(phosphor_disposable_1.DisposableDelegate));
	/**
	 * A private namespace for the Kernel.
	 */
	var Private;
	(function (Private) {
	    /**
	     * A signal emitted when the kernel status changes.
	     */
	    Private.statusChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted for iopub kernel messages.
	     */
	    Private.iopubMessageSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted for unhandled kernel message.
	     */
	    Private.unhandledMessageSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the specs change.
	     */
	    Private.specsChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the running kernels change.
	     */
	    Private.runningChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A module private store for running kernels.
	     */
	    Private.runningKernels = Object.create(null);
	    /**
	     * Restart a kernel.
	     */
	    function restartKernel(kernel, baseUrl, ajaxSettings) {
	        if (kernel.status === 'dead') {
	            return Promise.reject(new Error('Kernel is dead'));
	        }
	        var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, encodeURIComponent(kernel.id), 'restart');
	        ajaxSettings = ajaxSettings || {};
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            validate.validateKernelModel(success.data);
	        }, onKernelError);
	    }
	    Private.restartKernel = restartKernel;
	    /**
	     * Interrupt a kernel.
	     */
	    function interruptKernel(kernel, baseUrl, ajaxSettings) {
	        if (kernel.status === 'dead') {
	            return Promise.reject(new Error('Kernel is dead'));
	        }
	        var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, encodeURIComponent(kernel.id), 'interrupt');
	        ajaxSettings = ajaxSettings || {};
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        }, onKernelError);
	    }
	    Private.interruptKernel = interruptKernel;
	    /**
	     * Delete a kernel.
	     */
	    function shutdownKernel(id, baseUrl, ajaxSettings) {
	        var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, encodeURIComponent(id));
	        ajaxSettings = ajaxSettings || {};
	        ajaxSettings.method = 'DELETE';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        }, onKernelError);
	    }
	    Private.shutdownKernel = shutdownKernel;
	    /**
	     * Get a full kernel model from the server by kernel id string.
	     */
	    function getKernelModel(id, options) {
	        options = options || {};
	        var baseUrl = options.baseUrl || utils.getBaseUrl();
	        var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, encodeURIComponent(id));
	        var ajaxSettings = options.ajaxSettings || {};
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            var data = success.data;
	            validate.validateKernelModel(data);
	            return data;
	        }, Private.onKernelError);
	    }
	    Private.getKernelModel = getKernelModel;
	    /**
	     * Log the current kernel status.
	     */
	    function logKernelStatus(kernel) {
	        switch (kernel.status) {
	            case 'idle':
	            case 'busy':
	            case 'unknown':
	                return;
	            default:
	                console.log("Kernel: " + kernel.status + " (" + kernel.id + ")");
	                break;
	        }
	    }
	    Private.logKernelStatus = logKernelStatus;
	    /**
	     * Handle an error on a kernel Ajax call.
	     */
	    function onKernelError(error) {
	        var text = (error.throwError ||
	            error.xhr.statusText ||
	            error.xhr.responseText);
	        var msg = "API request failed: " + text;
	        console.error(msg);
	        return Promise.reject(error);
	    }
	    Private.onKernelError = onKernelError;
	    /**
	     * Send a kernel message to the kernel and resolve the reply message.
	     */
	    function handleShellMessage(kernel, msg) {
	        var future;
	        try {
	            future = kernel.sendShellMessage(msg, true);
	        }
	        catch (e) {
	            return Promise.reject(e);
	        }
	        return new Promise(function (resolve, reject) {
	            future.onReply = function (reply) {
	                resolve(reply);
	            };
	        });
	    }
	    Private.handleShellMessage = handleShellMessage;
	    /**
	     * Throw a typed error.
	     */
	    function typedThrow(msg) {
	        throw new Error(msg);
	    }
	    Private.typedThrow = typedThrow;
	})(Private || (Private = {}));


/***/ },
/* 21 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2015, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	'use strict';
	/**
	 * A disposable object which delegates to a callback.
	 */
	var DisposableDelegate = (function () {
	    /**
	     * Construct a new disposable delegate.
	     *
	     * @param callback - The function to invoke when the delegate is
	     *   disposed.
	     */
	    function DisposableDelegate(callback) {
	        this._callback = callback || null;
	    }
	    Object.defineProperty(DisposableDelegate.prototype, "isDisposed", {
	        /**
	         * Test whether the delegate has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property which is always safe to access.
	         */
	        get: function () {
	            return this._callback === null;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the delegate and invoke its callback.
	     *
	     * #### Notes
	     * If this method is called more than once, all calls made after the
	     * first will be a no-op.
	     */
	    DisposableDelegate.prototype.dispose = function () {
	        if (this._callback === null) {
	            return;
	        }
	        var callback = this._callback;
	        this._callback = null;
	        callback();
	    };
	    return DisposableDelegate;
	})();
	exports.DisposableDelegate = DisposableDelegate;
	/**
	 * An object which manages a collection of disposable items.
	 */
	var DisposableSet = (function () {
	    /**
	     * Construct a new disposable set.
	     *
	     * @param items - The initial disposable items for the set.
	     */
	    function DisposableSet(items) {
	        var _this = this;
	        this._set = new Set();
	        if (items)
	            items.forEach(function (item) { _this._set.add(item); });
	    }
	    Object.defineProperty(DisposableSet.prototype, "isDisposed", {
	        /**
	         * Test whether the set has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property which is always safe to access.
	         */
	        get: function () {
	            return this._set === null;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the set and dispose the items it contains.
	     *
	     * #### Notes
	     * Items are disposed in the order they are added to the set.
	     *
	     * It is unsafe to use the set after it has been disposed.
	     *
	     * If this method is called more than once, all calls made after the
	     * first will be a no-op.
	     */
	    DisposableSet.prototype.dispose = function () {
	        if (this._set === null) {
	            return;
	        }
	        var set = this._set;
	        this._set = null;
	        set.forEach(function (item) { item.dispose(); });
	    };
	    /**
	     * Add a disposable item to the set.
	     *
	     * @param item - The disposable item to add to the set. If the item
	     *   is already contained in the set, this is a no-op.
	     *
	     * @throws Will throw an error if the set has been disposed.
	     */
	    DisposableSet.prototype.add = function (item) {
	        if (this._set === null) {
	            throw new Error('object is disposed');
	        }
	        this._set.add(item);
	    };
	    /**
	     * Remove a disposable item from the set.
	     *
	     * @param item - The disposable item to remove from the set. If the
	     *   item does not exist in the set, this is a no-op.
	     *
	     * @throws Will throw an error if the set has been disposed.
	     */
	    DisposableSet.prototype.remove = function (item) {
	        if (this._set === null) {
	            throw new Error('object is disposed');
	        }
	        this._set.delete(item);
	    };
	    /**
	     * Clear all disposable items from the set.
	     *
	     * @throws Will throw an error if the set has been disposed.
	     */
	    DisposableSet.prototype.clear = function () {
	        if (this._set === null) {
	            throw new Error('object is disposed');
	        }
	        this._set.clear();
	    };
	    return DisposableSet;
	})();
	exports.DisposableSet = DisposableSet;
	//# sourceMappingURL=index.js.map

/***/ },
/* 22 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2015, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	'use strict';
	/**
	 * An object used for type-safe inter-object communication.
	 *
	 * #### Notes
	 * Signals provide a type-safe implementation of the publish-subscribe
	 * pattern. An object (publisher) declares which signals it will emit,
	 * and consumers connect callbacks (subscribers) to those signals. The
	 * subscribers are invoked whenever the publisher emits the signal.
	 *
	 * A `Signal` object must be bound to a sender in order to be useful.
	 * A common pattern is to declare a `Signal` object as a static class
	 * member, along with a convenience getter which binds the signal to
	 * the `this` instance on-demand.
	 *
	 * #### Example
	 * ```typescript
	 * import { ISignal, Signal } from 'phosphor-signaling';
	 *
	 * class MyClass {
	 *
	 *   static valueChangedSignal = new Signal<MyClass, number>();
	 *
	 *   constructor(name: string) {
	 *     this._name = name;
	 *   }
	 *
	 *   get valueChanged(): ISignal<MyClass, number> {
	 *     return MyClass.valueChangedSignal.bind(this);
	 *   }
	 *
	 *   get name(): string {
	 *     return this._name;
	 *   }
	 *
	 *   get value(): number {
	 *     return this._value;
	 *   }
	 *
	 *   set value(value: number) {
	 *     if (value !== this._value) {
	 *       this._value = value;
	 *       this.valueChanged.emit(value);
	 *     }
	 *   }
	 *
	 *   private _name: string;
	 *   private _value = 0;
	 * }
	 *
	 * function logger(sender: MyClass, value: number): void {
	 *   console.log(sender.name, value);
	 * }
	 *
	 * let m1 = new MyClass('foo');
	 * let m2 = new MyClass('bar');
	 *
	 * m1.valueChanged.connect(logger);
	 * m2.valueChanged.connect(logger);
	 *
	 * m1.value = 42;  // logs: foo 42
	 * m2.value = 17;  // logs: bar 17
	 * ```
	 */
	var Signal = (function () {
	    function Signal() {
	    }
	    /**
	     * Bind the signal to a specific sender.
	     *
	     * @param sender - The sender object to bind to the signal.
	     *
	     * @returns The bound signal object which can be used for connecting,
	     *   disconnecting, and emitting the signal.
	     */
	    Signal.prototype.bind = function (sender) {
	        return new BoundSignal(this, sender);
	    };
	    return Signal;
	})();
	exports.Signal = Signal;
	/**
	 * Remove all connections where the given object is the sender.
	 *
	 * @param sender - The sender object of interest.
	 *
	 * #### Example
	 * ```typescript
	 * disconnectSender(someObject);
	 * ```
	 */
	function disconnectSender(sender) {
	    var list = senderMap.get(sender);
	    if (!list) {
	        return;
	    }
	    var conn = list.first;
	    while (conn !== null) {
	        removeFromSendersList(conn);
	        conn.callback = null;
	        conn.thisArg = null;
	        conn = conn.nextReceiver;
	    }
	    senderMap.delete(sender);
	}
	exports.disconnectSender = disconnectSender;
	/**
	 * Remove all connections where the given object is the receiver.
	 *
	 * @param receiver - The receiver object of interest.
	 *
	 * #### Notes
	 * If a `thisArg` is provided when connecting a signal, that object
	 * is considered the receiver. Otherwise, the `callback` is used as
	 * the receiver.
	 *
	 * #### Example
	 * ```typescript
	 * // disconnect a regular object receiver
	 * disconnectReceiver(myObject);
	 *
	 * // disconnect a plain callback receiver
	 * disconnectReceiver(myCallback);
	 * ```
	 */
	function disconnectReceiver(receiver) {
	    var conn = receiverMap.get(receiver);
	    if (!conn) {
	        return;
	    }
	    while (conn !== null) {
	        var next = conn.nextSender;
	        conn.callback = null;
	        conn.thisArg = null;
	        conn.prevSender = null;
	        conn.nextSender = null;
	        conn = next;
	    }
	    receiverMap.delete(receiver);
	}
	exports.disconnectReceiver = disconnectReceiver;
	/**
	 * Clear all signal data associated with the given object.
	 *
	 * @param obj - The object for which the signal data should be cleared.
	 *
	 * #### Notes
	 * This removes all signal connections where the object is used as
	 * either the sender or the receiver.
	 *
	 * #### Example
	 * ```typescript
	 * clearSignalData(someObject);
	 * ```
	 */
	function clearSignalData(obj) {
	    disconnectSender(obj);
	    disconnectReceiver(obj);
	}
	exports.clearSignalData = clearSignalData;
	/**
	 * A concrete implementation of ISignal.
	 */
	var BoundSignal = (function () {
	    /**
	     * Construct a new bound signal.
	     */
	    function BoundSignal(signal, sender) {
	        this._signal = signal;
	        this._sender = sender;
	    }
	    /**
	     * Connect a callback to the signal.
	     */
	    BoundSignal.prototype.connect = function (callback, thisArg) {
	        return connect(this._sender, this._signal, callback, thisArg);
	    };
	    /**
	     * Disconnect a callback from the signal.
	     */
	    BoundSignal.prototype.disconnect = function (callback, thisArg) {
	        return disconnect(this._sender, this._signal, callback, thisArg);
	    };
	    /**
	     * Emit the signal and invoke the connected callbacks.
	     */
	    BoundSignal.prototype.emit = function (args) {
	        emit(this._sender, this._signal, args);
	    };
	    return BoundSignal;
	})();
	/**
	 * A struct which holds connection data.
	 */
	var Connection = (function () {
	    function Connection() {
	        /**
	         * The signal for the connection.
	         */
	        this.signal = null;
	        /**
	         * The callback connected to the signal.
	         */
	        this.callback = null;
	        /**
	         * The `this` context for the callback.
	         */
	        this.thisArg = null;
	        /**
	         * The next connection in the singly linked receivers list.
	         */
	        this.nextReceiver = null;
	        /**
	         * The next connection in the doubly linked senders list.
	         */
	        this.nextSender = null;
	        /**
	         * The previous connection in the doubly linked senders list.
	         */
	        this.prevSender = null;
	    }
	    return Connection;
	})();
	/**
	 * The list of receiver connections for a specific sender.
	 */
	var ConnectionList = (function () {
	    function ConnectionList() {
	        /**
	         * The ref count for the list.
	         */
	        this.refs = 0;
	        /**
	         * The first connection in the list.
	         */
	        this.first = null;
	        /**
	         * The last connection in the list.
	         */
	        this.last = null;
	    }
	    return ConnectionList;
	})();
	/**
	 * A mapping of sender object to its receiver connection list.
	 */
	var senderMap = new WeakMap();
	/**
	 * A mapping of receiver object to its sender connection list.
	 */
	var receiverMap = new WeakMap();
	/**
	 * Create a connection between a sender, signal, and callback.
	 */
	function connect(sender, signal, callback, thisArg) {
	    // Coerce a `null` thisArg to `undefined`.
	    thisArg = thisArg || void 0;
	    // Search for an equivalent connection and bail if one exists.
	    var list = senderMap.get(sender);
	    if (list && findConnection(list, signal, callback, thisArg)) {
	        return false;
	    }
	    // Create a new connection.
	    var conn = new Connection();
	    conn.signal = signal;
	    conn.callback = callback;
	    conn.thisArg = thisArg;
	    // Add the connection to the receivers list.
	    if (!list) {
	        list = new ConnectionList();
	        list.first = conn;
	        list.last = conn;
	        senderMap.set(sender, list);
	    }
	    else if (list.last === null) {
	        list.first = conn;
	        list.last = conn;
	    }
	    else {
	        list.last.nextReceiver = conn;
	        list.last = conn;
	    }
	    // Add the connection to the senders list.
	    var receiver = thisArg || callback;
	    var head = receiverMap.get(receiver);
	    if (head) {
	        head.prevSender = conn;
	        conn.nextSender = head;
	    }
	    receiverMap.set(receiver, conn);
	    return true;
	}
	/**
	 * Break the connection between a sender, signal, and callback.
	 */
	function disconnect(sender, signal, callback, thisArg) {
	    // Coerce a `null` thisArg to `undefined`.
	    thisArg = thisArg || void 0;
	    // Search for an equivalent connection and bail if none exists.
	    var list = senderMap.get(sender);
	    if (!list) {
	        return false;
	    }
	    var conn = findConnection(list, signal, callback, thisArg);
	    if (!conn) {
	        return false;
	    }
	    // Remove the connection from the senders list. It will be removed
	    // from the receivers list the next time the signal is emitted.
	    removeFromSendersList(conn);
	    // Clear the connection data so it becomes a dead connection.
	    conn.callback = null;
	    conn.thisArg = null;
	    return true;
	}
	/**
	 * Emit a signal and invoke the connected callbacks.
	 */
	function emit(sender, signal, args) {
	    // If there is no connection list, there is nothing to do.
	    var list = senderMap.get(sender);
	    if (!list) {
	        return;
	    }
	    // Prepare to dispatch the callbacks. Increment the reference count
	    // on the list so that the list is cleaned only when the emit stack
	    // is fully unwound.
	    list.refs++;
	    var dirty = false;
	    var last = list.last;
	    var conn = list.first;
	    // Dispatch the callbacks. If a connection has a null callback, it
	    // indicates the list is dirty. Connections which match the signal
	    // are safely dispatched where all exceptions are logged. Dispatch
	    // is stopped at the last connection for the current stack frame.
	    while (conn !== null) {
	        if (!conn.callback) {
	            dirty = true;
	        }
	        else if (conn.signal === signal) {
	            safeInvoke(conn, sender, args);
	        }
	        if (conn === last) {
	            break;
	        }
	        conn = conn.nextReceiver;
	    }
	    // Decrement the reference count on the list.
	    list.refs--;
	    // Clean the list if it's dirty and the emit stack is fully unwound.
	    if (dirty && list.refs === 0) {
	        cleanList(list);
	    }
	}
	/**
	 * Safely invoke the callback for the given connection.
	 *
	 * Exceptions thrown by the callback will be caught and logged.
	 */
	function safeInvoke(conn, sender, args) {
	    try {
	        conn.callback.call(conn.thisArg, sender, args);
	    }
	    catch (err) {
	        console.error('Exception in signal handler:', err);
	    }
	}
	/**
	 * Find a matching connection in the given connection list.
	 *
	 * Returns `null` if no matching connection is found.
	 */
	function findConnection(list, signal, callback, thisArg) {
	    var conn = list.first;
	    while (conn !== null) {
	        if (conn.signal === signal &&
	            conn.callback === callback &&
	            conn.thisArg === thisArg) {
	            return conn;
	        }
	        conn = conn.nextReceiver;
	    }
	    return null;
	}
	/**
	 * Remove the dead connections from the given connection list.
	 */
	function cleanList(list) {
	    var prev;
	    var conn = list.first;
	    while (conn !== null) {
	        var next = conn.nextReceiver;
	        if (!conn.callback) {
	            conn.nextReceiver = null;
	        }
	        else if (!prev) {
	            list.first = conn;
	            prev = conn;
	        }
	        else {
	            prev.nextReceiver = conn;
	            prev = conn;
	        }
	        conn = next;
	    }
	    if (!prev) {
	        list.first = null;
	        list.last = null;
	    }
	    else {
	        prev.nextReceiver = null;
	        list.last = prev;
	    }
	}
	/**
	 * Remove a connection from the doubly linked list of senders.
	 */
	function removeFromSendersList(conn) {
	    var receiver = conn.thisArg || conn.callback;
	    if (!receiver) {
	        return;
	    }
	    var prev = conn.prevSender;
	    var next = conn.nextSender;
	    if (prev === null && next === null) {
	        receiverMap.delete(receiver);
	    }
	    else if (prev === null) {
	        receiverMap.set(receiver, next);
	        next.prevSender = null;
	    }
	    else if (next === null) {
	        prev.nextSender = null;
	    }
	    else {
	        prev.nextSender = next;
	        next.prevSender = prev;
	    }
	    conn.prevSender = null;
	    conn.nextSender = null;
	}
	//# sourceMappingURL=index.js.map

/***/ },
/* 23 */
/***/ function(module, exports) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	"use strict";
	/**
	 * Test whether a JSON value is a primitive.
	 *
	 * @param value - The JSON value of interest.
	 *
	 * @returns `true` if the value is a primitive or `null`,
	 *   `false` otherwise.
	 */
	function isPrimitive(value) {
	    return (value === null ||
	        typeof value === 'boolean' ||
	        typeof value === 'number' ||
	        typeof value === 'string');
	}
	exports.isPrimitive = isPrimitive;
	/**
	 * Test whether a JSON value is an array.
	 *
	 * @param value - The JSON value of interest.
	 *
	 * @returns `true` if the value is a an array, `false` otherwise.
	 */
	function isArray(value) {
	    return Array.isArray(value);
	}
	exports.isArray = isArray;
	/**
	 * Test whether a JSON value is an object.
	 *
	 * @param value - The JSON value of interest.
	 *
	 * @returns `true` if the value is a an object, `false` otherwise.
	 */
	function isObject(value) {
	    return !isPrimitive(value) && !isArray(value);
	}
	exports.isObject = isObject;
	/**
	 * Compare two JSON values for deep equality.
	 *
	 * @param first - The first JSON value of interest.
	 *
	 * @param second - The second JSON value of interest.
	 *
	 * @returns `true` if the values are equivalent, `false` otherwise.
	 */
	function deepEqual(first, second) {
	    // Check referential and primitive equality first.
	    if (first === second) {
	        return true;
	    }
	    // If one is a primitive, the `===` check ruled out the other.
	    if (isPrimitive(first) || isPrimitive(second)) {
	        return false;
	    }
	    // Bail if either is `undefined`.
	    if (!first || !second) {
	        return false;
	    }
	    // Test whether they are arrays.
	    var a1 = isArray(first);
	    var a2 = isArray(second);
	    // Bail if the types are different.
	    if (a1 !== a2) {
	        return false;
	    }
	    // If they are both arrays, compare them.
	    if (a1 && a2) {
	        return Private.arrayEqual(first, second);
	    }
	    // At this point, they must both be objects.
	    return Private.objectEqual(first, second);
	}
	exports.deepEqual = deepEqual;
	/**
	 * The namespace for the private module data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * Compare two JSON arrays for deep equality.
	     */
	    function arrayEqual(first, second) {
	        // Test the arrays for equal length.
	        if (first.length !== second.length) {
	            return false;
	        }
	        // Compare the values for equality.
	        for (var i = 0, n = first.length; i < n; ++i) {
	            if (!deepEqual(first[i], second[i])) {
	                return false;
	            }
	        }
	        // At this point, the arrays are equal.
	        return true;
	    }
	    Private.arrayEqual = arrayEqual;
	    /**
	     * Compare two JSON objects for deep equality.
	     */
	    function objectEqual(first, second) {
	        // Get the keys for each object.
	        var k1 = Object.keys(first);
	        var k2 = Object.keys(second);
	        // Test the keys for equal length.
	        if (k1.length !== k2.length) {
	            return false;
	        }
	        // Sort the keys for equivalent order.
	        k1.sort();
	        k2.sort();
	        // Compare the keys for equality.
	        for (var i = 0, n = k1.length; i < n; ++i) {
	            if (k1[i] !== k2[i]) {
	                return false;
	            }
	        }
	        // Compare the values for equality.
	        for (var i = 0, n = k1.length; i < n; ++i) {
	            if (!deepEqual(first[k1[i]], second[k1[i]])) {
	                return false;
	            }
	        }
	        // At this point, the objects are equal.
	        return true;
	    }
	    Private.objectEqual = objectEqual;
	})(Private || (Private = {}));


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate) {// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var phosphor_disposable_1 = __webpack_require__(21);
	var ikernel_1 = __webpack_require__(19);
	/**
	 * Implementation of a kernel future.
	 */
	var KernelFutureHandler = (function (_super) {
	    __extends(KernelFutureHandler, _super);
	    /**
	     * Construct a new KernelFutureHandler.
	     */
	    function KernelFutureHandler(cb, msg, expectShell, disposeOnDone) {
	        _super.call(this, cb);
	        this._msg = null;
	        this._status = 0;
	        this._stdin = null;
	        this._iopub = null;
	        this._reply = null;
	        this._done = null;
	        this._hooks = new Private.HookList();
	        this._disposeOnDone = true;
	        this._msg = msg;
	        if (!expectShell) {
	            this._setFlag(Private.KernelFutureFlag.GotReply);
	        }
	        this._disposeOnDone = disposeOnDone;
	    }
	    Object.defineProperty(KernelFutureHandler.prototype, "msg", {
	        /**
	         * Get the original outgoing message.
	         */
	        get: function () {
	            return this._msg;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelFutureHandler.prototype, "isDone", {
	        /**
	         * Check for message done state.
	         */
	        get: function () {
	            return this._testFlag(Private.KernelFutureFlag.IsDone);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelFutureHandler.prototype, "onReply", {
	        /**
	         * Get the reply handler.
	         */
	        get: function () {
	            return this._reply;
	        },
	        /**
	         * Set the reply handler.
	         */
	        set: function (cb) {
	            this._reply = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelFutureHandler.prototype, "onIOPub", {
	        /**
	         * Get the iopub handler.
	         */
	        get: function () {
	            return this._iopub;
	        },
	        /**
	         * Set the iopub handler.
	         */
	        set: function (cb) {
	            this._iopub = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelFutureHandler.prototype, "onDone", {
	        /**
	         * Get the done handler.
	         */
	        get: function () {
	            return this._done;
	        },
	        /**
	         * Set the done handler.
	         */
	        set: function (cb) {
	            this._done = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(KernelFutureHandler.prototype, "onStdin", {
	        /**
	         * Get the stdin handler.
	         */
	        get: function () {
	            return this._stdin;
	        },
	        /**
	         * Set the stdin handler.
	         */
	        set: function (cb) {
	            this._stdin = cb;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Register hook for IOPub messages.
	     *
	     * @param hook - The callback invoked for an IOPub message.
	     *
	     * #### Notes
	     * The IOPub hook system allows you to preempt the handlers for IOPub messages handled
	     * by the future. The most recently registered hook is run first.
	     * If the hook returns false, any later hooks and the future's onIOPub handler will not run.
	     * If a hook throws an error, the error is logged to the console and the next hook is run.
	     * If a hook is registered during the hook processing, it won't run until the next message.
	     * If a hook is removed during the hook processing, it will be deactivated immediately.
	     */
	    KernelFutureHandler.prototype.registerMessageHook = function (hook) {
	        this._hooks.add(hook);
	    };
	    /**
	     * Remove a hook for IOPub messages.
	     *
	     * @param hook - The hook to remove.
	     *
	     * #### Notes
	     * If a hook is removed during the hook processing, it will be deactivated immediately.
	     */
	    KernelFutureHandler.prototype.removeMessageHook = function (hook) {
	        if (this.isDisposed) {
	            return;
	        }
	        this._hooks.remove(hook);
	    };
	    /**
	     * Dispose and unregister the future.
	     */
	    KernelFutureHandler.prototype.dispose = function () {
	        this._stdin = null;
	        this._iopub = null;
	        this._reply = null;
	        this._done = null;
	        this._msg = null;
	        if (this._hooks) {
	            this._hooks.dispose();
	        }
	        this._hooks = null;
	        _super.prototype.dispose.call(this);
	    };
	    /**
	     * Handle an incoming kernel message.
	     */
	    KernelFutureHandler.prototype.handleMsg = function (msg) {
	        switch (msg.channel) {
	            case 'shell':
	                this._handleReply(msg);
	                break;
	            case 'stdin':
	                this._handleStdin(msg);
	                break;
	            case 'iopub':
	                this._handleIOPub(msg);
	                break;
	        }
	    };
	    KernelFutureHandler.prototype._handleReply = function (msg) {
	        var reply = this._reply;
	        if (reply) {
	            reply(msg);
	        }
	        this._setFlag(Private.KernelFutureFlag.GotReply);
	        if (this._testFlag(Private.KernelFutureFlag.GotIdle)) {
	            this._handleDone();
	        }
	    };
	    KernelFutureHandler.prototype._handleStdin = function (msg) {
	        var stdin = this._stdin;
	        if (stdin) {
	            stdin(msg);
	        }
	    };
	    KernelFutureHandler.prototype._handleIOPub = function (msg) {
	        var process = this._hooks.process(msg);
	        var iopub = this._iopub;
	        if (process && iopub) {
	            iopub(msg);
	        }
	        if (ikernel_1.KernelMessage.isStatusMsg(msg) &&
	            msg.content.execution_state === 'idle') {
	            this._setFlag(Private.KernelFutureFlag.GotIdle);
	            if (this._testFlag(Private.KernelFutureFlag.GotReply)) {
	                this._handleDone();
	            }
	        }
	    };
	    KernelFutureHandler.prototype._handleDone = function () {
	        if (this.isDone) {
	            return;
	        }
	        this._setFlag(Private.KernelFutureFlag.IsDone);
	        var done = this._done;
	        if (done)
	            done();
	        this._done = null;
	        if (this._disposeOnDone) {
	            this.dispose();
	        }
	    };
	    /**
	     * Test whether the given future flag is set.
	     */
	    KernelFutureHandler.prototype._testFlag = function (flag) {
	        return (this._status & flag) !== 0;
	    };
	    /**
	     * Set the given future flag.
	     */
	    KernelFutureHandler.prototype._setFlag = function (flag) {
	        this._status |= flag;
	    };
	    return KernelFutureHandler;
	}(phosphor_disposable_1.DisposableDelegate));
	exports.KernelFutureHandler = KernelFutureHandler;
	var Private;
	(function (Private) {
	    /**
	     * A polyfill for a function to run code outside of the current execution context.
	     */
	    var defer = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setImmediate;
	    var HookList = (function () {
	        function HookList() {
	            this._hooks = [];
	        }
	        /**
	         * Register a hook.
	         *
	         * @param hook - The callback to register.
	         */
	        HookList.prototype.add = function (hook) {
	            this.remove(hook);
	            this._hooks.push(hook);
	        };
	        /**
	         * Remove a hook.
	         *
	         * @param hook - The callback to remove.
	         */
	        HookList.prototype.remove = function (hook) {
	            if (this.isDisposed) {
	                return;
	            }
	            var index = this._hooks.indexOf(hook);
	            if (index >= 0) {
	                this._hooks[index] = null;
	                this._scheduleCompact();
	            }
	        };
	        /**
	         * Process a message through the hooks.
	         *
	         * #### Notes
	         * The most recently registered hook is run first.
	         * If the hook returns false, any later hooks will not run.
	         * If a hook throws an error, the error is logged to the console and the next hook is run.
	         * If a hook is registered during the hook processing, it won't run until the next message.
	         * If a hook is removed during the hook processing, it will be deactivated immediately.
	         */
	        HookList.prototype.process = function (msg) {
	            var continueHandling;
	            // most recently-added hook is called first
	            for (var i = this._hooks.length - 1; i >= 0; i--) {
	                var hook = this._hooks[i];
	                if (hook === null) {
	                    continue;
	                }
	                try {
	                    continueHandling = hook(msg);
	                }
	                catch (err) {
	                    continueHandling = true;
	                    console.error(err);
	                }
	                if (continueHandling === false) {
	                    return false;
	                }
	            }
	            return true;
	        };
	        Object.defineProperty(HookList.prototype, "isDisposed", {
	            /**
	             * Test whether the HookList has been disposed.
	             *
	             * #### Notes
	             * This is a read-only property which is always safe to access.
	             */
	            get: function () {
	                return (this._hooks === null);
	            },
	            enumerable: true,
	            configurable: true
	        });
	        /**
	         * Dispose the hook list.
	         */
	        HookList.prototype.dispose = function () {
	            this._hooks = null;
	        };
	        /**
	         * Schedule a cleanup of the list, removing any hooks that have been nulled out.
	         */
	        HookList.prototype._scheduleCompact = function () {
	            var _this = this;
	            if (!this._cleanupScheduled) {
	                this._cleanupScheduled = true;
	                defer(function () {
	                    _this._cleanupScheduled = false;
	                    _this._compact();
	                });
	            }
	        };
	        /**
	         * Compact the list, removing any nulls.
	         */
	        HookList.prototype._compact = function () {
	            if (this.isDisposed) {
	                return;
	            }
	            var numNulls = 0;
	            for (var i = 0, len = this._hooks.length; i < len; i++) {
	                var hook = this._hooks[i];
	                if (this._hooks[i] === null) {
	                    numNulls++;
	                }
	                else {
	                    this._hooks[i - numNulls] = hook;
	                }
	            }
	            this._hooks.length -= numNulls;
	        };
	        return HookList;
	    }());
	    Private.HookList = HookList;
	    /**
	     * Bit flags for the kernel future state.
	     */
	    (function (KernelFutureFlag) {
	        KernelFutureFlag[KernelFutureFlag["GotReply"] = 1] = "GotReply";
	        KernelFutureFlag[KernelFutureFlag["GotIdle"] = 2] = "GotIdle";
	        KernelFutureFlag[KernelFutureFlag["IsDone"] = 4] = "IsDone";
	        KernelFutureFlag[KernelFutureFlag["DisposeOnDone"] = 8] = "DisposeOnDone";
	    })(Private.KernelFutureFlag || (Private.KernelFutureFlag = {}));
	    var KernelFutureFlag = Private.KernelFutureFlag;
	})(Private || (Private = {}));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(25).setImmediate))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;
	
	// DOM APIs, for completeness
	
	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };
	
	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};
	
	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};
	
	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};
	
	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);
	
	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};
	
	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
	
	  immediateIds[id] = true;
	
	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });
	
	  return id;
	};
	
	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(25).setImmediate, __webpack_require__(25).clearImmediate))

/***/ },
/* 26 */
/***/ function(module, exports) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	/**
	 * Deserialize and return the unpacked message.
	 *
	 * #### Notes
	 * Handles JSON blob strings and binary messages.
	 */
	function deserialize(data) {
	    var value;
	    if (typeof data === 'string') {
	        value = JSON.parse(data);
	    }
	    else {
	        value = deserializeBinary(data);
	    }
	    return value;
	}
	exports.deserialize = deserialize;
	/**
	 * Serialize a kernel message for transport.
	 *
	 * #### Notes
	 * If there is binary content, an `ArrayBuffer` is returned,
	 * otherwise the message is converted to a JSON string.
	 */
	function serialize(msg) {
	    var value;
	    if (msg.buffers && msg.buffers.length) {
	        value = serializeBinary(msg);
	    }
	    else {
	        value = JSON.stringify(msg);
	    }
	    return value;
	}
	exports.serialize = serialize;
	/**
	 * Deserialize a binary message to a Kernel Message.
	 */
	function deserializeBinary(buf) {
	    var data = new DataView(buf);
	    // read the header: 1 + nbufs 32b integers
	    var nbufs = data.getUint32(0);
	    var offsets = [];
	    if (nbufs < 2) {
	        throw new Error('Invalid incoming Kernel Message');
	    }
	    for (var i = 1; i <= nbufs; i++) {
	        offsets.push(data.getUint32(i * 4));
	    }
	    var jsonBytes = new Uint8Array(buf.slice(offsets[0], offsets[1]));
	    var msg = JSON.parse((new TextDecoder('utf8')).decode(jsonBytes));
	    // the remaining chunks are stored as DataViews in msg.buffers
	    msg.buffers = [];
	    for (var i = 1; i < nbufs; i++) {
	        var start = offsets[i];
	        var stop = offsets[i + 1] || buf.byteLength;
	        msg.buffers.push(new DataView(buf.slice(start, stop)));
	    }
	    return msg;
	}
	/**
	 * Implement the binary serialization protocol.
	 *
	 * Serialize Kernel message to ArrayBuffer.
	 */
	function serializeBinary(msg) {
	    var offsets = [];
	    var buffers = [];
	    var encoder = new TextEncoder('utf8');
	    var jsonUtf8 = encoder.encode(JSON.stringify(msg, replaceBuffers));
	    buffers.push(jsonUtf8.buffer);
	    for (var i = 0; i < msg.buffers.length; i++) {
	        // msg.buffers elements could be either views or ArrayBuffers
	        // buffers elements are ArrayBuffers
	        var b = msg.buffers[i];
	        buffers.push(b instanceof ArrayBuffer ? b : b.buffer);
	    }
	    var nbufs = buffers.length;
	    offsets.push(4 * (nbufs + 1));
	    for (var i = 0; i + 1 < buffers.length; i++) {
	        offsets.push(offsets[offsets.length - 1] + buffers[i].byteLength);
	    }
	    var msgBuf = new Uint8Array(offsets[offsets.length - 1] + buffers[buffers.length - 1].byteLength);
	    // use DataView.setUint32 for network byte-order
	    var view = new DataView(msgBuf.buffer);
	    // write nbufs to first 4 bytes
	    view.setUint32(0, nbufs);
	    // write offsets to next 4 * nbufs bytes
	    for (var i = 0; i < offsets.length; i++) {
	        view.setUint32(4 * (i + 1), offsets[i]);
	    }
	    // write all the buffers at their respective offsets
	    for (var i = 0; i < buffers.length; i++) {
	        msgBuf.set(new Uint8Array(buffers[i]), offsets[i]);
	    }
	    return msgBuf.buffer;
	}
	/**
	 * Filter `"buffers"` key for `JSON.stringify`.
	 */
	function replaceBuffers(key, value) {
	    if (key === 'buffers') {
	        return undefined;
	    }
	    return value;
	}


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	"use strict";
	var utils_1 = __webpack_require__(2);
	var phosphor_signaling_1 = __webpack_require__(22);
	var contents_1 = __webpack_require__(13);
	var kernel_1 = __webpack_require__(20);
	var session_1 = __webpack_require__(28);
	var terminals_1 = __webpack_require__(29);
	/**
	 * Create a new service manager.
	 *
	 * @param options - The service manager creation options.
	 *
	 * @returns A promise that resolves with a service manager.
	 */
	function createServiceManager(options) {
	    if (options === void 0) { options = {}; }
	    options.baseUrl = options.baseUrl || utils_1.getBaseUrl();
	    options.ajaxSettings = options.ajaxSettings || {};
	    if (options.kernelspecs) {
	        return Promise.resolve(new ServiceManager(options));
	    }
	    var kernelOptions = {
	        baseUrl: options.baseUrl,
	        ajaxSettings: options.ajaxSettings
	    };
	    return kernel_1.getKernelSpecs(kernelOptions).then(function (specs) {
	        options.kernelspecs = specs;
	        return new ServiceManager(options);
	    });
	}
	exports.createServiceManager = createServiceManager;
	/**
	 * An implementation of a services manager.
	 */
	var ServiceManager = (function () {
	    /**
	     * Construct a new services provider.
	     */
	    function ServiceManager(options) {
	        this._kernelManager = null;
	        this._sessionManager = null;
	        this._contentsManager = null;
	        this._terminalManager = null;
	        this._kernelspecs = null;
	        this._isDisposed = false;
	        var subOptions = {
	            baseUrl: options.baseUrl,
	            ajaxSettings: options.ajaxSettings
	        };
	        this._kernelspecs = options.kernelspecs;
	        this._kernelManager = new kernel_1.KernelManager(subOptions);
	        this._sessionManager = new session_1.SessionManager(subOptions);
	        this._contentsManager = new contents_1.ContentsManager(subOptions);
	        this._terminalManager = new terminals_1.TerminalManager(subOptions);
	        this._kernelManager.specsChanged.connect(this._onSpecsChanged, this);
	        this._sessionManager.specsChanged.connect(this._onSpecsChanged, this);
	    }
	    Object.defineProperty(ServiceManager.prototype, "specsChanged", {
	        /**
	         * A signal emitted when the specs change on the service manager.
	         */
	        get: function () {
	            return Private.specsChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ServiceManager.prototype, "isDisposed", {
	        /**
	         * Test whether the terminal manager is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._isDisposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the resources used by the manager.
	     */
	    ServiceManager.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._isDisposed = true;
	        phosphor_signaling_1.clearSignalData(this);
	    };
	    Object.defineProperty(ServiceManager.prototype, "kernelspecs", {
	        /**
	         * Get kernel specs.
	         */
	        get: function () {
	            return this._kernelspecs;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ServiceManager.prototype, "kernels", {
	        /**
	         * Get kernel manager instance.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._kernelManager;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ServiceManager.prototype, "sessions", {
	        /**
	         * Get the session manager instance.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._sessionManager;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ServiceManager.prototype, "contents", {
	        /**
	         * Get the contents manager instance.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._contentsManager;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ServiceManager.prototype, "terminals", {
	        /**
	         * Get the terminal manager instance.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._terminalManager;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Handle a change in kernel specs.
	     */
	    ServiceManager.prototype._onSpecsChanged = function (sender, args) {
	        this._kernelspecs = args;
	        this.specsChanged.emit(args);
	    };
	    return ServiceManager;
	}());
	exports.ServiceManager = ServiceManager;
	/**
	 * A namespace for private data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * A signal emitted when the specs change.
	     */
	    Private.specsChangedSignal = new phosphor_signaling_1.Signal();
	})(Private || (Private = {}));


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	'use strict';
	var phosphor_signaling_1 = __webpack_require__(22);
	var json_1 = __webpack_require__(23);
	var kernel_1 = __webpack_require__(20);
	var utils = __webpack_require__(2);
	var validate = __webpack_require__(18);
	/**
	 * The url for the session service.
	 */
	var SESSION_SERVICE_URL = 'api/sessions';
	/**
	 * An implementation of a session manager.
	 */
	var SessionManager = (function () {
	    /**
	     * Construct a new session manager.
	     *
	     * @param options - The default options for each session.
	     */
	    function SessionManager(options) {
	        this._options = null;
	        this._isDisposed = false;
	        this._running = [];
	        this._specs = null;
	        this._options = utils.copy(options || {});
	    }
	    Object.defineProperty(SessionManager.prototype, "specsChanged", {
	        /**
	         * A signal emitted when the kernel specs change.
	         */
	        get: function () {
	            return Private.specsChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(SessionManager.prototype, "runningChanged", {
	        /**
	         * A signal emitted when the running sessions change.
	         */
	        get: function () {
	            return Private.runningChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(SessionManager.prototype, "isDisposed", {
	        /**
	         * Test whether the terminal manager is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._isDisposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the resources used by the manager.
	     */
	    SessionManager.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._isDisposed = true;
	        phosphor_signaling_1.clearSignalData(this);
	        this._running = [];
	    };
	    /**
	     * Get the available kernel specs. See also [[getKernelSpecs]].
	     *
	     * @param options - Overrides for the default options.
	     */
	    SessionManager.prototype.getSpecs = function (options) {
	        var _this = this;
	        return kernel_1.getKernelSpecs(this._getOptions(options)).then(function (specs) {
	            if (!json_1.deepEqual(specs, _this._specs)) {
	                _this._specs = specs;
	                _this.specsChanged.emit(specs);
	            }
	            return specs;
	        });
	    };
	    /**
	     * List the running sessions.  See also [[listRunningSessions]].
	     *
	     * @param options - Overrides for the default options.
	     */
	    SessionManager.prototype.listRunning = function (options) {
	        var _this = this;
	        return listRunningSessions(this._getOptions(options)).then(function (running) {
	            if (!json_1.deepEqual(running, _this._running)) {
	                _this._running = running.slice();
	                _this.runningChanged.emit(running);
	            }
	            return running;
	        });
	    };
	    /**
	     * Start a new session.  See also [[startNewSession]].
	     *
	     * @param options - Overrides for the default options, must include a
	     *   `'path'`.
	     *
	     * #### Notes
	     * This will emit [[runningChanged]] if the running kernels list
	     * changes.
	     */
	    SessionManager.prototype.startNew = function (options) {
	        return startNewSession(this._getOptions(options));
	    };
	    /**
	     * Find a session by id.
	     */
	    SessionManager.prototype.findById = function (id, options) {
	        return findSessionById(id, this._getOptions(options));
	    };
	    /**
	     * Find a session by path.
	     */
	    SessionManager.prototype.findByPath = function (path, options) {
	        return findSessionByPath(path, this._getOptions(options));
	    };
	    /*
	     * Connect to a running session.  See also [[connectToSession]].
	     */
	    SessionManager.prototype.connectTo = function (id, options) {
	        return connectToSession(id, this._getOptions(options));
	    };
	    /**
	     * Shut down a session by id.
	     *
	     * #### Notes
	     * This will emit [[runningChanged]] if the running kernels list
	     * changes.
	     */
	    SessionManager.prototype.shutdown = function (id, options) {
	        return shutdownSession(id, this._getOptions(options));
	    };
	    /**
	     * Get optionally overidden options.
	     */
	    SessionManager.prototype._getOptions = function (options) {
	        if (options) {
	            options = utils.extend(utils.copy(this._options), options);
	        }
	        else {
	            options = this._options;
	        }
	        return options;
	    };
	    return SessionManager;
	}());
	exports.SessionManager = SessionManager;
	/**
	 * List the running sessions.
	 *
	 * #### Notes
	 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
	 *
	 * All client-side sessions are updated with current information.
	 *
	 * The promise is fulfilled on a valid response and rejected otherwise.
	 */
	function listRunningSessions(options) {
	    options = options || {};
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
	    var ajaxSettings = utils.copy(options.ajaxSettings || {});
	    ajaxSettings.method = 'GET';
	    ajaxSettings.dataType = 'json';
	    ajaxSettings.cache = false;
	    return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	        if (success.xhr.status !== 200) {
	            return utils.makeAjaxError(success);
	        }
	        if (!Array.isArray(success.data)) {
	            return utils.makeAjaxError(success, 'Invalid Session list');
	        }
	        for (var i = 0; i < success.data.length; i++) {
	            try {
	                validate.validateSessionModel(success.data[i]);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	        }
	        return Private.updateRunningSessions(success.data);
	    }, Private.onSessionError);
	}
	exports.listRunningSessions = listRunningSessions;
	/**
	 * Start a new session.
	 *
	 * #### Notes
	 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
	 *
	 * A path must be provided.  If a kernel id is given, it will
	 * connect to an existing kernel.  If no kernel id or name is given,
	 * the server will start the default kernel type.
	 *
	 * The promise is fulfilled on a valid response and rejected otherwise.
	 *
	 * Wrap the result in an Session object. The promise is fulfilled
	 * when the session is created on the server, otherwise the promise is
	 * rejected.
	 */
	function startNewSession(options) {
	    if (options.path === void 0) {
	        return Promise.reject(new Error('Must specify a path'));
	    }
	    return Private.startSession(options).then(function (model) {
	        return Private.createSession(model, options);
	    });
	}
	exports.startNewSession = startNewSession;
	/**
	 * Find a session by id.
	 *
	 * #### Notes
	 * If the session was already started via `startNewSession`, the existing
	 * Session object's information is used in the fulfillment value.
	 *
	 * Otherwise, if `options` are given, we attempt to find to the existing
	 * session.
	 * The promise is fulfilled when the session is found,
	 * otherwise the promise is rejected.
	 */
	function findSessionById(id, options) {
	    var sessions = Private.runningSessions;
	    for (var clientId in sessions) {
	        var session = sessions[clientId];
	        if (session.id === id) {
	            var model = {
	                id: id,
	                notebook: { path: session.path },
	                kernel: { name: session.kernel.name, id: session.kernel.id }
	            };
	            return Promise.resolve(model);
	        }
	    }
	    return Private.getSessionModel(id, options).catch(function () {
	        var msg = "No running session for id: " + id;
	        return Private.typedThrow(msg);
	    });
	}
	exports.findSessionById = findSessionById;
	/**
	 * Find a session by path.
	 *
	 * #### Notes
	 * If the session was already started via `startNewSession`, the existing
	 * Session object's info is used in the fulfillment value.
	 *
	 * Otherwise, if `options` are given, we attempt to find to the existing
	 * session using [listRunningSessions].
	 * The promise is fulfilled when the session is found,
	 * otherwise the promise is rejected.
	 *
	 * If the session was not already started and no `options` are given,
	 * the promise is rejected.
	 */
	function findSessionByPath(path, options) {
	    var sessions = Private.runningSessions;
	    for (var clientId in sessions) {
	        var session = sessions[clientId];
	        if (session.path === path) {
	            var model = {
	                id: session.id,
	                notebook: { path: session.path },
	                kernel: { name: session.kernel.name, id: session.kernel.id }
	            };
	            return Promise.resolve(model);
	        }
	    }
	    return listRunningSessions(options).then(function (models) {
	        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
	            var model = models_1[_i];
	            if (model.notebook.path === path) {
	                return model;
	            }
	        }
	        var msg = "No running session for path: " + path;
	        return Private.typedThrow(msg);
	    });
	}
	exports.findSessionByPath = findSessionByPath;
	/**
	 * Connect to a running session.
	 *
	 * #### Notes
	 * If the session was already started via `startNewSession`, the existing
	 * Session object is used as the fulfillment value.
	 *
	 * Otherwise, if `options` are given, we attempt to connect to the existing
	 * session.
	 * The promise is fulfilled when the session is ready on the server,
	 * otherwise the promise is rejected.
	 *
	 * If the session was not already started and no `options` are given,
	 * the promise is rejected.
	 */
	function connectToSession(id, options) {
	    for (var clientId in Private.runningSessions) {
	        var session = Private.runningSessions[clientId];
	        if (session.id === id) {
	            return session.clone();
	        }
	    }
	    return Private.getSessionModel(id, options).then(function (model) {
	        return Private.createSession(model, options);
	    }).catch(function () {
	        var msg = "No running session with id: " + id;
	        return Private.typedThrow(msg);
	    });
	}
	exports.connectToSession = connectToSession;
	/**
	 * Shut down a session by id.
	 */
	function shutdownSession(id, options) {
	    if (options === void 0) { options = {}; }
	    var baseUrl = options.baseUrl || utils.getBaseUrl();
	    var ajaxSettings = options.ajaxSettings || {};
	    return Private.shutdownSession(id, baseUrl, ajaxSettings);
	}
	exports.shutdownSession = shutdownSession;
	/**
	 * Session object for accessing the session REST api. The session
	 * should be used to start kernels and then shut them down -- for
	 * all other operations, the kernel object should be used.
	 */
	var Session = (function () {
	    /**
	     * Construct a new session.
	     */
	    function Session(options, id, kernel) {
	        this._id = '';
	        this._path = '';
	        this._ajaxSettings = '';
	        this._kernel = null;
	        this._uuid = '';
	        this._baseUrl = '';
	        this._options = null;
	        this._updating = false;
	        this.ajaxSettings = options.ajaxSettings || {};
	        this._id = id;
	        this._path = options.path;
	        this._baseUrl = options.baseUrl || utils.getBaseUrl();
	        this._uuid = utils.uuid();
	        Private.runningSessions[this._uuid] = this;
	        this.setupKernel(kernel);
	        this._options = utils.copy(options);
	    }
	    Object.defineProperty(Session.prototype, "sessionDied", {
	        /**
	         * A signal emitted when the session dies.
	         */
	        get: function () {
	            return Private.sessionDiedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "kernelChanged", {
	        /**
	         * A signal emitted when the kernel changes.
	         */
	        get: function () {
	            return Private.kernelChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "statusChanged", {
	        /**
	         * A signal emitted when the kernel status changes.
	         */
	        get: function () {
	            return Private.statusChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "iopubMessage", {
	        /**
	         * A signal emitted for a kernel messages.
	         */
	        get: function () {
	            return Private.iopubMessageSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "unhandledMessage", {
	        /**
	         * A signal emitted for an unhandled kernel message.
	         */
	        get: function () {
	            return Private.unhandledMessageSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "pathChanged", {
	        /**
	         * A signal emitted when the session path changes.
	         */
	        get: function () {
	            return Private.pathChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "id", {
	        /**
	         * Get the session id.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._id;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "kernel", {
	        /**
	         * Get the session kernel object.
	         *
	         * #### Notes
	         * This is a read-only property, and can be altered by [changeKernel].
	         * Use the [statusChanged] and [unhandledMessage] signals on the session
	         * instead of the ones on the kernel.
	         */
	        get: function () {
	            return this._kernel;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "path", {
	        /**
	         * Get the session path.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._path;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "model", {
	        /**
	         * Get the model associated with the session.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return {
	                id: this.id,
	                kernel: this.kernel.model,
	                notebook: {
	                    path: this.path
	                }
	            };
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "status", {
	        /**
	         * The current status of the session.
	         *
	         * #### Notes
	         * This is a read-only property, and is a delegate to the kernel status.
	         */
	        get: function () {
	            return this._kernel ? this._kernel.status : 'dead';
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "ajaxSettings", {
	        /**
	         * Get a copy of the default ajax settings for the session.
	         */
	        get: function () {
	            return JSON.parse(this._ajaxSettings);
	        },
	        /**
	         * Set the default ajax settings for the session.
	         */
	        set: function (value) {
	            this._ajaxSettings = JSON.stringify(value);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Session.prototype, "isDisposed", {
	        /**
	         * Test whether the session has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property which is always safe to access.
	         */
	        get: function () {
	            return this._options === null;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Clone the current session with a new clientId.
	     */
	    Session.prototype.clone = function () {
	        var _this = this;
	        var options = this._getKernelOptions();
	        return kernel_1.connectToKernel(this.kernel.id, options).then(function (kernel) {
	            options = utils.copy(_this._options);
	            options.ajaxSettings = _this.ajaxSettings;
	            return new Session(options, _this._id, kernel);
	        });
	    };
	    /**
	     * Update the session based on a session model from the server.
	     */
	    Session.prototype.update = function (model) {
	        var _this = this;
	        // Avoid a race condition if we are waiting for a REST call return.
	        if (this._updating) {
	            return Promise.resolve(void 0);
	        }
	        if (this._path !== model.notebook.path) {
	            this.pathChanged.emit(model.notebook.path);
	        }
	        this._path = model.notebook.path;
	        if (model.kernel.id !== this._kernel.id) {
	            var options = this._getKernelOptions();
	            options.name = model.kernel.name;
	            return kernel_1.connectToKernel(model.kernel.id, options).then(function (kernel) {
	                _this.setupKernel(kernel);
	                _this.kernelChanged.emit(kernel);
	            });
	        }
	        return Promise.resolve(void 0);
	    };
	    /**
	     * Dispose of the resources held by the session.
	     */
	    Session.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        if (this._kernel) {
	            this._kernel.dispose();
	        }
	        this._options = null;
	        delete Private.runningSessions[this._uuid];
	        this._kernel = null;
	        phosphor_signaling_1.clearSignalData(this);
	    };
	    /**
	     * Change the session path.
	     *
	     * @param path - The new session path.
	     *
	     * #### Notes
	     * This uses the Jupyter REST API, and the response is validated.
	     * The promise is fulfilled on a valid response and rejected otherwise.
	     */
	    Session.prototype.rename = function (path) {
	        if (this.isDisposed) {
	            return Promise.reject(new Error('Session is disposed'));
	        }
	        var data = JSON.stringify({
	            notebook: { path: path }
	        });
	        return this._patch(data).then(function () { return void 0; });
	    };
	    /**
	     * Change the kernel.
	     *
	     * @params options - The name or id of the new kernel.
	     *
	     * #### Notes
	     * This shuts down the existing kernel and creates a new kernel,
	     * keeping the existing session ID and session path.
	     */
	    Session.prototype.changeKernel = function (options) {
	        var _this = this;
	        if (this.isDisposed) {
	            return Promise.reject(new Error('Session is disposed'));
	        }
	        this._kernel.dispose();
	        var data = JSON.stringify({ kernel: options });
	        return this._patch(data).then(function () {
	            return _this.kernel;
	        });
	    };
	    /**
	     * Kill the kernel and shutdown the session.
	     *
	     * @returns - The promise fulfilled on a valid response from the server.
	     *
	     * #### Notes
	     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/sessions), and validates the response.
	     * Emits a [sessionDied] signal on success.
	     */
	    Session.prototype.shutdown = function () {
	        var _this = this;
	        if (this.isDisposed) {
	            return Promise.reject(new Error('Session is disposed'));
	        }
	        return Private.shutdownSession(this.id, this._baseUrl, this.ajaxSettings)
	            .then(function () {
	            _this._kernel.dispose();
	            _this._kernel = null;
	            _this.sessionDied.emit(void 0);
	        });
	    };
	    /**
	     * Handle connections to a kernel.
	     */
	    Session.prototype.setupKernel = function (kernel) {
	        this._kernel = kernel;
	        kernel.statusChanged.connect(this.onKernelStatus, this);
	        kernel.unhandledMessage.connect(this.onUnhandledMessage, this);
	        kernel.iopubMessage.connect(this.onIOPubMessage, this);
	    };
	    /**
	     * Handle to changes in the Kernel status.
	     */
	    Session.prototype.onKernelStatus = function (sender, state) {
	        this.statusChanged.emit(state);
	    };
	    /**
	     * Handle iopub kernel messages.
	     */
	    Session.prototype.onIOPubMessage = function (sender, msg) {
	        this.iopubMessage.emit(msg);
	    };
	    /**
	     * Handle unhandled kernel messages.
	     */
	    Session.prototype.onUnhandledMessage = function (sender, msg) {
	        this.unhandledMessage.emit(msg);
	    };
	    /**
	     * Get the options used to create a new kernel.
	     */
	    Session.prototype._getKernelOptions = function () {
	        return {
	            baseUrl: this._options.baseUrl,
	            wsUrl: this._options.wsUrl,
	            username: this.kernel.username,
	            ajaxSettings: this.ajaxSettings
	        };
	    };
	    /**
	     * Send a PATCH to the server, updating the session path or the kernel.
	     */
	    Session.prototype._patch = function (data) {
	        var _this = this;
	        var url = Private.getSessionUrl(this._baseUrl, this._id);
	        var ajaxSettings = this.ajaxSettings;
	        ajaxSettings.method = 'PATCH';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.data = data;
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.cache = false;
	        this._updating = true;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            _this._updating = false;
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            var data = success.data;
	            try {
	                validate.validateSessionModel(data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return Private.updateByModel(data);
	        }, function (error) {
	            _this._updating = false;
	            return Private.onSessionError(error);
	        });
	    };
	    return Session;
	}());
	/**
	 * A namespace for session private data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * A signal emitted when the session is shut down.
	     */
	    Private.sessionDiedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the kernel changes.
	     */
	    Private.kernelChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the session kernel status changes.
	     */
	    Private.statusChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted for iopub kernel messages.
	     */
	    Private.iopubMessageSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted for an unhandled kernel message.
	     */
	    Private.unhandledMessageSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the session path changes.
	     */
	    Private.pathChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the specs change.
	     */
	    Private.specsChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the running kernels change.
	     */
	    Private.runningChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * The running sessions.
	     */
	    Private.runningSessions = Object.create(null);
	    /**
	     * Create a new session, or return an existing session if a session if
	     * the session path already exists
	     */
	    function startSession(options) {
	        var baseUrl = options.baseUrl || utils.getBaseUrl();
	        var url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
	        var model = {
	            kernel: { name: options.kernelName, id: options.kernelId },
	            notebook: { path: options.path }
	        };
	        var ajaxSettings = utils.copy(options.ajaxSettings || {});
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.data = JSON.stringify(model);
	        ajaxSettings.contentType = 'application/json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 201) {
	                return utils.makeAjaxError(success);
	            }
	            try {
	                validate.validateSessionModel(success.data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            var data = success.data;
	            return updateByModel(data);
	        }, onSessionError);
	    }
	    Private.startSession = startSession;
	    /**
	     * Create a Promise for a kernel object given a session model and options.
	     */
	    function createKernel(model, options) {
	        var kernelOptions = {
	            name: model.kernel.name,
	            baseUrl: options.baseUrl || utils.getBaseUrl(),
	            wsUrl: options.wsUrl,
	            username: options.username,
	            clientId: options.clientId,
	            ajaxSettings: options.ajaxSettings
	        };
	        return kernel_1.connectToKernel(model.kernel.id, kernelOptions);
	    }
	    Private.createKernel = createKernel;
	    /**
	     * Create a Session object.
	     *
	     * @returns - A promise that resolves with a started session.
	     */
	    function createSession(model, options) {
	        return createKernel(model, options).then(function (kernel) {
	            return new Session(options, model.id, kernel);
	        }).catch(function (error) {
	            return typedThrow('Session failed to start: ' + error.message);
	        });
	    }
	    Private.createSession = createSession;
	    /**
	     * Get a full session model from the server by session id string.
	     */
	    function getSessionModel(id, options) {
	        options = options || {};
	        var baseUrl = options.baseUrl || utils.getBaseUrl();
	        var url = getSessionUrl(baseUrl, id);
	        var ajaxSettings = options.ajaxSettings || {};
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            var data = success.data;
	            try {
	                validate.validateSessionModel(data);
	            }
	            catch (err) {
	                return utils.makeAjaxError(success, err.message);
	            }
	            return updateByModel(data);
	        }, Private.onSessionError);
	    }
	    Private.getSessionModel = getSessionModel;
	    /**
	     * Update the running sessions based on new data from the server.
	     */
	    function updateRunningSessions(sessions) {
	        var promises = [];
	        for (var uuid in Private.runningSessions) {
	            var session = Private.runningSessions[uuid];
	            var updated = false;
	            for (var _i = 0, sessions_1 = sessions; _i < sessions_1.length; _i++) {
	                var sId = sessions_1[_i];
	                if (session.id === sId.id) {
	                    promises.push(session.update(sId));
	                    updated = true;
	                    break;
	                }
	            }
	            // If session is no longer running on disk, emit dead signal.
	            if (!updated && session.status !== 'dead') {
	                session.sessionDied.emit(void 0);
	            }
	        }
	        return Promise.all(promises).then(function () { return sessions; });
	    }
	    Private.updateRunningSessions = updateRunningSessions;
	    /**
	     * Update the running sessions given an updated session Id.
	     */
	    function updateByModel(model) {
	        var promises = [];
	        for (var uuid in Private.runningSessions) {
	            var session = Private.runningSessions[uuid];
	            if (session.id === model.id) {
	                promises.push(session.update(model));
	            }
	        }
	        return Promise.all(promises).then(function () { return model; });
	    }
	    Private.updateByModel = updateByModel;
	    /**
	     * Shut down a session by id.
	     */
	    function shutdownSession(id, baseUrl, ajaxSettings) {
	        if (ajaxSettings === void 0) { ajaxSettings = {}; }
	        var url = getSessionUrl(baseUrl, id);
	        ajaxSettings.method = 'DELETE';
	        ajaxSettings.dataType = 'json';
	        ajaxSettings.cache = false;
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        }, function (err) {
	            if (err.xhr.status === 410) {
	                err.throwError = 'The kernel was deleted but the session was not';
	            }
	            return onSessionError(err);
	        });
	    }
	    Private.shutdownSession = shutdownSession;
	    /**
	     * Get a session url.
	     */
	    function getSessionUrl(baseUrl, id) {
	        return utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL, id);
	    }
	    Private.getSessionUrl = getSessionUrl;
	    /**
	     * Handle an error on a session Ajax call.
	     */
	    function onSessionError(error) {
	        var text = (error.throwError ||
	            error.xhr.statusText ||
	            error.xhr.responseText);
	        var msg = "API request failed: " + text;
	        console.error(msg);
	        return Promise.reject(error);
	    }
	    Private.onSessionError = onSessionError;
	    /**
	     * Throw a typed error.
	     */
	    function typedThrow(msg) {
	        throw new Error(msg);
	    }
	    Private.typedThrow = typedThrow;
	})(Private || (Private = {}));


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright (c) Jupyter Development Team.
	// Distributed under the terms of the Modified BSD License.
	"use strict";
	var phosphor_signaling_1 = __webpack_require__(22);
	var json_1 = __webpack_require__(23);
	var utils = __webpack_require__(2);
	/**
	 * The url for the terminal service.
	 */
	var TERMINAL_SERVICE_URL = 'api/terminals';
	/**
	 * Create a terminal session or connect to an existing session.
	 *
	 * #### Notes
	 * If the session is already running on the client, the existing
	 * instance will be returned.
	 */
	function createTerminalSession(options) {
	    if (options === void 0) { options = {}; }
	    if (options.name && options.name in Private.running) {
	        return Private.running[options.name];
	    }
	    return new TerminalSession(options).connect();
	}
	exports.createTerminalSession = createTerminalSession;
	/**
	 * A terminal session manager.
	 */
	var TerminalManager = (function () {
	    /**
	     * Construct a new terminal manager.
	     */
	    function TerminalManager(options) {
	        if (options === void 0) { options = {}; }
	        this._baseUrl = '';
	        this._wsUrl = '';
	        this._ajaxSettings = null;
	        this._running = [];
	        this._isDisposed = false;
	        this._baseUrl = options.baseUrl || utils.getBaseUrl();
	        this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
	        this._ajaxSettings = utils.copy(options.ajaxSettings || {});
	    }
	    Object.defineProperty(TerminalManager.prototype, "runningChanged", {
	        /**
	         * A signal emitted when the running terminals change.
	         */
	        get: function () {
	            return Private.runningChangedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TerminalManager.prototype, "isDisposed", {
	        /**
	         * Test whether the terminal manager is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._isDisposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the resources used by the manager.
	     */
	    TerminalManager.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._isDisposed = true;
	        phosphor_signaling_1.clearSignalData(this);
	        this._running = [];
	    };
	    /**
	     * Create a new terminal session or connect to an existing session.
	     */
	    TerminalManager.prototype.create = function (options) {
	        if (options === void 0) { options = {}; }
	        options.baseUrl = options.baseUrl || this._baseUrl;
	        options.wsUrl = options.wsUrl || this._wsUrl;
	        options.ajaxSettings = (options.ajaxSettings || utils.copy(this._ajaxSettings));
	        return createTerminalSession(options);
	    };
	    /**
	     * Shut down a terminal session by name.
	     */
	    TerminalManager.prototype.shutdown = function (name) {
	        var url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, name);
	        var ajaxSettings = utils.copy(this._ajaxSettings || {});
	        ajaxSettings.method = 'DELETE';
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	        });
	    };
	    /**
	     * Get the list of models for the terminals running on the server.
	     */
	    TerminalManager.prototype.listRunning = function () {
	        var _this = this;
	        var url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL);
	        var ajaxSettings = utils.copy(this._ajaxSettings || {});
	        ajaxSettings.method = 'GET';
	        ajaxSettings.dataType = 'json';
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            var data = success.data;
	            if (!Array.isArray(data)) {
	                return utils.makeAjaxError(success, 'Invalid terminal data');
	            }
	            if (!json_1.deepEqual(data, _this._running)) {
	                _this._running = data.slice();
	                _this.runningChanged.emit(data);
	            }
	            return data;
	        });
	    };
	    return TerminalManager;
	}());
	exports.TerminalManager = TerminalManager;
	/**
	 * An implementation of a terminal interface.
	 */
	var TerminalSession = (function () {
	    /**
	     * Construct a new terminal session.
	     */
	    function TerminalSession(options) {
	        if (options === void 0) { options = {}; }
	        this._ajaxSettings = null;
	        this._ws = null;
	        this._isDisposed = false;
	        this._promise = null;
	        this._baseUrl = options.baseUrl || utils.getBaseUrl();
	        this._ajaxSettings = options.ajaxSettings || {};
	        this._name = options.name;
	        this._wsUrl = options.wsUrl || utils.getWsUrl(this._baseUrl);
	        this._promise = new utils.PromiseDelegate();
	    }
	    Object.defineProperty(TerminalSession.prototype, "messageReceived", {
	        /**
	         * A signal emitted when a message is received from the server.
	         */
	        get: function () {
	            return Private.messageReceivedSignal.bind(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TerminalSession.prototype, "name", {
	        /**
	         * Get the name of the terminal session.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._name;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TerminalSession.prototype, "url", {
	        /**
	         * Get the websocket url used by the terminal session.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._url;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TerminalSession.prototype, "isDisposed", {
	        /**
	         * Test whether the session is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._isDisposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Dispose of the resources held by the session.
	     */
	    TerminalSession.prototype.dispose = function () {
	        if (this.isDisposed) {
	            return;
	        }
	        this._isDisposed = true;
	        if (this._ws) {
	            this._ws.close();
	            this._ws = null;
	        }
	        delete Private.running[this._name];
	        this._promise = null;
	        phosphor_signaling_1.clearSignalData(this);
	    };
	    /**
	     * Send a message to the terminal session.
	     */
	    TerminalSession.prototype.send = function (message) {
	        var msg = [message.type];
	        msg.push.apply(msg, message.content);
	        this._ws.send(JSON.stringify(msg));
	    };
	    /**
	     * Shut down the terminal session.
	     */
	    TerminalSession.prototype.shutdown = function () {
	        var _this = this;
	        var url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL, this._name);
	        var ajaxSettings = utils.copy(this._ajaxSettings);
	        ajaxSettings.method = 'DELETE';
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 204) {
	                return utils.makeAjaxError(success);
	            }
	            _this.dispose();
	        });
	    };
	    /**
	     * Connect to the terminal session.
	     */
	    TerminalSession.prototype.connect = function () {
	        var _this = this;
	        if (this._name) {
	            return this._initializeSocket();
	        }
	        return this._getName().then(function (name) {
	            _this._name = name;
	            return _this._initializeSocket();
	        });
	    };
	    /**
	     * Get a name for the terminal from the server.
	     */
	    TerminalSession.prototype._getName = function () {
	        var url = utils.urlPathJoin(this._baseUrl, TERMINAL_SERVICE_URL);
	        var ajaxSettings = utils.copy(this._ajaxSettings);
	        ajaxSettings.method = 'POST';
	        ajaxSettings.dataType = 'json';
	        return utils.ajaxRequest(url, ajaxSettings).then(function (success) {
	            if (success.xhr.status !== 200) {
	                return utils.makeAjaxError(success);
	            }
	            return success.data.name;
	        });
	    };
	    /**
	     * Connect to the websocket.
	     */
	    TerminalSession.prototype._initializeSocket = function () {
	        var _this = this;
	        var name = this._name;
	        Private.running[name] = this._promise.promise;
	        this._url = this._wsUrl + "terminals/websocket/" + name;
	        this._ws = new WebSocket(this._url);
	        this._ws.onmessage = function (event) {
	            var data = JSON.parse(event.data);
	            _this.messageReceived.emit({
	                type: data[0],
	                content: data.slice(1)
	            });
	        };
	        this._ws.onopen = function (event) {
	            _this._promise.resolve(_this);
	        };
	        return this._promise.promise;
	    };
	    return TerminalSession;
	}());
	/**
	 * A namespace for private data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * A mapping of running terminals by name.
	     */
	    Private.running = Object.create(null);
	    /**
	     * A signal emitted when the terminal is fully connected.
	     */
	    Private.connectedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when the running terminals change.
	     */
	    Private.runningChangedSignal = new phosphor_signaling_1.Signal();
	    /**
	     * A signal emitted when a message is received.
	     */
	    Private.messageReceivedSignal = new phosphor_signaling_1.Signal();
	})(Private || (Private = {}));


/***/ }
/******/ ])
});
;
//# sourceMappingURL=index.js.map
