// @repo/data — level 1.
// Argon2id derivation of the journal/file encryption key (start-roadmap.md §9: "the journal and
// file key lives in the core", "derived separately from the database key, from the same
// original secret"). The database key is derived by the platform-tauri adapter, in Rust, from a
// different salt (packages/platform/src/services/sqlDriver.ts's SqlKeyDerivation) — this
// derivation never produces that key and the two are not related by any computation, so neither
// key gives access to the other.

import { argon2idAsync } from '@noble/hashes/argon2.js';

export type KdfSpec = {
  readonly salt: Uint8Array;
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
};

export const JOURNAL_KEY_LENGTH = 32;

// Async variant: output is identical to the sync `argon2id`, but it yields to the event loop
// between blocks — on a phone's JS thread the 64 MiB derivation would otherwise freeze the UI.
export function deriveJournalKey(secret: string, spec: KdfSpec): Promise<Uint8Array> {
  return argon2idAsync(secret, spec.salt, {
    m: spec.memoryKiB,
    t: spec.iterations,
    p: spec.parallelism,
    dkLen: JOURNAL_KEY_LENGTH,
  });
}
