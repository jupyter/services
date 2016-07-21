// Type definitions for MockHttpRequest v.1.0.0
// Project: https://github.com/philikon/MockHttpRequest
// Definitions by: Steven Silvester <https://github.com/blink1073>


declare module MockXHR {

  class request extends XMLHttpRequest {
    constructor();
    data: string;
    getRequestHeader(value: string): string;
    setResponseHeader(header: string, value: string): void;
    receive(status: number, data: string): void;
    err(value: Error): void;
    authenticate(user: string, password: string): boolean;
  }

  class server {
    constructor(handler: (value: request) => void);
    start(): void;
    stop(): void;
    handle(value: request): void;
  }
}

declare module 'mock-xhr' {
  export = MockXHR;
}
