import { describe, expect, it } from 'vitest';
import { open, SEAL_NONCE_LENGTH, SEAL_TAG_LENGTH, seal } from './seal';

const KEY = new Uint8Array(32).fill(7);
const NONCE = new Uint8Array(SEAL_NONCE_LENGTH).fill(1);
const AAD = new TextEncoder().encode('sequence:0|prev:0000');
const PLAINTEXT = new TextEncoder().encode('{"v":1,"ops":[]}');

describe('seal / open', () => {
  it('round-trips: open(seal(x)) === x', () => {
    const ciphertext = seal(KEY, NONCE, AAD, PLAINTEXT);
    expect(ciphertext.byteLength).toBe(PLAINTEXT.byteLength + SEAL_TAG_LENGTH);
    expect(open(KEY, NONCE, AAD, ciphertext)).toEqual(PLAINTEXT);
  });

  it('fails to open when a ciphertext byte is flipped', () => {
    const ciphertext = seal(KEY, NONCE, AAD, PLAINTEXT);
    const tampered = new Uint8Array(ciphertext);
    tampered[0] = (tampered[0] ?? 0) ^ 0xff;
    expect(open(KEY, NONCE, AAD, tampered)).toBeNull();
  });

  it('fails to open when the AAD does not match', () => {
    const ciphertext = seal(KEY, NONCE, AAD, PLAINTEXT);
    const wrongAad = new TextEncoder().encode('sequence:1|prev:0000');
    expect(open(KEY, NONCE, wrongAad, ciphertext)).toBeNull();
  });

  it('fails to open with the wrong key', () => {
    const ciphertext = seal(KEY, NONCE, AAD, PLAINTEXT);
    const wrongKey = new Uint8Array(32).fill(9);
    expect(open(wrongKey, NONCE, AAD, ciphertext)).toBeNull();
  });

  it('fails to open with the wrong nonce', () => {
    const ciphertext = seal(KEY, NONCE, AAD, PLAINTEXT);
    const wrongNonce = new Uint8Array(SEAL_NONCE_LENGTH).fill(2);
    expect(open(KEY, wrongNonce, AAD, ciphertext)).toBeNull();
  });
});
