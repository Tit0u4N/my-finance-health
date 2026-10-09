import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64, toHex } from './base64';

describe('base64', () => {
  it('round-trips arbitrary bytes, including ones that are not valid UTF-8', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(decodeBase64(encodeBase64(bytes))).toEqual(bytes);
  });

  it('decodes a standard padded value', () => {
    expect(decodeBase64('c29tZXNhbHQ=')).toEqual(Uint8Array.from('somesalt', (char) => char.charCodeAt(0)));
  });

  it('writes lowercase, zero-padded hex', () => {
    expect(toHex(new Uint8Array([0, 15, 16, 255]))).toBe('000f10ff');
  });
});
