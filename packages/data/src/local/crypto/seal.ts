// @repo/data — level 1.
// XChaCha20-Poly1305 seal/open, the AEAD primitive behind the operations journal's per-entry
// frames and the single-block file seals (start-roadmap.md §9: "authenticated encryption
// library in JavaScript, embedded in the core"). A fresh cipher instance is created per call —
// @noble/ciphers refuses to encrypt twice with the same key+nonce pair, which is also why every
// journal entry uses a freshly random nonce (RandomService.bytes(24)), never a counter.

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

export const SEAL_NONCE_LENGTH = 24;
export const SEAL_TAG_LENGTH = 16;

export function seal(key: Uint8Array, nonce: Uint8Array, aad: Uint8Array, plaintext: Uint8Array): Uint8Array {
  return xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
}

/** Returns `null` on any authentication failure (tampered ciphertext, wrong key, or wrong AAD) rather than throwing. */
export function open(key: Uint8Array, nonce: Uint8Array, aad: Uint8Array, ciphertext: Uint8Array): Uint8Array | null {
  try {
    return xchacha20poly1305(key, nonce, aad).decrypt(ciphertext);
  } catch {
    return null;
  }
}
