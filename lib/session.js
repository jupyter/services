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