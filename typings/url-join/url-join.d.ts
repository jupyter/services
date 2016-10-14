// Type definitions for url-join v1.1.0
// Project: https://github.com/jfromaniello/url-join
// Definitions by: Steven Silvester <https://github.com/blink1073>

// We use the hack mentioned in https://github.com/Microsoft/TypeScript/issues/5073
// to enable `import * as urljoin from 'url-join';`

declare module 'url-join' {
  function urljoin(...parts: string[]): string;
  namespace urljoin { }
  export = urljoin;
}

