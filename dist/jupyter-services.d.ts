declare module jupyter.services.serialize {
    import IKernelMsg = services.IKernelMsg;
    /**
     * Deserialize and return the unpacked message.
     */
    function deserialize(data: ArrayBuffer | string): IKernelMsg;
    /**
     * Serialize a kernel message for transport.
     */
    function serialize(msg: IKernelMsg): string | ArrayBuffer;
}

declare module jupyter.services {
    import ISignal = phosphor.core.ISignal;
    import IDisposable = phosphor.utility.IDisposable;
    /**
     * Kernel message header content.
     */
    interface IKernelMsgHeader {
        username: string;
        version: string;
        session: string;
        msgId: string;
        msgType: string;
    }
    /**
     * Kernel message specification.
     */
    interface IKernelMsg {
        header: IKernelMsgHeader;
        metadata: any;
        content: any;
        parentHeader: {} | IKernelMsgHeader;
        msgId?: string;
        msgType?: string;
        channel?: string;
        buffers?: string[] | ArrayBuffer[];
    }
    /**
     * Settings for a kernel execute command.
     */
    interface IKernelExecute {
        silent?: boolean;
        user_expressions?: any;
        allow_stdin?: boolean;
        store_history?: boolean;
    }
    /**
     * Kernel identification specification.
     */
    interface IKernelId {
        id: string;
        name: string;
    }
    /**
     * Kernel information specification.
     * http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info
     */
    interface IKernelInfo {
        protocol_version: string;
        implementation: string;
        implementation_version: string;
        language_info: IKernelLanguageInfo;
        banner: string;
        help_links: {
            [key: string]: string;
        };
    }
    /**
     * Kernel language information specification.
     */
    interface IKernelLanguageInfo {
        name: string;
        version: string;
        mimetype: string;
        file_extension: string;
        pygments_lexer: string;
        codemirror_mode: string | {};
        nbconverter_exporter: string;
    }
    /**
     * Object providing a Future interface for message callbacks.
     *
     * Only one callback can be registered per type.
     * If `autoDispose` is set, the future will self-dispose after `isDone` is
     * set and the registered `onDone` handler is called.
     *
     * The Future is considered done when a `reply` message and a
     * an `idle` iopub status message have been received.
     */
    interface IKernelFuture extends IDisposable {
        /**
         * The autoDispose behavior of the future.
         *
         * If True, it will self-dispose() after onDone() is called.
         */
        autoDispose: boolean;
        /**
         * Set when the message is done.
         */
        isDone: boolean;
        /**
         * Register a reply handler. Returns `this`.
         */
        onReply(cb: (msg: IKernelMsg) => void): IKernelFuture;
        /**
         * Register an output handler. Returns `this`.
         */
        onOutput(cb: (msg: IKernelMsg) => void): IKernelFuture;
        /**
         * Register a done handler. Returns `this`.
         */
        onDone(cb: (msg: IKernelMsg) => void): IKernelFuture;
        /**
         * Register an input handler. Returns `this`.
         */
        onInput(cb: (msg: IKernelMsg) => void): IKernelFuture;
    }
    /**
     * A class to communicate with the Python kernel. This
     * should generally not be constructed directly, but be created
     * by the `Session` object. Once created, this object should be
     * used to communicate with the kernel.
     */
    class Kernel {
        /**
         * A signal emitted when the kernel changes state.
         */
        statusChanged: ISignal<string>;
        /**
         * GET /api/kernels
         *
         * Get the list of running kernels.
         */
        static list(baseUrl: string): Promise<IKernelId[]>;
        /**
         * Construct a new kernel.
         */
        constructor(baseUrl: string, wsUrl: string);
        /**
         * Get the name of the kernel.
         */
        /**
         * Set the name of the kernel.
         */
        name: string;
        /**
         * Check whether there is a connection to the kernel. This
         * function only returns true if websocket has been
         * created and has a state of WebSocket.OPEN.
         */
        isConnected: boolean;
        /**
         * Check whether the connection to the kernel has been completely
         * severed. This function only returns true if the websocket is null.
         */
        isFullyDisconnected: boolean;
        /**
         * Get the Info Reply Message from the kernel.
         */
        infoReply: IKernelInfo;
        /**
         * Get the current status of the kernel.
         */
        status: string;
        /**
         * Get the current id of the kernel.
         */
        /**
         * Set the current id of the kernel.
         */
        id: string;
        /**
         * Get the full websocket url.
         */
        wsUrl: string;
        /**
         * GET /api/kernels/[:kernel_id]
         *
         * Get information about the kernel.
         */
        getInfo(): Promise<IKernelId>;
        /**
         * POST /api/kernels/[:kernel_id]/interrupt
         *
         * Interrupt the kernel.
         */
        interrupt(): Promise<void>;
        /**
         * POST /api/kernels/[:kernel_id]/restart
         *
         * Restart the kernel.
         */
        restart(): Promise<IKernelId>;
        /**
         * POST /api/kernels/[:kernel_id]
         *
         * Start a kernel.  Note: if using a session, Session.start()
         * should be used instead.
         */
        start(id?: IKernelId): Promise<IKernelId>;
        /**
         * DELETE /api/kernels/[:kernel_id]
         *
         * Kill a kernel. Note: if useing a session, Session.delete()
         * should be used instead.
         */
        delete(): Promise<void>;
        /**
         * Connect to the server-side the kernel.
         *
         * This should only be called directly by a session.
         */
        connect(id?: IKernelId): void;
        /**
         * Reconnect to a disconnected kernel. This is not actually a
         * standard HTTP request, but useful function nonetheless for
         * reconnecting to the kernel if the connection is somehow lost.
         */
        reconnect(): void;
        /**
         * Disconnect the kernel.
         */
        disconnect(): void;
        /**
         * Send a message on the kernel's shell channel.
         */
        sendShellMessage(msg_type: string, content: any, metadata?: {}, buffers?: string[]): IKernelFuture;
        /**
         * Get kernel info.
         *
         * Returns a KernelFuture that will resolve to a `kernel_info_reply` message documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#kernel-info)
         */
        kernelInfo(): IKernelFuture;
        /**
         * Get info on an object.
         *
         * Returns a KernelFuture that will resolve to a `inspect_reply` message documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#object-information)
         */
        inspect(code: string, cursor_pos: number): IKernelFuture;
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
        execute(code: string, options?: IKernelExecute): IKernelFuture;
        /**
         * Request a code completion from the kernel.
         *
         * Returns a KernelFuture with will resolve to a `complete_reply` documented
         * [here](http://ipython.org/ipython-doc/dev/development/messaging.html#complete)
         */
        complete(code: string, cursor_pos: number): IKernelFuture;
        /**
         * Send an input reply message to the kernel.
         *
         * TODO: how to handle this?  Right now called by
         * ./static/notebook/js/outputarea.js:827:
         * this.events.trigger('send_input_reply.Kernel', value);
         *
         * which has no reference to the session or the kernel
         */
        sendInputReply(input: any): string;
        /**
         * Create a kernel message given input attributes.
         */
        private _createMsg(msg_type, content, metadata?, buffers?);
        /**
         * Handle a kernel status change message.
         */
        private _handleStatus(status);
        /**
         * Handle a failed AJAX request by logging the error message, and throwing
         * another error.
         */
        private _onError(error);
        /**
         * Start the Websocket channels.
         * Will stop and restart them if they already exist.
         */
        private _startChannels();
        /**
         * Clear the websocket if necessary.
         */
        private _clearSocket();
        /**
         * Perform necessary tasks once the connection to the kernel has
         * been established. This includes requesting information about
         * the kernel.
         */
        private _kernelConnected();
        /**
         * Perform necessary tasks after the kernel has died. This closes
         * communication channels to the kernel if they are still somehow
         * open.
         */
        private _kernelDead();
        /**
         * Handle a websocket entering the open state,
         * signaling that the kernel is connected when websocket is open.
         */
        private _wsOpened(evt);
        /**
         * Handle a websocket entering the closed state.  If the websocket
         * was not closed due to an error, try to reconnect to the kernel.
         *
         * @param {string} ws_url - the websocket url
         * @param {bool} error - whether the connection was closed due to an error
         */
        private _wsClosed(ws_url, error);
        /**
         * Function to call when kernel connection is lost.
         * schedules reconnect, or fires 'connection_dead' if reconnect limit is hit.
         */
        private _scheduleReconnect();
        /**
         * Handle an incoming Websocket message.
         */
        private _handleWSMessage(e);
        /**
         * Handle status iopub messages from the kernel.
         */
        private _handleStatusMessage(msg);
        private _id;
        private _name;
        private _baseUrl;
        private _kernelUrl;
        private _wsUrl;
        private _username;
        private _staticId;
        private _ws;
        private _infoReply;
        private _reconnectLimit;
        private _autorestartAttempt;
        private _reconnectAttempt;
        private _handlerMap;
        private _iopubHandlers;
        private _status;
    }
    /**
     * Validate an object as being of IKernelID type
     */
    function validateKernelId(info: IKernelId): void;
}

declare module jupyter.services {
    import ISignal = phosphor.core.ISignal;
    /**
     * Notebook Identification specification.
     */
    interface INotebookId {
        path: string;
    }
    /**
     * Session Identification specification.
     */
    interface ISessionId {
        id: string;
        notebook: INotebookId;
        kernel: IKernelId;
    }
    /**
     * Session initialization options.
     */
    interface ISessionOptions {
        notebookPath: string;
        kernelName: string;
        baseUrl: string;
        wsUrl: string;
    }
    /**
     * Session object for accessing the session REST api. The session
     * should be used to start kernels and then shut them down -- for
     * all other operations, the kernel object should be used.
     **/
    class NotebookSession {
        /**
         * A signal emitted when the session changes state.
         */
        statusChanged: ISignal<string>;
        /**
         * GET /api/sessions
         *
         * Get a list of the current sessions.
         */
        static list(baseUrl: string): Promise<ISessionId[]>;
        /**
         * Construct a new session.
         */
        constructor(options: ISessionOptions);
        /**
         * Get the session kernel object.
        */
        kernel: Kernel;
        /**
         * POST /api/sessions
         *
         * Start a new session. This function can only be successfully executed once.
         */
        start(): Promise<ISessionId>;
        /**
         * GET /api/sessions/[:session_id]
         *
         * Get information about a session.
         */
        getInfo(): Promise<ISessionId>;
        /**
         * DELETE /api/sessions/[:session_id]
         *
         * Kill the kernel and shutdown the session.
         */
        delete(): Promise<void>;
        /**
         * Restart the session by deleting it and then starting it fresh.
         */
        restart(options?: ISessionOptions): Promise<void>;
        /**
         * Rename the notebook.
         */
        renameNotebook(path: string): Promise<ISessionId>;
        /**
         * Get the data model for the session, which includes the notebook path
         * and kernel (name and id).
         */
        private _model;
        /**
         * Handle a session status change.
         */
        private _handleStatus(status);
        private _id;
        private _notebookPath;
        private _baseUrl;
        private _sessionUrl;
        private _wsUrl;
        private _kernel;
    }
}

declare module jupyter.services.utils {
    /**
     * Copy the contents of one object to another, recursively.
     *
     * http://stackoverflow.com/questions/12317003/something-like-jquery-extend-but-standalone
     */
    function extend(target: any, source: any): any;
    /**
     * Get a uuid as a string.
     *
     * http://www.ietf.org/rfc/rfc4122.txt
     */
    function uuid(): string;
    /**
     * Join a sequence of url components with '/'.
     */
    function urlPathJoin(...paths: string[]): string;
    /**
     * Encode just the components of a multi-segment uri,
     * leaving '/' separators.
     */
    function encodeURIComponents(uri: string): string;
    /**
     * Join a sequence of url components with '/',
     * encoding each component with encodeURIComponent.
     */
    function urlJoinEncode(...args: string[]): string;
    /**
     * Properly detect the current browser.
     * http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
     */
    var browser: string[];
    /**
     * Return a serialized object string suitable for a query.
     *
     * http://stackoverflow.com/a/30707423
     */
    function jsonToQueryString(json: any): string;
    /**
     * Input settings for an AJAX request.
     */
    interface IAjaxSetttings {
        method: string;
        dataType: string;
        contentType?: string;
        data?: any;
    }
    /**
     * Success handler for AJAX request.
     */
    interface IAjaxSuccess {
        data: any;
        statusText: string;
        xhr: XMLHttpRequest;
    }
    /**
     * Error handler for AJAX request.
     */
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
    function ajaxRequest(url: string, settings: IAjaxSetttings): Promise<any>;
}
