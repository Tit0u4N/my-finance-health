// @repo/platform-tauri — level 1.

import { describe, expect, it } from 'vitest';
import { createWebCryptoRandom, type WebCryptoLike } from './random';

function createFakeCrypto(): WebCryptoLike {
  let counter = 0;
  return {
    randomUUID: () => {
      counter += 1;
      return `fake-uuid-${counter}`;
    },
    getRandomValues: (array: Uint8Array<ArrayBuffer>) => {
      for (let index = 0; index < array.length; index += 1) {
        array[index] = index % 256;
      }
      return array;
    },
  };
}

describe('createWebCryptoRandom', () => {
  it('delegates uuid to crypto.randomUUID', () => {
    const random = createWebCryptoRandom(createFakeCrypto());

    expect(random.uuid()).toBe('fake-uuid-1');
  });

  it('fills the requested number of bytes via crypto.getRandomValues', () => {
    const random = createWebCryptoRandom(createFakeCrypto());

    const bytes = random.bytes(4);

    expect(bytes).toEqual(new Uint8Array([0, 1, 2, 3]));
  });
});
