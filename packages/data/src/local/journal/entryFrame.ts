// @repo/data — level 1.
// One journal entry's on-disk frame: a length prefix, a random nonce, and an XChaCha20-Poly1305
// sealed payload (start-roadmap.md §9's rules: length-prefixed and individually sealed so a
// truncated tail is detectable and discardable, and chained via the sequence number and the
// previous entry's hash in the authenticated data so deletion, reordering, or truncation of the
// journal is never invisible).

import { sha256 } from '@noble/hashes/sha2.js';
import { open, SEAL_NONCE_LENGTH, SEAL_TAG_LENGTH, seal } from '../crypto/seal';

export const LENGTH_PREFIX_BYTES = 4;
export const ZERO_HASH: Uint8Array = new Uint8Array(32);

function buildAad(header: Uint8Array, sequence: number, prevEntryHash: Uint8Array): Uint8Array {
  const aad = new Uint8Array(header.byteLength + 8 + prevEntryHash.byteLength);
  aad.set(header, 0);
  new DataView(aad.buffer).setBigUint64(header.byteLength, BigInt(sequence), true);
  aad.set(prevEntryHash, header.byteLength + 8);
  return aad;
}

export type EncodeEntryFrameInput = {
  readonly key: Uint8Array;
  /** 24 random bytes, fresh for every entry — never a counter, since @noble/ciphers refuses to reuse a key+nonce pair. */
  readonly nonce: Uint8Array;
  readonly plaintext: Uint8Array;
  /** The 110-byte cleartext segment header this entry belongs to; part of the AAD. */
  readonly header: Uint8Array;
  readonly sequence: number;
  readonly prevEntryHash: Uint8Array;
};

export function encodeEntryFrame(input: EncodeEntryFrameInput): Uint8Array {
  const aad = buildAad(input.header, input.sequence, input.prevEntryHash);
  const ciphertext = seal(input.key, input.nonce, aad, input.plaintext);
  const frame = new Uint8Array(LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH + ciphertext.byteLength);
  new DataView(frame.buffer).setUint32(0, SEAL_NONCE_LENGTH + ciphertext.byteLength, true);
  frame.set(input.nonce, LENGTH_PREFIX_BYTES);
  frame.set(ciphertext, LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH);
  return frame;
}

export type DecodeEntryFrameInput = {
  readonly key: Uint8Array;
  /** Exactly one frame's bytes, length prefix included. */
  readonly frame: Uint8Array;
  readonly header: Uint8Array;
  readonly sequence: number;
  readonly prevEntryHash: Uint8Array;
};

/** Returns `null` when the frame fails authentication — tampering, corruption, or a wrong key — rather than throwing. */
export function decodeEntryFrame(input: DecodeEntryFrameInput): Uint8Array | null {
  if (input.frame.byteLength < LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH + SEAL_TAG_LENGTH) {
    return null;
  }
  const nonce = input.frame.slice(LENGTH_PREFIX_BYTES, LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH);
  const ciphertext = input.frame.slice(LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH);
  const aad = buildAad(input.header, input.sequence, input.prevEntryHash);
  return open(input.key, nonce, aad, ciphertext);
}

/** Reads a frame's declared total length (prefix included) from its first 4 bytes. */
export function readDeclaredFrameLength(bytes: Uint8Array, offset: number): number {
  return (
    LENGTH_PREFIX_BYTES + new DataView(bytes.buffer, bytes.byteOffset + offset, LENGTH_PREFIX_BYTES).getUint32(0, true)
  );
}

/** SHA-256 of a complete frame's bytes — the chaining hash the *next* entry's AAD carries. */
export function hashFrame(frame: Uint8Array): Uint8Array {
  return sha256(frame);
}
