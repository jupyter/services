// Type definitions for mock-socket.js
// Project: https://github.com/thoov/mock-socket

declare var MockWebSocket: any;


interface MockServer {
    send: (value: string) => void;
    on: (name: string, callback: () => void) => void;
}

interface MockServerConstructor {
    new (wsUrl: string): MockServer;
    prototype: MockServer;
}

declare var MockServer: MockServerConstructor;
