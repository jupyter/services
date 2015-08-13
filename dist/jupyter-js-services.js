(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jupyterJsServices = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _kernel = require('./kernel');

var _session = require('./session');

exports['default'] = { Kernel: _kernel.Kernel, NotebookSession: _session.NotebookSession };
module.exports = exports['default'];
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvaW5kZXguanMiLCJsaWIva2VybmVsLmpzIiwibGliL3NlcmlhbGl6ZS5qcyIsImxpYi9zZXNzaW9uLmpzIiwibGliL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfa2VybmVsID0gcmVxdWlyZSgnLi9rZXJuZWwnKTtcblxudmFyIF9zZXNzaW9uID0gcmVxdWlyZSgnLi9zZXNzaW9uJyk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHsgS2VybmVsOiBfa2VybmVsLktlcm5lbCwgTm90ZWJvb2tTZXNzaW9uOiBfc2Vzc2lvbi5Ob3RlYm9va1Nlc3Npb24gfTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIi8vIENvcHlyaWdodCAoYykgSnVweXRlciBEZXZlbG9wbWVudCBUZWFtLlxuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNb2RpZmllZCBCU0QgTGljZW5zZS5cblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94NSwgX3g2LCBfeDcpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3g1LCBwcm9wZXJ0eSA9IF94NiwgcmVjZWl2ZXIgPSBfeDc7IGRlc2MgPSBwYXJlbnQgPSBnZXR0ZXIgPSB1bmRlZmluZWQ7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3g1ID0gcGFyZW50OyBfeDYgPSBwcm9wZXJ0eTsgX3g3ID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKFwidmFsdWVcIiBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmV4cG9ydHMudmFsaWRhdGVLZXJuZWxJZCA9IHZhbGlkYXRlS2VybmVsSWQ7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSBuZXdPYmpbXCJkZWZhdWx0XCJdID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBfdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciB1dGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF91dGlscyk7XG5cbnZhciBfc2VyaWFsaXplID0gcmVxdWlyZSgnLi9zZXJpYWxpemUnKTtcblxuLyoqXG4gKiBUaGUgdXJsIGZvciB0aGUga2VybmVsIHNlcnZpY2UuXG4gKi9cbnZhciBfX2RlY29yYXRlID0gdW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2RlY29yYXRlIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQgJiYgZChvKSB8fCBvO1xuICAgICAgICAgICAgfSwgdGFyZ2V0KTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQgJiYgZCh0YXJnZXQsIGtleSksIHZvaWQgMCk7XG4gICAgICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkICYmIGQodGFyZ2V0LCBrZXksIG8pIHx8IG87XG4gICAgICAgICAgICB9LCBkZXNjKTtcbiAgICB9XG59O1xudmFyIHNpZ25hbCA9IHBob3NwaG9yLmNvcmUuc2lnbmFsO1xudmFyIERpc3Bvc2FibGUgPSBwaG9zcGhvci51dGlsaXR5LkRpc3Bvc2FibGU7XG52YXIgS0VSTkVMX1NFUlZJQ0VfVVJMID0gJ2FwaS9rZXJuZWwnO1xuLyoqXG4gKiBHZXQgYSBsb2dnZXIga2VybmVsIG9iamVjdHMuXG4gKi9cbnZhciBrZXJuZWxfbG9nID0gTG9nZ2VyLmdldCgna2VybmVsJyk7XG4vKipcbiAqIEEgY2xhc3MgdG8gY29tbXVuaWNhdGUgd2l0aCB0aGUgUHl0aG9uIGtlcm5lbC4gVGhpc1xuICogc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgY29uc3RydWN0ZWQgZGlyZWN0bHksIGJ1dCBiZSBjcmVhdGVkXG4gKiBieSB0aGUgYFNlc3Npb25gIG9iamVjdC4gT25jZSBjcmVhdGVkLCB0aGlzIG9iamVjdCBzaG91bGQgYmVcbiAqIHVzZWQgdG8gY29tbXVuaWNhdGUgd2l0aCB0aGUga2VybmVsLlxuICovXG5cbnZhciBLZXJuZWwgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBrZXJuZWwuXG4gICAgICovXG5cbiAgICBmdW5jdGlvbiBLZXJuZWwoYmFzZVVybCwgd3NVcmwpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEtlcm5lbCk7XG5cbiAgICAgICAgdGhpcy5faWQgPSAnJztcbiAgICAgICAgdGhpcy5fbmFtZSA9ICcnO1xuICAgICAgICB0aGlzLl9iYXNlVXJsID0gJyc7XG4gICAgICAgIHRoaXMuX2tlcm5lbFVybCA9ICcnO1xuICAgICAgICB0aGlzLl93c1VybCA9ICcnO1xuICAgICAgICB0aGlzLl91c2VybmFtZSA9ICcnO1xuICAgICAgICB0aGlzLl9zdGF0aWNJZCA9ICcnO1xuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2luZm9SZXBseSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdExpbWl0ID0gNztcbiAgICAgICAgdGhpcy5fYXV0b3Jlc3RhcnRBdHRlbXB0ID0gMDtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0QXR0ZW1wdCA9IDA7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJNYXAgPSBudWxsO1xuICAgICAgICB0aGlzLl9pb3B1YkhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gJyc7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9ICd1bmtub3duJztcbiAgICAgICAgdGhpcy5fYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgICAgIHRoaXMuX3dzVXJsID0gd3NVcmw7XG4gICAgICAgIGlmICghdGhpcy5fd3NVcmwpIHtcbiAgICAgICAgICAgIC8vIHRyYWlsaW5nICdzJyBpbiBodHRwcyB3aWxsIGJlY29tZSB3c3MgZm9yIHNlY3VyZSB3ZWIgc29ja2V0c1xuICAgICAgICAgICAgdGhpcy5fd3NVcmwgPSBsb2NhdGlvbi5wcm90b2NvbC5yZXBsYWNlKCdodHRwJywgJ3dzJykgKyBcIi8vXCIgKyBsb2NhdGlvbi5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N0YXRpY0lkID0gdXRpbHMudXVpZCgpO1xuICAgICAgICB0aGlzLl9oYW5kbGVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAodHlwZW9mIFdlYlNvY2tldCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lcyBub3QgaGF2ZSBXZWJTb2NrZXQgc3VwcG9ydCwgcGxlYXNlIHRyeSBDaHJvbWUsIFNhZmFyaSwgb3IgRmlyZWZveCDiiaUgMTEuJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHRVQgL2FwaS9rZXJuZWxzXG4gICAgICpcbiAgICAgKiBHZXQgdGhlIGxpc3Qgb2YgcnVubmluZyBrZXJuZWxzLlxuICAgICAqL1xuXG4gICAgX2NyZWF0ZUNsYXNzKEtlcm5lbCwgW3tcbiAgICAgICAga2V5OiBcImdldEluZm9cIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogR0VUIC9hcGkva2VybmVscy9bOmtlcm5lbF9pZF1cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0SW5mbygpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9rZXJuZWxVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFN0YXR1czogJyArIHN1Y2Nlc3MueGhyLnN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlS2VybmVsSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUE9TVCAvYXBpL2tlcm5lbHMvWzprZXJuZWxfaWRdL2ludGVycnVwdFxuICAgICAgICAgKlxuICAgICAgICAgKiBJbnRlcnJ1cHQgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW50ZXJydXB0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpbnRlcnJ1cHQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdpbnRlcnJ1cHRpbmcnKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2tlcm5lbFVybCwgJ2ludGVycnVwdCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJoaSB0aGVyZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh1cmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzMi5fb25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQT1NUIC9hcGkva2VybmVscy9bOmtlcm5lbF9pZF0vcmVzdGFydFxuICAgICAgICAgKlxuICAgICAgICAgKiBSZXN0YXJ0IHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlc3RhcnRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdyZXN0YXJ0aW5nJyk7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2tlcm5lbFVybCwgJ3Jlc3RhcnQnKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh1cmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTdGF0dXM6ICcgKyBzdWNjZXNzLnhoci5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUtlcm5lbElkKHN1Y2Nlc3MuZGF0YSk7XG4gICAgICAgICAgICAgICAgX3RoaXMzLmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMzLl9vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBPU1QgL2FwaS9rZXJuZWxzL1s6a2VybmVsX2lkXVxuICAgICAgICAgKlxuICAgICAgICAgKiBTdGFydCBhIGtlcm5lbC4gIE5vdGU6IGlmIHVzaW5nIGEgc2Vzc2lvbiwgU2Vzc2lvbi5zdGFydCgpXG4gICAgICAgICAqIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInN0YXJ0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydChpZCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmIChpZCAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldHRpbmcgdGhpcyB0aGluZycpO1xuICAgICAgICAgICAgICAgIHRoaXMuaWQgPSBpZC5pZDtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBpZC5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLl9rZXJuZWxVcmwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignWW91IG11c3Qgc2V0IHRoZSBrZXJuZWwgaWQgYmVmb3JlIHN0YXJ0aW5nLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHRoaXMuX2tlcm5lbFVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFN0YXR1czogJyArIHN1Y2Nlc3MueGhyLnN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbGlkYXRlS2VybmVsSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICBfdGhpczQuY29ubmVjdChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfdGhpczQuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogREVMRVRFIC9hcGkva2VybmVscy9bOmtlcm5lbF9pZF1cbiAgICAgICAgICpcbiAgICAgICAgICogS2lsbCBhIGtlcm5lbC4gTm90ZTogaWYgdXNlaW5nIGEgc2Vzc2lvbiwgU2Vzc2lvbi5kZWxldGUoKVxuICAgICAgICAgKiBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkZWxldGVcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9kZWxldGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fa2VybmVsVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbm5lY3QgdG8gdGhlIHNlcnZlci1zaWRlIHRoZSBrZXJuZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGRpcmVjdGx5IGJ5IGEgc2Vzc2lvbi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29ubmVjdChpZCkge1xuICAgICAgICAgICAgaWYgKGlkICE9PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlkID0gaWQuaWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gaWQubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5fa2VybmVsVXJsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1lvdSBtdXN0IHNldCB0aGUga2VybmVsIGlkIGJlZm9yZSBzdGFydGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc3RhcnRDaGFubmVscygpO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdjcmVhdGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVjb25uZWN0IHRvIGEgZGlzY29ubmVjdGVkIGtlcm5lbC4gVGhpcyBpcyBub3QgYWN0dWFsbHkgYVxuICAgICAgICAgKiBzdGFuZGFyZCBIVFRQIHJlcXVlc3QsIGJ1dCB1c2VmdWwgZnVuY3Rpb24gbm9uZXRoZWxlc3MgZm9yXG4gICAgICAgICAqIHJlY29ubmVjdGluZyB0byB0aGUga2VybmVsIGlmIHRoZSBjb25uZWN0aW9uIGlzIHNvbWVob3cgbG9zdC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVjb25uZWN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWNvbm5lY3QoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPSB0aGlzLl9yZWNvbm5lY3RBdHRlbXB0ICsgMTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygncmVjb25uZWN0aW5nJyk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydENoYW5uZWxzKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzY29ubmVjdCB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkaXNjb25uZWN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNjb25uZWN0KCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl93cyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl93cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93cy5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9jbGVhclNvY2tldCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93cy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyU29ja2V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmQgYSBtZXNzYWdlIG9uIHRoZSBrZXJuZWwncyBzaGVsbCBjaGFubmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzZW5kU2hlbGxNZXNzYWdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZW5kU2hlbGxNZXNzYWdlKG1zZ190eXBlLCBjb250ZW50KSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIG1ldGFkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICB2YXIgYnVmZmVycyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJrZXJuZWwgaXMgbm90IGNvbm5lY3RlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtc2cgPSB0aGlzLl9jcmVhdGVNc2cobXNnX3R5cGUsIGNvbnRlbnQsIG1ldGFkYXRhLCBidWZmZXJzKTtcbiAgICAgICAgICAgIG1zZy5jaGFubmVsID0gJ3NoZWxsJztcbiAgICAgICAgICAgIHRoaXMuX3dzLnNlbmQoKDAsIF9zZXJpYWxpemUuc2VyaWFsaXplKShtc2cpKTtcbiAgICAgICAgICAgIHZhciBmdXR1cmUgPSBuZXcgS2VybmVsRnV0dXJlSGFuZGxlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXM2Ll9oYW5kbGVyTWFwW1wiZGVsZXRlXCJdKG1zZy5oZWFkZXIubXNnSWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyTWFwLnNldChtc2cuaGVhZGVyLm1zZ0lkLCBmdXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1dHVyZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQga2VybmVsIGluZm8uXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgdGhhdCB3aWxsIHJlc29sdmUgdG8gYSBga2VybmVsX2luZm9fcmVwbHlgIG1lc3NhZ2UgZG9jdW1lbnRlZFxuICAgICAgICAgKiBbaGVyZV0oaHR0cDovL2lweXRob24ub3JnL2lweXRob24tZG9jL2Rldi9kZXZlbG9wbWVudC9tZXNzYWdpbmcuaHRtbCNrZXJuZWwtaW5mbylcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwia2VybmVsSW5mb1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24ga2VybmVsSW5mbygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbmRTaGVsbE1lc3NhZ2UoXCJrZXJuZWxfaW5mb19yZXF1ZXN0XCIsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgaW5mbyBvbiBhbiBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgdGhhdCB3aWxsIHJlc29sdmUgdG8gYSBgaW5zcGVjdF9yZXBseWAgbWVzc2FnZSBkb2N1bWVudGVkXG4gICAgICAgICAqIFtoZXJlXShodHRwOi8vaXB5dGhvbi5vcmcvaXB5dGhvbi1kb2MvZGV2L2RldmVsb3BtZW50L21lc3NhZ2luZy5odG1sI29iamVjdC1pbmZvcm1hdGlvbilcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW5zcGVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5zcGVjdChjb2RlLCBjdXJzb3JfcG9zKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgICAgIGN1cnNvcl9wb3M6IGN1cnNvcl9wb3MsXG4gICAgICAgICAgICAgICAgZGV0YWlsX2xldmVsOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VuZFNoZWxsTWVzc2FnZShcImluc3BlY3RfcmVxdWVzdFwiLCBjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFeGVjdXRlIGdpdmVuIGNvZGUgaW50byBrZXJuZWwsIHJldHVybmluZyBhIEtlcm5lbEZ1dHVyZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIG9wdGlvbnMgb2JqZWN0IHNob3VsZCBjb250YWluIHRoZSBvcHRpb25zIGZvciB0aGUgZXhlY3V0ZVxuICAgICAgICAgKiBjYWxsLiBJdHMgZGVmYXVsdCB2YWx1ZXMgYXJlOlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAqICAgICAgICBzaWxlbnQgOiB0cnVlLFxuICAgICAgICAgKiAgICAgICAgdXNlcl9leHByZXNzaW9ucyA6IHt9LFxuICAgICAgICAgKiAgICAgICAgYWxsb3dfc3RkaW4gOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHN0b3JlX2hpc3Rvcnk6IGZhbHNlXG4gICAgICAgICAqICAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJleGVjdXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBleGVjdXRlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICAgICAgc2lsZW50OiB0cnVlLFxuICAgICAgICAgICAgICAgIHN0b3JlX2hpc3Rvcnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHVzZXJfZXhwcmVzc2lvbnM6IHt9LFxuICAgICAgICAgICAgICAgIGFsbG93X3N0ZGluOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHV0aWxzLmV4dGVuZChjb250ZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbmRTaGVsbE1lc3NhZ2UoXCJleGVjdXRlX3JlcXVlc3RcIiwgY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVxdWVzdCBhIGNvZGUgY29tcGxldGlvbiBmcm9tIHRoZSBrZXJuZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIFJldHVybnMgYSBLZXJuZWxGdXR1cmUgd2l0aCB3aWxsIHJlc29sdmUgdG8gYSBgY29tcGxldGVfcmVwbHlgIGRvY3VtZW50ZWRcbiAgICAgICAgICogW2hlcmVdKGh0dHA6Ly9pcHl0aG9uLm9yZy9pcHl0aG9uLWRvYy9kZXYvZGV2ZWxvcG1lbnQvbWVzc2FnaW5nLmh0bWwjY29tcGxldGUpXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvbXBsZXRlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZShjb2RlLCBjdXJzb3JfcG9zKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICAgICAgICAgIGN1cnNvcl9wb3M6IGN1cnNvcl9wb3NcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZW5kU2hlbGxNZXNzYWdlKFwiY29tcGxldGVfcmVxdWVzdFwiLCBjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kIGFuIGlucHV0IHJlcGx5IG1lc3NhZ2UgdG8gdGhlIGtlcm5lbC5cbiAgICAgICAgICpcbiAgICAgICAgICogVE9ETzogaG93IHRvIGhhbmRsZSB0aGlzPyAgUmlnaHQgbm93IGNhbGxlZCBieVxuICAgICAgICAgKiAuL3N0YXRpYy9ub3RlYm9vay9qcy9vdXRwdXRhcmVhLmpzOjgyNzpcbiAgICAgICAgICogdGhpcy5ldmVudHMudHJpZ2dlcignc2VuZF9pbnB1dF9yZXBseS5LZXJuZWwnLCB2YWx1ZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHdoaWNoIGhhcyBubyByZWZlcmVuY2UgdG8gdGhlIHNlc3Npb24gb3IgdGhlIGtlcm5lbFxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzZW5kSW5wdXRSZXBseVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZElucHV0UmVwbHkoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImtlcm5lbCBpcyBub3QgY29ubmVjdGVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIG1zZyA9IHRoaXMuX2NyZWF0ZU1zZyhcImlucHV0X3JlcGx5XCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgbXNnLmNoYW5uZWwgPSAnc3RkaW4nO1xuICAgICAgICAgICAgdGhpcy5fd3Muc2VuZCgoMCwgX3NlcmlhbGl6ZS5zZXJpYWxpemUpKG1zZykpO1xuICAgICAgICAgICAgcmV0dXJuIG1zZy5oZWFkZXIubXNnSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEga2VybmVsIG1lc3NhZ2UgZ2l2ZW4gaW5wdXQgYXR0cmlidXRlcy5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2NyZWF0ZU1zZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2NyZWF0ZU1zZyhtc2dfdHlwZSwgY29udGVudCkge1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICB2YXIgYnVmZmVycyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0ge1xuICAgICAgICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgICAgICBtc2dJZDogdXRpbHMudXVpZCgpLFxuICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdGhpcy5fdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlc3Npb246IHRoaXMuX3N0YXRpY0lkLFxuICAgICAgICAgICAgICAgICAgICBtc2dUeXBlOiBtc2dfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCI1LjBcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWV0YWRhdGE6IG1ldGFkYXRhIHx8IHt9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICAgICAgYnVmZmVyczogYnVmZmVycyB8fCBbXSxcbiAgICAgICAgICAgICAgICBwYXJlbnRIZWFkZXI6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBrZXJuZWwgc3RhdHVzIGNoYW5nZSBtZXNzYWdlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlU3RhdHVzXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlU3RhdHVzKHN0YXR1cykge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDaGFuZ2VkLmVtaXQoc3RhdHVzKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIHZhciBtc2cgPSAnS2VybmVsOiAnICsgc3RhdHVzICsgJyAoJyArIHRoaXMuX2lkICsgJyknO1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnIHx8IHN0YXR1cyA9PT0gJ2J1c3knKSB7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5kZWJ1Zyhtc2cpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmluZm8obXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSBmYWlsZWQgQUpBWCByZXF1ZXN0IGJ5IGxvZ2dpbmcgdGhlIGVycm9yIG1lc3NhZ2UsIGFuZCB0aHJvd2luZ1xuICAgICAgICAgKiBhbm90aGVyIGVycm9yLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfb25FcnJvclwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX29uRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSBcIkFQSSByZXF1ZXN0IGZhaWxlZCAoXCIgKyBlcnJvci5zdGF0dXNUZXh0ICsgXCIpOiBcIjtcbiAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IobXNnKTtcbiAgICAgICAgICAgIHRocm93IEVycm9yKGVycm9yLnN0YXR1c1RleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXJ0IHRoZSBXZWJzb2NrZXQgY2hhbm5lbHMuXG4gICAgICAgICAqIFdpbGwgc3RvcCBhbmQgcmVzdGFydCB0aGVtIGlmIHRoZXkgYWxyZWFkeSBleGlzdC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3N0YXJ0Q2hhbm5lbHNcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9zdGFydENoYW5uZWxzKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgdmFyIHdzX2hvc3RfdXJsID0gdGhpcy5fd3NVcmwgKyB0aGlzLl9rZXJuZWxVcmw7XG4gICAgICAgICAgICBrZXJuZWxfbG9nLmluZm8oXCJTdGFydGluZyBXZWJTb2NrZXRzOlwiLCB3c19ob3N0X3VybCk7XG4gICAgICAgICAgICB0aGlzLl93cyA9IG5ldyBXZWJTb2NrZXQodGhpcy53c1VybCk7XG4gICAgICAgICAgICAvLyBFbnN1cmUgaW5jb21pbmcgYmluYXJ5IG1lc3NhZ2VzIGFyZSBub3QgQmxvYnNcbiAgICAgICAgICAgIHRoaXMuX3dzLmJpbmFyeVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICAgICAgdmFyIGFscmVhZHlfY2FsbGVkX29uY2xvc2UgPSBmYWxzZTsgLy8gb25seSBhbGVydCBvbmNlXG4gICAgICAgICAgICB0aGlzLl93cy5vbmNsb3NlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChhbHJlYWR5X2NhbGxlZF9vbmNsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxyZWFkeV9jYWxsZWRfb25jbG9zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKCFldnQud2FzQ2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHdlYnNvY2tldCB3YXMgY2xvc2VkIGVhcmx5LCB0aGF0IGNvdWxkIG1lYW5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCB0aGUga2VybmVsIGlzIGFjdHVhbGx5IGRlYWQuIFRyeSBnZXR0aW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGluZm9ybWF0aW9uIGFib3V0IHRoZSBrZXJuZWwgZnJvbSB0aGUgQVBJIGNhbGwgLS1cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhhdCBmYWlscywgdGhlbiBhc3N1bWUgdGhlIGtlcm5lbCBpcyBkZWFkLFxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UganVzdCBmb2xsb3cgdGhlIHR5cGljYWwgd2Vic29ja2V0IGNsb3NlZFxuICAgICAgICAgICAgICAgICAgICAvLyBwcm90b2NvbC5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXM3LmdldEluZm8oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3dzX2Nsb3NlZCh3c19ob3N0X3VybCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXJuZWxfZGVhZCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeV9jYWxsZWRfb25jbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFscmVhZHlfY2FsbGVkX29uY2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzNy5fd3NDbG9zZWQod3NfaG9zdF91cmwsIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX3dzLm9ub3BlbiA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBfdGhpczcuX3dzT3BlbmVkKGV2dCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHdzX2Nsb3NlZF9sYXRlID0gZnVuY3Rpb24gd3NfY2xvc2VkX2xhdGUoZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFscmVhZHlfY2FsbGVkX29uY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbHJlYWR5X2NhbGxlZF9vbmNsb3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWV2dC53YXNDbGVhbikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczcuX3dzQ2xvc2VkKHdzX2hvc3RfdXJsLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIHN3aXRjaCBmcm9tIGVhcmx5LWNsb3NlIHRvIGxhdGUtY2xvc2UgbWVzc2FnZSBhZnRlciAxc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzNy5fd3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM3Ll93cy5vbmNsb3NlID0gd3NfY2xvc2VkX2xhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICB0aGlzLl93cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgX3RoaXM3Ll9oYW5kbGVXU01lc3NhZ2UoZXZ0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xlYXIgdGhlIHdlYnNvY2tldCBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9jbGVhclNvY2tldFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2NsZWFyU29ja2V0KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3dzICYmIHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TRUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUGVyZm9ybSBuZWNlc3NhcnkgdGFza3Mgb25jZSB0aGUgY29ubmVjdGlvbiB0byB0aGUga2VybmVsIGhhc1xuICAgICAgICAgKiBiZWVuIGVzdGFibGlzaGVkLiBUaGlzIGluY2x1ZGVzIHJlcXVlc3RpbmcgaW5mb3JtYXRpb24gYWJvdXRcbiAgICAgICAgICogdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2tlcm5lbENvbm5lY3RlZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2tlcm5lbENvbm5lY3RlZCgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczggPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0QXR0ZW1wdCA9IDA7XG4gICAgICAgICAgICAvLyBnZXQga2VybmVsIGluZm8gc28gd2Uga25vdyB3aGF0IHN0YXRlIHRoZSBrZXJuZWwgaXMgaW5cbiAgICAgICAgICAgIHRoaXMua2VybmVsSW5mbygpLm9uUmVwbHkoZnVuY3Rpb24gKHJlcGx5KSB7XG4gICAgICAgICAgICAgICAgX3RoaXM4Ll9pbmZvUmVwbHkgPSByZXBseS5jb250ZW50O1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbmZvIHJlcGx5Jyk7XG4gICAgICAgICAgICAgICAgX3RoaXM4Ll9oYW5kbGVTdGF0dXMoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgX3RoaXM4Ll9hdXRvcmVzdGFydEF0dGVtcHQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUGVyZm9ybSBuZWNlc3NhcnkgdGFza3MgYWZ0ZXIgdGhlIGtlcm5lbCBoYXMgZGllZC4gVGhpcyBjbG9zZXNcbiAgICAgICAgICogY29tbXVuaWNhdGlvbiBjaGFubmVscyB0byB0aGUga2VybmVsIGlmIHRoZXkgYXJlIHN0aWxsIHNvbWVob3dcbiAgICAgICAgICogb3Blbi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2tlcm5lbERlYWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9rZXJuZWxEZWFkKCkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdkZWFkJyk7XG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYSB3ZWJzb2NrZXQgZW50ZXJpbmcgdGhlIG9wZW4gc3RhdGUsXG4gICAgICAgICAqIHNpZ25hbGluZyB0aGF0IHRoZSBrZXJuZWwgaXMgY29ubmVjdGVkIHdoZW4gd2Vic29ja2V0IGlzIG9wZW4uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl93c09wZW5lZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3dzT3BlbmVkKGV2dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBhbGwgZXZlbnRzIHJlYWR5LCB0cmlnZ2VyIHN0YXJ0ZWQgZXZlbnQuXG4gICAgICAgICAgICAgICAgdGhpcy5fa2VybmVsQ29ubmVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGEgd2Vic29ja2V0IGVudGVyaW5nIHRoZSBjbG9zZWQgc3RhdGUuICBJZiB0aGUgd2Vic29ja2V0XG4gICAgICAgICAqIHdhcyBub3QgY2xvc2VkIGR1ZSB0byBhbiBlcnJvciwgdHJ5IHRvIHJlY29ubmVjdCB0byB0aGUga2VybmVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gd3NfdXJsIC0gdGhlIHdlYnNvY2tldCB1cmxcbiAgICAgICAgICogQHBhcmFtIHtib29sfSBlcnJvciAtIHdoZXRoZXIgdGhlIGNvbm5lY3Rpb24gd2FzIGNsb3NlZCBkdWUgdG8gYW4gZXJyb3JcbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3dzQ2xvc2VkXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfd3NDbG9zZWQod3NfdXJsLCBlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5lcnJvcignV2ViU29ja2V0IGNvbm5lY3Rpb24gZmFpbGVkOiAnLCB3c191cmwpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnY29ubmVjdGlvbkZhaWxlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGVSZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGdW5jdGlvbiB0byBjYWxsIHdoZW4ga2VybmVsIGNvbm5lY3Rpb24gaXMgbG9zdC5cbiAgICAgICAgICogc2NoZWR1bGVzIHJlY29ubmVjdCwgb3IgZmlyZXMgJ2Nvbm5lY3Rpb25fZGVhZCcgaWYgcmVjb25uZWN0IGxpbWl0IGlzIGhpdC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3NjaGVkdWxlUmVjb25uZWN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfc2NoZWR1bGVSZWNvbm5lY3QoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXM5ID0gdGhpcztcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdEF0dGVtcHQgPCB0aGlzLl9yZWNvbm5lY3RMaW1pdCkge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lb3V0ID0gTWF0aC5wb3coMiwgdGhpcy5fcmVjb25uZWN0QXR0ZW1wdCk7XG4gICAgICAgICAgICAgICAga2VybmVsX2xvZy5lcnJvcihcIkNvbm5lY3Rpb24gbG9zdCwgcmVjb25uZWN0aW5nIGluIFwiICsgdGltZW91dCArIFwiIHNlY29uZHMuXCIpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczkucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfSwgMWUzICogdGltZW91dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1cygnY29ubmVjdGlvbkRlYWQnKTtcbiAgICAgICAgICAgICAgICBrZXJuZWxfbG9nLmVycm9yKFwiRmFpbGVkIHRvIHJlY29ubmVjdCwgZ2l2aW5nIHVwLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYW4gaW5jb21pbmcgV2Vic29ja2V0IG1lc3NhZ2UuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9oYW5kbGVXU01lc3NhZ2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9oYW5kbGVXU01lc3NhZ2UoZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gKDAsIF9zZXJpYWxpemUuZGVzZXJpYWxpemUpKGUuZGF0YSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGtlcm5lbF9sb2cuZXJyb3IoZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1zZy5jaGFubmVsID09PSAnaW9wdWInICYmIG1zZy5tc2dUeXBlID09PSAnc3RhdHVzJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVN0YXR1c01lc3NhZ2UobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtc2cucGFyZW50SGVhZGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhlYWRlciA9IG1zZy5wYXJlbnRIZWFkZXI7XG4gICAgICAgICAgICAgICAgdmFyIGZ1dHVyZSA9IHRoaXMuX2hhbmRsZXJNYXAuZ2V0KGhlYWRlci5tc2dJZCk7XG4gICAgICAgICAgICAgICAgaWYgKGZ1dHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBmdXR1cmUuaGFuZGxlTXNnKG1zZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBzdGF0dXMgaW9wdWIgbWVzc2FnZXMgZnJvbSB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlU3RhdHVzTWVzc2FnZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2hhbmRsZVN0YXR1c01lc3NhZ2UobXNnKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMxMCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBleGVjdXRpb25fc3RhdGUgPSBtc2cuY29udGVudC5leGVjdXRpb25fc3RhdGU7XG4gICAgICAgICAgICBpZiAoZXhlY3V0aW9uX3N0YXRlICE9PSAnZGVhZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoZXhlY3V0aW9uX3N0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleGVjdXRpb25fc3RhdGUgPT09ICdzdGFydGluZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmtlcm5lbEluZm8oKS5vblJlcGx5KGZ1bmN0aW9uIChyZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczEwLl9pbmZvUmVwbHkgPSByZXBseS5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBfdGhpczEwLl9oYW5kbGVTdGF0dXMoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzMTAuX2F1dG9yZXN0YXJ0QXR0ZW1wdCA9IDA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV4ZWN1dGlvbl9zdGF0ZSA9PT0gJ3Jlc3RhcnRpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gYXV0b3Jlc3RhcnRpbmcgaXMgZGlzdGluY3QgZnJvbSByZXN0YXJ0aW5nLFxuICAgICAgICAgICAgICAgIC8vIGluIHRoYXQgaXQgbWVhbnMgdGhlIGtlcm5lbCBkaWVkIGFuZCB0aGUgc2VydmVyIGlzIHJlc3RhcnRpbmcgaXQuXG4gICAgICAgICAgICAgICAgLy8ga2VybmVsX3Jlc3RhcnRpbmcgc2V0cyB0aGUgbm90aWZpY2F0aW9uIHdpZGdldCxcbiAgICAgICAgICAgICAgICAvLyBhdXRvcmVzdGFydCBzaG93cyB0aGUgbW9yZSBwcm9taW5lbnQgZGlhbG9nLlxuICAgICAgICAgICAgICAgIHRoaXMuX2F1dG9yZXN0YXJ0QXR0ZW1wdCA9IHRoaXMuX2F1dG9yZXN0YXJ0QXR0ZW1wdCArIDE7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlU3RhdHVzKCdhdXRvcmVzdGFydGluZycpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleGVjdXRpb25fc3RhdGUgPT09ICdkZWFkJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2tlcm5lbERlYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm5hbWVcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBuYW1lIG9mIHRoZSBrZXJuZWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIG5hbWUgb2YgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9uYW1lID0gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgd2hldGhlciB0aGVyZSBpcyBhIGNvbm5lY3Rpb24gdG8gdGhlIGtlcm5lbC4gVGhpc1xuICAgICAgICAgKiBmdW5jdGlvbiBvbmx5IHJldHVybnMgdHJ1ZSBpZiB3ZWJzb2NrZXQgaGFzIGJlZW5cbiAgICAgICAgICogY3JlYXRlZCBhbmQgaGFzIGEgc3RhdGUgb2YgV2ViU29ja2V0Lk9QRU4uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImlzQ29ubmVjdGVkXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3dzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgd2hldGhlciB0aGUgY29ubmVjdGlvbiB0byB0aGUga2VybmVsIGhhcyBiZWVuIGNvbXBsZXRlbHlcbiAgICAgICAgICogc2V2ZXJlZC4gVGhpcyBmdW5jdGlvbiBvbmx5IHJldHVybnMgdHJ1ZSBpZiB0aGUgd2Vic29ja2V0IGlzIG51bGwuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImlzRnVsbHlEaXNjb25uZWN0ZWRcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd3MgPT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBJbmZvIFJlcGx5IE1lc3NhZ2UgZnJvbSB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpbmZvUmVwbHlcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5mb1JlcGx5O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwic3RhdHVzXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGN1cnJlbnQgaWQgb2YgdGhlIGtlcm5lbC5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaWRcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgY3VycmVudCBpZCBvZiB0aGUga2VybmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2lkID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9rZXJuZWxVcmwgPSB1dGlscy51cmxKb2luRW5jb2RlKHRoaXMuX2Jhc2VVcmwsIEtFUk5FTF9TRVJWSUNFX1VSTCwgdGhpcy5faWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgZnVsbCB3ZWJzb2NrZXQgdXJsLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3c1VybFwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy5fd3NVcmwsIHV0aWxzLnVybEpvaW5FbmNvZGUodGhpcy5fa2VybmVsVXJsLCAnY2hhbm5lbHMnKSwgXCI/c2Vzc2lvbl9pZD1cIiArIHRoaXMuX3N0YXRpY0lkXS5qb2luKCcnKTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwibGlzdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGlzdChiYXNlVXJsKSB7XG4gICAgICAgICAgICB2YXIga2VybmVsU2VydmljZVVybCA9IHV0aWxzLnVybEpvaW5FbmNvZGUoYmFzZVVybCwgS0VSTkVMX1NFUlZJQ0VfVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdChrZXJuZWxTZXJ2aWNlVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VjY2Vzcy5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQga2VybmVsIGxpc3QnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1Y2Nlc3MuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGVLZXJuZWxJZChzdWNjZXNzLmRhdGFbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFN0YXR1czogJyArIHN1Y2Nlc3MueGhyLnN0YXR1cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBLZXJuZWw7XG59KSgpO1xuXG5leHBvcnRzLktlcm5lbCA9IEtlcm5lbDtcblxuX19kZWNvcmF0ZShbc2lnbmFsXSwgS2VybmVsLnByb3RvdHlwZSwgXCJzdGF0dXNDaGFuZ2VkXCIpO1xuLyoqXG4gKiBCaXQgZmxhZ3MgZm9yIHRoZSBrZXJuZWwgZnV0dXJlIHN0YXRlLlxuICovXG52YXIgS2VybmVsRnV0dXJlRmxhZztcbihmdW5jdGlvbiAoS2VybmVsRnV0dXJlRmxhZykge1xuICAgIEtlcm5lbEZ1dHVyZUZsYWdbS2VybmVsRnV0dXJlRmxhZ1tcIkdvdFJlcGx5XCJdID0gMV0gPSBcIkdvdFJlcGx5XCI7XG4gICAgS2VybmVsRnV0dXJlRmxhZ1tLZXJuZWxGdXR1cmVGbGFnW1wiR290SWRsZVwiXSA9IDJdID0gXCJHb3RJZGxlXCI7XG4gICAgS2VybmVsRnV0dXJlRmxhZ1tLZXJuZWxGdXR1cmVGbGFnW1wiQXV0b0Rpc3Bvc2VcIl0gPSA0XSA9IFwiQXV0b0Rpc3Bvc2VcIjtcbiAgICBLZXJuZWxGdXR1cmVGbGFnW0tlcm5lbEZ1dHVyZUZsYWdbXCJJc0RvbmVcIl0gPSA4XSA9IFwiSXNEb25lXCI7XG59KShLZXJuZWxGdXR1cmVGbGFnIHx8IChLZXJuZWxGdXR1cmVGbGFnID0ge30pKTtcbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgYSBrZXJuZWwgZnV0dXJlLlxuICovXG5cbnZhciBLZXJuZWxGdXR1cmVIYW5kbGVyID0gKGZ1bmN0aW9uIChfRGlzcG9zYWJsZSkge1xuICAgIF9pbmhlcml0cyhLZXJuZWxGdXR1cmVIYW5kbGVyLCBfRGlzcG9zYWJsZSk7XG5cbiAgICBmdW5jdGlvbiBLZXJuZWxGdXR1cmVIYW5kbGVyKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgS2VybmVsRnV0dXJlSGFuZGxlcik7XG5cbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihLZXJuZWxGdXR1cmVIYW5kbGVyLnByb3RvdHlwZSksIFwiY29uc3RydWN0b3JcIiwgdGhpcykuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IDA7XG4gICAgICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVwbHkgPSBudWxsO1xuICAgICAgICB0aGlzLl9kb25lID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgYXV0b0Rpc3Bvc2Ugc3RhdHVzIG9mIHRoZSBmdXR1cmUuXG4gICAgICovXG5cbiAgICBfY3JlYXRlQ2xhc3MoS2VybmVsRnV0dXJlSGFuZGxlciwgW3tcbiAgICAgICAga2V5OiBcIm9uUmVwbHlcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgYSByZXBseSBoYW5kbGVyLiBSZXR1cm5zIGB0aGlzYC5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblJlcGx5KGNiKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXBseSA9IGNiO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgYW4gb3V0cHV0IGhhbmRsZXIuIFJldHVybnMgYHRoaXNgLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvbk91dHB1dFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25PdXRwdXQoY2IpIHtcbiAgICAgICAgICAgIHRoaXMuX291dHB1dCA9IGNiO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgYSBkb25lIGhhbmRsZXIuIFJldHVybnMgYHRoaXNgLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvbkRvbmVcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uRG9uZShjYikge1xuICAgICAgICAgICAgdGhpcy5fZG9uZSA9IGNiO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgYW4gaW5wdXQgaGFuZGxlci4gUmV0dXJucyBgdGhpc2AuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uSW5wdXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uSW5wdXQoY2IpIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gY2I7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGUgYW4gaW5jb21pbmcgbWVzc2FnZSBmcm9tIHRoZSBrZXJuZWwgYmVsb25naW5nIHRvIHRoaXMgZnV0dXJlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJoYW5kbGVNc2dcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZU1zZyhtc2cpIHtcbiAgICAgICAgICAgIGlmIChtc2cuY2hhbm5lbCA9PT0gJ2lvcHViJykge1xuICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9vdXRwdXQ7XG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dCkgb3V0cHV0KG1zZyk7XG4gICAgICAgICAgICAgICAgaWYgKG1zZy5tc2dUeXBlID09PSAnc3RhdHVzJyAmJiBtc2cuY29udGVudC5leGVjdXRpb25fc3RhdGUgPT09ICdpZGxlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuR290SWRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl90ZXN0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkdvdFJlcGx5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRG9uZShtc2cpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtc2cuY2hhbm5lbCA9PT0gJ3NoZWxsJykge1xuICAgICAgICAgICAgICAgIHZhciByZXBseSA9IHRoaXMuX291dHB1dDtcbiAgICAgICAgICAgICAgICBpZiAocmVwbHkpIHJlcGx5KG1zZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkdvdFJlcGx5KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Hb3RJZGxlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVEb25lKG1zZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtc2cuY2hhbm5lbCA9PT0gJ3N0ZGluJykge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuX2lucHV0O1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dCkgaW5wdXQobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwb3NlIGFuZCB1bnJlZ2lzdGVyIHRoZSBmdXR1cmUuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRpc3Bvc2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9vdXRwdXQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fcmVwbHkgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fZG9uZSA9IG51bGw7XG4gICAgICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihLZXJuZWxGdXR1cmVIYW5kbGVyLnByb3RvdHlwZSksIFwiZGlzcG9zZVwiLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBhIG1lc3NhZ2UgZG9uZSBzdGF0dXMuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl9oYW5kbGVEb25lXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlRG9uZShtc2cpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Jc0RvbmUpO1xuICAgICAgICAgICAgdmFyIGRvbmUgPSB0aGlzLl9kb25lO1xuICAgICAgICAgICAgaWYgKGRvbmUpIGRvbmUobXNnKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBvdGhlciBjYWxsYmFja3NcbiAgICAgICAgICAgIHRoaXMuX3JlcGx5ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2RvbmUgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Rlc3RGbGFnKEtlcm5lbEZ1dHVyZUZsYWcuQXV0b0Rpc3Bvc2UpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiBmdXR1cmUgZmxhZyBpcyBzZXQuXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIl90ZXN0RmxhZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3Rlc3RGbGFnKGZsYWcpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5fc3RhdHVzICYgZmxhZykgIT09IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBnaXZlbiBmdXR1cmUgZmxhZy5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX3NldEZsYWdcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9zZXRGbGFnKGZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyB8PSBmbGFnO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsZWFyIHRoZSBnaXZlbiBmdXR1cmUgZmxhZy5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX2NsZWFyRmxhZ1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2NsZWFyRmxhZyhmbGFnKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgJj0gfmZsYWc7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJhdXRvRGlzcG9zZVwiLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90ZXN0RmxhZyhLZXJuZWxGdXR1cmVGbGFnLkF1dG9EaXNwb3NlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBjdXJyZW50IGF1dG9EaXNwb3NlIGJlaGF2aW9yIG9mIHRoZSBmdXR1cmUuXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIFRydWUsIGl0IHdpbGwgc2VsZi1kaXNwb3NlKCkgYWZ0ZXIgb25Eb25lKCkgaXMgY2FsbGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoS2VybmVsRnV0dXJlRmxhZy5BdXRvRGlzcG9zZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyRmxhZyhLZXJuZWxGdXR1cmVGbGFnLkF1dG9EaXNwb3NlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBmb3IgbWVzc2FnZSBkb25lIHN0YXRlLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpc0RvbmVcIixcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGVzdEZsYWcoS2VybmVsRnV0dXJlRmxhZy5Jc0RvbmUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEtlcm5lbEZ1dHVyZUhhbmRsZXI7XG59KShEaXNwb3NhYmxlKTtcblxudmFyIEtlcm5lbFN1YiA9IChmdW5jdGlvbiAoX0tlcm5lbCkge1xuICAgIF9pbmhlcml0cyhLZXJuZWxTdWIsIF9LZXJuZWwpO1xuXG4gICAgZnVuY3Rpb24gS2VybmVsU3ViKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgS2VybmVsU3ViKTtcblxuICAgICAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihLZXJuZWxTdWIucHJvdG90eXBlKSwgXCJjb25zdHJ1Y3RvclwiLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIG9iamVjdCBhcyBiZWluZyBvZiBJS2VybmVsSUQgdHlwZVxuICAgICAqL1xuXG4gICAgX2NyZWF0ZUNsYXNzKEtlcm5lbFN1YiwgW3tcbiAgICAgICAga2V5OiBcImRvU29tZXRoaW5nXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkb1NvbWV0aGluZygpIHt9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEtlcm5lbFN1Yjtcbn0pKEtlcm5lbCk7XG5cbmV4cG9ydHMuS2VybmVsU3ViID0gS2VybmVsU3ViO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZUtlcm5lbElkKGluZm8pIHtcbiAgICBpZiAoIWluZm8uaGFzT3duUHJvcGVydHkoJ25hbWUnKSB8fCAhaW5mby5oYXNPd25Qcm9wZXJ0eSgnaWQnKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBrZXJuZWwgaWQnKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBpbmZvLmlkICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgaW5mby5uYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBrZXJuZWwgaWQnKTtcbiAgICB9XG59IiwiLy8gQ29weXJpZ2h0IChjKSBKdXB5dGVyIERldmVsb3BtZW50IFRlYW0uXG4vLyBEaXN0cmlidXRlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1vZGlmaWVkIEJTRCBMaWNlbnNlLlxuLyoqXG4gKiBEZXNlcmlhbGl6ZSBhbmQgcmV0dXJuIHRoZSB1bnBhY2tlZCBtZXNzYWdlLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZXNlcmlhbGl6ZSA9IGRlc2VyaWFsaXplO1xuZXhwb3J0cy5zZXJpYWxpemUgPSBzZXJpYWxpemU7XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplKGRhdGEpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHZhbHVlID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRlc2VyaWFsaXplQmluYXJ5KGRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogU2VyaWFsaXplIGEga2VybmVsIG1lc3NhZ2UgZm9yIHRyYW5zcG9ydC5cbiAqL1xuXG5mdW5jdGlvbiBzZXJpYWxpemUobXNnKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmIChtc2cuYnVmZmVycyAmJiBtc2cuYnVmZmVycy5sZW5ndGgpIHtcbiAgICAgICAgdmFsdWUgPSBzZXJpYWxpemVCaW5hcnkobXNnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KG1zZyk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBEZXNlcmlhbGl6ZSBhIGJpbmFyeSBtZXNzYWdlIHRvIGEgS2VybmVsIE1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIGRlc2VyaWFsaXplQmluYXJ5KGJ1Zikge1xuICAgIHZhciBkYXRhID0gbmV3IERhdGFWaWV3KGJ1Zik7XG4gICAgLy8gcmVhZCB0aGUgaGVhZGVyOiAxICsgbmJ1ZnMgMzJiIGludGVnZXJzXG4gICAgdmFyIG5idWZzID0gZGF0YS5nZXRVaW50MzIoMCk7XG4gICAgdmFyIG9mZnNldHMgPSBbXTtcbiAgICBpZiAobmJ1ZnMgPCAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW5jb21pbmcgS2VybmVsIE1lc3NhZ2VcIik7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IG5idWZzOyBpKyspIHtcbiAgICAgICAgb2Zmc2V0cy5wdXNoKGRhdGEuZ2V0VWludDMyKGkgKiA0KSk7XG4gICAgfVxuICAgIHZhciBqc29uX2J5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmLnNsaWNlKG9mZnNldHNbMF0sIG9mZnNldHNbMV0pKTtcbiAgICB2YXIgbXNnID0gSlNPTi5wYXJzZShuZXcgVGV4dERlY29kZXIoJ3V0ZjgnKS5kZWNvZGUoanNvbl9ieXRlcykpO1xuICAgIC8vIHRoZSByZW1haW5pbmcgY2h1bmtzIGFyZSBzdG9yZWQgYXMgRGF0YVZpZXdzIGluIG1zZy5idWZmZXJzXG4gICAgbXNnLmJ1ZmZlcnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IG5idWZzOyBpKyspIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gb2Zmc2V0c1tpXTtcbiAgICAgICAgdmFyIHN0b3AgPSBvZmZzZXRzW2kgKyAxXSB8fCBidWYuYnl0ZUxlbmd0aDtcbiAgICAgICAgbXNnLmJ1ZmZlcnMucHVzaChuZXcgRGF0YVZpZXcoYnVmLnNsaWNlKHN0YXJ0LCBzdG9wKSkpO1xuICAgIH1cbiAgICByZXR1cm4gbXNnO1xufVxuLyoqXG4gKiBJbXBsZW1lbnQgdGhlIGJpbmFyeSBzZXJpYWxpemF0aW9uIHByb3RvY29sLlxuICogU2VyaWFsaXplIEtlcm5lbCBtZXNzYWdlIHRvIEFycmF5QnVmZmVyLlxuICovXG5mdW5jdGlvbiBzZXJpYWxpemVCaW5hcnkobXNnKSB7XG4gICAgdmFyIG9mZnNldHMgPSBbXTtcbiAgICB2YXIgYnVmZmVycyA9IFtdO1xuICAgIHZhciBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCd1dGY4Jyk7XG4gICAgdmFyIGpzb25fdXRmOCA9IGVuY29kZXIuZW5jb2RlKEpTT04uc3RyaW5naWZ5KG1zZywgcmVwbGFjZV9idWZmZXJzKSk7XG4gICAgYnVmZmVycy5wdXNoKGpzb25fdXRmOC5idWZmZXIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLmJ1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gbXNnLmJ1ZmZlcnMgZWxlbWVudHMgY291bGQgYmUgZWl0aGVyIHZpZXdzIG9yIEFycmF5QnVmZmVyc1xuICAgICAgICAvLyBidWZmZXJzIGVsZW1lbnRzIGFyZSBBcnJheUJ1ZmZlcnNcbiAgICAgICAgdmFyIGIgPSBtc2cuYnVmZmVyc1tpXTtcbiAgICAgICAgYnVmZmVycy5wdXNoKGIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciA/IGIgOiBiLmJ1ZmZlcik7XG4gICAgfVxuICAgIHZhciBuYnVmcyA9IGJ1ZmZlcnMubGVuZ3RoO1xuICAgIG9mZnNldHMucHVzaCg0ICogKG5idWZzICsgMSkpO1xuICAgIGZvciAoaSA9IDA7IGkgKyAxIDwgYnVmZmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvZmZzZXRzLnB1c2gob2Zmc2V0c1tvZmZzZXRzLmxlbmd0aCAtIDFdICsgYnVmZmVyc1tpXS5ieXRlTGVuZ3RoKTtcbiAgICB9XG4gICAgdmFyIG1zZ19idWYgPSBuZXcgVWludDhBcnJheShvZmZzZXRzW29mZnNldHMubGVuZ3RoIC0gMV0gKyBidWZmZXJzW2J1ZmZlcnMubGVuZ3RoIC0gMV0uYnl0ZUxlbmd0aCk7XG4gICAgLy8gdXNlIERhdGFWaWV3LnNldFVpbnQzMiBmb3IgbmV0d29yayBieXRlLW9yZGVyXG4gICAgdmFyIHZpZXcgPSBuZXcgRGF0YVZpZXcobXNnX2J1Zi5idWZmZXIpO1xuICAgIC8vIHdyaXRlIG5idWZzIHRvIGZpcnN0IDQgYnl0ZXNcbiAgICB2aWV3LnNldFVpbnQzMigwLCBuYnVmcyk7XG4gICAgLy8gd3JpdGUgb2Zmc2V0cyB0byBuZXh0IDQgKiBuYnVmcyBieXRlc1xuICAgIGZvciAoaSA9IDA7IGkgPCBvZmZzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0VWludDMyKDQgKiAoaSArIDEpLCBvZmZzZXRzW2ldKTtcbiAgICB9XG4gICAgLy8gd3JpdGUgYWxsIHRoZSBidWZmZXJzIGF0IHRoZWlyIHJlc3BlY3RpdmUgb2Zmc2V0c1xuICAgIGZvciAoaSA9IDA7IGkgPCBidWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1zZ19idWYuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbaV0pLCBvZmZzZXRzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIG1zZ19idWYuYnVmZmVyO1xufVxuLyoqXG4gKiBGaWx0ZXIgXCJidWZmZXJzXCIga2V5IGZvciBKU09OLnN0cmluZ2lmeVxuICovXG5mdW5jdGlvbiByZXBsYWNlX2J1ZmZlcnMoa2V5LCB2YWx1ZSkge1xuICAgIGlmIChrZXkgPT09IFwiYnVmZmVyc1wiKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn0iLCIvLyBDb3B5cmlnaHQgKGMpIEp1cHl0ZXIgRGV2ZWxvcG1lbnQgVGVhbS5cbi8vIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTW9kaWZpZWQgQlNEIExpY2Vuc2UuXG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSBuZXdPYmpbXCJkZWZhdWx0XCJdID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIF91dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIHV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3V0aWxzKTtcblxudmFyIF9rZXJuZWwgPSByZXF1aXJlKCcuL2tlcm5lbCcpO1xuXG4vKipcbiAqIFRoZSB1cmwgZm9yIHRoZSBzZXNzaW9uIHNlcnZpY2UuXG4gKi9cbnZhciBfX2RlY29yYXRlID0gdW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2RlY29yYXRlIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiBkZWNvcmF0b3JzLnJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChvLCBkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQgJiYgZChvKSB8fCBvO1xuICAgICAgICAgICAgfSwgdGFyZ2V0KTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnMucmVkdWNlUmlnaHQoZnVuY3Rpb24gKG8sIGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQgJiYgZCh0YXJnZXQsIGtleSksIHZvaWQgMCk7XG4gICAgICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ycy5yZWR1Y2VSaWdodChmdW5jdGlvbiAobywgZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkICYmIGQodGFyZ2V0LCBrZXksIG8pIHx8IG87XG4gICAgICAgICAgICB9LCBkZXNjKTtcbiAgICB9XG59O1xudmFyIHNpZ25hbCA9IHBob3NwaG9yLmNvcmUuc2lnbmFsO1xudmFyIFNFU1NJT05fU0VSVklDRV9VUkwgPSAnYXBpL3Nlc3Npb25zJztcbi8qKlxuICogR2V0IGEgbG9nZ2VyIHNlc3Npb24gb2JqZWN0cy5cbiAqL1xudmFyIHNlc3Npb25fbG9nID0gTG9nZ2VyLmdldCgnc2Vzc2lvbicpO1xuO1xuO1xuO1xuLyoqXG4gKiBTZXNzaW9uIG9iamVjdCBmb3IgYWNjZXNzaW5nIHRoZSBzZXNzaW9uIFJFU1QgYXBpLiBUaGUgc2Vzc2lvblxuICogc2hvdWxkIGJlIHVzZWQgdG8gc3RhcnQga2VybmVscyBhbmQgdGhlbiBzaHV0IHRoZW0gZG93biAtLSBmb3JcbiAqIGFsbCBvdGhlciBvcGVyYXRpb25zLCB0aGUga2VybmVsIG9iamVjdCBzaG91bGQgYmUgdXNlZC5cbiAqKi9cblxudmFyIE5vdGVib29rU2Vzc2lvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IHNlc3Npb24uXG4gICAgICovXG5cbiAgICBmdW5jdGlvbiBOb3RlYm9va1Nlc3Npb24ob3B0aW9ucykge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTm90ZWJvb2tTZXNzaW9uKTtcblxuICAgICAgICB0aGlzLl9pZCA9IFwidW5rbm93blwiO1xuICAgICAgICB0aGlzLl9ub3RlYm9va1BhdGggPSBcInVua25vd25cIjtcbiAgICAgICAgdGhpcy5fYmFzZVVybCA9IFwidW5rbm93blwiO1xuICAgICAgICB0aGlzLl9zZXNzaW9uVXJsID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRoaXMuX3dzVXJsID0gXCJ1bmtub3duXCI7XG4gICAgICAgIHRoaXMuX2tlcm5lbCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2lkID0gdXRpbHMudXVpZCgpO1xuICAgICAgICB0aGlzLl9ub3RlYm9va1BhdGggPSBvcHRpb25zLm5vdGVib29rUGF0aDtcbiAgICAgICAgdGhpcy5fYmFzZVVybCA9IG9wdGlvbnMuYmFzZVVybDtcbiAgICAgICAgdGhpcy5fd3NVcmwgPSBvcHRpb25zLndzVXJsO1xuICAgICAgICB0aGlzLl9rZXJuZWwgPSBuZXcgX2tlcm5lbC5LZXJuZWwodGhpcy5fYmFzZVVybCwgdGhpcy5fd3NVcmwpO1xuICAgICAgICB0aGlzLl9zZXNzaW9uVXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9iYXNlVXJsLCBTRVNTSU9OX1NFUlZJQ0VfVVJMLCB0aGlzLl9pZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR0VUIC9hcGkvc2Vzc2lvbnNcbiAgICAgKlxuICAgICAqIEdldCBhIGxpc3Qgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbnMuXG4gICAgICovXG5cbiAgICBfY3JlYXRlQ2xhc3MoTm90ZWJvb2tTZXNzaW9uLCBbe1xuICAgICAgICBrZXk6IFwic3RhcnRcIixcblxuICAgICAgICAvKipcbiAgICAgICAgICogUE9TVCAvYXBpL3Nlc3Npb25zXG4gICAgICAgICAqXG4gICAgICAgICAqIFN0YXJ0IGEgbmV3IHNlc3Npb24uIFRoaXMgZnVuY3Rpb24gY2FuIG9ubHkgYmUgc3VjY2Vzc2Z1bGx5IGV4ZWN1dGVkIG9uY2UuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgdXJsID0gdXRpbHMudXJsSm9pbkVuY29kZSh0aGlzLl9iYXNlVXJsLCBTRVNTSU9OX1NFUlZJQ0VfVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh1cmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh0aGlzLl9tb2RlbCksXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVNlc3Npb25JZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIF90aGlzLl9rZXJuZWwuY29ubmVjdChzdWNjZXNzLmRhdGEua2VybmVsKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlU3RhdHVzKCdrZXJuZWxDcmVhdGVkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MuZGF0YTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVTdGF0dXMoJ2tlcm5lbERlYWQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdFVCAvYXBpL3Nlc3Npb25zL1s6c2Vzc2lvbl9pZF1cbiAgICAgICAgICpcbiAgICAgICAgICogR2V0IGluZm9ybWF0aW9uIGFib3V0IGEgc2Vzc2lvbi5cbiAgICAgICAgICovXG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0SW5mb1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0SW5mbygpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hamF4UmVxdWVzdCh0aGlzLl9zZXNzaW9uVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzLnhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVNlc3Npb25JZChzdWNjZXNzLmRhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBERUxFVEUgL2FwaS9zZXNzaW9ucy9bOnNlc3Npb25faWRdXG4gICAgICAgICAqXG4gICAgICAgICAqIEtpbGwgdGhlIGtlcm5lbCBhbmQgc2h1dGRvd24gdGhlIHNlc3Npb24uXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRlbGV0ZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX2RlbGV0ZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9rZXJuZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVTdGF0dXMoJ2tlcm5lbEtpbGxlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2tlcm5lbC5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYWpheFJlcXVlc3QodGhpcy5fc2Vzc2lvblVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJERUxFVEVcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVTZXNzaW9uSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIGlmIChyZWplY3RlZC54aHIuc3RhdHVzID09PSA0MTApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBrZXJuZWwgd2FzIGRlbGV0ZWQgYnV0IHRoZSBzZXNzaW9uIHdhcyBub3QnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IocmVqZWN0ZWQuc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXN0YXJ0IHRoZSBzZXNzaW9uIGJ5IGRlbGV0aW5nIGl0IGFuZCB0aGVuIHN0YXJ0aW5nIGl0IGZyZXNoLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZXN0YXJ0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZXN0YXJ0KG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tcImRlbGV0ZVwiXSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczIuc3RhcnQoKTtcbiAgICAgICAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczIuc3RhcnQoKTtcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubm90ZWJvb2tQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzMi5fbm90ZWJvb2tQYXRoID0gb3B0aW9ucy5ub3RlYm9va1BhdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMua2VybmVsTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczIuX2tlcm5lbC5uYW1lID0gb3B0aW9ucy5rZXJuZWxOYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmFtZSB0aGUgbm90ZWJvb2suXG4gICAgICAgICAqL1xuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlbmFtZU5vdGVib29rXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW5hbWVOb3RlYm9vayhwYXRoKSB7XG4gICAgICAgICAgICB0aGlzLl9ub3RlYm9va1BhdGggPSBwYXRoO1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHRoaXMuX3Nlc3Npb25VcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUEFUQ0hcIixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkodGhpcy5fbW9kZWwpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcy54aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVTZXNzaW9uSWQoc3VjY2Vzcy5kYXRhKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBkYXRhIG1vZGVsIGZvciB0aGUgc2Vzc2lvbiwgd2hpY2ggaW5jbHVkZXMgdGhlIG5vdGVib29rIHBhdGhcbiAgICAgICAgICogYW5kIGtlcm5lbCAobmFtZSBhbmQgaWQpLlxuICAgICAgICAgKi9cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJfaGFuZGxlU3RhdHVzXCIsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZSBhIHNlc3Npb24gc3RhdHVzIGNoYW5nZS5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfaGFuZGxlU3RhdHVzKHN0YXR1cykge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDaGFuZ2VkLmVtaXQoc3RhdHVzKTtcbiAgICAgICAgICAgIHNlc3Npb25fbG9nLmVycm9yKCdTZXNzaW9uOiAnICsgc3RhdHVzICsgJyAoJyArIHRoaXMuX2lkICsgJyknKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImtlcm5lbFwiLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIHNlc3Npb24ga2VybmVsIG9iamVjdC5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fa2VybmVsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiX21vZGVsXCIsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICAgICAgbm90ZWJvb2s6IHsgcGF0aDogdGhpcy5fbm90ZWJvb2tQYXRoIH0sXG4gICAgICAgICAgICAgICAga2VybmVsOiB7IG5hbWU6IHRoaXMuX2tlcm5lbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpZDogdGhpcy5fa2VybmVsLmlkIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcImxpc3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpc3QoYmFzZVVybCkge1xuICAgICAgICAgICAgdmFyIHNlc3Npb25VcmwgPSB1dGlscy51cmxKb2luRW5jb2RlKGJhc2VVcmwsIFNFU1NJT05fU0VSVklDRV9VUkwpO1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFqYXhSZXF1ZXN0KHNlc3Npb25VcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MueGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFN0YXR1czogJyArIHN1Y2Nlc3MueGhyLnN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdWNjZXNzLmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNlc3Npb24gbGlzdCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1Y2Nlc3MuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0ZVNlc3Npb25JZChzdWNjZXNzLmRhdGFbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzcy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gTm90ZWJvb2tTZXNzaW9uO1xufSkoKTtcblxuZXhwb3J0cy5Ob3RlYm9va1Nlc3Npb24gPSBOb3RlYm9va1Nlc3Npb247XG5cbl9fZGVjb3JhdGUoW3NpZ25hbF0sIE5vdGVib29rU2Vzc2lvbi5wcm90b3R5cGUsIFwic3RhdHVzQ2hhbmdlZFwiKTtcbi8qKlxuICogVmFsaWRhdGUgYW4gb2JqZWN0IGFzIGJlaW5nIG9mIElTZXNzaW9uSWQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTZXNzaW9uSWQoaW5mbykge1xuICAgIGlmICghaW5mby5oYXNPd25Qcm9wZXJ0eSgnaWQnKSB8fCAhaW5mby5oYXNPd25Qcm9wZXJ0eSgnbm90ZWJvb2snKSB8fCAhaW5mby5oYXNPd25Qcm9wZXJ0eSgna2VybmVsJykpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2Vzc2lvbiBNb2RlbCcpO1xuICAgIH1cbiAgICAoMCwgX2tlcm5lbC52YWxpZGF0ZUtlcm5lbElkKShpbmZvLmtlcm5lbCk7XG4gICAgaWYgKHR5cGVvZiBpbmZvLmlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTZXNzaW9uIE1vZGVsJyk7XG4gICAgfVxuICAgIHZhbGlkYXRlTm90ZWJvb2tJZChpbmZvLm5vdGVib29rKTtcbn1cbi8qKlxuICogVmFsaWRhdGUgYW4gb2JqZWN0IGFzIGJlaW5nIG9mIElOb3RlYm9va0lkIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTm90ZWJvb2tJZChtb2RlbCkge1xuICAgIGlmICghbW9kZWwuaGFzT3duUHJvcGVydHkoJ3BhdGgnKSB8fCB0eXBlb2YgbW9kZWwucGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgTm90ZWJvb2sgTW9kZWwnKTtcbiAgICB9XG59IiwiLy8gQ29weXJpZ2h0IChjKSBKdXB5dGVyIERldmVsb3BtZW50IFRlYW0uXG4vLyBEaXN0cmlidXRlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1vZGlmaWVkIEJTRCBMaWNlbnNlLlxuLyoqXG4gKiBDb3B5IHRoZSBjb250ZW50cyBvZiBvbmUgb2JqZWN0IHRvIGFub3RoZXIsIHJlY3Vyc2l2ZWx5LlxuICpcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTIzMTcwMDMvc29tZXRoaW5nLWxpa2UtanF1ZXJ5LWV4dGVuZC1idXQtc3RhbmRhbG9uZVxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XG5leHBvcnRzLnV1aWQgPSB1dWlkO1xuZXhwb3J0cy51cmxQYXRoSm9pbiA9IHVybFBhdGhKb2luO1xuZXhwb3J0cy5lbmNvZGVVUklDb21wb25lbnRzID0gZW5jb2RlVVJJQ29tcG9uZW50cztcbmV4cG9ydHMudXJsSm9pbkVuY29kZSA9IHVybEpvaW5FbmNvZGU7XG5leHBvcnRzLmpzb25Ub1F1ZXJ5U3RyaW5nID0ganNvblRvUXVlcnlTdHJpbmc7XG5leHBvcnRzLmFqYXhSZXF1ZXN0ID0gYWpheFJlcXVlc3Q7XG5cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQsIHNvdXJjZSkge1xuICAgIHRhcmdldCA9IHRhcmdldCB8fCB7fTtcbiAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVtwcm9wXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IGV4dGVuZCh0YXJnZXRbcHJvcF0sIHNvdXJjZVtwcm9wXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBHZXQgYSB1dWlkIGFzIGEgc3RyaW5nLlxuICpcbiAqIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XG4gKi9cblxuZnVuY3Rpb24gdXVpZCgpIHtcbiAgICB2YXIgcyA9IFtdO1xuICAgIHZhciBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlBQkNERUZcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICAgICAgc1tpXSA9IGhleERpZ2l0cy5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCkpO1xuICAgIH1cbiAgICBzWzEyXSA9IFwiNFwiOyAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE2XSA9IGhleERpZ2l0cy5jaGFyQXQoTnVtYmVyKHNbMTZdKSAmIDB4MyB8IDB4OCk7IC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gICAgcmV0dXJuIHMuam9pbihcIlwiKTtcbn1cblxuLyoqXG4gKiBKb2luIGEgc2VxdWVuY2Ugb2YgdXJsIGNvbXBvbmVudHMgd2l0aCAnLycuXG4gKi9cblxuZnVuY3Rpb24gdXJsUGF0aEpvaW4oKSB7XG4gICAgdmFyIHVybCA9ICcnO1xuXG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIHBhdGhzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIHBhdGhzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhdGhzW2ldID09PSAnJykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVybC5sZW5ndGggPiAwICYmIHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpICE9ICcvJykge1xuICAgICAgICAgICAgdXJsID0gdXJsICsgJy8nICsgcGF0aHNbaV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwgKyBwYXRoc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoL1xcL1xcLysvLCAnLycpO1xufVxuXG4vKipcbiAqIEVuY29kZSBqdXN0IHRoZSBjb21wb25lbnRzIG9mIGEgbXVsdGktc2VnbWVudCB1cmksXG4gKiBsZWF2aW5nICcvJyBzZXBhcmF0b3JzLlxuICovXG5cbmZ1bmN0aW9uIGVuY29kZVVSSUNvbXBvbmVudHModXJpKSB7XG4gICAgcmV0dXJuIHVyaS5zcGxpdCgnLycpLm1hcChlbmNvZGVVUklDb21wb25lbnQpLmpvaW4oJy8nKTtcbn1cblxuLyoqXG4gKiBKb2luIGEgc2VxdWVuY2Ugb2YgdXJsIGNvbXBvbmVudHMgd2l0aCAnLycsXG4gKiBlbmNvZGluZyBlYWNoIGNvbXBvbmVudCB3aXRoIGVuY29kZVVSSUNvbXBvbmVudC5cbiAqL1xuXG5mdW5jdGlvbiB1cmxKb2luRW5jb2RlKCkge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50cyh1cmxQYXRoSm9pbi5hcHBseShudWxsLCBhcmdzKSk7XG59XG5cbi8qKlxuICogUHJvcGVybHkgZGV0ZWN0IHRoZSBjdXJyZW50IGJyb3dzZXIuXG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0MDA5MzUvYnJvd3Nlci1kZXRlY3Rpb24taW4tamF2YXNjcmlwdFxuICovXG52YXIgYnJvd3NlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIG5hdmlnYXRvciB1bmRlZmluZWQgaW4gbm9kZVxuICAgICAgICByZXR1cm4gWydOb25lJ107XG4gICAgfVxuICAgIHZhciBOID0gbmF2aWdhdG9yLmFwcE5hbWU7XG4gICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICB2YXIgdGVtO1xuICAgIHZhciBNID0gdWEubWF0Y2goLyhvcGVyYXxjaHJvbWV8c2FmYXJpfGZpcmVmb3h8bXNpZSlcXC8/XFxzKihcXC4/XFxkKyhcXC5cXGQrKSopL2kpO1xuICAgIGlmIChNICYmICh0ZW0gPSB1YS5tYXRjaCgvdmVyc2lvblxcLyhbXFwuXFxkXSspL2kpKSAhPT0gbnVsbCkgTVsyXSA9IHRlbVsxXTtcbiAgICBNID0gTSA/IFtNWzFdLCBNWzJdXSA6IFtOLCBuYXZpZ2F0b3IuYXBwVmVyc2lvbiwgJy0/J107XG4gICAgcmV0dXJuIE07XG59KSgpO1xuZXhwb3J0cy5icm93c2VyID0gYnJvd3Nlcjtcbi8qKlxuICogUmV0dXJuIGEgc2VyaWFsaXplZCBvYmplY3Qgc3RyaW5nIHN1aXRhYmxlIGZvciBhIHF1ZXJ5LlxuICpcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzMwNzA3NDIzXG4gKi9cblxuZnVuY3Rpb24ganNvblRvUXVlcnlTdHJpbmcoanNvbikge1xuICAgIHJldHVybiAnPycgKyBPYmplY3Qua2V5cyhqc29uKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoanNvbltrZXldKTtcbiAgICB9KS5qb2luKCcmJyk7XG59XG5cbi8qKlxuICogQXN5bmNocm9ub3VzIFhNTEhUVFBSZXF1ZXN0IGhhbmRsZXIuXG4gKlxuICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvZXM2L3Byb21pc2VzLyN0b2MtcHJvbWlzaWZ5aW5nLXhtbGh0dHByZXF1ZXN0XG4gKi9cblxuZnVuY3Rpb24gYWpheFJlcXVlc3QodXJsLCBzZXR0aW5ncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgcmVxLm9wZW4oc2V0dGluZ3MubWV0aG9kLCB1cmwpO1xuICAgICAgICBpZiAoc2V0dGluZ3MuY29udGVudFR5cGUpIHtcbiAgICAgICAgICAgIHJlcS5vdmVycmlkZU1pbWVUeXBlKHNldHRpbmdzLmNvbnRlbnRUeXBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcmVxLnJlc3BvbnNlO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzLmRhdGFUeXBlID09PSAnanNvbicpIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVxLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoeyBkYXRhOiByZXNwb25zZSwgc3RhdHVzVGV4dDogcmVxLnN0YXR1c1RleHQsIHhocjogcmVxIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdCh7IHhocjogcmVxLCBzdGF0dXNUZXh0OiByZXEuc3RhdHVzVGV4dCwgZXJyb3I6IGVyciB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHNldHRpbmdzLmRhdGEpIHtcbiAgICAgICAgICAgIHJlcS5zZW5kKHNldHRpbmdzLmRhdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxLnNlbmQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSJdfQ==
