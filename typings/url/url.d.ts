// Type definitions for node-url v0.11.0
// Project: https://github.com/defunctzombie/node-url
// Definitions by: Steven Silvester <https://github.com/blink1073>


declare module 'url' {
  export
  function parse(urlStr: string, parseQueryString?: boolean, slashesDenoteHost?: boolean): IUrlObject;

  export
  function format(urlObj: IUrlObject): string;

  export
  function resolve(from: string, to: string): string;

  export
  interface IUrlObject {
    href: string;
    protocol: string;
    slashes: boolean;
    host: string;
    auth: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    path: string;
    query: string;
    hash: string;
  }
}

