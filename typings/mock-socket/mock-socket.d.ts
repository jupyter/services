// Type definitions for mock-socket v.3.0.1
// Project: https://github.com/thoov/mock-socket
// Definitions by: Steven Silvester <https://github.com/blink1073>


declare module MockWebSocket {

  class WebSocket extends EventTarget {
    constructor(url: string, protocol?: string);
    server: Server;
    binarytype: string;
    url: string;
    readyState: number;
    protocol: string;
    onopen: (event: Event) => void;
    omessage: (event: MessageEvent) => void;
    onclose: (event: CloseEvent) => void;
    onerror: (event: ErrorEvent) => void;
    send(data: any): void;
    close(): void;
  }

  class Server extends EventTarget {
    constructor(url: string);
    start(): void;
    stop(): void;
    on(type: string, callback: (event: Event) => void): void;
    send(data: any, options?: any): void;
    emit(event: Event, data: any, options?: any): void;
    close(options?: any): void;
    clients(): WebSocket[];
  }
}


declare module 'mock-socket' {
  export = MockWebSocket;
}
