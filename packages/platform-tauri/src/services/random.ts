// @repo/platform-tauri — level 1.
// RandomService (@repo/platform/services/random) on the Web Crypto API — a real Tauri window has
// a working `crypto`, so this needs no native plugin. The DOM `Crypto` type is spelled out
// locally rather than named, since this package's tsconfig has no DOM lib; the caller passes
// `window.crypto` in.

import type { RandomService } from '@repo/platform/services/random';

export type WebCryptoLike = {
  randomUUID(): string;
  // Narrowed to `Uint8Array<ArrayBuffer>` (what `new Uint8Array(length)` actually produces)
  // rather than a generic `<T extends ArrayBufferView>` or the wider `Uint8Array<ArrayBufferLike>`
  // default — DOM's own `Crypto.getRandomValues` bounds its generic to `ArrayBufferView<ArrayBuffer>`
  // (excluding a SharedArrayBuffer-backed view), and a broader parameter type here would make the
  // real `window.crypto` structurally fail to satisfy this interface.
  getRandomValues(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
};

export function createWebCryptoRandom(crypto: WebCryptoLike): RandomService {
  return {
    uuid: () => crypto.randomUUID(),
    bytes: (length) => crypto.getRandomValues(new Uint8Array(length)),
  };
}
