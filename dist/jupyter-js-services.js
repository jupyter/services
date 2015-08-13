(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jupyterServices = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

var _kernel = require('./kernel');

var _session = require('./session');

_defaults(exports, _interopExportWildcard(_kernel, _defaults));

_defaults(exports, _interopExportWildcard(_session, _defaults));

exports['default'] = { Kernel: _kernel.Kernel, NotebookSession: _session.NotebookSession };
},{"./kernel":2,"./session":4}],2:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.validateKernelId = validateKernelId;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _serialize = require('./serialize');

/**
 * The url for the kernel service.
 */
var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2:
            return decorators.reduceRight(function (o, d) {
                return d && d(o) || o;
            }, target);
        case 3:
            return decorators.reduceRight(function (o, d) {
                return (d && d(target, key), void 0);
            }, void 0);
        case 4:
            return decorators.reduceRight(function (o, d) {
                return d && d(target, key, o) || o;
            }, desc);
    }
};
var signal = phosphor.core.signal;
var Disposable = phosphor.utility.Disposable;
var KERNEL_SERVICE_URL = 'api/kernel';
/**
 * Get a logger kernel objects.
 */
var kernel_log = Logger.get('kernel');
/**
 * A class to communicate with the Python kernel. This
 * should generally not be constructed directly, but be created
 * by the `Session` object. Once created, this object should be
 * used to communicate with the kernel.
 */

var Kernel = (function () {
    /**
     * Construct a new kernel.
     */

    function Kernel(baseUrl, wsUrl) {
        _classCallCheck(this, Kernel);

        this._id = '';
        this._name = '';
        this._baseUrl = '';
        this._kernelUrl = '';
        this._wsUrl = '';
        this._username = '';
        this._staticId = '';
        this._ws = null;
        this._infoReply = null;
        this._reconnectLimit = 7;
        this._autorestartAttempt = 0;
        this._reconnectAttempt = 0;
        this._handlerMap = null;
        this._iopubHandlers = null;
        this._status = '';
        this._status = 'unknown';
        this._baseUrl = baseUrl;
        this._wsUrl = wsUrl;
        if (!this._wsUrl) {
            // trailing 's' in https will become wss for secure web sockets
            this._wsUrl = location.protocol.replace('http', 'ws') + "//" + location.host;
        }
        this._staticId = utils.uuid();
        this._handlerMap = new Map();
        if (typeof WebSocket === 'undefined') {
            alert('Your browser does not have WebSocket support, please try Chrome, Safari, or Firefox ≥ 11.');
        }
    }

    /**
     * GET /api/kernels
     *
     * Get the list of running kernels.
     */

    _createClass(Kernel, [{
        key: "getInfo",

        /**
         * GET /api/kernels/[:kernel_id]
         *
         * Get information about the kernel.
         */
        value: function getInfo() {
            var _this = this;

            return utils.ajaxRequest(this._kernelUrl, {
                method: "GET",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid Status: ' + success.xhr.status);
                }
                validateKernelId(success.data);
                return success.data;
            }, function (error) {
                _this._onError(error);
            });
        }

        /**
         * POST /api/kernels/[:kernel_id]/interrupt
         *
         * Interrupt the kernel.
         */
    }, {
        key: "interrupt",
        value: function interrupt() {
            var _this2 = this;

            this._handleStatus('interrupting');
            var url = utils.urlJoinEncode(this._kernelUrl, 'interrupt');
            return utils.ajaxRequest(url, {
                method: "POST",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 204) {
                    throw Error('Invalid Status: ' + success.xhr.status);
                }
            }, function (error) {
                _this2._onError(error);
            });
        }

        /**
         * POST /api/kernels/[:kernel_id]/restart
         *
         * Restart the kernel.
         */
    }, {
        key: "restart",
        value: function restart() {
            var _this3 = this;

            this._handleStatus('restarting');
            this.disconnect();
            var url = utils.urlJoinEncode(this._kernelUrl, 'restart');
            return utils.ajaxRequest(url, {
                method: "POST",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid Status: ' + success.xhr.status);
                }
                validateKernelId(success.data);
                _this3.connect();
                return success.data;
            }, function (error) {
                _this3._onError(error);
            });
        }

        /**
         * POST /api/kernels/[:kernel_id]
         *
         * Start a kernel.  Note: if using a session, Session.start()
         * should be used instead.
         */
    }, {
        key: "start",
        value: function start(id) {
            var _this4 = this;

            if (id !== void 0) {
                this.id = id.id;
                this.name = id.name;
            }
            if (!this._kernelUrl) {
                throw Error('You must set the kernel id before starting.');
            }
            this._handleStatus('starting');
            return utils.ajaxRequest(this._kernelUrl, {
                method: "POST",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid Status: ' + success.xhr.status);
                }
                validateKernelId(success.data);
                _this4.connect(success.data);
                return success.data;
            }, function (error) {
                _this4._onError(error);
            });
        }

        /**
         * DELETE /api/kernels/[:kernel_id]
         *
         * Shut down a kernel. Note: if useing a session, Session.shutdown()
         * should be used instead.
         */
    }, {
        key: "shutdown",
        value: function shutdown() {
            this._handleStatus('shutdown');
            this.disconnect();
            return utils.ajaxRequest(this._kernelUrl, {
                method: "DELETE",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 204) {
                    throw Error('Invalid response');
                }
            });
        }

        /**
         * Connect to the server-side the kernel.
         *
         * This should only be called directly by a session.
         */
    }, {
        key: "connect",
        value: function connect(id) {
            if (id !== void 0) {
                this.id = id.id;
                this.name = id.name;
            }
            if (!this._kernelUrl) {
                throw Error('You must set the kernel id before starting');
            }
            this._startChannels();
            this._handleStatus('created');
        }

        /**
         * Disconnect the kernel.
         */
    }, {
        key: "disconnect",
        value: function disconnect() {
            var _this5 = this;

            if (this._ws !== null) {
                if (this._ws.readyState === WebSocket.OPEN) {
                    this._ws.onclose = function () {
                        _this5._clearSocket();
                    };
                    this._ws.close();
                } else {
                    this._clearSocket();
                }
            }
        }

        /**
          * Reconnect to a disconnected kernel. This is not actually a
          * standard HTTP request, but useful function nonetheless for
          * reconnecting to the kernel if the connection is somehow lost.
          */
    }, {
        key: "reconnect",
        value: function reconnect() {
            if (this.isConnected) {
                return;
            }
            this._reconnectAttempt = this._reconnectAttempt + 1;
            this._handleStatus('reconnecting');
            this._startChannels();
        }

        /**
         * Send a message on the kernel's shell channel.
         */
    }, {
        key: "sendShellMessage",
        value: function sendShellMessage(msg_type, content) {
            var _this6 = this;

            var metadata = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var buffers = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

            if (!this.isConnected) {
                throw new Error("kernel is not connected");
            }
            var msg = this._createMsg(msg_type, content, metadata, buffers);
            msg.channel = 'shell';
            this._ws.send((0, _serialize.serialize)(msg));
            var future = new KernelFutureHandler(function () {
                _this6._handlerMap["delete"](msg.header.msgId);
            });
            this._handlerMap.set(msg.header.msgId, future);
            return future;
        }

        /**
         * Get kernel info.
         *
         * Returns a KernelFuture that will resolve to a `kernel_info_reply` message documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info)
         */
    }, {
        key: "kernelInfo",
        value: function kernelInfo() {
            return this.sendShellMessage("kernel_info_request", {});
        }

        /**
         * Get info on an object.
         *
         * Returns a KernelFuture that will resolve to a `inspect_reply` message documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#object-information)
         */
    }, {
        key: "inspect",
        value: function inspect(code, cursor_pos) {
            var content = {
                code: code,
                cursor_pos: cursor_pos,
                detail_level: 0
            };
            return this.sendShellMessage("inspect_request", content);
        }

        /**
         * Execute given code into kernel, returning a KernelFuture.
         *
         * @example
         *
         * The options object should contain the options for the execute
         * call. Its default values are:
         *
         *      options = {
         *        silent : true,
         *        user_expressions : {},
         *        allow_stdin : false,
                  store_history: false
         *      }
         *
         */
    }, {
        key: "execute",
        value: function execute(code, options) {
            var content = {
                code: code,
                silent: true,
                store_history: false,
                user_expressions: {},
                allow_stdin: false
            };
            utils.extend(content, options);
            return this.sendShellMessage("execute_request", content);
        }

        /**
         * Request a code completion from the kernel.
         *
         * Returns a KernelFuture with will resolve to a `complete_reply` documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#complete)
         */
    }, {
        key: "complete",
        value: function complete(code, cursor_pos) {
            var content = {
                code: code,
                cursor_pos: cursor_pos
            };
            return this.sendShellMessage("complete_request", content);
        }

        /**
         * Send an input reply message to the kernel.
         *
         * TODO: how to handle this?  Right now called by
         * ./static/notebook/js/outputarea.js:827:
         * this.events.trigger('send_input_reply.Kernel', value);
         *
         * which has no reference to the session or the kernel
         */
    }, {
        key: "sendInputReply",
        value: function sendInputReply(input) {
            if (!this.isConnected) {
                throw new Error("kernel is not connected");
            }
            var content = {
                value: input
            };
            var msg = this._createMsg("input_reply", content);
            msg.channel = 'stdin';
            this._ws.send((0, _serialize.serialize)(msg));
            return msg.header.msgId;
        }

        /**
         * Create a kernel message given input attributes.
         */
    }, {
        key: "_createMsg",
        value: function _createMsg(msg_type, content) {
            var metadata = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var buffers = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

            var msg = {
                header: {
                    msgId: utils.uuid(),
                    username: this._username,
                    session: this._staticId,
                    msgType: msg_type,
                    version: "5.0"
                },
                metadata: metadata || {},
                content: content,
                buffers: buffers || [],
                parentHeader: {}
            };
            return msg;
        }

        /**
         * Handle a kernel status change message.
         */
    }, {
        key: "_handleStatus",
        value: function _handleStatus(status) {
            this.statusChanged.emit(status);
            this._status = status;
            var msg = 'Kernel: ' + status + ' (' + this._id + ')';
            if (status === 'idle' || status === 'busy') {
                kernel_log.debug(msg);
            } else {
                kernel_log.info(msg);
            }
        }

        /**
         * Handle a failed AJAX request by logging the error message, and throwing
         * another error.
         */
    }, {
        key: "_onError",
        value: function _onError(error) {
            var msg = "API request failed (" + error.statusText + "): ";
            kernel_log.error(msg);
            throw Error(error.statusText);
        }

        /**
         * Start the Websocket channels.
         * Will stop and restart them if they already exist.
         */
    }, {
        key: "_startChannels",
        value: function _startChannels() {
            var _this7 = this;

            this.disconnect();
            var ws_host_url = this._wsUrl + this._kernelUrl;
            kernel_log.info("Starting WebSockets:", ws_host_url);
            this._ws = new WebSocket(this.wsUrl);
            // Ensure incoming binary messages are not Blobs
            this._ws.binaryType = 'arraybuffer';
            var already_called_onclose = false; // only alert once
            this._ws.onclose = function (evt) {
                if (already_called_onclose) {
                    return;
                }
                already_called_onclose = true;
                if (!evt.wasClean) {
                    // If the websocket was closed early, that could mean
                    // that the kernel is actually dead. Try getting
                    // information about the kernel from the API call --
                    // if that fails, then assume the kernel is dead,
                    // otherwise just follow the typical websocket closed
                    // protocol.
                    _this7.getInfo().then(function () {
                        this._ws_closed(ws_host_url, false);
                    }, function () {
                        this._kernel_dead();
                    });
                }
            };
            this._ws.onerror = function (evt) {
                if (already_called_onclose) {
                    return;
                }
                already_called_onclose = true;
                _this7._wsClosed(ws_host_url, true);
            };
            this._ws.onopen = function (evt) {
                _this7._wsOpened(evt);
            };
            var ws_closed_late = function ws_closed_late(evt) {
                if (already_called_onclose) {
                    return;
                }
                already_called_onclose = true;
                if (!evt.wasClean) {
                    _this7._wsClosed(ws_host_url, false);
                }
            };
            // switch from early-close to late-close message after 1s
            setTimeout(function () {
                if (_this7._ws !== null) {
                    _this7._ws.onclose = ws_closed_late;
                }
            }, 1000);
            this._ws.onmessage = function (evt) {
                _this7._handleWSMessage(evt);
            };
        }

        /**
         * Clear the websocket if necessary.
         */
    }, {
        key: "_clearSocket",
        value: function _clearSocket() {
            if (this._ws && this._ws.readyState === WebSocket.CLOSED) {
                this._ws = null;
            }
            this._handleStatus('disconnected');
        }

        /**
         * Perform necessary tasks once the connection to the kernel has
         * been established. This includes requesting information about
         * the kernel.
         */
    }, {
        key: "_kernelConnected",
        value: function _kernelConnected() {
            var _this8 = this;

            this._handleStatus('connected');
            this._reconnectAttempt = 0;
            // get kernel info so we know what state the kernel is in
            this.kernelInfo().onReply(function (reply) {
                _this8._infoReply = reply.content;
                _this8._handleStatus('ready');
                _this8._autorestartAttempt = 0;
            });
        }

        /**
         * Perform necessary tasks after the kernel has died. This closes
         * communication channels to the kernel if they are still somehow
         * open.
         */
    }, {
        key: "_kernelDead",
        value: function _kernelDead() {
            this._handleStatus('dead');
            this.disconnect();
        }

        /**
         * Handle a websocket entering the open state,
         * signaling that the kernel is connected when websocket is open.
         */
    }, {
        key: "_wsOpened",
        value: function _wsOpened(evt) {
            if (this.isConnected) {
                // all events ready, trigger started event.
                this._kernelConnected();
            }
        }

        /**
         * Handle a websocket entering the closed state.  If the websocket
         * was not closed due to an error, try to reconnect to the kernel.
         *
         * @param {string} ws_url - the websocket url
         * @param {bool} error - whether the connection was closed due to an error
         */
    }, {
        key: "_wsClosed",
        value: function _wsClosed(ws_url, error) {
            this.disconnect();
            this._handleStatus('disconnected');
            if (error) {
                kernel_log.error('WebSocket connection failed: ', ws_url);
                this._handleStatus('connectionFailed');
            }
            this._scheduleReconnect();
        }

        /**
         * Function to call when kernel connection is lost.
         * schedules reconnect, or fires 'connection_dead' if reconnect limit is hit.
         */
    }, {
        key: "_scheduleReconnect",
        value: function _scheduleReconnect() {
            var _this9 = this;

            if (this._reconnectAttempt < this._reconnectLimit) {
                var timeout = Math.pow(2, this._reconnectAttempt);
                kernel_log.error("Connection lost, reconnecting in " + timeout + " seconds.");
                setTimeout(function () {
                    _this9.reconnect();
                }, 1e3 * timeout);
            } else {
                this._handleStatus('connectionDead');
                kernel_log.error("Failed to reconnect, giving up.");
            }
        }

        /**
         * Handle an incoming Websocket message.
         */
    }, {
        key: "_handleWSMessage",
        value: function _handleWSMessage(e) {
            try {
                var msg = (0, _serialize.deserialize)(e.data);
            } catch (error) {
                kernel_log.error(error.message);
                return;
            }
            if (msg.channel === 'iopub' && msg.msgType === 'status') {
                this._handleStatusMessage(msg);
            }
            if (msg.parentHeader) {
                var header = msg.parentHeader;
                var future = this._handlerMap.get(header.msgId);
                if (future) {
                    future.handleMsg(msg);
                }
            }
        }

        /**
         * Handle status iopub messages from the kernel.
         */
    }, {
        key: "_handleStatusMessage",
        value: function _handleStatusMessage(msg) {
            var _this10 = this;

            var execution_state = msg.content.execution_state;
            if (execution_state !== 'dead') {
                this._handleStatus(execution_state);
            }
            if (execution_state === 'starting') {
                this.kernelInfo().onReply(function (reply) {
                    _this10._infoReply = reply.content;
                    _this10._handleStatus('ready');
                    _this10._autorestartAttempt = 0;
                });
            } else if (execution_state === 'restarting') {
                // autorestarting is distinct from restarting,
                // in that it means the kernel died and the server is restarting it.
                // kernel_restarting sets the notification widget,
                // autorestart shows the more prominent dialog.
                this._autorestartAttempt = this._autorestartAttempt + 1;
                this._handleStatus('autorestarting');
            } else if (execution_state === 'dead') {
                this._kernelDead();
            }
        }
    }, {
        key: "name",

        /**
         * Get the name of the kernel.
         */
        get: function get() {
            return this._name;
        },

        /**
         * Set the name of the kernel.
         */
        set: function set(value) {
            this._name = value;
        }

        /**
         * Check whether there is a connection to the kernel. This
         * function only returns true if websocket has been
         * created and has a state of WebSocket.OPEN.
         */
    }, {
        key: "isConnected",
        get: function get() {
            if (this._ws === null) {
                return false;
            }
            if (this._ws.readyState !== WebSocket.OPEN) {
                return false;
            }
            return true;
        }

        /**
         * Check whether the connection to the kernel has been completely
         * severed. This function only returns true if the websocket is null.
         */
    }, {
        key: "isFullyDisconnected",
        get: function get() {
            return this._ws === null;
        }

        /**
         * Get the Info Reply Message from the kernel.
         */
    }, {
        key: "infoReply",
        get: function get() {
            return this._infoReply;
        }

        /**
         * Get the current status of the kernel.
         */
    }, {
        key: "status",
        get: function get() {
            return this._status;
        }

        /**
         * Get the current id of the kernel.
         */
    }, {
        key: "id",
        get: function get() {
            return this._id;
        },

        /**
         * Set the current id of the kernel.
         */
        set: function set(value) {
            this._id = value;
            this._kernelUrl = utils.urlJoinEncode(this._baseUrl, KERNEL_SERVICE_URL, this._id);
        }

        /**
         * Get the full websocket url.
         */
    }, {
        key: "wsUrl",
        get: function get() {
            return [this._wsUrl, utils.urlJoinEncode(this._kernelUrl, 'channels'), "?session_id=" + this._staticId].join('');
        }
    }], [{
        key: "list",
        value: function list(baseUrl) {
            var kernelServiceUrl = utils.urlJoinEncode(baseUrl, KERNEL_SERVICE_URL);
            return utils.ajaxRequest(kernelServiceUrl, {
                method: "GET",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status === 200) {
                    if (!Array.isArray(success.data)) {
                        throw Error('Invalid kernel list');
                    }
                    for (var i = 0; i < success.data.length; i++) {
                        validateKernelId(success.data[i]);
                    }
                    return success.data;
                }
                throw Error('Invalid Status: ' + success.xhr.status);
            });
        }
    }]);

    return Kernel;
})();

exports.Kernel = Kernel;

__decorate([signal], Kernel.prototype, "statusChanged");
/**
 * Bit flags for the kernel future state.
 */
var KernelFutureFlag;
(function (KernelFutureFlag) {
    KernelFutureFlag[KernelFutureFlag["GotReply"] = 1] = "GotReply";
    KernelFutureFlag[KernelFutureFlag["GotIdle"] = 2] = "GotIdle";
    KernelFutureFlag[KernelFutureFlag["AutoDispose"] = 4] = "AutoDispose";
    KernelFutureFlag[KernelFutureFlag["IsDone"] = 8] = "IsDone";
})(KernelFutureFlag || (KernelFutureFlag = {}));
/**
 * Implementation of a kernel future.
 */

var KernelFutureHandler = (function (_Disposable) {
    _inherits(KernelFutureHandler, _Disposable);

    function KernelFutureHandler() {
        _classCallCheck(this, KernelFutureHandler);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        _get(Object.getPrototypeOf(KernelFutureHandler.prototype), "constructor", this).apply(this, args);
        this._status = 0;
        this._input = null;
        this._output = null;
        this._reply = null;
        this._done = null;
    }

    /**
     * Validate an object as being of IKernelID type
     */

    /**
     * Get the current autoDispose status of the future.
     */

    _createClass(KernelFutureHandler, [{
        key: "onReply",

        /**
         * Register a reply handler. Returns `this`.
         */
        value: function onReply(cb) {
            this._reply = cb;
            return this;
        }

        /**
         * Register an output handler. Returns `this`.
         */
    }, {
        key: "onOutput",
        value: function onOutput(cb) {
            this._output = cb;
            return this;
        }

        /**
         * Register a done handler. Returns `this`.
         */
    }, {
        key: "onDone",
        value: function onDone(cb) {
            this._done = cb;
            return this;
        }

        /**
         * Register an input handler. Returns `this`.
         */
    }, {
        key: "onInput",
        value: function onInput(cb) {
            this._input = cb;
            return this;
        }

        /**
         * Handle an incoming message from the kernel belonging to this future.
         */
    }, {
        key: "handleMsg",
        value: function handleMsg(msg) {
            if (msg.channel === 'iopub') {
                var output = this._output;
                if (output) output(msg);
                if (msg.msgType === 'status' && msg.content.execution_state === 'idle') {
                    this._setFlag(KernelFutureFlag.GotIdle);
                    if (this._testFlag(KernelFutureFlag.GotReply)) {
                        this._handleDone(msg);
                    }
                }
            } else if (msg.channel === 'shell') {
                var reply = this._output;
                if (reply) reply(msg);
                this._setFlag(KernelFutureFlag.GotReply);
                if (this._testFlag(KernelFutureFlag.GotIdle)) {
                    this._handleDone(msg);
                }
            } else if (msg.channel === 'stdin') {
                var input = this._input;
                if (input) input(msg);
            }
        }

        /**
         * Dispose and unregister the future.
         */
    }, {
        key: "dispose",
        value: function dispose() {
            this._input = null;
            this._output = null;
            this._reply = null;
            this._done = null;
            _get(Object.getPrototypeOf(KernelFutureHandler.prototype), "dispose", this).call(this);
        }

        /**
         * Handle a message done status.
         */
    }, {
        key: "_handleDone",
        value: function _handleDone(msg) {
            this._setFlag(KernelFutureFlag.IsDone);
            var done = this._done;
            if (done) done(msg);
            // clear the other callbacks
            this._reply = null;
            this._done = null;
            this._input = null;
            if (this._testFlag(KernelFutureFlag.AutoDispose)) {
                this.dispose();
            }
        }

        /**
         * Test whether the given future flag is set.
         */
    }, {
        key: "_testFlag",
        value: function _testFlag(flag) {
            return (this._status & flag) !== 0;
        }

        /**
         * Set the given future flag.
         */
    }, {
        key: "_setFlag",
        value: function _setFlag(flag) {
            this._status |= flag;
        }

        /**
         * Clear the given future flag.
         */
    }, {
        key: "_clearFlag",
        value: function _clearFlag(flag) {
            this._status &= ~flag;
        }
    }, {
        key: "autoDispose",
        get: function get() {
            return this._testFlag(KernelFutureFlag.AutoDispose);
        },

        /**
         * Set the current autoDispose behavior of the future.
         *
         * If True, it will self-dispose() after onDone() is called.
         */
        set: function set(value) {
            if (value) {
                this._setFlag(KernelFutureFlag.AutoDispose);
            } else {
                this._clearFlag(KernelFutureFlag.AutoDispose);
            }
        }

        /**
         * Check for message done state.
         */
    }, {
        key: "isDone",
        get: function get() {
            return this._testFlag(KernelFutureFlag.IsDone);
        }
    }]);

    return KernelFutureHandler;
})(Disposable);

function validateKernelId(info) {
    if (!info.hasOwnProperty('name') || !info.hasOwnProperty('id')) {
        throw Error('Invalid kernel id');
    }
    if (typeof info.id !== 'string' || typeof info.name !== 'string') {
        throw Error('Invalid kernel id');
    }
}
},{"./serialize":3,"./utils":5}],3:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * Deserialize and return the unpacked message.
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deserialize = deserialize;
exports.serialize = serialize;

function deserialize(data) {
    var value;
    if (typeof data === "string") {
        value = JSON.parse(data);
    } else {
        value = deserializeBinary(data);
    }
    return value;
}

/**
 * Serialize a kernel message for transport.
 */

function serialize(msg) {
    var value;
    if (msg.buffers && msg.buffers.length) {
        value = serializeBinary(msg);
    } else {
        value = JSON.stringify(msg);
    }
    return value;
}

/**
 * Deserialize a binary message to a Kernel Message.
 */
function deserializeBinary(buf) {
    var data = new DataView(buf);
    // read the header: 1 + nbufs 32b integers
    var nbufs = data.getUint32(0);
    var offsets = [];
    if (nbufs < 2) {
        throw new Error("Invalid incoming Kernel Message");
    }
    for (var i = 1; i <= nbufs; i++) {
        offsets.push(data.getUint32(i * 4));
    }
    var json_bytes = new Uint8Array(buf.slice(offsets[0], offsets[1]));
    var msg = JSON.parse(new TextDecoder('utf8').decode(json_bytes));
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
 * Serialize Kernel message to ArrayBuffer.
 */
function serializeBinary(msg) {
    var offsets = [];
    var buffers = [];
    var encoder = new TextEncoder('utf8');
    var json_utf8 = encoder.encode(JSON.stringify(msg, replace_buffers));
    buffers.push(json_utf8.buffer);
    for (var i = 0; i < msg.buffers.length; i++) {
        // msg.buffers elements could be either views or ArrayBuffers
        // buffers elements are ArrayBuffers
        var b = msg.buffers[i];
        buffers.push(b instanceof ArrayBuffer ? b : b.buffer);
    }
    var nbufs = buffers.length;
    offsets.push(4 * (nbufs + 1));
    for (i = 0; i + 1 < buffers.length; i++) {
        offsets.push(offsets[offsets.length - 1] + buffers[i].byteLength);
    }
    var msg_buf = new Uint8Array(offsets[offsets.length - 1] + buffers[buffers.length - 1].byteLength);
    // use DataView.setUint32 for network byte-order
    var view = new DataView(msg_buf.buffer);
    // write nbufs to first 4 bytes
    view.setUint32(0, nbufs);
    // write offsets to next 4 * nbufs bytes
    for (i = 0; i < offsets.length; i++) {
        view.setUint32(4 * (i + 1), offsets[i]);
    }
    // write all the buffers at their respective offsets
    for (i = 0; i < buffers.length; i++) {
        msg_buf.set(new Uint8Array(buffers[i]), offsets[i]);
    }
    return msg_buf.buffer;
}
/**
 * Filter "buffers" key for JSON.stringify
 */
function replace_buffers(key, value) {
    if (key === "buffers") {
        return undefined;
    }
    return value;
}
},{}],4:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _kernel = require('./kernel');

/**
 * The url for the session service.
 */
var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2:
            return decorators.reduceRight(function (o, d) {
                return d && d(o) || o;
            }, target);
        case 3:
            return decorators.reduceRight(function (o, d) {
                return (d && d(target, key), void 0);
            }, void 0);
        case 4:
            return decorators.reduceRight(function (o, d) {
                return d && d(target, key, o) || o;
            }, desc);
    }
};
var signal = phosphor.core.signal;
var SESSION_SERVICE_URL = 'api/sessions';
/**
 * Get a logger session objects.
 */
var session_log = Logger.get('session');
;
;
;
/**
 * Session object for accessing the session REST api. The session
 * should be used to start kernels and then shut them down -- for
 * all other operations, the kernel object should be used.
 **/

var NotebookSession = (function () {
    /**
     * Construct a new session.
     */

    function NotebookSession(options) {
        _classCallCheck(this, NotebookSession);

        this._id = "unknown";
        this._notebookPath = "unknown";
        this._baseUrl = "unknown";
        this._sessionUrl = "unknown";
        this._wsUrl = "unknown";
        this._kernel = null;
        this._id = utils.uuid();
        this._notebookPath = options.notebookPath;
        this._baseUrl = options.baseUrl;
        this._wsUrl = options.wsUrl;
        this._kernel = new _kernel.Kernel(this._baseUrl, this._wsUrl);
        this._sessionUrl = utils.urlJoinEncode(this._baseUrl, SESSION_SERVICE_URL, this._id);
    }

    /**
     * GET /api/sessions
     *
     * Get a list of the current sessions.
     */

    _createClass(NotebookSession, [{
        key: "start",

        /**
         * POST /api/sessions
         *
         * Start a new session. This function can only be successfully executed once.
         */
        value: function start() {
            var _this = this;

            var url = utils.urlJoinEncode(this._baseUrl, SESSION_SERVICE_URL);
            return utils.ajaxRequest(url, {
                method: "POST",
                dataType: "json",
                data: JSON.stringify(this._model),
                contentType: 'application/json'
            }).then(function (success) {
                if (success.xhr.status !== 201) {
                    throw Error('Invalid response');
                }
                validateSessionId(success.data);
                _this._kernel.connect(success.data.kernel);
                _this._handleStatus('kernelCreated');
                return success.data;
            }, function (error) {
                _this._handleStatus('kernelDead');
            });
        }

        /**
         * GET /api/sessions/[:session_id]
         *
         * Get information about a session.
         */
    }, {
        key: "getInfo",
        value: function getInfo() {
            return utils.ajaxRequest(this._sessionUrl, {
                method: "GET",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid response');
                }
                validateSessionId(success.data);
                return success.data;
            });
        }

        /**
         * DELETE /api/sessions/[:session_id]
         *
         * Kill the kernel and shutdown the session.
         */
    }, {
        key: "delete",
        value: function _delete() {
            if (this._kernel) {
                this._handleStatus('kernelKilled');
                this._kernel.disconnect();
            }
            return utils.ajaxRequest(this._sessionUrl, {
                method: "DELETE",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 204) {
                    throw Error('Invalid response');
                }
                validateSessionId(success.data);
            }, function (rejected) {
                if (rejected.xhr.status === 410) {
                    throw Error('The kernel was deleted but the session was not');
                }
                throw Error(rejected.statusText);
            });
        }

        /**
         * Restart the session by deleting it and then starting it fresh.
         */
    }, {
        key: "restart",
        value: function restart(options) {
            var _this2 = this;

            return this["delete"]().then(function () {
                return _this2.start();
            })["catch"](function () {
                return _this2.start();
            }).then(function () {
                if (options && options.notebookPath) {
                    _this2._notebookPath = options.notebookPath;
                }
                if (options && options.kernelName) {
                    _this2._kernel.name = options.kernelName;
                }
            });
        }

        /**
         * Rename the notebook.
         */
    }, {
        key: "renameNotebook",
        value: function renameNotebook(path) {
            this._notebookPath = path;
            return utils.ajaxRequest(this._sessionUrl, {
                method: "PATCH",
                dataType: "json",
                data: JSON.stringify(this._model),
                contentType: 'application/json'
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid response');
                }
                validateSessionId(success.data);
                return success.data;
            });
        }

        /**
         * Get the data model for the session, which includes the notebook path
         * and kernel (name and id).
         */
    }, {
        key: "_handleStatus",

        /**
         * Handle a session status change.
         */
        value: function _handleStatus(status) {
            this.statusChanged.emit(status);
            session_log.error('Session: ' + status + ' (' + this._id + ')');
        }
    }, {
        key: "kernel",

        /**
         * Get the session kernel object.
        */
        get: function get() {
            return this._kernel;
        }
    }, {
        key: "_model",
        get: function get() {
            return {
                id: this._id,
                notebook: { path: this._notebookPath },
                kernel: { name: this._kernel.name,
                    id: this._kernel.id }
            };
        }
    }], [{
        key: "list",
        value: function list(baseUrl) {
            var sessionUrl = utils.urlJoinEncode(baseUrl, SESSION_SERVICE_URL);
            return utils.ajaxRequest(sessionUrl, {
                method: "GET",
                dataType: "json"
            }).then(function (success) {
                if (success.xhr.status !== 200) {
                    throw Error('Invalid Status: ' + success.xhr.status);
                }
                if (!Array.isArray(success.data)) {
                    throw Error('Invalid Session list');
                }
                for (var i = 0; i < success.data.length; i++) {
                    validateSessionId(success.data[i]);
                }
                return success.data;
            });
        }
    }]);

    return NotebookSession;
})();

exports.NotebookSession = NotebookSession;

__decorate([signal], NotebookSession.prototype, "statusChanged");
/**
 * Validate an object as being of ISessionId type.
 */
function validateSessionId(info) {
    if (!info.hasOwnProperty('id') || !info.hasOwnProperty('notebook') || !info.hasOwnProperty('kernel')) {
        throw Error('Invalid Session Model');
    }
    (0, _kernel.validateKernelId)(info.kernel);
    if (typeof info.id !== 'string') {
        throw Error('Invalid Session Model');
    }
    validateNotebookId(info.notebook);
}
/**
 * Validate an object as being of INotebookId type.
 */
function validateNotebookId(model) {
    if (!model.hasOwnProperty('path') || typeof model.path !== 'string') {
        throw Error('Invalid Notebook Model');
    }
}
},{"./kernel":2,"./utils":5}],5:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * Copy the contents of one object to another, recursively.
 *
 * http://stackoverflow.com/questions/12317003/something-like-jquery-extend-but-standalone
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.extend = extend;
exports.uuid = uuid;
exports.urlPathJoin = urlPathJoin;
exports.encodeURIComponents = encodeURIComponents;
exports.urlJoinEncode = urlJoinEncode;
exports.jsonToQueryString = jsonToQueryString;
exports.ajaxRequest = ajaxRequest;

function extend(target, source) {
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

function uuid() {
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
    }
    s[12] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.charAt(Number(s[16]) & 0x3 | 0x8); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    return s.join("");
}

/**
 * Join a sequence of url components with '/'.
 */

function urlPathJoin() {
    var url = '';

    for (var _len = arguments.length, paths = Array(_len), _key = 0; _key < _len; _key++) {
        paths[_key] = arguments[_key];
    }

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

function encodeURIComponents(uri) {
    return uri.split('/').map(encodeURIComponent).join('/');
}

/**
 * Join a sequence of url components with '/',
 * encoding each component with encodeURIComponent.
 */

function urlJoinEncode() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
    }

    return encodeURIComponents(urlPathJoin.apply(null, args));
}

/**
 * Properly detect the current browser.
 * http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
 */
var browser = (function () {
    if (typeof navigator === 'undefined') {
        // navigator undefined in node
        return ['None'];
    }
    var N = navigator.appName;
    var ua = navigator.userAgent;
    var tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1];
    M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    return M;
})();
exports.browser = browser;
/**
 * Return a serialized object string suitable for a query.
 *
 * http://stackoverflow.com/a/30707423
 */

function jsonToQueryString(json) {
    return '?' + Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}

/**
 * Asynchronous XMLHTTPRequest handler.
 *
 * http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
 */

function ajaxRequest(url, settings) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(settings.method, url);
        if (settings.contentType) {
            req.overrideMimeType(settings.contentType);
        }
        req.onload = function () {
            var response = req.response;
            if (settings.dataType === 'json') {
                response = JSON.parse(req.response);
            }
            resolve({ data: response, statusText: req.statusText, xhr: req });
        };
        req.onerror = function (err) {
            reject({ xhr: req, statusText: req.statusText, error: err });
        };
        if (settings.data) {
            req.send(settings.data);
        } else {
            req.send();
        }
    });
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvaW5kZXguanMiLCJsaWIva2VybmVsLmpzIiwibGliL3NlcmlhbGl6ZS5qcyIsImxpYi9zZXNzaW9uLmpzIiwibGliL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6K0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wRXhwb3J0V2lsZGNhcmQob2JqLCBkZWZhdWx0cykgeyB2YXIgbmV3T2JqID0gZGVmYXVsdHMoe30sIG9iaik7IGRlbGV0ZSBuZXdPYmpbJ2RlZmF1bHQnXTsgcmV0dXJuIG5ld09iajsgfVxuXG5mdW5jdGlvbiBfZGVmYXVsdHMob2JqLCBkZWZhdWx0cykgeyB2YXIga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGRlZmF1bHRzKTsgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7IHZhciBrZXkgPSBrZXlzW2ldOyB2YXIgdmFsdWUgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGRlZmF1bHRzLCBrZXkpOyBpZiAodmFsdWUgJiYgdmFsdWUuY29uZmlndXJhYmxlICYmIG9ialtrZXldID09PSB1bmRlZmluZWQpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSk7IH0gfSByZXR1cm4gb2JqOyB9XG5cbnZhciBfa2VybmVsID0gcmVxdWlyZSgnLi9rZXJuZWwnKTtcblxudmFyIF9zZXNzaW9uID0gcmVxdWlyZSgnLi9zZXNzaW9uJyk7XG5cbl9kZWZhdWx0cyhleHBvcnRzLCBfaW50ZXJvcEV4cG9ydFdpbGRjYXJkKF9rZXJuZWwsIF9kZWZhdWx0cykpO1xuXG5fZGVmYXVsdHMoZXhwb3J0cywgX2ludGVyb3BFeHBvcnRXaWxkY2FyZChfc2Vzc2lvbiwgX2RlZmF1bHRzKSk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHsgS2VybmVsOiBfa2VybmVsLktlcm5lbCwgTm90ZWJvb2tTZXNzaW9uOiBfc2Vzc2lvbi5Ob3RlYm9va1Nlc3Npb24gfTsiLCIvLyBDb3B5cmlnaHQgKGMpIEp1cHl0ZXIgRGV2ZWxvcG1lbnQgVGVhbS5cbi8vIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTW9kaWZpZWQgQlNEIExpY2Vuc2UuXG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDUsIF94NiwgX3g3KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NSwgcHJvcGVydHkgPSBfeDYsIHJlY2VpdmVyID0gX3g3OyBkZXNjID0gcGFyZW50ID0gZ2V0dGVyID0gdW5kZWZpbmVkOyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NSA9IHBhcmVudDsgX3g2ID0gcHJvcGVydHk7IF94NyA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5leHBvcnRzLnZhbGlkYXRlS2VybmVsSWQgPSB2YWxpZGF0ZUtlcm5lbElkO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqW1wiZGVmYXVsdFwiXSA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgX3V0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgdXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdXRpbHMpO1xuXG52YXIgX3NlcmlhbGl6ZSA9IHJlcXVpcmUoJy4vc2VyaWFsaXplJyk7XG5cbi8qKlxuICogVGhlIHVybCBmb3IgdGhlIGtlcm5lbCBzZXJ2aWNlLlxuICovXG52YXIgX19kZWNvcmF0ZSA9IHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19kZWNvcmF0ZSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkICYmIGQobykgfHwgbztcbiAgICAgICAgICAgIH0sIHRhcmdldCk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChkICYmIGQodGFyZ2V0LCBrZXkpLCB2b2lkIDApO1xuICAgICAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiBkKHRhcmdldCwga2V5LCBvKSB8fCBvO1xuICAgICAgICAgICAgfSwgZGVzYyk7XG4gICAgfVxufTtcbnZhciBzaWduYWwgPSBwaG9zcGhvci5jb3JlLnNpZ25hbDtcbnZhciBEaXNwb3NhYmxlID0gcGhvc3Bob3IudXRpbGl0eS5EaXNwb3NhYmxlO1xudmFyIEtFUk5FTF9TRVJWSUNFX1VSTCA9ICdhcGkva2VybmVsJztcbi8qKlxuICogR2V0IGEgbG9nZ2VyIGtlcm5lbCBvYmplY3RzLlxuICovXG52YXIga2VybmVsX2xvZyA9IExvZ2dlci5nZXQoJ2tlcm5lbCcpO1xuLyoqXG4gKiBBIGNsYXNzIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIFB5dGhvbiBrZXJuZWwuIFRoaXNcbiAqIHNob3VsZCBnZW5lcmFsbHkgbm90IGJlIGNvbnN0cnVjdGVkIGRpcmVjdGx5LCBidXQgYmUgY3JlYXRlZFxuICogYnkgdGhlIGBTZXNzaW9uYCBvYmplY3QuIE9uY2UgY3JlYXRlZCwgdGhpcyBvYmplY3Qgc2hvdWxkIGJlXG4gKiB1c2VkIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIGtlcm5lbC5cbiAqL1xuXG52YXIgS2VybmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcga2VybmVsLlxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gS2VybmVsKGJhc2VVcmwsIHdzVXJsKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBLZXJuZWwpO1xuXG4gICAgICAgIHRoaXMuX2lkID0gJyc7XG4gICAgICAgIHRoaXMuX25hbWUgPSAnJztcbiAgICAgICAgdGhpcy5fYmFzZVVybCA9ICcnO1xuICAgICAgICB0aGlzLl9rZXJuZWxVcmwgPSAnJztcbiAgICAgICAgdGhpcy5fd3NVcmwgPSAnJztcbiAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSAnJztcbiAgICAgICAgdGhpcy5fc3RhdGljSWQgPSAnJztcbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbmZvUmVwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3RMaW1pdCA9IDc7XG4gICAgICAgIHRoaXMuX2F1dG9yZXN0YXJ0QXR0ZW1wdCA9IDA7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPSAwO1xuICAgICAgICB0aGlzLl9oYW5kbGVyTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW9wdWJIYW5kbGVycyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9ICcnO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSAndW5rbm93bic7XG4gICAgICAgIHRoaXMuX2Jhc2VVcmwgPSBiYXNlVXJsO1xuICAgICAgICB0aGlzLl93c1VybCA9IHdzVXJsO1xuICAgICAgICBpZiAoIXRoaXMuX3dzVXJsKSB7XG4gICAgICAgICAgICAvLyB0cmFpbGluZyAncycgaW4gaHR0cHMgd2lsbCBiZWNvbWUgd3NzIGZvciBzZWN1cmUgd2ViIHNvY2tldHNcbiAgICAgICAgICAgIHRoaXMuX3dzVXJsID0gbG9jYXRpb24ucHJvdG9jb2wucmVwbGFjZSgnaHR0cCcsICd3cycpICsgXCIvL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdGF0aWNJZCA9IHV0aWxzLnV1aWQoKTtcbiAgICAgICAgdGhpcy5faGFuZGxlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJTb2NrZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBicm93c2VyIGRvZXMgbm90IGhhdmUgV2ViU29ja2V0IHN1cHBvcnQsIHBsZWFzZSB0cnkgQ2hyb21lLCBTYWZhcmksIG9yIEZpcmVmb3gg4omlIDExLicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR0VUIC9hcGkva2VybmVsc1xuICAgICAqXG4gICAgICogR2V0IHRoZSBsaXN0IG9mIHJ1bm5pbmcga2VybmVscy5cbiAgICAgKi9cblxuICAgIF9jcmVhdGVDbGFzcyhLZXJuZWwsIFt7XG4gICAgICAgIGtleTogXCJnZXRJbmZvXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdFVCAvYXBpL2tlcm5lbHMvWzprZXJuZWxfaWRdXG4gICAgICAgICAqXG4gICAgICAgICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEluZm8oKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fa2VybmVsVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBPU1QgL2FwaS9rZXJuZWxzL1s6a2VybmVsX2lkXS9pbnRlcnJ1cHRcbiAgICAgICAgICpcbiAgICAgICAgICogSW50ZXJydXB0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImludGVycnVwdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW50ZXJydXB0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnaW50ZXJydXB0aW5nJyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9rZXJuZWxVcmwsICdpbnRlcnJ1cHQnKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh1cmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzMi5fb25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQT1NUIC9hcGkva2VybmVscy9bOmtlcm5lbF9pZF0vcmVzdGFydFxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXN0YXJ0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlc3RhcnRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdyZXN0YXJ0aW5nJyk7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2tlcm5lbFVybCwgJ3Jlc3RhcnQnKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh1cmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgX3RoaXMzLmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMzLl9vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBPU1QgL2FwaS9rZXJuZWxzL1s6a2VybmVsX2lkXVxuICAgICAgICAgKlxuICAgICAgICAgKiBTdGFydCBhIGtlcm5lbC4gIE5vdGU6IGlmIHVzaW5nIGEgc2Vzc2lvbiwgU2Vzc2lvbi5zdGFydCgpXG4gICAgICAgICAqIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInN0YXJ0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydChpZCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmIChpZCAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9IGlkLmlkO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IGlkLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2tlcm5lbFVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdZb3UgbXVzdCBzZXQgdGhlIGtlcm5lbCBpZCBiZWZvcmUgc3RhcnRpbmcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ3N0YXJ0aW5nJyk7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fa2VybmVsVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU3RhdHVzOiAnICsgc3VjY2Vzcy54aHIuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVLZXJuZWxJZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIF90aGlzNC5jb25uZWN0KHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzNC5fb25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBERUxFVEUgL2FwaS9rZXJuZWxzL1s6a2VybmVsX2lkXVxuICAgICAgICAgKlxuICAgICAgICAgKiBTaHV0IGRvd24gYSBrZXJuZWwuIE5vdGU6IGlmIHVzZWluZyBhIHNlc3Npb24sIFNlc3Npb24uc2h1dGRvd24oKVxuICAgICAgICAgKiBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzaHV0ZG93blwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2h1dGRvd24oKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ3NodXRkb3duJyk7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9rZXJuZWxVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiREVMRVRFXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29ubmVjdCB0byB0aGUgc2VydmVyLXNpZGUgdGhlIGtlcm5lbC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgZGlyZWN0bHkgYnkgYSBzZXNzaW9uLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjb25uZWN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb25uZWN0KGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQgIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaWQgPSBpZC5pZDtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBpZC5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLl9rZXJuZWxVcmwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignWW91IG11c3Qgc2V0IHRoZSBrZXJuZWwgaWQgYmVmb3JlIHN0YXJ0aW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zdGFydENoYW5uZWxzKCk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2NyZWF0ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNjb25uZWN0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRpc2Nvbm5lY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3dzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dzLm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczUuX2NsZWFyU29ja2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICAqIFJlY29ubmVjdCB0byBhIGRpc2Nvbm5lY3RlZCBrZXJuZWwuIFRoaXMgaXMgbm90IGFjdHVhbGx5IGFcbiAgICAgICAgICAqIHN0YW5kYXJkIEhUVFAgcmVxdWVzdCwgYnV0IHVzZWZ1bCBmdW5jdGlvbiBub25ldGhlbGVzcyBmb3JcbiAgICAgICAgICAqIHJlY29ubmVjdGluZyB0byB0aGUga2VybmVsIGlmIHRoZSBjb25uZWN0aW9uIGlzIHNvbWVob3cgbG9zdC5cbiAgICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVjb25uZWN0KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RBdHRlbXB0ID0gdGhpcy5fcmVjb25uZWN0QXR0ZW1wdCArIDE7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ3JlY29ubmVjdGluZycpO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRDaGFubmVscygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmQgYSBtZXNzYWdlIG9uIHRoZSBrZXJuZWwncyBzaGVsbCBjaGFubmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzZW5kU2hlbGxNZXNzYWdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kU2hlbGxNZXNzYWdlKG1zZ190eXBlLCBjb250ZW50KSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIG1ldGFkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICB2YXIgYnVmZmVycyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJrZXJuZWwgaXMgbm90IGNvbm5lY3RlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtc2cgPSB0aGlzLl9jcmVhdGVNc2cobXNnX3R5cGUsIGNvbnRlbnQsIG1ldGFkYXRhLCBidWZmZXJzKTtcbiAgICAgICAgICAgIG1zZy5jaGFubmVsID0gJ3NoZWxsJztcbiAgICAgICAgICAgIHRoaXMuX3dzLnNlbmQoKDAsIF9zZXJpYWxpemUuc2VyaWFsaXplKShtc2cpKTtcbiAgICAgICAgICAgIHZhciBmdXR1cmUgPSBuZXcgS2VybmVsRnV0dXJlSGFuZGxlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXM2Ll9oYW5kbGVyTWFwW1wiZGVsZXRlXCJdKG1zZy5oZWFkZXIubXNnSWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyTWFwLnNldChtc2cuaGVhZGVyLm1zZ0lkLCBmdXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQga2VybmVsIGluZm8uXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgdGhhdCB3aWxsIHJlc29sdmUgdG8gYSBga2VybmVsX2luZm9fcmVwbHlgIG1lc3NhZ2UgZG9jdW1lbnRlZFxuICAgICAgICAgKiBbaGVyZV0oaHR0cDovL2lweXRob24ub3JnL2lweXRob24tZG9jL2Rldi9kZXZlbG9wbWVudC9tZXNzYWdpbmcuaHRtbCNrZXJuZWwtaW5mbylcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwia2VybmVsSW5mb1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24ga2VybmVsSW5mbygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbmRTaGVsbE1lc3NhZ2UoXCJrZXJuZWxfaW5mb19yZXF1ZXN0XCIsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgaW5mbyBvbiBhbiBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgdGhhdCB3aWxsIHJlc29sdmUgdG8gYSBgaW5zcGVjdF9yZXBseWAgbWVzc2FnZSBkb2N1bWVudGVkXG4gICAgICAgICAqIFtoZXJlXShodHRwOi8vaXB5dGhvbi5vcmcvaXB5dGhvbi1kb2MvZGV2L2RldmVsb3BtZW50L21lc3NhZ2luZy5odG1sI29iamVjdC1pbmZvcm1hdGlvbilcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW5zcGVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5zcGVjdChjb2RlLCBjdXJzb3JfcG9zKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgICAgIGN1cnNvcl9wb3M6IGN1cnNvcl9wb3MsXG4gICAgICAgICAgICAgICAgZGV0YWlsX2xldmVsOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VuZFNoZWxsTWVzc2FnZShcImluc3BlY3RfcmVxdWVzdFwiLCBjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFeGVjdXRlIGdpdmVuIGNvZGUgaW50byBrZXJuZWwsIHJldHVybmluZyBhIEtlcm5lbEZ1dHVyZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIG9wdGlvbnMgb2JqZWN0IHNob3VsZCBjb250YWluIHRoZSBvcHRpb25zIGZvciB0aGUgZXhlY3V0ZVxuICAgICAgICAgKiBjYWxsLiBJdHMgZGVmYXVsdCB2YWx1ZXMgYXJlOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAqICAgICAgICBzaWxlbnQgOiB0cnVlLFxuICAgICAgICAgKiAgICAgICAgdXNlcl9leHByZXNzaW9ucyA6IHt9LFxuICAgICAgICAgKiAgICAgICAgYWxsb3dfc3RkaW4gOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHN0b3JlX2hpc3Rvcnk6IGZhbHNlXG4gICAgICAgICAqICAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJleGVjdXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBleGVjdXRlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICAgICAgc2lsZW50OiB0cnVlLFxuICAgICAgICAgICAgICAgIHN0b3JlX2hpc3Rvcnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHVzZXJfZXhwcmVzc2lvbnM6IHt9LFxuICAgICAgICAgICAgICAgIGFsbG93X3N0ZGluOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHV0aWxzLmV4dGVuZChjb250ZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbmRTaGVsbE1lc3NhZ2UoXCJleGVjdXRlX3JlcXVlc3RcIiwgY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVxdWVzdCBhIGNvZGUgY29tcGxldGlvbiBmcm9tIHRoZSBrZXJuZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgd2l0aCB3aWxsIHJlc29sdmUgdG8gYSBgY29tcGxldGVfcmVwbHlgIGRvY3VtZW50ZWRcbiAgICAgICAgICogW2hlcmVdKGh0dHA6Ly9pcHl0aG9uLm9yZy9pcHl0aG9uLWRvYy9kZXYvZGV2ZWxvcG1lbnQvbWVzc2FnaW5nLmh0bWwjY29tcGxldGUpXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvbXBsZXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZShjb2RlLCBjdXJzb3JfcG9zKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgICAgIGN1cnNvcl9wb3M6IGN1cnNvcl9wb3NcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZW5kU2hlbGxNZXNzYWdlKFwiY29tcGxldGVfcmVxdWVzdFwiLCBjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIGFuIGlucHV0IHJlcGx5IG1lc3NhZ2UgdG8gdGhlIGtlcm5lbC5cbiAgICAgICAgICpcbiAgICAgICAgICogVE9ETzogaG93IHRvIGhhbmRsZSB0aGlzPyAgUmlnaHQgbm93IGNhbGxlZCBieVxuICAgICAgICAgKiAuL3N0YXRpYy9ub3RlYm9vay9qcy9vdXRwdXRhcmVhLmpzOjgyNzpcbiAgICAgICAgICogdGhpcy5ldmVudHMudHJpZ2dlcignc2VuZF9pbnB1dF9yZXBseS5LZXJuZWwnLCB2YWx1ZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHdoaWNoIGhhcyBubyByZWZlcmVuY2UgdG8gdGhlIHNlc3Npb24gb3IgdGhlIGtlcm5lbFxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzZW5kSW5wdXRSZXBseVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZElucHV0UmVwbHkoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImtlcm5lbCBpcyBub3QgY29ubmVjdGVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIG1zZyA9IHRoaXMuX2NyZWF0ZU1zZyhcImlucHV0X3JlcGx5XCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgbXNnLmNoYW5uZWwgPSAnc3RkaW4nO1xuICAgICAgICAgICAgdGhpcy5fd3Muc2VuZCgoMCwgX3NlcmlhbGl6ZS5zZXJpYWxpemUpKG1zZykpO1xuICAgICAgICAgICAgcmV0dXJuIG1zZy5oZWFkZXIubXNnSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEga2VybmVsIG1lc3NhZ2UgZ2l2ZW4gaW5wdXQgYXR0cmlidXRlcy5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2NyZWF0ZU1zZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2NyZWF0ZU1zZyhtc2dfdHlwZSwgY29udGVudCkge1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICB2YXIgYnVmZmVycyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0ge1xuICAgICAgICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgICAgICBtc2dJZDogdXRpbHMudXVpZCgpLFxuICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdGhpcy5fdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlc3Npb246IHRoaXMuX3N0YXRpY0lkLFxuICAgICAgICAgICAgICAgICAgICBtc2dUeXBlOiBtc2dfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCI1LjBcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWV0YWRhdGE6IG1ldGFkYXRhIHx8IHt9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICAgICAgYnVmZmVyczogYnVmZmVycyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwYXJlbnRIZWFkZXI6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBrZXJuZWwgc3RhdHVzIGNoYW5nZSBtZXNzYWdlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlU3RhdHVzXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlU3RhdHVzKHN0YXR1cykge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDaGFuZ2VkLmVtaXQoc3RhdHVzKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIHZhciBtc2cgPSAnS2VybmVsOiAnICsgc3RhdHVzICsgJyAoJyArIHRoaXMuX2lkICsgJyknO1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnIHx8IHN0YXR1cyA9PT0gJ2J1c3knKSB7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5kZWJ1Zyhtc2cpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmluZm8obXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBmYWlsZWQgQUpBWCByZXF1ZXN0IGJ5IGxvZ2dpbmcgdGhlIGVycm9yIG1lc3NhZ2UsIGFuZCB0aHJvd2luZ1xuICAgICAgICAgKiBhbm90aGVyIGVycm9yLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfb25FcnJvclwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX29uRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSBcIkFQSSByZXF1ZXN0IGZhaWxlZCAoXCIgKyBlcnJvci5zdGF0dXNUZXh0ICsgXCIpOiBcIjtcbiAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IobXNnKTtcbiAgICAgICAgICAgIHRocm93IEVycm9yKGVycm9yLnN0YXR1c1RleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXJ0IHRoZSBXZWJzb2NrZXQgY2hhbm5lbHMuXG4gICAgICAgICAqIFdpbGwgc3RvcCBhbmQgcmVzdGFydCB0aGVtIGlmIHRoZXkgYWxyZWFkeSBleGlzdC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3N0YXJ0Q2hhbm5lbHNcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9zdGFydENoYW5uZWxzKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgdmFyIHdzX2hvc3RfdXJsID0gdGhpcy5fd3NVcmwgKyB0aGlzLl9rZXJuZWxVcmw7XG4gICAgICAgICAgICBrZXJuZWxfbG9nLmluZm8oXCJTdGFydGluZyBXZWJTb2NrZXRzOlwiLCB3c19ob3N0X3VybCk7XG4gICAgICAgICAgICB0aGlzLl93cyA9IG5ldyBXZWJTb2NrZXQodGhpcy53c1VybCk7XG4gICAgICAgICAgICAvLyBFbnN1cmUgaW5jb21pbmcgYmluYXJ5IG1lc3NhZ2VzIGFyZSBub3QgQmxvYnNcbiAgICAgICAgICAgIHRoaXMuX3dzLmJpbmFyeVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICAgICAgdmFyIGFscmVhZHlfY2FsbGVkX29uY2xvc2UgPSBmYWxzZTsgLy8gb25seSBhbGVydCBvbmNlXG4gICAgICAgICAgICB0aGlzLl93cy5vbmNsb3NlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChhbHJlYWR5X2NhbGxlZF9vbmNsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxyZWFkeV9jYWxsZWRfb25jbG9zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKCFldnQud2FzQ2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHdlYnNvY2tldCB3YXMgY2xvc2VkIGVhcmx5LCB0aGF0IGNvdWxkIG1lYW5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCB0aGUga2VybmVsIGlzIGFjdHVhbGx5IGRlYWQuIFRyeSBnZXR0aW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGluZm9ybWF0aW9uIGFib3V0IHRoZSBrZXJuZWwgZnJvbSB0aGUgQVBJIGNhbGwgLS1cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhhdCBmYWlscywgdGhlbiBhc3N1bWUgdGhlIGtlcm5lbCBpcyBkZWFkLFxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UganVzdCBmb2xsb3cgdGhlIHR5cGljYWwgd2Vic29ja2V0IGNsb3NlZFxuICAgICAgICAgICAgICAgICAgICAvLyBwcm90b2NvbC5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXM3LmdldEluZm8oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3dzX2Nsb3NlZCh3c19ob3N0X3VybCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXJuZWxfZGVhZCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeV9jYWxsZWRfb25jbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFscmVhZHlfY2FsbGVkX29uY2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzNy5fd3NDbG9zZWQod3NfaG9zdF91cmwsIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX3dzLm9ub3BlbiA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBfdGhpczcuX3dzT3BlbmVkKGV2dCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHdzX2Nsb3NlZF9sYXRlID0gZnVuY3Rpb24gd3NfY2xvc2VkX2xhdGUoZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFscmVhZHlfY2FsbGVkX29uY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbHJlYWR5X2NhbGxlZF9vbmNsb3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWV2dC53YXNDbGVhbikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczcuX3dzQ2xvc2VkKHdzX2hvc3RfdXJsLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIHN3aXRjaCBmcm9tIGVhcmx5LWNsb3NlIHRvIGxhdGUtY2xvc2UgbWVzc2FnZSBhZnRlciAxc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzNy5fd3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM3Ll93cy5vbmNsb3NlID0gd3NfY2xvc2VkX2xhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICB0aGlzLl93cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgX3RoaXM3Ll9oYW5kbGVXU01lc3NhZ2UoZXZ0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xlYXIgdGhlIHdlYnNvY2tldCBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9jbGVhclNvY2tldFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2NsZWFyU29ja2V0KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3dzICYmIHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TRUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcmZvcm0gbmVjZXNzYXJ5IHRhc2tzIG9uY2UgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIGtlcm5lbCBoYXNcbiAgICAgICAgICogYmVlbiBlc3RhYmxpc2hlZC4gVGhpcyBpbmNsdWRlcyByZXF1ZXN0aW5nIGluZm9ybWF0aW9uIGFib3V0XG4gICAgICAgICAqIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9rZXJuZWxDb25uZWN0ZWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9rZXJuZWxDb25uZWN0ZWQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPSAwO1xuICAgICAgICAgICAgLy8gZ2V0IGtlcm5lbCBpbmZvIHNvIHdlIGtub3cgd2hhdCBzdGF0ZSB0aGUga2VybmVsIGlzIGluXG4gICAgICAgICAgICB0aGlzLmtlcm5lbEluZm8oKS5vblJlcGx5KGZ1bmN0aW9uIChyZXBseSkge1xuICAgICAgICAgICAgICAgIF90aGlzOC5faW5mb1JlcGx5ID0gcmVwbHkuY29udGVudDtcbiAgICAgICAgICAgICAgICBfdGhpczguX2hhbmRsZVN0YXR1cygncmVhZHknKTtcbiAgICAgICAgICAgICAgICBfdGhpczguX2F1dG9yZXN0YXJ0QXR0ZW1wdCA9IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQZXJmb3JtIG5lY2Vzc2FyeSB0YXNrcyBhZnRlciB0aGUga2VybmVsIGhhcyBkaWVkLiBUaGlzIGNsb3Nlc1xuICAgICAgICAgKiBjb21tdW5pY2F0aW9uIGNoYW5uZWxzIHRvIHRoZSBrZXJuZWwgaWYgdGhleSBhcmUgc3RpbGwgc29tZWhvd1xuICAgICAgICAgKiBvcGVuLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfa2VybmVsRGVhZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2tlcm5lbERlYWQoKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2RlYWQnKTtcbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBhIHdlYnNvY2tldCBlbnRlcmluZyB0aGUgb3BlbiBzdGF0ZSxcbiAgICAgICAgICogc2lnbmFsaW5nIHRoYXQgdGhlIGtlcm5lbCBpcyBjb25uZWN0ZWQgd2hlbiB3ZWJzb2NrZXQgaXMgb3Blbi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3dzT3BlbmVkXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfd3NPcGVuZWQoZXZ0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIC8vIGFsbCBldmVudHMgcmVhZHksIHRyaWdnZXIgc3RhcnRlZCBldmVudC5cbiAgICAgICAgICAgICAgICB0aGlzLl9rZXJuZWxDb25uZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSB3ZWJzb2NrZXQgZW50ZXJpbmcgdGhlIGNsb3NlZCBzdGF0ZS4gIElmIHRoZSB3ZWJzb2NrZXRcbiAgICAgICAgICogd2FzIG5vdCBjbG9zZWQgZHVlIHRvIGFuIGVycm9yLCB0cnkgdG8gcmVjb25uZWN0IHRvIHRoZSBrZXJuZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3c191cmwgLSB0aGUgd2Vic29ja2V0IHVybFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2x9IGVycm9yIC0gd2hldGhlciB0aGUgY29ubmVjdGlvbiB3YXMgY2xvc2VkIGR1ZSB0byBhbiBlcnJvclxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfd3NDbG9zZWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF93c0Nsb3NlZCh3c191cmwsIGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmVycm9yKCdXZWJTb2NrZXQgY29ubmVjdGlvbiBmYWlsZWQ6ICcsIHdzX3VybCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdjb25uZWN0aW9uRmFpbGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZVJlY29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBrZXJuZWwgY29ubmVjdGlvbiBpcyBsb3N0LlxuICAgICAgICAgKiBzY2hlZHVsZXMgcmVjb25uZWN0LCBvciBmaXJlcyAnY29ubmVjdGlvbl9kZWFkJyBpZiByZWNvbm5lY3QgbGltaXQgaXMgaGl0LlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfc2NoZWR1bGVSZWNvbm5lY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9zY2hlZHVsZVJlY29ubmVjdCgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczkgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0QXR0ZW1wdCA8IHRoaXMuX3JlY29ubmVjdExpbWl0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBNYXRoLnBvdygyLCB0aGlzLl9yZWNvbm5lY3RBdHRlbXB0KTtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmVycm9yKFwiQ29ubmVjdGlvbiBsb3N0LCByZWNvbm5lY3RpbmcgaW4gXCIgKyB0aW1lb3V0ICsgXCIgc2Vjb25kcy5cIik7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzOS5yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB9LCAxZTMgKiB0aW1lb3V0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdjb25uZWN0aW9uRGVhZCcpO1xuICAgICAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IoXCJGYWlsZWQgdG8gcmVjb25uZWN0LCBnaXZpbmcgdXAuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBhbiBpbmNvbWluZyBXZWJzb2NrZXQgbWVzc2FnZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2hhbmRsZVdTTWVzc2FnZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZVdTTWVzc2FnZShlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBtc2cgPSAoMCwgX3NlcmlhbGl6ZS5kZXNlcmlhbGl6ZSkoZS5kYXRhKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5lcnJvcihlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobXNnLmNoYW5uZWwgPT09ICdpb3B1YicgJiYgbXNnLm1zZ1R5cGUgPT09ICdzdGF0dXMnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzTWVzc2FnZShtc2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1zZy5wYXJlbnRIZWFkZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGVhZGVyID0gbXNnLnBhcmVudEhlYWRlcjtcbiAgICAgICAgICAgICAgICB2YXIgZnV0dXJlID0gdGhpcy5faGFuZGxlck1hcC5nZXQoaGVhZGVyLm1zZ0lkKTtcbiAgICAgICAgICAgICAgICBpZiAoZnV0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1dHVyZS5oYW5kbGVNc2cobXNnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIHN0YXR1cyBpb3B1YiBtZXNzYWdlcyBmcm9tIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9oYW5kbGVTdGF0dXNNZXNzYWdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlU3RhdHVzTWVzc2FnZShtc2cpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczEwID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGV4ZWN1dGlvbl9zdGF0ZSA9IG1zZy5jb250ZW50LmV4ZWN1dGlvbl9zdGF0ZTtcbiAgICAgICAgICAgIGlmIChleGVjdXRpb25fc3RhdGUgIT09ICdkZWFkJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cyhleGVjdXRpb25fc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4ZWN1dGlvbl9zdGF0ZSA9PT0gJ3N0YXJ0aW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMua2VybmVsSW5mbygpLm9uUmVwbHkoZnVuY3Rpb24gKHJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzMTAuX2luZm9SZXBseSA9IHJlcGx5LmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzMTAuX2hhbmRsZVN0YXR1cygncmVhZHknKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMxMC5fYXV0b3Jlc3RhcnRBdHRlbXB0ID0gMDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhlY3V0aW9uX3N0YXRlID09PSAncmVzdGFydGluZycpIHtcbiAgICAgICAgICAgICAgICAvLyBhdXRvcmVzdGFydGluZyBpcyBkaXN0aW5jdCBmcm9tIHJlc3RhcnRpbmcsXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhhdCBpdCBtZWFucyB0aGUga2VybmVsIGRpZWQgYW5kIHRoZSBzZXJ2ZXIgaXMgcmVzdGFydGluZyBpdC5cbiAgICAgICAgICAgICAgICAvLyBrZXJuZWxfcmVzdGFydGluZyBzZXRzIHRoZSBub3RpZmljYXRpb24gd2lkZ2V0LFxuICAgICAgICAgICAgICAgIC8vIGF1dG9yZXN0YXJ0IHNob3dzIHRoZSBtb3JlIHByb21pbmVudCBkaWFsb2cuXG4gICAgICAgICAgICAgICAgdGhpcy5fYXV0b3Jlc3RhcnRBdHRlbXB0ID0gdGhpcy5fYXV0b3Jlc3RhcnRBdHRlbXB0ICsgMTtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2F1dG9yZXN0YXJ0aW5nJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV4ZWN1dGlvbl9zdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fa2VybmVsRGVhZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibmFtZVwiLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIG5hbWUgb2YgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgbmFtZSBvZiB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX25hbWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgY29ubmVjdGlvbiB0byB0aGUga2VybmVsLiBUaGlzXG4gICAgICAgICAqIGZ1bmN0aW9uIG9ubHkgcmV0dXJucyB0cnVlIGlmIHdlYnNvY2tldCBoYXMgYmVlblxuICAgICAgICAgKiBjcmVhdGVkIGFuZCBoYXMgYSBzdGF0ZSBvZiBXZWJTb2NrZXQuT1BFTi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaXNDb25uZWN0ZWRcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fd3MgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fd3MucmVhZHlTdGF0ZSAhPT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayB3aGV0aGVyIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBrZXJuZWwgaGFzIGJlZW4gY29tcGxldGVseVxuICAgICAgICAgKiBzZXZlcmVkLiBUaGlzIGZ1bmN0aW9uIG9ubHkgcmV0dXJucyB0cnVlIGlmIHRoZSB3ZWJzb2NrZXQgaXMgbnVsbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaXNGdWxseURpc2Nvbm5lY3RlZFwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93cyA9PT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIEluZm8gUmVwbHkgTWVzc2FnZSBmcm9tIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImluZm9SZXBseVwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmZvUmVwbHk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzdGF0dXNcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgY3VycmVudCBpZCBvZiB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpZFwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBjdXJyZW50IGlkIG9mIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX2tlcm5lbFVybCA9IHV0aWxzLnVybEpvaW5FbmNvZGUodGhpcy5fYmFzZVVybCwgS0VSTkVMX1NFUlZJQ0VfVVJMLCB0aGlzLl9pZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBmdWxsIHdlYnNvY2tldCB1cmwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIndzVXJsXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLl93c1VybCwgdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9rZXJuZWxVcmwsICdjaGFubmVscycpLCBcIj9zZXNzaW9uX2lkPVwiICsgdGhpcy5fc3RhdGljSWRdLmpvaW4oJycpO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJsaXN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaXN0KGJhc2VVcmwpIHtcbiAgICAgICAgICAgIHZhciBrZXJuZWxTZXJ2aWNlVXJsID0gdXRpbHMudXJsSm9pbkVuY29kZShiYXNlVXJsLCBLRVJORUxfU0VSVklDRV9VUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KGtlcm5lbFNlcnZpY2VVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdWNjZXNzLmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBrZXJuZWwgbGlzdCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU3RhdHVzOiAnICsgc3VjY2Vzcy54aHIuc3RhdHVzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEtlcm5lbDtcbn0pKCk7XG5cbmV4cG9ydHMuS2VybmVsID0gS2VybmVsO1xuXG5fX2RlY29yYXRlKFtzaWduYWxdLCBLZXJuZWwucHJvdG90eXBlLCBcInN0YXR1c0NoYW5nZWRcIik7XG4vKipcbiAqIEJpdCBmbGFncyBmb3IgdGhlIGtlcm5lbCBmdXR1cmUgc3RhdGUuXG4gKi9cbnZhciBLZXJuZWxGdXR1cmVGbGFnO1xuKGZ1bmN0aW9uIChLZXJuZWxGdXR1cmVGbGFnKSB7XG4gICAgS2VybmVsRnV0dXJlRmxhZ1tLZXJuZWxGdXR1cmVGbGFnW1wiR290UmVwbHlcIl0gPSAxXSA9IFwiR290UmVwbHlcIjtcbiAgICBLZXJuZWxGdXR1cmVGbGFnW0tlcm5lbEZ1dHVyZUZsYWdbXCJHb3RJZGxlXCJdID0gMl0gPSBcIkdvdElkbGVcIjtcbiAgICBLZXJuZWxGdXR1cmVGbGFnW0tlcm5lbEZ1dHVyZUZsYWdbXCJBdXRvRGlzcG9zZVwiXSA9IDRdID0gXCJBdXRvRGlzcG9zZVwiO1xuICAgIEtlcm5lbEZ1dHVyZUZsYWdbS2VybmVsRnV0dXJlRmxhZ1tcIklzRG9uZVwiXSA9IDhdID0gXCJJc0RvbmVcIjtcbn0pKEtlcm5lbEZ1dHVyZUZsYWcgfHwgKEtlcm5lbEZ1dHVyZUZsYWcgPSB7fSkpO1xuLyoqXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBhIGtlcm5lbCBmdXR1cmUuXG4gKi9cblxudmFyIEtlcm5lbEZ1dHVyZUhhbmRsZXIgPSAoZnVuY3Rpb24gKF9EaXNwb3NhYmxlKSB7XG4gICAgX2luaGVyaXRzKEtlcm5lbEZ1dHVyZUhhbmRsZXIsIF9EaXNwb3NhYmxlKTtcblxuICAgIGZ1bmN0aW9uIEtlcm5lbEZ1dHVyZUhhbmRsZXIoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBLZXJuZWxGdXR1cmVIYW5kbGVyKTtcblxuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKEtlcm5lbEZ1dHVyZUhhbmRsZXIucHJvdG90eXBlKSwgXCJjb25zdHJ1Y3RvclwiLCB0aGlzKS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gMDtcbiAgICAgICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZXBseSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2RvbmUgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIG9iamVjdCBhcyBiZWluZyBvZiBJS2VybmVsSUQgdHlwZVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IGF1dG9EaXNwb3NlIHN0YXR1cyBvZiB0aGUgZnV0dXJlLlxuICAgICAqL1xuXG4gICAgX2NyZWF0ZUNsYXNzKEtlcm5lbEZ1dHVyZUhhbmRsZXIsIFt7XG4gICAgICAgIGtleTogXCJvblJlcGx5XCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGEgcmVwbHkgaGFuZGxlci4gUmV0dXJucyBgdGhpc2AuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25SZXBseShjYikge1xuICAgICAgICAgICAgdGhpcy5fcmVwbHkgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGFuIG91dHB1dCBoYW5kbGVyLiBSZXR1cm5zIGB0aGlzYC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25PdXRwdXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uT3V0cHV0KGNiKSB7XG4gICAgICAgICAgICB0aGlzLl9vdXRwdXQgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGEgZG9uZSBoYW5kbGVyLiBSZXR1cm5zIGB0aGlzYC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25Eb25lXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbkRvbmUoY2IpIHtcbiAgICAgICAgICAgIHRoaXMuX2RvbmUgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGFuIGlucHV0IGhhbmRsZXIuIFJldHVybnMgYHRoaXNgLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvbklucHV0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbklucHV0KGNiKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dCA9IGNiO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGFuIGluY29taW5nIG1lc3NhZ2UgZnJvbSB0aGUga2VybmVsIGJlbG9uZ2luZyB0byB0aGlzIGZ1dHVyZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaGFuZGxlTXNnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVNc2cobXNnKSB7XG4gICAgICAgICAgICBpZiAobXNnLmNoYW5uZWwgPT09ICdpb3B1YicpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fb3V0cHV0O1xuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQpIG91dHB1dChtc2cpO1xuICAgICAgICAgICAgICAgIGlmIChtc2cubXNnVHlwZSA9PT0gJ3N0YXR1cycgJiYgbXNnLmNvbnRlbnQuZXhlY3V0aW9uX3N0YXRlID09PSAnaWRsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkdvdElkbGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Hb3RSZXBseSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZURvbmUobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXNnLmNoYW5uZWwgPT09ICdzaGVsbCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVwbHkgPSB0aGlzLl9vdXRwdXQ7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGx5KSByZXBseShtc2cpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Hb3RSZXBseSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Rlc3RGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuR290SWRsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRG9uZShtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXNnLmNoYW5uZWwgPT09ICdzdGRpbicpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLl9pbnB1dDtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQpIGlucHV0KG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcG9zZSBhbmQgdW5yZWdpc3RlciB0aGUgZnV0dXJlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkaXNwb3NlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3JlcGx5ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2RvbmUgPSBudWxsO1xuICAgICAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoS2VybmVsRnV0dXJlSGFuZGxlci5wcm90b3R5cGUpLCBcImRpc3Bvc2VcIiwgdGhpcykuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBtZXNzYWdlIGRvbmUgc3RhdHVzLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlRG9uZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZURvbmUobXNnKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuSXNEb25lKTtcbiAgICAgICAgICAgIHZhciBkb25lID0gdGhpcy5fZG9uZTtcbiAgICAgICAgICAgIGlmIChkb25lKSBkb25lKG1zZyk7XG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgb3RoZXIgY2FsbGJhY2tzXG4gICAgICAgICAgICB0aGlzLl9yZXBseSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9kb25lID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXN0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkF1dG9EaXNwb3NlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcgaXMgc2V0LlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfdGVzdEZsYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF90ZXN0RmxhZyhmbGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuX3N0YXR1cyAmIGZsYWcpICE9PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9zZXRGbGFnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfc2V0RmxhZyhmbGFnKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgfD0gZmxhZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhciB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9jbGVhckZsYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9jbGVhckZsYWcoZmxhZykge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzICY9IH5mbGFnO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYXV0b0Rpc3Bvc2VcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5BdXRvRGlzcG9zZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgY3VycmVudCBhdXRvRGlzcG9zZSBiZWhhdmlvciBvZiB0aGUgZnV0dXJlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiBUcnVlLCBpdCB3aWxsIHNlbGYtZGlzcG9zZSgpIGFmdGVyIG9uRG9uZSgpIGlzIGNhbGxlZC5cbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuQXV0b0Rpc3Bvc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGVhckZsYWcoS2VybmVsRnV0dXJlRmxhZy5BdXRvRGlzcG9zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgZm9yIG1lc3NhZ2UgZG9uZSBzdGF0ZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaXNEb25lXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Rlc3RGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuSXNEb25lKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBLZXJuZWxGdXR1cmVIYW5kbGVyO1xufSkoRGlzcG9zYWJsZSk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlS2VybmVsSWQoaW5mbykge1xuICAgIGlmICghaW5mby5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpIHx8ICFpbmZvLmhhc093blByb3BlcnR5KCdpZCcpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIGtlcm5lbCBpZCcpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGluZm8uaWQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBpbmZvLm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIGtlcm5lbCBpZCcpO1xuICAgIH1cbn0iLCIvLyBDb3B5cmlnaHQgKGMpIEp1cHl0ZXIgRGV2ZWxvcG1lbnQgVGVhbS5cbi8vIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTW9kaWZpZWQgQlNEIExpY2Vuc2UuXG4vKipcbiAqIERlc2VyaWFsaXplIGFuZCByZXR1cm4gdGhlIHVucGFja2VkIG1lc3NhZ2UuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlc2VyaWFsaXplID0gZGVzZXJpYWxpemU7XG5leHBvcnRzLnNlcmlhbGl6ZSA9IHNlcmlhbGl6ZTtcblxuZnVuY3Rpb24gZGVzZXJpYWxpemUoZGF0YSkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdmFsdWUgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gZGVzZXJpYWxpemVCaW5hcnkoZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemUgYSBrZXJuZWwgbWVzc2FnZSBmb3IgdHJhbnNwb3J0LlxuICovXG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZShtc2cpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKG1zZy5idWZmZXJzICYmIG1zZy5idWZmZXJzLmxlbmd0aCkge1xuICAgICAgICB2YWx1ZSA9IHNlcmlhbGl6ZUJpbmFyeShtc2cpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkobXNnKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIERlc2VyaWFsaXplIGEgYmluYXJ5IG1lc3NhZ2UgdG8gYSBLZXJuZWwgTWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gZGVzZXJpYWxpemVCaW5hcnkoYnVmKSB7XG4gICAgdmFyIGRhdGEgPSBuZXcgRGF0YVZpZXcoYnVmKTtcbiAgICAvLyByZWFkIHRoZSBoZWFkZXI6IDEgKyBuYnVmcyAzMmIgaW50ZWdlcnNcbiAgICB2YXIgbmJ1ZnMgPSBkYXRhLmdldFVpbnQzMigwKTtcbiAgICB2YXIgb2Zmc2V0cyA9IFtdO1xuICAgIGlmIChuYnVmcyA8IDIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbmNvbWluZyBLZXJuZWwgTWVzc2FnZVwiKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gbmJ1ZnM7IGkrKykge1xuICAgICAgICBvZmZzZXRzLnB1c2goZGF0YS5nZXRVaW50MzIoaSAqIDQpKTtcbiAgICB9XG4gICAgdmFyIGpzb25fYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWYuc2xpY2Uob2Zmc2V0c1swXSwgb2Zmc2V0c1sxXSkpO1xuICAgIHZhciBtc2cgPSBKU09OLnBhcnNlKG5ldyBUZXh0RGVjb2RlcigndXRmOCcpLmRlY29kZShqc29uX2J5dGVzKSk7XG4gICAgLy8gdGhlIHJlbWFpbmluZyBjaHVua3MgYXJlIHN0b3JlZCBhcyBEYXRhVmlld3MgaW4gbXNnLmJ1ZmZlcnNcbiAgICBtc2cuYnVmZmVycyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbmJ1ZnM7IGkrKykge1xuICAgICAgICB2YXIgc3RhcnQgPSBvZmZzZXRzW2ldO1xuICAgICAgICB2YXIgc3RvcCA9IG9mZnNldHNbaSArIDFdIHx8IGJ1Zi5ieXRlTGVuZ3RoO1xuICAgICAgICBtc2cuYnVmZmVycy5wdXNoKG5ldyBEYXRhVmlldyhidWYuc2xpY2Uoc3RhcnQsIHN0b3ApKSk7XG4gICAgfVxuICAgIHJldHVybiBtc2c7XG59XG4vKipcbiAqIEltcGxlbWVudCB0aGUgYmluYXJ5IHNlcmlhbGl6YXRpb24gcHJvdG9jb2wuXG4gKiBTZXJpYWxpemUgS2VybmVsIG1lc3NhZ2UgdG8gQXJyYXlCdWZmZXIuXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUJpbmFyeShtc2cpIHtcbiAgICB2YXIgb2Zmc2V0cyA9IFtdO1xuICAgIHZhciBidWZmZXJzID0gW107XG4gICAgdmFyIGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoJ3V0ZjgnKTtcbiAgICB2YXIganNvbl91dGY4ID0gZW5jb2Rlci5lbmNvZGUoSlNPTi5zdHJpbmdpZnkobXNnLCByZXBsYWNlX2J1ZmZlcnMpKTtcbiAgICBidWZmZXJzLnB1c2goanNvbl91dGY4LmJ1ZmZlcik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtc2cuYnVmZmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBtc2cuYnVmZmVycyBlbGVtZW50cyBjb3VsZCBiZSBlaXRoZXIgdmlld3Mgb3IgQXJyYXlCdWZmZXJzXG4gICAgICAgIC8vIGJ1ZmZlcnMgZWxlbWVudHMgYXJlIEFycmF5QnVmZmVyc1xuICAgICAgICB2YXIgYiA9IG1zZy5idWZmZXJzW2ldO1xuICAgICAgICBidWZmZXJzLnB1c2goYiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyID8gYiA6IGIuYnVmZmVyKTtcbiAgICB9XG4gICAgdmFyIG5idWZzID0gYnVmZmVycy5sZW5ndGg7XG4gICAgb2Zmc2V0cy5wdXNoKDQgKiAobmJ1ZnMgKyAxKSk7XG4gICAgZm9yIChpID0gMDsgaSArIDEgPCBidWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9mZnNldHMucHVzaChvZmZzZXRzW29mZnNldHMubGVuZ3RoIC0gMV0gKyBidWZmZXJzW2ldLmJ5dGVMZW5ndGgpO1xuICAgIH1cbiAgICB2YXIgbXNnX2J1ZiA9IG5ldyBVaW50OEFycmF5KG9mZnNldHNbb2Zmc2V0cy5sZW5ndGggLSAxXSArIGJ1ZmZlcnNbYnVmZmVycy5sZW5ndGggLSAxXS5ieXRlTGVuZ3RoKTtcbiAgICAvLyB1c2UgRGF0YVZpZXcuc2V0VWludDMyIGZvciBuZXR3b3JrIGJ5dGUtb3JkZXJcbiAgICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhtc2dfYnVmLmJ1ZmZlcik7XG4gICAgLy8gd3JpdGUgbmJ1ZnMgdG8gZmlyc3QgNCBieXRlc1xuICAgIHZpZXcuc2V0VWludDMyKDAsIG5idWZzKTtcbiAgICAvLyB3cml0ZSBvZmZzZXRzIHRvIG5leHQgNCAqIG5idWZzIGJ5dGVzXG4gICAgZm9yIChpID0gMDsgaSA8IG9mZnNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRVaW50MzIoNCAqIChpICsgMSksIG9mZnNldHNbaV0pO1xuICAgIH1cbiAgICAvLyB3cml0ZSBhbGwgdGhlIGJ1ZmZlcnMgYXQgdGhlaXIgcmVzcGVjdGl2ZSBvZmZzZXRzXG4gICAgZm9yIChpID0gMDsgaSA8IGJ1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbXNnX2J1Zi5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1tpXSksIG9mZnNldHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gbXNnX2J1Zi5idWZmZXI7XG59XG4vKipcbiAqIEZpbHRlciBcImJ1ZmZlcnNcIiBrZXkgZm9yIEpTT04uc3RyaW5naWZ5XG4gKi9cbmZ1bmN0aW9uIHJlcGxhY2VfYnVmZmVycyhrZXksIHZhbHVlKSB7XG4gICAgaWYgKGtleSA9PT0gXCJidWZmZXJzXCIpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufSIsIi8vIENvcHlyaWdodCAoYykgSnVweXRlciBEZXZlbG9wbWVudCBUZWFtLlxuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNb2RpZmllZCBCU0QgTGljZW5zZS5cblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IG5ld09ialtcImRlZmF1bHRcIl0gPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgX3V0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgdXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdXRpbHMpO1xuXG52YXIgX2tlcm5lbCA9IHJlcXVpcmUoJy4va2VybmVsJyk7XG5cbi8qKlxuICogVGhlIHVybCBmb3IgdGhlIHNlc3Npb24gc2VydmljZS5cbiAqL1xudmFyIF9fZGVjb3JhdGUgPSB1bmRlZmluZWQgJiYgdW5kZWZpbmVkLl9fZGVjb3JhdGUgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiBkKG8pIHx8IG87XG4gICAgICAgICAgICB9LCB0YXJnZXQpO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZCAmJiBkKHRhcmdldCwga2V5KSwgdm9pZCAwKTtcbiAgICAgICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQgJiYgZCh0YXJnZXQsIGtleSwgbykgfHwgbztcbiAgICAgICAgICAgIH0sIGRlc2MpO1xuICAgIH1cbn07XG52YXIgc2lnbmFsID0gcGhvc3Bob3IuY29yZS5zaWduYWw7XG52YXIgU0VTU0lPTl9TRVJWSUNFX1VSTCA9ICdhcGkvc2Vzc2lvbnMnO1xuLyoqXG4gKiBHZXQgYSBsb2dnZXIgc2Vzc2lvbiBvYmplY3RzLlxuICovXG52YXIgc2Vzc2lvbl9sb2cgPSBMb2dnZXIuZ2V0KCdzZXNzaW9uJyk7XG47XG47XG47XG4vKipcbiAqIFNlc3Npb24gb2JqZWN0IGZvciBhY2Nlc3NpbmcgdGhlIHNlc3Npb24gUkVTVCBhcGkuIFRoZSBzZXNzaW9uXG4gKiBzaG91bGQgYmUgdXNlZCB0byBzdGFydCBrZXJuZWxzIGFuZCB0aGVuIHNodXQgdGhlbSBkb3duIC0tIGZvclxuICogYWxsIG90aGVyIG9wZXJhdGlvbnMsIHRoZSBrZXJuZWwgb2JqZWN0IHNob3VsZCBiZSB1c2VkLlxuICoqL1xuXG52YXIgTm90ZWJvb2tTZXNzaW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgc2Vzc2lvbi5cbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIE5vdGVib29rU2Vzc2lvbihvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBOb3RlYm9va1Nlc3Npb24pO1xuXG4gICAgICAgIHRoaXMuX2lkID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRoaXMuX25vdGVib29rUGF0aCA9IFwidW5rbm93blwiO1xuICAgICAgICB0aGlzLl9iYXNlVXJsID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRoaXMuX3Nlc3Npb25VcmwgPSBcInVua25vd25cIjtcbiAgICAgICAgdGhpcy5fd3NVcmwgPSBcInVua25vd25cIjtcbiAgICAgICAgdGhpcy5fa2VybmVsID0gbnVsbDtcbiAgICAgICAgdGhpcy5faWQgPSB1dGlscy51dWlkKCk7XG4gICAgICAgIHRoaXMuX25vdGVib29rUGF0aCA9IG9wdGlvbnMubm90ZWJvb2tQYXRoO1xuICAgICAgICB0aGlzLl9iYXNlVXJsID0gb3B0aW9ucy5iYXNlVXJsO1xuICAgICAgICB0aGlzLl93c1VybCA9IG9wdGlvbnMud3NVcmw7XG4gICAgICAgIHRoaXMuX2tlcm5lbCA9IG5ldyBfa2VybmVsLktlcm5lbCh0aGlzLl9iYXNlVXJsLCB0aGlzLl93c1VybCk7XG4gICAgICAgIHRoaXMuX3Nlc3Npb25VcmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2Jhc2VVcmwsIFNFU1NJT05fU0VSVklDRV9VUkwsIHRoaXMuX2lkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHRVQgL2FwaS9zZXNzaW9uc1xuICAgICAqXG4gICAgICogR2V0IGEgbGlzdCBvZiB0aGUgY3VycmVudCBzZXNzaW9ucy5cbiAgICAgKi9cblxuICAgIF9jcmVhdGVDbGFzcyhOb3RlYm9va1Nlc3Npb24sIFt7XG4gICAgICAgIGtleTogXCJzdGFydFwiLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQT1NUIC9hcGkvc2Vzc2lvbnNcbiAgICAgICAgICpcbiAgICAgICAgICogU3RhcnQgYSBuZXcgc2Vzc2lvbi4gVGhpcyBmdW5jdGlvbiBjYW4gb25seSBiZSBzdWNjZXNzZnVsbHkgZXhlY3V0ZWQgb25jZS5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciB1cmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2Jhc2VVcmwsIFNFU1NJT05fU0VSVklDRV9VUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHRoaXMuX21vZGVsKSxcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlU2Vzc2lvbklkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2tlcm5lbC5jb25uZWN0KHN1Y2Nlc3MuZGF0YS5rZXJuZWwpO1xuICAgICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVTdGF0dXMoJ2tlcm5lbENyZWF0ZWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2hhbmRsZVN0YXR1cygna2VybmVsRGVhZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR0VUIC9hcGkvc2Vzc2lvbnMvWzpzZXNzaW9uX2lkXVxuICAgICAgICAgKlxuICAgICAgICAgKiBHZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBzZXNzaW9uLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRJbmZvXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHRoaXMuX3Nlc3Npb25VcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlU2Vzc2lvbklkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERFTEVURSAvYXBpL3Nlc3Npb25zL1s6c2Vzc2lvbl9pZF1cbiAgICAgICAgICpcbiAgICAgICAgICogS2lsbCB0aGUga2VybmVsIGFuZCBzaHV0ZG93biB0aGUgc2Vzc2lvbi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZGVsZXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfZGVsZXRlKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2tlcm5lbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygna2VybmVsS2lsbGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fa2VybmVsLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9zZXNzaW9uVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVNlc3Npb25JZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlamVjdGVkLnhoci5zdGF0dXMgPT09IDQxMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGtlcm5lbCB3YXMgZGVsZXRlZCBidXQgdGhlIHNlc3Npb24gd2FzIG5vdCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihyZWplY3RlZC5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlc3RhcnQgdGhlIHNlc3Npb24gYnkgZGVsZXRpbmcgaXQgYW5kIHRoZW4gc3RhcnRpbmcgaXQgZnJlc2guXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlc3RhcnRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3RhcnQob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzW1wiZGVsZXRlXCJdKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5zdGFydCgpO1xuICAgICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5zdGFydCgpO1xuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5ub3RlYm9va1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMyLl9ub3RlYm9va1BhdGggPSBvcHRpb25zLm5vdGVib29rUGF0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXJuZWxOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzMi5fa2VybmVsLm5hbWUgPSBvcHRpb25zLmtlcm5lbE5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVuYW1lIHRoZSBub3RlYm9vay5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVuYW1lTm90ZWJvb2tcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmFtZU5vdGVib29rKHBhdGgpIHtcbiAgICAgICAgICAgIHRoaXMuX25vdGVib29rUGF0aCA9IHBhdGg7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fc2Vzc2lvblVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQQVRDSFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh0aGlzLl9tb2RlbCksXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVNlc3Npb25JZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGRhdGEgbW9kZWwgZm9yIHRoZSBzZXNzaW9uLCB3aGljaCBpbmNsdWRlcyB0aGUgbm90ZWJvb2sgcGF0aFxuICAgICAgICAgKiBhbmQga2VybmVsIChuYW1lIGFuZCBpZCkuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9oYW5kbGVTdGF0dXNcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGEgc2Vzc2lvbiBzdGF0dXMgY2hhbmdlLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9oYW5kbGVTdGF0dXMoc3RhdHVzKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0NoYW5nZWQuZW1pdChzdGF0dXMpO1xuICAgICAgICAgICAgc2Vzc2lvbl9sb2cuZXJyb3IoJ1Nlc3Npb246ICcgKyBzdGF0dXMgKyAnICgnICsgdGhpcy5faWQgKyAnKScpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwia2VybmVsXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgc2Vzc2lvbiBrZXJuZWwgb2JqZWN0LlxuICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9rZXJuZWw7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfbW9kZWxcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBub3RlYm9vazogeyBwYXRoOiB0aGlzLl9ub3RlYm9va1BhdGggfSxcbiAgICAgICAgICAgICAgICBrZXJuZWw6IHsgbmFtZTogdGhpcy5fa2VybmVsLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLl9rZXJuZWwuaWQgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwibGlzdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGlzdChiYXNlVXJsKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvblVybCA9IHV0aWxzLnVybEpvaW5FbmNvZGUoYmFzZVVybCwgU0VTU0lPTl9TRVJWSUNFX1VSTCk7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3Qoc2Vzc2lvblVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU3RhdHVzOiAnICsgc3VjY2Vzcy54aHIuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN1Y2Nlc3MuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2Vzc2lvbiBsaXN0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRlU2Vzc2lvbklkKHN1Y2Nlc3MuZGF0YVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBOb3RlYm9va1Nlc3Npb247XG59KSgpO1xuXG5leHBvcnRzLk5vdGVib29rU2Vzc2lvbiA9IE5vdGVib29rU2Vzc2lvbjtcblxuX19kZWNvcmF0ZShbc2lnbmFsXSwgTm90ZWJvb2tTZXNzaW9uLnByb3RvdHlwZSwgXCJzdGF0dXNDaGFuZ2VkXCIpO1xuLyoqXG4gKiBWYWxpZGF0ZSBhbiBvYmplY3QgYXMgYmVpbmcgb2YgSVNlc3Npb25JZCB0eXBlLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVNlc3Npb25JZChpbmZvKSB7XG4gICAgaWYgKCFpbmZvLmhhc093blByb3BlcnR5KCdpZCcpIHx8ICFpbmZvLmhhc093blByb3BlcnR5KCdub3RlYm9vaycpIHx8ICFpbmZvLmhhc093blByb3BlcnR5KCdrZXJuZWwnKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTZXNzaW9uIE1vZGVsJyk7XG4gICAgfVxuICAgICgwLCBfa2VybmVsLnZhbGlkYXRlS2VybmVsSWQpKGluZm8ua2VybmVsKTtcbiAgICBpZiAodHlwZW9mIGluZm8uaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNlc3Npb24gTW9kZWwnKTtcbiAgICB9XG4gICAgdmFsaWRhdGVOb3RlYm9va0lkKGluZm8ubm90ZWJvb2spO1xufVxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBvYmplY3QgYXMgYmVpbmcgb2YgSU5vdGVib29rSWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVOb3RlYm9va0lkKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5oYXNPd25Qcm9wZXJ0eSgncGF0aCcpIHx8IHR5cGVvZiBtb2RlbC5wYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBOb3RlYm9vayBNb2RlbCcpO1xuICAgIH1cbn0iLCIvLyBDb3B5cmlnaHQgKGMpIEp1cHl0ZXIgRGV2ZWxvcG1lbnQgVGVhbS5cbi8vIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTW9kaWZpZWQgQlNEIExpY2Vuc2UuXG4vKipcbiAqIENvcHkgdGhlIGNvbnRlbnRzIG9mIG9uZSBvYmplY3QgdG8gYW5vdGhlciwgcmVjdXJzaXZlbHkuXG4gKlxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMjMxNzAwMy9zb21ldGhpbmctbGlrZS1qcXVlcnktZXh0ZW5kLWJ1dC1zdGFuZGFsb25lXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmV4dGVuZCA9IGV4dGVuZDtcbmV4cG9ydHMudXVpZCA9IHV1aWQ7XG5leHBvcnRzLnVybFBhdGhKb2luID0gdXJsUGF0aEpvaW47XG5leHBvcnRzLmVuY29kZVVSSUNvbXBvbmVudHMgPSBlbmNvZGVVUklDb21wb25lbnRzO1xuZXhwb3J0cy51cmxKb2luRW5jb2RlID0gdXJsSm9pbkVuY29kZTtcbmV4cG9ydHMuanNvblRvUXVlcnlTdHJpbmcgPSBqc29uVG9RdWVyeVN0cmluZztcbmV4cG9ydHMuYWpheFJlcXVlc3QgPSBhamF4UmVxdWVzdDtcblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCwgc291cmNlKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHt9O1xuICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlW3Byb3BdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gZXh0ZW5kKHRhcmdldFtwcm9wXSwgc291cmNlW3Byb3BdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIEdldCBhIHV1aWQgYXMgYSBzdHJpbmcuXG4gKlxuICogaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAqL1xuXG5mdW5jdGlvbiB1dWlkKCkge1xuICAgIHZhciBzID0gW107XG4gICAgdmFyIGhleERpZ2l0cyA9IFwiMDEyMzQ1Njc4OUFCQ0RFRlwiO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgICBzW2ldID0gaGV4RGlnaXRzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSk7XG4gICAgfVxuICAgIHNbMTJdID0gXCI0XCI7IC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuICAgIHNbMTZdID0gaGV4RGlnaXRzLmNoYXJBdChOdW1iZXIoc1sxNl0pICYgMHgzIHwgMHg4KTsgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgICByZXR1cm4gcy5qb2luKFwiXCIpO1xufVxuXG4vKipcbiAqIEpvaW4gYSBzZXF1ZW5jZSBvZiB1cmwgY29tcG9uZW50cyB3aXRoICcvJy5cbiAqL1xuXG5mdW5jdGlvbiB1cmxQYXRoSm9pbigpIHtcbiAgICB2YXIgdXJsID0gJyc7XG5cbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgcGF0aHMgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgcGF0aHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGF0aHNbaV0gPT09ICcnKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXJsLmxlbmd0aCA+IDAgJiYgdXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgIT0gJy8nKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwgKyAnLycgKyBwYXRoc1tpXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVybCA9IHVybCArIHBhdGhzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1cmwucmVwbGFjZSgvXFwvXFwvKy8sICcvJyk7XG59XG5cbi8qKlxuICogRW5jb2RlIGp1c3QgdGhlIGNvbXBvbmVudHMgb2YgYSBtdWx0aS1zZWdtZW50IHVyaSxcbiAqIGxlYXZpbmcgJy8nIHNlcGFyYXRvcnMuXG4gKi9cblxuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50cyh1cmkpIHtcbiAgICByZXR1cm4gdXJpLnNwbGl0KCcvJykubWFwKGVuY29kZVVSSUNvbXBvbmVudCkuam9pbignLycpO1xufVxuXG4vKipcbiAqIEpvaW4gYSBzZXF1ZW5jZSBvZiB1cmwgY29tcG9uZW50cyB3aXRoICcvJyxcbiAqIGVuY29kaW5nIGVhY2ggY29tcG9uZW50IHdpdGggZW5jb2RlVVJJQ29tcG9uZW50LlxuICovXG5cbmZ1bmN0aW9uIHVybEpvaW5FbmNvZGUoKSB7XG4gICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgYXJnc1tfa2V5Ml0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cblxuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnRzKHVybFBhdGhKb2luLmFwcGx5KG51bGwsIGFyZ3MpKTtcbn1cblxuLyoqXG4gKiBQcm9wZXJseSBkZXRlY3QgdGhlIGN1cnJlbnQgYnJvd3Nlci5cbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjQwMDkzNS9icm93c2VyLWRldGVjdGlvbi1pbi1qYXZhc2NyaXB0XG4gKi9cbnZhciBicm93c2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gbmF2aWdhdG9yIHVuZGVmaW5lZCBpbiBub2RlXG4gICAgICAgIHJldHVybiBbJ05vbmUnXTtcbiAgICB9XG4gICAgdmFyIE4gPSBuYXZpZ2F0b3IuYXBwTmFtZTtcbiAgICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuICAgIHZhciB0ZW07XG4gICAgdmFyIE0gPSB1YS5tYXRjaCgvKG9wZXJhfGNocm9tZXxzYWZhcml8ZmlyZWZveHxtc2llKVxcLz9cXHMqKFxcLj9cXGQrKFxcLlxcZCspKikvaSk7XG4gICAgaWYgKE0gJiYgKHRlbSA9IHVhLm1hdGNoKC92ZXJzaW9uXFwvKFtcXC5cXGRdKykvaSkpICE9PSBudWxsKSBNWzJdID0gdGVtWzFdO1xuICAgIE0gPSBNID8gW01bMV0sIE1bMl1dIDogW04sIG5hdmlnYXRvci5hcHBWZXJzaW9uLCAnLT8nXTtcbiAgICByZXR1cm4gTTtcbn0pKCk7XG5leHBvcnRzLmJyb3dzZXIgPSBicm93c2VyO1xuLyoqXG4gKiBSZXR1cm4gYSBzZXJpYWxpemVkIG9iamVjdCBzdHJpbmcgc3VpdGFibGUgZm9yIGEgcXVlcnkuXG4gKlxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzA3MDc0MjNcbiAqL1xuXG5mdW5jdGlvbiBqc29uVG9RdWVyeVN0cmluZyhqc29uKSB7XG4gICAgcmV0dXJuICc/JyArIE9iamVjdC5rZXlzKGpzb24pLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChqc29uW2tleV0pO1xuICAgIH0pLmpvaW4oJyYnKTtcbn1cblxuLyoqXG4gKiBBc3luY2hyb25vdXMgWE1MSFRUUFJlcXVlc3QgaGFuZGxlci5cbiAqXG4gKiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9lczYvcHJvbWlzZXMvI3RvYy1wcm9taXNpZnlpbmcteG1saHR0cHJlcXVlc3RcbiAqL1xuXG5mdW5jdGlvbiBhamF4UmVxdWVzdCh1cmwsIHNldHRpbmdzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXEub3BlbihzZXR0aW5ncy5tZXRob2QsIHVybCk7XG4gICAgICAgIGlmIChzZXR0aW5ncy5jb250ZW50VHlwZSkge1xuICAgICAgICAgICAgcmVxLm92ZXJyaWRlTWltZVR5cGUoc2V0dGluZ3MuY29udGVudFR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSByZXEucmVzcG9uc2U7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MuZGF0YVR5cGUgPT09ICdqc29uJykge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSh7IGRhdGE6IHJlc3BvbnNlLCBzdGF0dXNUZXh0OiByZXEuc3RhdHVzVGV4dCwgeGhyOiByZXEgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KHsgeGhyOiByZXEsIHN0YXR1c1RleHQ6IHJlcS5zdGF0dXNUZXh0LCBlcnJvcjogZXJyIH0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoc2V0dGluZ3MuZGF0YSkge1xuICAgICAgICAgICAgcmVxLnNlbmQoc2V0dGluZ3MuZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXEuc2VuZCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59Il19
