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
            console.log("hi there");
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
                console.log('setting this thing');
                this.id = id.id;
                this.name = id.name;
            }
            if (!this._kernelUrl) {
                throw Error('You must set the kernel id before starting.');
            }
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
         * Kill a kernel. Note: if useing a session, Session.delete()
         * should be used instead.
         */
    }, {
        key: "delete",
        value: function _delete() {
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
                console.log('info reply');
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

var KernelSub = (function (_Kernel) {
    _inherits(KernelSub, _Kernel);

    function KernelSub() {
        _classCallCheck(this, KernelSub);

        _get(Object.getPrototypeOf(KernelSub.prototype), "constructor", this).apply(this, arguments);
    }

    /**
     * Validate an object as being of IKernelID type
     */

    _createClass(KernelSub, [{
        key: "doSomething",
        value: function doSomething() {}
    }]);

    return KernelSub;
})(Kernel);

exports.KernelSub = KernelSub;

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvaW5kZXguanMiLCJsaWIva2VybmVsLmpzIiwibGliL3NlcmlhbGl6ZS5qcyIsImxpYi9zZXNzaW9uLmpzIiwibGliL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wRXhwb3J0V2lsZGNhcmQob2JqLCBkZWZhdWx0cykgeyB2YXIgbmV3T2JqID0gZGVmYXVsdHMoe30sIG9iaik7IGRlbGV0ZSBuZXdPYmpbJ2RlZmF1bHQnXTsgcmV0dXJuIG5ld09iajsgfVxuXG5mdW5jdGlvbiBfZGVmYXVsdHMob2JqLCBkZWZhdWx0cykgeyB2YXIga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGRlZmF1bHRzKTsgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7IHZhciBrZXkgPSBrZXlzW2ldOyB2YXIgdmFsdWUgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGRlZmF1bHRzLCBrZXkpOyBpZiAodmFsdWUgJiYgdmFsdWUuY29uZmlndXJhYmxlICYmIG9ialtrZXldID09PSB1bmRlZmluZWQpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSk7IH0gfSByZXR1cm4gb2JqOyB9XG5cbnZhciBfa2VybmVsID0gcmVxdWlyZSgnLi9rZXJuZWwnKTtcblxudmFyIF9zZXNzaW9uID0gcmVxdWlyZSgnLi9zZXNzaW9uJyk7XG5cbl9kZWZhdWx0cyhleHBvcnRzLCBfaW50ZXJvcEV4cG9ydFdpbGRjYXJkKF9rZXJuZWwsIF9kZWZhdWx0cykpO1xuXG5fZGVmYXVsdHMoZXhwb3J0cywgX2ludGVyb3BFeHBvcnRXaWxkY2FyZChfc2Vzc2lvbiwgX2RlZmF1bHRzKSk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHsgS2VybmVsOiBfa2VybmVsLktlcm5lbCwgTm90ZWJvb2tTZXNzaW9uOiBfc2Vzc2lvbi5Ob3RlYm9va1Nlc3Npb24gfTsiLCIvLyBDb3B5cmlnaHQgKGMpIEp1cHl0ZXIgRGV2ZWxvcG1lbnQgVGVhbS5cbi8vIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTW9kaWZpZWQgQlNEIExpY2Vuc2UuXG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDUsIF94NiwgX3g3KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NSwgcHJvcGVydHkgPSBfeDYsIHJlY2VpdmVyID0gX3g3OyBkZXNjID0gcGFyZW50ID0gZ2V0dGVyID0gdW5kZWZpbmVkOyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NSA9IHBhcmVudDsgX3g2ID0gcHJvcGVydHk7IF94NyA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5leHBvcnRzLnZhbGlkYXRlS2VybmVsSWQgPSB2YWxpZGF0ZUtlcm5lbElkO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqW1wiZGVmYXVsdFwiXSA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgX3V0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgdXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdXRpbHMpO1xuXG52YXIgX3NlcmlhbGl6ZSA9IHJlcXVpcmUoJy4vc2VyaWFsaXplJyk7XG5cbi8qKlxuICogVGhlIHVybCBmb3IgdGhlIGtlcm5lbCBzZXJ2aWNlLlxuICovXG52YXIgX19kZWNvcmF0ZSA9IHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19kZWNvcmF0ZSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkICYmIGQobykgfHwgbztcbiAgICAgICAgICAgIH0sIHRhcmdldCk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChkICYmIGQodGFyZ2V0LCBrZXkpLCB2b2lkIDApO1xuICAgICAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiBkKHRhcmdldCwga2V5LCBvKSB8fCBvO1xuICAgICAgICAgICAgfSwgZGVzYyk7XG4gICAgfVxufTtcbnZhciBzaWduYWwgPSBwaG9zcGhvci5jb3JlLnNpZ25hbDtcbnZhciBEaXNwb3NhYmxlID0gcGhvc3Bob3IudXRpbGl0eS5EaXNwb3NhYmxlO1xudmFyIEtFUk5FTF9TRVJWSUNFX1VSTCA9ICdhcGkva2VybmVsJztcbi8qKlxuICogR2V0IGEgbG9nZ2VyIGtlcm5lbCBvYmplY3RzLlxuICovXG52YXIga2VybmVsX2xvZyA9IExvZ2dlci5nZXQoJ2tlcm5lbCcpO1xuLyoqXG4gKiBBIGNsYXNzIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIFB5dGhvbiBrZXJuZWwuIFRoaXNcbiAqIHNob3VsZCBnZW5lcmFsbHkgbm90IGJlIGNvbnN0cnVjdGVkIGRpcmVjdGx5LCBidXQgYmUgY3JlYXRlZFxuICogYnkgdGhlIGBTZXNzaW9uYCBvYmplY3QuIE9uY2UgY3JlYXRlZCwgdGhpcyBvYmplY3Qgc2hvdWxkIGJlXG4gKiB1c2VkIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIGtlcm5lbC5cbiAqL1xuXG52YXIgS2VybmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcga2VybmVsLlxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gS2VybmVsKGJhc2VVcmwsIHdzVXJsKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBLZXJuZWwpO1xuXG4gICAgICAgIHRoaXMuX2lkID0gJyc7XG4gICAgICAgIHRoaXMuX25hbWUgPSAnJztcbiAgICAgICAgdGhpcy5fYmFzZVVybCA9ICcnO1xuICAgICAgICB0aGlzLl9rZXJuZWxVcmwgPSAnJztcbiAgICAgICAgdGhpcy5fd3NVcmwgPSAnJztcbiAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSAnJztcbiAgICAgICAgdGhpcy5fc3RhdGljSWQgPSAnJztcbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbmZvUmVwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3RMaW1pdCA9IDc7XG4gICAgICAgIHRoaXMuX2F1dG9yZXN0YXJ0QXR0ZW1wdCA9IDA7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPSAwO1xuICAgICAgICB0aGlzLl9oYW5kbGVyTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW9wdWJIYW5kbGVycyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9ICcnO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSAndW5rbm93bic7XG4gICAgICAgIHRoaXMuX2Jhc2VVcmwgPSBiYXNlVXJsO1xuICAgICAgICB0aGlzLl93c1VybCA9IHdzVXJsO1xuICAgICAgICBpZiAoIXRoaXMuX3dzVXJsKSB7XG4gICAgICAgICAgICAvLyB0cmFpbGluZyAncycgaW4gaHR0cHMgd2lsbCBiZWNvbWUgd3NzIGZvciBzZWN1cmUgd2ViIHNvY2tldHNcbiAgICAgICAgICAgIHRoaXMuX3dzVXJsID0gbG9jYXRpb24ucHJvdG9jb2wucmVwbGFjZSgnaHR0cCcsICd3cycpICsgXCIvL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdGF0aWNJZCA9IHV0aWxzLnV1aWQoKTtcbiAgICAgICAgdGhpcy5faGFuZGxlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJTb2NrZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBicm93c2VyIGRvZXMgbm90IGhhdmUgV2ViU29ja2V0IHN1cHBvcnQsIHBsZWFzZSB0cnkgQ2hyb21lLCBTYWZhcmksIG9yIEZpcmVmb3gg4omlIDExLicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR0VUIC9hcGkva2VybmVsc1xuICAgICAqXG4gICAgICogR2V0IHRoZSBsaXN0IG9mIHJ1bm5pbmcga2VybmVscy5cbiAgICAgKi9cblxuICAgIF9jcmVhdGVDbGFzcyhLZXJuZWwsIFt7XG4gICAgICAgIGtleTogXCJnZXRJbmZvXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdFVCAvYXBpL2tlcm5lbHMvWzprZXJuZWxfaWRdXG4gICAgICAgICAqXG4gICAgICAgICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEluZm8oKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fa2VybmVsVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBPU1QgL2FwaS9rZXJuZWxzL1s6a2VybmVsX2lkXS9pbnRlcnJ1cHRcbiAgICAgICAgICpcbiAgICAgICAgICogSW50ZXJydXB0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImludGVycnVwdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW50ZXJydXB0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnaW50ZXJydXB0aW5nJyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9rZXJuZWxVcmwsICdpbnRlcnJ1cHQnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaGkgdGhlcmVcIik7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU3RhdHVzOiAnICsgc3VjY2Vzcy54aHIuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfdGhpczIuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUE9TVCAvYXBpL2tlcm5lbHMvWzprZXJuZWxfaWRdL3Jlc3RhcnRcbiAgICAgICAgICpcbiAgICAgICAgICogUmVzdGFydCB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZXN0YXJ0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZXN0YXJ0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygncmVzdGFydGluZycpO1xuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB2YXIgdXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9rZXJuZWxVcmwsICdyZXN0YXJ0Jyk7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU3RhdHVzOiAnICsgc3VjY2Vzcy54aHIuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVLZXJuZWxJZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIF90aGlzMy5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzMy5fb25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQT1NUIC9hcGkva2VybmVscy9bOmtlcm5lbF9pZF1cbiAgICAgICAgICpcbiAgICAgICAgICogU3RhcnQgYSBrZXJuZWwuICBOb3RlOiBpZiB1c2luZyBhIHNlc3Npb24sIFNlc3Npb24uc3RhcnQoKVxuICAgICAgICAgKiBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzdGFydFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQoaWQpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAoaWQgIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZXR0aW5nIHRoaXMgdGhpbmcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlkID0gaWQuaWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gaWQubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5fa2VybmVsVXJsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1lvdSBtdXN0IHNldCB0aGUga2VybmVsIGlkIGJlZm9yZSBzdGFydGluZy4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9rZXJuZWxVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgX3RoaXM0LmNvbm5lY3Qoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXM0Ll9vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERFTEVURSAvYXBpL2tlcm5lbHMvWzprZXJuZWxfaWRdXG4gICAgICAgICAqXG4gICAgICAgICAqIEtpbGwgYSBrZXJuZWwuIE5vdGU6IGlmIHVzZWluZyBhIHNlc3Npb24sIFNlc3Npb24uZGVsZXRlKClcbiAgICAgICAgICogc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZGVsZXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfZGVsZXRlKCkge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHRoaXMuX2tlcm5lbFVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJERUxFVEVcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25uZWN0IHRvIHRoZSBzZXJ2ZXItc2lkZSB0aGUga2VybmVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBkaXJlY3RseSBieSBhIHNlc3Npb24uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvbm5lY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbm5lY3QoaWQpIHtcbiAgICAgICAgICAgIGlmIChpZCAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9IGlkLmlkO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IGlkLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2tlcm5lbFVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdZb3UgbXVzdCBzZXQgdGhlIGtlcm5lbCBpZCBiZWZvcmUgc3RhcnRpbmcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0Q2hhbm5lbHMoKTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnY3JlYXRlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlY29ubmVjdCB0byBhIGRpc2Nvbm5lY3RlZCBrZXJuZWwuIFRoaXMgaXMgbm90IGFjdHVhbGx5IGFcbiAgICAgICAgICogc3RhbmRhcmQgSFRUUCByZXF1ZXN0LCBidXQgdXNlZnVsIGZ1bmN0aW9uIG5vbmV0aGVsZXNzIGZvclxuICAgICAgICAgKiByZWNvbm5lY3RpbmcgdG8gdGhlIGtlcm5lbCBpZiB0aGUgY29ubmVjdGlvbiBpcyBzb21laG93IGxvc3QuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVjb25uZWN0KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RBdHRlbXB0ID0gdGhpcy5fcmVjb25uZWN0QXR0ZW1wdCArIDE7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ3JlY29ubmVjdGluZycpO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRDaGFubmVscygpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2Nvbm5lY3QgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZGlzY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGlzY29ubmVjdCgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fd3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fd3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd3Mub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzNS5fY2xlYXJTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGVhclNvY2tldCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIGEgbWVzc2FnZSBvbiB0aGUga2VybmVsJ3Mgc2hlbGwgY2hhbm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwic2VuZFNoZWxsTWVzc2FnZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZFNoZWxsTWVzc2FnZShtc2dfdHlwZSwgY29udGVudCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBtZXRhZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzJdO1xuICAgICAgICAgICAgdmFyIGJ1ZmZlcnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyBbXSA6IGFyZ3VtZW50c1szXTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwia2VybmVsIGlzIG5vdCBjb25uZWN0ZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gdGhpcy5fY3JlYXRlTXNnKG1zZ190eXBlLCBjb250ZW50LCBtZXRhZGF0YSwgYnVmZmVycyk7XG4gICAgICAgICAgICBtc2cuY2hhbm5lbCA9ICdzaGVsbCc7XG4gICAgICAgICAgICB0aGlzLl93cy5zZW5kKCgwLCBfc2VyaWFsaXplLnNlcmlhbGl6ZSkobXNnKSk7XG4gICAgICAgICAgICB2YXIgZnV0dXJlID0gbmV3IEtlcm5lbEZ1dHVyZUhhbmRsZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzNi5faGFuZGxlck1hcFtcImRlbGV0ZVwiXShtc2cuaGVhZGVyLm1zZ0lkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlck1hcC5zZXQobXNnLmhlYWRlci5tc2dJZCwgZnV0dXJlKTtcbiAgICAgICAgICAgIHJldHVybiBmdXR1cmU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGtlcm5lbCBpbmZvLlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIGEgS2VybmVsRnV0dXJlIHRoYXQgd2lsbCByZXNvbHZlIHRvIGEgYGtlcm5lbF9pbmZvX3JlcGx5YCBtZXNzYWdlIGRvY3VtZW50ZWRcbiAgICAgICAgICogW2hlcmVdKGh0dHA6Ly9pcHl0aG9uLm9yZy9pcHl0aG9uLWRvYy9kZXYvZGV2ZWxvcG1lbnQvbWVzc2FnaW5nLmh0bWwja2VybmVsLWluZm8pXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImtlcm5lbEluZm9cIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGtlcm5lbEluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZW5kU2hlbGxNZXNzYWdlKFwia2VybmVsX2luZm9fcmVxdWVzdFwiLCB7fSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGluZm8gb24gYW4gb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIGEgS2VybmVsRnV0dXJlIHRoYXQgd2lsbCByZXNvbHZlIHRvIGEgYGluc3BlY3RfcmVwbHlgIG1lc3NhZ2UgZG9jdW1lbnRlZFxuICAgICAgICAgKiBbaGVyZV0oaHR0cDovL2lweXRob24ub3JnL2lweXRob24tZG9jL2Rldi9kZXZlbG9wbWVudC9tZXNzYWdpbmcuaHRtbCNvYmplY3QtaW5mb3JtYXRpb24pXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImluc3BlY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGluc3BlY3QoY29kZSwgY3Vyc29yX3Bvcykge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgICAgICBjdXJzb3JfcG9zOiBjdXJzb3JfcG9zLFxuICAgICAgICAgICAgICAgIGRldGFpbF9sZXZlbDogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbmRTaGVsbE1lc3NhZ2UoXCJpbnNwZWN0X3JlcXVlc3RcIiwgY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRXhlY3V0ZSBnaXZlbiBjb2RlIGludG8ga2VybmVsLCByZXR1cm5pbmcgYSBLZXJuZWxGdXR1cmUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBvcHRpb25zIG9iamVjdCBzaG91bGQgY29udGFpbiB0aGUgb3B0aW9ucyBmb3IgdGhlIGV4ZWN1dGVcbiAgICAgICAgICogY2FsbC4gSXRzIGRlZmF1bHQgdmFsdWVzIGFyZTpcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBvcHRpb25zID0ge1xuICAgICAgICAgKiAgICAgICAgc2lsZW50IDogdHJ1ZSxcbiAgICAgICAgICogICAgICAgIHVzZXJfZXhwcmVzc2lvbnMgOiB7fSxcbiAgICAgICAgICogICAgICAgIGFsbG93X3N0ZGluIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICBzdG9yZV9oaXN0b3J5OiBmYWxzZVxuICAgICAgICAgKiAgICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZXhlY3V0ZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZXhlY3V0ZShjb2RlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgICAgIHNpbGVudDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdG9yZV9oaXN0b3J5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB1c2VyX2V4cHJlc3Npb25zOiB7fSxcbiAgICAgICAgICAgICAgICBhbGxvd19zdGRpbjogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB1dGlscy5leHRlbmQoY29udGVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZW5kU2hlbGxNZXNzYWdlKFwiZXhlY3V0ZV9yZXF1ZXN0XCIsIGNvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlcXVlc3QgYSBjb2RlIGNvbXBsZXRpb24gZnJvbSB0aGUga2VybmVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXR1cm5zIGEgS2VybmVsRnV0dXJlIHdpdGggd2lsbCByZXNvbHZlIHRvIGEgYGNvbXBsZXRlX3JlcGx5YCBkb2N1bWVudGVkXG4gICAgICAgICAqIFtoZXJlXShodHRwOi8vaXB5dGhvbi5vcmcvaXB5dGhvbi1kb2MvZGV2L2RldmVsb3BtZW50L21lc3NhZ2luZy5odG1sI2NvbXBsZXRlKVxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjb21wbGV0ZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29tcGxldGUoY29kZSwgY3Vyc29yX3Bvcykge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgICAgICBjdXJzb3JfcG9zOiBjdXJzb3JfcG9zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VuZFNoZWxsTWVzc2FnZShcImNvbXBsZXRlX3JlcXVlc3RcIiwgY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZCBhbiBpbnB1dCByZXBseSBtZXNzYWdlIHRvIHRoZSBrZXJuZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRPRE86IGhvdyB0byBoYW5kbGUgdGhpcz8gIFJpZ2h0IG5vdyBjYWxsZWQgYnlcbiAgICAgICAgICogLi9zdGF0aWMvbm90ZWJvb2svanMvb3V0cHV0YXJlYS5qczo4Mjc6XG4gICAgICAgICAqIHRoaXMuZXZlbnRzLnRyaWdnZXIoJ3NlbmRfaW5wdXRfcmVwbHkuS2VybmVsJywgdmFsdWUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiB3aGljaCBoYXMgbm8gcmVmZXJlbmNlIHRvIHRoZSBzZXNzaW9uIG9yIHRoZSBrZXJuZWxcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwic2VuZElucHV0UmVwbHlcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNlbmRJbnB1dFJlcGx5KGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJrZXJuZWwgaXMgbm90IGNvbm5lY3RlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBtc2cgPSB0aGlzLl9jcmVhdGVNc2coXCJpbnB1dF9yZXBseVwiLCBjb250ZW50KTtcbiAgICAgICAgICAgIG1zZy5jaGFubmVsID0gJ3N0ZGluJztcbiAgICAgICAgICAgIHRoaXMuX3dzLnNlbmQoKDAsIF9zZXJpYWxpemUuc2VyaWFsaXplKShtc2cpKTtcbiAgICAgICAgICAgIHJldHVybiBtc2cuaGVhZGVyLm1zZ0lkO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhIGtlcm5lbCBtZXNzYWdlIGdpdmVuIGlucHV0IGF0dHJpYnV0ZXMuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9jcmVhdGVNc2dcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9jcmVhdGVNc2cobXNnX3R5cGUsIGNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzJdO1xuICAgICAgICAgICAgdmFyIGJ1ZmZlcnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyBbXSA6IGFyZ3VtZW50c1szXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgbXNnSWQ6IHV0aWxzLnV1aWQoKSxcbiAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHRoaXMuX3VzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uOiB0aGlzLl9zdGF0aWNJZCxcbiAgICAgICAgICAgICAgICAgICAgbXNnVHlwZTogbXNnX3R5cGUsXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IFwiNS4wXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBtZXRhZGF0YSB8fCB7fSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxuICAgICAgICAgICAgICAgIGJ1ZmZlcnM6IGJ1ZmZlcnMgfHwgW10sXG4gICAgICAgICAgICAgICAgcGFyZW50SGVhZGVyOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBtc2c7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGEga2VybmVsIHN0YXR1cyBjaGFuZ2UgbWVzc2FnZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2hhbmRsZVN0YXR1c1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZVN0YXR1cyhzdGF0dXMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2hhbmdlZC5lbWl0KHN0YXR1cyk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgICB2YXIgbXNnID0gJ0tlcm5lbDogJyArIHN0YXR1cyArICcgKCcgKyB0aGlzLl9pZCArICcpJztcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdpZGxlJyB8fCBzdGF0dXMgPT09ICdidXN5Jykge1xuICAgICAgICAgICAgICAgIGtlcm5lbF9sb2cuZGVidWcobXNnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5pbmZvKG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGEgZmFpbGVkIEFKQVggcmVxdWVzdCBieSBsb2dnaW5nIHRoZSBlcnJvciBtZXNzYWdlLCBhbmQgdGhyb3dpbmdcbiAgICAgICAgICogYW5vdGhlciBlcnJvci5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX29uRXJyb3JcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9vbkVycm9yKGVycm9yKSB7XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJBUEkgcmVxdWVzdCBmYWlsZWQgKFwiICsgZXJyb3Iuc3RhdHVzVGV4dCArIFwiKTogXCI7XG4gICAgICAgICAgICBrZXJuZWxfbG9nLmVycm9yKG1zZyk7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihlcnJvci5zdGF0dXNUZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGFydCB0aGUgV2Vic29ja2V0IGNoYW5uZWxzLlxuICAgICAgICAgKiBXaWxsIHN0b3AgYW5kIHJlc3RhcnQgdGhlbSBpZiB0aGV5IGFscmVhZHkgZXhpc3QuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9zdGFydENoYW5uZWxzXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfc3RhcnRDaGFubmVscygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHZhciB3c19ob3N0X3VybCA9IHRoaXMuX3dzVXJsICsgdGhpcy5fa2VybmVsVXJsO1xuICAgICAgICAgICAga2VybmVsX2xvZy5pbmZvKFwiU3RhcnRpbmcgV2ViU29ja2V0czpcIiwgd3NfaG9zdF91cmwpO1xuICAgICAgICAgICAgdGhpcy5fd3MgPSBuZXcgV2ViU29ja2V0KHRoaXMud3NVcmwpO1xuICAgICAgICAgICAgLy8gRW5zdXJlIGluY29taW5nIGJpbmFyeSBtZXNzYWdlcyBhcmUgbm90IEJsb2JzXG4gICAgICAgICAgICB0aGlzLl93cy5iaW5hcnlUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgICAgIHZhciBhbHJlYWR5X2NhbGxlZF9vbmNsb3NlID0gZmFsc2U7IC8vIG9ubHkgYWxlcnQgb25jZVxuICAgICAgICAgICAgdGhpcy5fd3Mub25jbG9zZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeV9jYWxsZWRfb25jbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFscmVhZHlfY2FsbGVkX29uY2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmICghZXZ0Lndhc0NsZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB3ZWJzb2NrZXQgd2FzIGNsb3NlZCBlYXJseSwgdGhhdCBjb3VsZCBtZWFuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgdGhlIGtlcm5lbCBpcyBhY3R1YWxseSBkZWFkLiBUcnkgZ2V0dGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBpbmZvcm1hdGlvbiBhYm91dCB0aGUga2VybmVsIGZyb20gdGhlIEFQSSBjYWxsIC0tXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoYXQgZmFpbHMsIHRoZW4gYXNzdW1lIHRoZSBrZXJuZWwgaXMgZGVhZCxcbiAgICAgICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgZm9sbG93IHRoZSB0eXBpY2FsIHdlYnNvY2tldCBjbG9zZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJvdG9jb2wuXG4gICAgICAgICAgICAgICAgICAgIF90aGlzNy5nZXRJbmZvKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl93c19jbG9zZWQod3NfaG9zdF91cmwsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2VybmVsX2RlYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX3dzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFscmVhZHlfY2FsbGVkX29uY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbHJlYWR5X2NhbGxlZF9vbmNsb3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBfdGhpczcuX3dzQ2xvc2VkKHdzX2hvc3RfdXJsLCB0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl93cy5vbm9wZW4gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgX3RoaXM3Ll93c09wZW5lZChldnQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciB3c19jbG9zZWRfbGF0ZSA9IGZ1bmN0aW9uIHdzX2Nsb3NlZF9sYXRlKGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChhbHJlYWR5X2NhbGxlZF9vbmNsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxyZWFkeV9jYWxsZWRfb25jbG9zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKCFldnQud2FzQ2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM3Ll93c0Nsb3NlZCh3c19ob3N0X3VybCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBzd2l0Y2ggZnJvbSBlYXJseS1jbG9zZSB0byBsYXRlLWNsb3NlIG1lc3NhZ2UgYWZ0ZXIgMXNcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChfdGhpczcuX3dzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzNy5fd3Mub25jbG9zZSA9IHdzX2Nsb3NlZF9sYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgdGhpcy5fd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIF90aGlzNy5faGFuZGxlV1NNZXNzYWdlKGV2dCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsZWFyIHRoZSB3ZWJzb2NrZXQgaWYgbmVjZXNzYXJ5LlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfY2xlYXJTb2NrZXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9jbGVhclNvY2tldCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl93cyAmJiB0aGlzLl93cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuQ0xPU0VEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcmZvcm0gbmVjZXNzYXJ5IHRhc2tzIG9uY2UgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIGtlcm5lbCBoYXNcbiAgICAgICAgICogYmVlbiBlc3RhYmxpc2hlZC4gVGhpcyBpbmNsdWRlcyByZXF1ZXN0aW5nIGluZm9ybWF0aW9uIGFib3V0XG4gICAgICAgICAqIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9rZXJuZWxDb25uZWN0ZWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9rZXJuZWxDb25uZWN0ZWQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPSAwO1xuICAgICAgICAgICAgLy8gZ2V0IGtlcm5lbCBpbmZvIHNvIHdlIGtub3cgd2hhdCBzdGF0ZSB0aGUga2VybmVsIGlzIGluXG4gICAgICAgICAgICB0aGlzLmtlcm5lbEluZm8oKS5vblJlcGx5KGZ1bmN0aW9uIChyZXBseSkge1xuICAgICAgICAgICAgICAgIF90aGlzOC5faW5mb1JlcGx5ID0gcmVwbHkuY29udGVudDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaW5mbyByZXBseScpO1xuICAgICAgICAgICAgICAgIF90aGlzOC5faGFuZGxlU3RhdHVzKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIF90aGlzOC5fYXV0b3Jlc3RhcnRBdHRlbXB0ID0gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcmZvcm0gbmVjZXNzYXJ5IHRhc2tzIGFmdGVyIHRoZSBrZXJuZWwgaGFzIGRpZWQuIFRoaXMgY2xvc2VzXG4gICAgICAgICAqIGNvbW11bmljYXRpb24gY2hhbm5lbHMgdG8gdGhlIGtlcm5lbCBpZiB0aGV5IGFyZSBzdGlsbCBzb21laG93XG4gICAgICAgICAqIG9wZW4uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9rZXJuZWxEZWFkXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfa2VybmVsRGVhZCgpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnZGVhZCcpO1xuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGEgd2Vic29ja2V0IGVudGVyaW5nIHRoZSBvcGVuIHN0YXRlLFxuICAgICAgICAgKiBzaWduYWxpbmcgdGhhdCB0aGUga2VybmVsIGlzIGNvbm5lY3RlZCB3aGVuIHdlYnNvY2tldCBpcyBvcGVuLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfd3NPcGVuZWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF93c09wZW5lZChldnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gYWxsIGV2ZW50cyByZWFkeSwgdHJpZ2dlciBzdGFydGVkIGV2ZW50LlxuICAgICAgICAgICAgICAgIHRoaXMuX2tlcm5lbENvbm5lY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBhIHdlYnNvY2tldCBlbnRlcmluZyB0aGUgY2xvc2VkIHN0YXRlLiAgSWYgdGhlIHdlYnNvY2tldFxuICAgICAgICAgKiB3YXMgbm90IGNsb3NlZCBkdWUgdG8gYW4gZXJyb3IsIHRyeSB0byByZWNvbm5lY3QgdG8gdGhlIGtlcm5lbC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdzX3VybCAtIHRoZSB3ZWJzb2NrZXQgdXJsXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbH0gZXJyb3IgLSB3aGV0aGVyIHRoZSBjb25uZWN0aW9uIHdhcyBjbG9zZWQgZHVlIHRvIGFuIGVycm9yXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl93c0Nsb3NlZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3dzQ2xvc2VkKHdzX3VybCwgZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IoJ1dlYlNvY2tldCBjb25uZWN0aW9uIGZhaWxlZDogJywgd3NfdXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2Nvbm5lY3Rpb25GYWlsZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlUmVjb25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGtlcm5lbCBjb25uZWN0aW9uIGlzIGxvc3QuXG4gICAgICAgICAqIHNjaGVkdWxlcyByZWNvbm5lY3QsIG9yIGZpcmVzICdjb25uZWN0aW9uX2RlYWQnIGlmIHJlY29ubmVjdCBsaW1pdCBpcyBoaXQuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9zY2hlZHVsZVJlY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3NjaGVkdWxlUmVjb25uZWN0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzOSA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RBdHRlbXB0IDwgdGhpcy5fcmVjb25uZWN0TGltaXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZW91dCA9IE1hdGgucG93KDIsIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQpO1xuICAgICAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IoXCJDb25uZWN0aW9uIGxvc3QsIHJlY29ubmVjdGluZyBpbiBcIiArIHRpbWVvdXQgKyBcIiBzZWNvbmRzLlwiKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM5LnJlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH0sIDFlMyAqIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2Nvbm5lY3Rpb25EZWFkJyk7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5lcnJvcihcIkZhaWxlZCB0byByZWNvbm5lY3QsIGdpdmluZyB1cC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGFuIGluY29taW5nIFdlYnNvY2tldCBtZXNzYWdlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlV1NNZXNzYWdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlV1NNZXNzYWdlKGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9ICgwLCBfc2VyaWFsaXplLmRlc2VyaWFsaXplKShlLmRhdGEpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmVycm9yKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtc2cuY2hhbm5lbCA9PT0gJ2lvcHViJyAmJiBtc2cubXNnVHlwZSA9PT0gJ3N0YXR1cycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXNNZXNzYWdlKG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobXNnLnBhcmVudEhlYWRlcikge1xuICAgICAgICAgICAgICAgIHZhciBoZWFkZXIgPSBtc2cucGFyZW50SGVhZGVyO1xuICAgICAgICAgICAgICAgIHZhciBmdXR1cmUgPSB0aGlzLl9oYW5kbGVyTWFwLmdldChoZWFkZXIubXNnSWQpO1xuICAgICAgICAgICAgICAgIGlmIChmdXR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgZnV0dXJlLmhhbmRsZU1zZyhtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgc3RhdHVzIGlvcHViIG1lc3NhZ2VzIGZyb20gdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2hhbmRsZVN0YXR1c01lc3NhZ2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9oYW5kbGVTdGF0dXNNZXNzYWdlKG1zZykge1xuICAgICAgICAgICAgdmFyIF90aGlzMTAgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgZXhlY3V0aW9uX3N0YXRlID0gbXNnLmNvbnRlbnQuZXhlY3V0aW9uX3N0YXRlO1xuICAgICAgICAgICAgaWYgKGV4ZWN1dGlvbl9zdGF0ZSAhPT0gJ2RlYWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKGV4ZWN1dGlvbl9zdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXhlY3V0aW9uX3N0YXRlID09PSAnc3RhcnRpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5rZXJuZWxJbmZvKCkub25SZXBseShmdW5jdGlvbiAocmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMxMC5faW5mb1JlcGx5ID0gcmVwbHkuY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMxMC5faGFuZGxlU3RhdHVzKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpczEwLl9hdXRvcmVzdGFydEF0dGVtcHQgPSAwO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleGVjdXRpb25fc3RhdGUgPT09ICdyZXN0YXJ0aW5nJykge1xuICAgICAgICAgICAgICAgIC8vIGF1dG9yZXN0YXJ0aW5nIGlzIGRpc3RpbmN0IGZyb20gcmVzdGFydGluZyxcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGF0IGl0IG1lYW5zIHRoZSBrZXJuZWwgZGllZCBhbmQgdGhlIHNlcnZlciBpcyByZXN0YXJ0aW5nIGl0LlxuICAgICAgICAgICAgICAgIC8vIGtlcm5lbF9yZXN0YXJ0aW5nIHNldHMgdGhlIG5vdGlmaWNhdGlvbiB3aWRnZXQsXG4gICAgICAgICAgICAgICAgLy8gYXV0b3Jlc3RhcnQgc2hvd3MgdGhlIG1vcmUgcHJvbWluZW50IGRpYWxvZy5cbiAgICAgICAgICAgICAgICB0aGlzLl9hdXRvcmVzdGFydEF0dGVtcHQgPSB0aGlzLl9hdXRvcmVzdGFydEF0dGVtcHQgKyAxO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnYXV0b3Jlc3RhcnRpbmcnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhlY3V0aW9uX3N0YXRlID09PSAnZGVhZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXJuZWxEZWFkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJuYW1lXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgbmFtZSBvZiB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBuYW1lIG9mIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fbmFtZSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIHdoZXRoZXIgdGhlcmUgaXMgYSBjb25uZWN0aW9uIHRvIHRoZSBrZXJuZWwuIFRoaXNcbiAgICAgICAgICogZnVuY3Rpb24gb25seSByZXR1cm5zIHRydWUgaWYgd2Vic29ja2V0IGhhcyBiZWVuXG4gICAgICAgICAqIGNyZWF0ZWQgYW5kIGhhcyBhIHN0YXRlIG9mIFdlYlNvY2tldC5PUEVOLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpc0Nvbm5lY3RlZFwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl93cyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIGtlcm5lbCBoYXMgYmVlbiBjb21wbGV0ZWx5XG4gICAgICAgICAqIHNldmVyZWQuIFRoaXMgZnVuY3Rpb24gb25seSByZXR1cm5zIHRydWUgaWYgdGhlIHdlYnNvY2tldCBpcyBudWxsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpc0Z1bGx5RGlzY29ubmVjdGVkXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dzID09PSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgSW5mbyBSZXBseSBNZXNzYWdlIGZyb20gdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW5mb1JlcGx5XCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luZm9SZXBseTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInN0YXR1c1wiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBjdXJyZW50IGlkIG9mIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImlkXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGN1cnJlbnQgaWQgb2YgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9pZCA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fa2VybmVsVXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9iYXNlVXJsLCBLRVJORUxfU0VSVklDRV9VUkwsIHRoaXMuX2lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGZ1bGwgd2Vic29ja2V0IHVybC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwid3NVcmxcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuX3dzVXJsLCB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2tlcm5lbFVybCwgJ2NoYW5uZWxzJyksIFwiP3Nlc3Npb25faWQ9XCIgKyB0aGlzLl9zdGF0aWNJZF0uam9pbignJyk7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcImxpc3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpc3QoYmFzZVVybCkge1xuICAgICAgICAgICAgdmFyIGtlcm5lbFNlcnZpY2VVcmwgPSB1dGlscy51cmxKb2luRW5jb2RlKGJhc2VVcmwsIEtFUk5FTF9TRVJWSUNFX1VSTCk7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3Qoa2VybmVsU2VydmljZVVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN1Y2Nlc3MuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIGtlcm5lbCBsaXN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRlS2VybmVsSWQoc3VjY2Vzcy5kYXRhW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gS2VybmVsO1xufSkoKTtcblxuZXhwb3J0cy5LZXJuZWwgPSBLZXJuZWw7XG5cbl9fZGVjb3JhdGUoW3NpZ25hbF0sIEtlcm5lbC5wcm90b3R5cGUsIFwic3RhdHVzQ2hhbmdlZFwiKTtcbi8qKlxuICogQml0IGZsYWdzIGZvciB0aGUga2VybmVsIGZ1dHVyZSBzdGF0ZS5cbiAqL1xudmFyIEtlcm5lbEZ1dHVyZUZsYWc7XG4oZnVuY3Rpb24gKEtlcm5lbEZ1dHVyZUZsYWcpIHtcbiAgICBLZXJuZWxGdXR1cmVGbGFnW0tlcm5lbEZ1dHVyZUZsYWdbXCJHb3RSZXBseVwiXSA9IDFdID0gXCJHb3RSZXBseVwiO1xuICAgIEtlcm5lbEZ1dHVyZUZsYWdbS2VybmVsRnV0dXJlRmxhZ1tcIkdvdElkbGVcIl0gPSAyXSA9IFwiR290SWRsZVwiO1xuICAgIEtlcm5lbEZ1dHVyZUZsYWdbS2VybmVsRnV0dXJlRmxhZ1tcIkF1dG9EaXNwb3NlXCJdID0gNF0gPSBcIkF1dG9EaXNwb3NlXCI7XG4gICAgS2VybmVsRnV0dXJlRmxhZ1tLZXJuZWxGdXR1cmVGbGFnW1wiSXNEb25lXCJdID0gOF0gPSBcIklzRG9uZVwiO1xufSkoS2VybmVsRnV0dXJlRmxhZyB8fCAoS2VybmVsRnV0dXJlRmxhZyA9IHt9KSk7XG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGEga2VybmVsIGZ1dHVyZS5cbiAqL1xuXG52YXIgS2VybmVsRnV0dXJlSGFuZGxlciA9IChmdW5jdGlvbiAoX0Rpc3Bvc2FibGUpIHtcbiAgICBfaW5oZXJpdHMoS2VybmVsRnV0dXJlSGFuZGxlciwgX0Rpc3Bvc2FibGUpO1xuXG4gICAgZnVuY3Rpb24gS2VybmVsRnV0dXJlSGFuZGxlcigpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEtlcm5lbEZ1dHVyZUhhbmRsZXIpO1xuXG4gICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoS2VybmVsRnV0dXJlSGFuZGxlci5wcm90b3R5cGUpLCBcImNvbnN0cnVjdG9yXCIsIHRoaXMpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSAwO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlcGx5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZG9uZSA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IGF1dG9EaXNwb3NlIHN0YXR1cyBvZiB0aGUgZnV0dXJlLlxuICAgICAqL1xuXG4gICAgX2NyZWF0ZUNsYXNzKEtlcm5lbEZ1dHVyZUhhbmRsZXIsIFt7XG4gICAgICAgIGtleTogXCJvblJlcGx5XCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGEgcmVwbHkgaGFuZGxlci4gUmV0dXJucyBgdGhpc2AuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25SZXBseShjYikge1xuICAgICAgICAgICAgdGhpcy5fcmVwbHkgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGFuIG91dHB1dCBoYW5kbGVyLiBSZXR1cm5zIGB0aGlzYC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25PdXRwdXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uT3V0cHV0KGNiKSB7XG4gICAgICAgICAgICB0aGlzLl9vdXRwdXQgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGEgZG9uZSBoYW5kbGVyLiBSZXR1cm5zIGB0aGlzYC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25Eb25lXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbkRvbmUoY2IpIHtcbiAgICAgICAgICAgIHRoaXMuX2RvbmUgPSBjYjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIGFuIGlucHV0IGhhbmRsZXIuIFJldHVybnMgYHRoaXNgLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvbklucHV0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbklucHV0KGNiKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dCA9IGNiO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGFuIGluY29taW5nIG1lc3NhZ2UgZnJvbSB0aGUga2VybmVsIGJlbG9uZ2luZyB0byB0aGlzIGZ1dHVyZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaGFuZGxlTXNnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVNc2cobXNnKSB7XG4gICAgICAgICAgICBpZiAobXNnLmNoYW5uZWwgPT09ICdpb3B1YicpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fb3V0cHV0O1xuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQpIG91dHB1dChtc2cpO1xuICAgICAgICAgICAgICAgIGlmIChtc2cubXNnVHlwZSA9PT0gJ3N0YXR1cycgJiYgbXNnLmNvbnRlbnQuZXhlY3V0aW9uX3N0YXRlID09PSAnaWRsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkdvdElkbGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Hb3RSZXBseSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZURvbmUobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXNnLmNoYW5uZWwgPT09ICdzaGVsbCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVwbHkgPSB0aGlzLl9vdXRwdXQ7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGx5KSByZXBseShtc2cpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Hb3RSZXBseSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Rlc3RGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuR290SWRsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRG9uZShtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobXNnLmNoYW5uZWwgPT09ICdzdGRpbicpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLl9pbnB1dDtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQpIGlucHV0KG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcG9zZSBhbmQgdW5yZWdpc3RlciB0aGUgZnV0dXJlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkaXNwb3NlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3JlcGx5ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2RvbmUgPSBudWxsO1xuICAgICAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoS2VybmVsRnV0dXJlSGFuZGxlci5wcm90b3R5cGUpLCBcImRpc3Bvc2VcIiwgdGhpcykuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBtZXNzYWdlIGRvbmUgc3RhdHVzLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlRG9uZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZURvbmUobXNnKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuSXNEb25lKTtcbiAgICAgICAgICAgIHZhciBkb25lID0gdGhpcy5fZG9uZTtcbiAgICAgICAgICAgIGlmIChkb25lKSBkb25lKG1zZyk7XG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgb3RoZXIgY2FsbGJhY2tzXG4gICAgICAgICAgICB0aGlzLl9yZXBseSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9kb25lID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZXN0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkF1dG9EaXNwb3NlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcgaXMgc2V0LlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfdGVzdEZsYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF90ZXN0RmxhZyhmbGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuX3N0YXR1cyAmIGZsYWcpICE9PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9zZXRGbGFnXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfc2V0RmxhZyhmbGFnKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgfD0gZmxhZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhciB0aGUgZ2l2ZW4gZnV0dXJlIGZsYWcuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9jbGVhckZsYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9jbGVhckZsYWcoZmxhZykge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzICY9IH5mbGFnO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYXV0b0Rpc3Bvc2VcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5BdXRvRGlzcG9zZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgY3VycmVudCBhdXRvRGlzcG9zZSBiZWhhdmlvciBvZiB0aGUgZnV0dXJlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiBUcnVlLCBpdCB3aWxsIHNlbGYtZGlzcG9zZSgpIGFmdGVyIG9uRG9uZSgpIGlzIGNhbGxlZC5cbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuQXV0b0Rpc3Bvc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGVhckZsYWcoS2VybmVsRnV0dXJlRmxhZy5BdXRvRGlzcG9zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgZm9yIG1lc3NhZ2UgZG9uZSBzdGF0ZS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaXNEb25lXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Rlc3RGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuSXNEb25lKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBLZXJuZWxGdXR1cmVIYW5kbGVyO1xufSkoRGlzcG9zYWJsZSk7XG5cbnZhciBLZXJuZWxTdWIgPSAoZnVuY3Rpb24gKF9LZXJuZWwpIHtcbiAgICBfaW5oZXJpdHMoS2VybmVsU3ViLCBfS2VybmVsKTtcblxuICAgIGZ1bmN0aW9uIEtlcm5lbFN1YigpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEtlcm5lbFN1Yik7XG5cbiAgICAgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoS2VybmVsU3ViLnByb3RvdHlwZSksIFwiY29uc3RydWN0b3JcIiwgdGhpcykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSBhbiBvYmplY3QgYXMgYmVpbmcgb2YgSUtlcm5lbElEIHR5cGVcbiAgICAgKi9cblxuICAgIF9jcmVhdGVDbGFzcyhLZXJuZWxTdWIsIFt7XG4gICAgICAgIGtleTogXCJkb1NvbWV0aGluZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZG9Tb21ldGhpbmcoKSB7fVxuICAgIH1dKTtcblxuICAgIHJldHVybiBLZXJuZWxTdWI7XG59KShLZXJuZWwpO1xuXG5leHBvcnRzLktlcm5lbFN1YiA9IEtlcm5lbFN1YjtcblxuZnVuY3Rpb24gdmFsaWRhdGVLZXJuZWxJZChpbmZvKSB7XG4gICAgaWYgKCFpbmZvLmhhc093blByb3BlcnR5KCduYW1lJykgfHwgIWluZm8uaGFzT3duUHJvcGVydHkoJ2lkJykpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQga2VybmVsIGlkJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgaW5mby5pZCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGluZm8ubmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQga2VybmVsIGlkJyk7XG4gICAgfVxufSIsIi8vIENvcHlyaWdodCAoYykgSnVweXRlciBEZXZlbG9wbWVudCBUZWFtLlxuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNb2RpZmllZCBCU0QgTGljZW5zZS5cbi8qKlxuICogRGVzZXJpYWxpemUgYW5kIHJldHVybiB0aGUgdW5wYWNrZWQgbWVzc2FnZS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVzZXJpYWxpemUgPSBkZXNlcmlhbGl6ZTtcbmV4cG9ydHMuc2VyaWFsaXplID0gc2VyaWFsaXplO1xuXG5mdW5jdGlvbiBkZXNlcmlhbGl6ZShkYXRhKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YWx1ZSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXNlcmlhbGl6ZUJpbmFyeShkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZSBhIGtlcm5lbCBtZXNzYWdlIGZvciB0cmFuc3BvcnQuXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG1zZykge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAobXNnLmJ1ZmZlcnMgJiYgbXNnLmJ1ZmZlcnMubGVuZ3RoKSB7XG4gICAgICAgIHZhbHVlID0gc2VyaWFsaXplQmluYXJ5KG1zZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShtc2cpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRGVzZXJpYWxpemUgYSBiaW5hcnkgbWVzc2FnZSB0byBhIEtlcm5lbCBNZXNzYWdlLlxuICovXG5mdW5jdGlvbiBkZXNlcmlhbGl6ZUJpbmFyeShidWYpIHtcbiAgICB2YXIgZGF0YSA9IG5ldyBEYXRhVmlldyhidWYpO1xuICAgIC8vIHJlYWQgdGhlIGhlYWRlcjogMSArIG5idWZzIDMyYiBpbnRlZ2Vyc1xuICAgIHZhciBuYnVmcyA9IGRhdGEuZ2V0VWludDMyKDApO1xuICAgIHZhciBvZmZzZXRzID0gW107XG4gICAgaWYgKG5idWZzIDwgMikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGluY29taW5nIEtlcm5lbCBNZXNzYWdlXCIpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBuYnVmczsgaSsrKSB7XG4gICAgICAgIG9mZnNldHMucHVzaChkYXRhLmdldFVpbnQzMihpICogNCkpO1xuICAgIH1cbiAgICB2YXIganNvbl9ieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1Zi5zbGljZShvZmZzZXRzWzBdLCBvZmZzZXRzWzFdKSk7XG4gICAgdmFyIG1zZyA9IEpTT04ucGFyc2UobmV3IFRleHREZWNvZGVyKCd1dGY4JykuZGVjb2RlKGpzb25fYnl0ZXMpKTtcbiAgICAvLyB0aGUgcmVtYWluaW5nIGNodW5rcyBhcmUgc3RvcmVkIGFzIERhdGFWaWV3cyBpbiBtc2cuYnVmZmVyc1xuICAgIG1zZy5idWZmZXJzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYnVmczsgaSsrKSB7XG4gICAgICAgIHZhciBzdGFydCA9IG9mZnNldHNbaV07XG4gICAgICAgIHZhciBzdG9wID0gb2Zmc2V0c1tpICsgMV0gfHwgYnVmLmJ5dGVMZW5ndGg7XG4gICAgICAgIG1zZy5idWZmZXJzLnB1c2gobmV3IERhdGFWaWV3KGJ1Zi5zbGljZShzdGFydCwgc3RvcCkpKTtcbiAgICB9XG4gICAgcmV0dXJuIG1zZztcbn1cbi8qKlxuICogSW1wbGVtZW50IHRoZSBiaW5hcnkgc2VyaWFsaXphdGlvbiBwcm90b2NvbC5cbiAqIFNlcmlhbGl6ZSBLZXJuZWwgbWVzc2FnZSB0byBBcnJheUJ1ZmZlci5cbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplQmluYXJ5KG1zZykge1xuICAgIHZhciBvZmZzZXRzID0gW107XG4gICAgdmFyIGJ1ZmZlcnMgPSBbXTtcbiAgICB2YXIgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigndXRmOCcpO1xuICAgIHZhciBqc29uX3V0ZjggPSBlbmNvZGVyLmVuY29kZShKU09OLnN0cmluZ2lmeShtc2csIHJlcGxhY2VfYnVmZmVycykpO1xuICAgIGJ1ZmZlcnMucHVzaChqc29uX3V0ZjguYnVmZmVyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1zZy5idWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIG1zZy5idWZmZXJzIGVsZW1lbnRzIGNvdWxkIGJlIGVpdGhlciB2aWV3cyBvciBBcnJheUJ1ZmZlcnNcbiAgICAgICAgLy8gYnVmZmVycyBlbGVtZW50cyBhcmUgQXJyYXlCdWZmZXJzXG4gICAgICAgIHZhciBiID0gbXNnLmJ1ZmZlcnNbaV07XG4gICAgICAgIGJ1ZmZlcnMucHVzaChiIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgPyBiIDogYi5idWZmZXIpO1xuICAgIH1cbiAgICB2YXIgbmJ1ZnMgPSBidWZmZXJzLmxlbmd0aDtcbiAgICBvZmZzZXRzLnB1c2goNCAqIChuYnVmcyArIDEpKTtcbiAgICBmb3IgKGkgPSAwOyBpICsgMSA8IGJ1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb2Zmc2V0cy5wdXNoKG9mZnNldHNbb2Zmc2V0cy5sZW5ndGggLSAxXSArIGJ1ZmZlcnNbaV0uYnl0ZUxlbmd0aCk7XG4gICAgfVxuICAgIHZhciBtc2dfYnVmID0gbmV3IFVpbnQ4QXJyYXkob2Zmc2V0c1tvZmZzZXRzLmxlbmd0aCAtIDFdICsgYnVmZmVyc1tidWZmZXJzLmxlbmd0aCAtIDFdLmJ5dGVMZW5ndGgpO1xuICAgIC8vIHVzZSBEYXRhVmlldy5zZXRVaW50MzIgZm9yIG5ldHdvcmsgYnl0ZS1vcmRlclxuICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KG1zZ19idWYuYnVmZmVyKTtcbiAgICAvLyB3cml0ZSBuYnVmcyB0byBmaXJzdCA0IGJ5dGVzXG4gICAgdmlldy5zZXRVaW50MzIoMCwgbmJ1ZnMpO1xuICAgIC8vIHdyaXRlIG9mZnNldHMgdG8gbmV4dCA0ICogbmJ1ZnMgYnl0ZXNcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2Zmc2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3LnNldFVpbnQzMig0ICogKGkgKyAxKSwgb2Zmc2V0c1tpXSk7XG4gICAgfVxuICAgIC8vIHdyaXRlIGFsbCB0aGUgYnVmZmVycyBhdCB0aGVpciByZXNwZWN0aXZlIG9mZnNldHNcbiAgICBmb3IgKGkgPSAwOyBpIDwgYnVmZmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtc2dfYnVmLnNldChuZXcgVWludDhBcnJheShidWZmZXJzW2ldKSwgb2Zmc2V0c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBtc2dfYnVmLmJ1ZmZlcjtcbn1cbi8qKlxuICogRmlsdGVyIFwiYnVmZmVyc1wiIGtleSBmb3IgSlNPTi5zdHJpbmdpZnlcbiAqL1xuZnVuY3Rpb24gcmVwbGFjZV9idWZmZXJzKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoa2V5ID09PSBcImJ1ZmZlcnNcIikge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59IiwiLy8gQ29weXJpZ2h0IChjKSBKdXB5dGVyIERldmVsb3BtZW50IFRlYW0uXG4vLyBEaXN0cmlidXRlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1vZGlmaWVkIEJTRCBMaWNlbnNlLlxuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqW1wiZGVmYXVsdFwiXSA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBfdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciB1dGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF91dGlscyk7XG5cbnZhciBfa2VybmVsID0gcmVxdWlyZSgnLi9rZXJuZWwnKTtcblxuLyoqXG4gKiBUaGUgdXJsIGZvciB0aGUgc2Vzc2lvbiBzZXJ2aWNlLlxuICovXG52YXIgX19kZWNvcmF0ZSA9IHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19kZWNvcmF0ZSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkICYmIGQobykgfHwgbztcbiAgICAgICAgICAgIH0sIHRhcmdldCk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChkICYmIGQodGFyZ2V0LCBrZXkpLCB2b2lkIDApO1xuICAgICAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCAmJiBkKHRhcmdldCwga2V5LCBvKSB8fCBvO1xuICAgICAgICAgICAgfSwgZGVzYyk7XG4gICAgfVxufTtcbnZhciBzaWduYWwgPSBwaG9zcGhvci5jb3JlLnNpZ25hbDtcbnZhciBTRVNTSU9OX1NFUlZJQ0VfVVJMID0gJ2FwaS9zZXNzaW9ucyc7XG4vKipcbiAqIEdldCBhIGxvZ2dlciBzZXNzaW9uIG9iamVjdHMuXG4gKi9cbnZhciBzZXNzaW9uX2xvZyA9IExvZ2dlci5nZXQoJ3Nlc3Npb24nKTtcbjtcbjtcbjtcbi8qKlxuICogU2Vzc2lvbiBvYmplY3QgZm9yIGFjY2Vzc2luZyB0aGUgc2Vzc2lvbiBSRVNUIGFwaS4gVGhlIHNlc3Npb25cbiAqIHNob3VsZCBiZSB1c2VkIHRvIHN0YXJ0IGtlcm5lbHMgYW5kIHRoZW4gc2h1dCB0aGVtIGRvd24gLS0gZm9yXG4gKiBhbGwgb3RoZXIgb3BlcmF0aW9ucywgdGhlIGtlcm5lbCBvYmplY3Qgc2hvdWxkIGJlIHVzZWQuXG4gKiovXG5cbnZhciBOb3RlYm9va1Nlc3Npb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBzZXNzaW9uLlxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gTm90ZWJvb2tTZXNzaW9uKG9wdGlvbnMpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE5vdGVib29rU2Vzc2lvbik7XG5cbiAgICAgICAgdGhpcy5faWQgPSBcInVua25vd25cIjtcbiAgICAgICAgdGhpcy5fbm90ZWJvb2tQYXRoID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRoaXMuX2Jhc2VVcmwgPSBcInVua25vd25cIjtcbiAgICAgICAgdGhpcy5fc2Vzc2lvblVybCA9IFwidW5rbm93blwiO1xuICAgICAgICB0aGlzLl93c1VybCA9IFwidW5rbm93blwiO1xuICAgICAgICB0aGlzLl9rZXJuZWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pZCA9IHV0aWxzLnV1aWQoKTtcbiAgICAgICAgdGhpcy5fbm90ZWJvb2tQYXRoID0gb3B0aW9ucy5ub3RlYm9va1BhdGg7XG4gICAgICAgIHRoaXMuX2Jhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmw7XG4gICAgICAgIHRoaXMuX3dzVXJsID0gb3B0aW9ucy53c1VybDtcbiAgICAgICAgdGhpcy5fa2VybmVsID0gbmV3IF9rZXJuZWwuS2VybmVsKHRoaXMuX2Jhc2VVcmwsIHRoaXMuX3dzVXJsKTtcbiAgICAgICAgdGhpcy5fc2Vzc2lvblVybCA9IHV0aWxzLnVybEpvaW5FbmNvZGUodGhpcy5fYmFzZVVybCwgU0VTU0lPTl9TRVJWSUNFX1VSTCwgdGhpcy5faWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdFVCAvYXBpL3Nlc3Npb25zXG4gICAgICpcbiAgICAgKiBHZXQgYSBsaXN0IG9mIHRoZSBjdXJyZW50IHNlc3Npb25zLlxuICAgICAqL1xuXG4gICAgX2NyZWF0ZUNsYXNzKE5vdGVib29rU2Vzc2lvbiwgW3tcbiAgICAgICAga2V5OiBcInN0YXJ0XCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBPU1QgL2FwaS9zZXNzaW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBTdGFydCBhIG5ldyBzZXNzaW9uLiBUaGlzIGZ1bmN0aW9uIGNhbiBvbmx5IGJlIHN1Y2Nlc3NmdWxseSBleGVjdXRlZCBvbmNlLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIHVybCA9IHV0aWxzLnVybEpvaW5FbmNvZGUodGhpcy5fYmFzZVVybCwgU0VTU0lPTl9TRVJWSUNFX1VSTCk7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkodGhpcy5fbW9kZWwpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVTZXNzaW9uSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5fa2VybmVsLmNvbm5lY3Qoc3VjY2Vzcy5kYXRhLmtlcm5lbCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2hhbmRsZVN0YXR1cygna2VybmVsQ3JlYXRlZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlU3RhdHVzKCdrZXJuZWxEZWFkJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHRVQgL2FwaS9zZXNzaW9ucy9bOnNlc3Npb25faWRdXG4gICAgICAgICAqXG4gICAgICAgICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCBhIHNlc3Npb24uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEluZm9cIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fc2Vzc2lvblVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVTZXNzaW9uSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogREVMRVRFIC9hcGkvc2Vzc2lvbnMvWzpzZXNzaW9uX2lkXVxuICAgICAgICAgKlxuICAgICAgICAgKiBLaWxsIHRoZSBrZXJuZWwgYW5kIHNodXRkb3duIHRoZSBzZXNzaW9uLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkZWxldGVcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9kZWxldGUoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fa2VybmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdrZXJuZWxLaWxsZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXJuZWwuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHRoaXMuX3Nlc3Npb25VcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiREVMRVRFXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlU2Vzc2lvbklkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVqZWN0ZWQueGhyLnN0YXR1cyA9PT0gNDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUga2VybmVsIHdhcyBkZWxldGVkIGJ1dCB0aGUgc2Vzc2lvbiB3YXMgbm90Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKHJlamVjdGVkLnN0YXR1c1RleHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVzdGFydCB0aGUgc2Vzc2lvbiBieSBkZWxldGluZyBpdCBhbmQgdGhlbiBzdGFydGluZyBpdCBmcmVzaC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVzdGFydFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVzdGFydChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbXCJkZWxldGVcIl0oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9KVtcImNhdGNoXCJdKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5vdGVib29rUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczIuX25vdGVib29rUGF0aCA9IG9wdGlvbnMubm90ZWJvb2tQYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmtlcm5lbE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMyLl9rZXJuZWwubmFtZSA9IG9wdGlvbnMua2VybmVsTmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW5hbWUgdGhlIG5vdGVib29rLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZW5hbWVOb3RlYm9va1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVuYW1lTm90ZWJvb2socGF0aCkge1xuICAgICAgICAgICAgdGhpcy5fbm90ZWJvb2tQYXRoID0gcGF0aDtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9zZXNzaW9uVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBBVENIXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHRoaXMuX21vZGVsKSxcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlU2Vzc2lvbklkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgZGF0YSBtb2RlbCBmb3IgdGhlIHNlc3Npb24sIHdoaWNoIGluY2x1ZGVzIHRoZSBub3RlYm9vayBwYXRoXG4gICAgICAgICAqIGFuZCBrZXJuZWwgKG5hbWUgYW5kIGlkKS5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2hhbmRsZVN0YXR1c1wiLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBzZXNzaW9uIHN0YXR1cyBjaGFuZ2UuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZVN0YXR1cyhzdGF0dXMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2hhbmdlZC5lbWl0KHN0YXR1cyk7XG4gICAgICAgICAgICBzZXNzaW9uX2xvZy5lcnJvcignU2Vzc2lvbjogJyArIHN0YXR1cyArICcgKCcgKyB0aGlzLl9pZCArICcpJyk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJrZXJuZWxcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBzZXNzaW9uIGtlcm5lbCBvYmplY3QuXG4gICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2tlcm5lbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9tb2RlbFwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIG5vdGVib29rOiB7IHBhdGg6IHRoaXMuX25vdGVib29rUGF0aCB9LFxuICAgICAgICAgICAgICAgIGtlcm5lbDogeyBuYW1lOiB0aGlzLl9rZXJuZWwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2tlcm5lbC5pZCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJsaXN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaXN0KGJhc2VVcmwpIHtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uVXJsID0gdXRpbHMudXJsSm9pbkVuY29kZShiYXNlVXJsLCBTRVNTSU9OX1NFUlZJQ0VfVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdChzZXNzaW9uVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VjY2Vzcy5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTZXNzaW9uIGxpc3QnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGVTZXNzaW9uSWQoc3VjY2Vzcy5kYXRhW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIE5vdGVib29rU2Vzc2lvbjtcbn0pKCk7XG5cbmV4cG9ydHMuTm90ZWJvb2tTZXNzaW9uID0gTm90ZWJvb2tTZXNzaW9uO1xuXG5fX2RlY29yYXRlKFtzaWduYWxdLCBOb3RlYm9va1Nlc3Npb24ucHJvdG90eXBlLCBcInN0YXR1c0NoYW5nZWRcIik7XG4vKipcbiAqIFZhbGlkYXRlIGFuIG9iamVjdCBhcyBiZWluZyBvZiBJU2Vzc2lvbklkIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlU2Vzc2lvbklkKGluZm8pIHtcbiAgICBpZiAoIWluZm8uaGFzT3duUHJvcGVydHkoJ2lkJykgfHwgIWluZm8uaGFzT3duUHJvcGVydHkoJ25vdGVib29rJykgfHwgIWluZm8uaGFzT3duUHJvcGVydHkoJ2tlcm5lbCcpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNlc3Npb24gTW9kZWwnKTtcbiAgICB9XG4gICAgKDAsIF9rZXJuZWwudmFsaWRhdGVLZXJuZWxJZCkoaW5mby5rZXJuZWwpO1xuICAgIGlmICh0eXBlb2YgaW5mby5pZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2Vzc2lvbiBNb2RlbCcpO1xuICAgIH1cbiAgICB2YWxpZGF0ZU5vdGVib29rSWQoaW5mby5ub3RlYm9vayk7XG59XG4vKipcbiAqIFZhbGlkYXRlIGFuIG9iamVjdCBhcyBiZWluZyBvZiBJTm90ZWJvb2tJZCB0eXBlLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZU5vdGVib29rSWQobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLmhhc093blByb3BlcnR5KCdwYXRoJykgfHwgdHlwZW9mIG1vZGVsLnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIE5vdGVib29rIE1vZGVsJyk7XG4gICAgfVxufSIsIi8vIENvcHlyaWdodCAoYykgSnVweXRlciBEZXZlbG9wbWVudCBUZWFtLlxuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNb2RpZmllZCBCU0QgTGljZW5zZS5cbi8qKlxuICogQ29weSB0aGUgY29udGVudHMgb2Ygb25lIG9iamVjdCB0byBhbm90aGVyLCByZWN1cnNpdmVseS5cbiAqXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyMzE3MDAzL3NvbWV0aGluZy1saWtlLWpxdWVyeS1leHRlbmQtYnV0LXN0YW5kYWxvbmVcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO1xuZXhwb3J0cy51dWlkID0gdXVpZDtcbmV4cG9ydHMudXJsUGF0aEpvaW4gPSB1cmxQYXRoSm9pbjtcbmV4cG9ydHMuZW5jb2RlVVJJQ29tcG9uZW50cyA9IGVuY29kZVVSSUNvbXBvbmVudHM7XG5leHBvcnRzLnVybEpvaW5FbmNvZGUgPSB1cmxKb2luRW5jb2RlO1xuZXhwb3J0cy5qc29uVG9RdWVyeVN0cmluZyA9IGpzb25Ub1F1ZXJ5U3RyaW5nO1xuZXhwb3J0cy5hamF4UmVxdWVzdCA9IGFqYXhSZXF1ZXN0O1xuXG5mdW5jdGlvbiBleHRlbmQodGFyZ2V0LCBzb3VyY2UpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQgfHwge307XG4gICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSBleHRlbmQodGFyZ2V0W3Byb3BdLCBzb3VyY2VbcHJvcF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogR2V0IGEgdXVpZCBhcyBhIHN0cmluZy5cbiAqXG4gKiBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICovXG5cbmZ1bmN0aW9uIHV1aWQoKSB7XG4gICAgdmFyIHMgPSBbXTtcbiAgICB2YXIgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5QUJDREVGXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG4gICAgICAgIHNbaV0gPSBoZXhEaWdpdHMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApKTtcbiAgICB9XG4gICAgc1sxMl0gPSBcIjRcIjsgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gICAgc1sxNl0gPSBoZXhEaWdpdHMuY2hhckF0KE51bWJlcihzWzE2XSkgJiAweDMgfCAweDgpOyAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHJldHVybiBzLmpvaW4oXCJcIik7XG59XG5cbi8qKlxuICogSm9pbiBhIHNlcXVlbmNlIG9mIHVybCBjb21wb25lbnRzIHdpdGggJy8nLlxuICovXG5cbmZ1bmN0aW9uIHVybFBhdGhKb2luKCkge1xuICAgIHZhciB1cmwgPSAnJztcblxuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBwYXRocyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBwYXRoc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYXRoc1tpXSA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmwubGVuZ3RoID4gMCAmJiB1cmwuY2hhckF0KHVybC5sZW5ndGggLSAxKSAhPSAnLycpIHtcbiAgICAgICAgICAgIHVybCA9IHVybCArICcvJyArIHBhdGhzW2ldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsID0gdXJsICsgcGF0aHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVybC5yZXBsYWNlKC9cXC9cXC8rLywgJy8nKTtcbn1cblxuLyoqXG4gKiBFbmNvZGUganVzdCB0aGUgY29tcG9uZW50cyBvZiBhIG11bHRpLXNlZ21lbnQgdXJpLFxuICogbGVhdmluZyAnLycgc2VwYXJhdG9ycy5cbiAqL1xuXG5mdW5jdGlvbiBlbmNvZGVVUklDb21wb25lbnRzKHVyaSkge1xuICAgIHJldHVybiB1cmkuc3BsaXQoJy8nKS5tYXAoZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcvJyk7XG59XG5cbi8qKlxuICogSm9pbiBhIHNlcXVlbmNlIG9mIHVybCBjb21wb25lbnRzIHdpdGggJy8nLFxuICogZW5jb2RpbmcgZWFjaCBjb21wb25lbnQgd2l0aCBlbmNvZGVVUklDb21wb25lbnQuXG4gKi9cblxuZnVuY3Rpb24gdXJsSm9pbkVuY29kZSgpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudHModXJsUGF0aEpvaW4uYXBwbHkobnVsbCwgYXJncykpO1xufVxuXG4vKipcbiAqIFByb3Blcmx5IGRldGVjdCB0aGUgY3VycmVudCBicm93c2VyLlxuICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNDAwOTM1L2Jyb3dzZXItZGV0ZWN0aW9uLWluLWphdmFzY3JpcHRcbiAqL1xudmFyIGJyb3dzZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBuYXZpZ2F0b3IgdW5kZWZpbmVkIGluIG5vZGVcbiAgICAgICAgcmV0dXJuIFsnTm9uZSddO1xuICAgIH1cbiAgICB2YXIgTiA9IG5hdmlnYXRvci5hcHBOYW1lO1xuICAgIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIHRlbTtcbiAgICB2YXIgTSA9IHVhLm1hdGNoKC8ob3BlcmF8Y2hyb21lfHNhZmFyaXxmaXJlZm94fG1zaWUpXFwvP1xccyooXFwuP1xcZCsoXFwuXFxkKykqKS9pKTtcbiAgICBpZiAoTSAmJiAodGVtID0gdWEubWF0Y2goL3ZlcnNpb25cXC8oW1xcLlxcZF0rKS9pKSkgIT09IG51bGwpIE1bMl0gPSB0ZW1bMV07XG4gICAgTSA9IE0gPyBbTVsxXSwgTVsyXV0gOiBbTiwgbmF2aWdhdG9yLmFwcFZlcnNpb24sICctPyddO1xuICAgIHJldHVybiBNO1xufSkoKTtcbmV4cG9ydHMuYnJvd3NlciA9IGJyb3dzZXI7XG4vKipcbiAqIFJldHVybiBhIHNlcmlhbGl6ZWQgb2JqZWN0IHN0cmluZyBzdWl0YWJsZSBmb3IgYSBxdWVyeS5cbiAqXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zMDcwNzQyM1xuICovXG5cbmZ1bmN0aW9uIGpzb25Ub1F1ZXJ5U3RyaW5nKGpzb24pIHtcbiAgICByZXR1cm4gJz8nICsgT2JqZWN0LmtleXMoanNvbikubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGpzb25ba2V5XSk7XG4gICAgfSkuam9pbignJicpO1xufVxuXG4vKipcbiAqIEFzeW5jaHJvbm91cyBYTUxIVFRQUmVxdWVzdCBoYW5kbGVyLlxuICpcbiAqIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2VzNi9wcm9taXNlcy8jdG9jLXByb21pc2lmeWluZy14bWxodHRwcmVxdWVzdFxuICovXG5cbmZ1bmN0aW9uIGFqYXhSZXF1ZXN0KHVybCwgc2V0dGluZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcS5vcGVuKHNldHRpbmdzLm1ldGhvZCwgdXJsKTtcbiAgICAgICAgaWYgKHNldHRpbmdzLmNvbnRlbnRUeXBlKSB7XG4gICAgICAgICAgICByZXEub3ZlcnJpZGVNaW1lVHlwZShzZXR0aW5ncy5jb250ZW50VHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHJlcS5yZXNwb25zZTtcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5kYXRhVHlwZSA9PT0gJ2pzb24nKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKHsgZGF0YTogcmVzcG9uc2UsIHN0YXR1c1RleHQ6IHJlcS5zdGF0dXNUZXh0LCB4aHI6IHJlcSB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoeyB4aHI6IHJlcSwgc3RhdHVzVGV4dDogcmVxLnN0YXR1c1RleHQsIGVycm9yOiBlcnIgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChzZXR0aW5ncy5kYXRhKSB7XG4gICAgICAgICAgICByZXEuc2VuZChzZXR0aW5ncy5kYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcS5zZW5kKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0iXX0=
