// @repo/data — level 1.

import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64';

describe('base64', () => {
  it('round-trips 16 arbitrary bytes (a salt-sized buffer)', () => {
    const bytes = Uint8Array.from({ length: 16 }, (_unused, index) => (index * 37) % 256);

    expect(decodeBase64(encodeBase64(bytes))).toEqual(bytes);
  });

  it('round-trips lengths that need one and two padding characters', () => {
    expect(decodeBase64(encodeBase64(Uint8Array.from([1])))).toEqual(Uint8Array.from([1]));
    expect(decodeBase64(encodeBase64(Uint8Array.from([1, 2])))).toEqual(Uint8Array.from([1, 2]));
    expect(decodeBase64(encodeBase64(Uint8Array.from([1, 2, 3])))).toEqual(Uint8Array.from([1, 2, 3]));
  });

  it('round-trips an empty buffer', () => {
    expect(decodeBase64(encodeBase64(new Uint8Array(0)))).toEqual(new Uint8Array(0));
  });

  it('matches a known encoding', () => {
    const bytes = new TextEncoder().encode('hello');
    expect(encodeBase64(bytes)).toBe('aGVsbG8=');
  });
});
