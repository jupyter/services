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