// @repo/data — level 1.
// A hand-rolled base64 codec rather than a dependency or a runtime global (`btoa`/`atob` are
// DOM/WebView-only and this package's tsconfig has no DOM lib; `Buffer` is Node-only) — the same
// "prefer no dependency" convention `sortableId.ts` follows for its base32. Used only to store
// the two Argon2id salts as text inside the cleartext `.mfhmeta` descriptor (workspaceMeta.ts).

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const byte0 = bytes[index] as number;
    const byte1 = bytes[index + 1];
    const byte2 = bytes[index + 2];

    output += ALPHABET[byte0 >> 2];
    output += ALPHABET[((byte0 & 0b11) << 4) | (byte1 === undefined ? 0 : byte1 >> 4)];
    output += byte1 === undefined ? '=' : ALPHABET[((byte1 & 0b1111) << 2) | (byte2 === undefined ? 0 : byte2 >> 6)];
    output += byte2 === undefined ? '=' : ALPHABET[byte2 & 0b111111];
  }
  return output;
}

export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (const char of clean) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`decodeBase64: invalid character "${char}"`);
    }
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}
