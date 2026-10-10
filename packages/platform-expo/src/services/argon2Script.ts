// @repo/platform-expo — level 1.
// Argon2id in pure JS (@noble/hashes): correct on every runtime, but far too slow on a phone's JS
// engine for the 64 MiB cost — the app injects a native engine and keeps this one as the fallback.

import { argon2idAsync } from '@noble/hashes/argon2.js';
import type { SqlKeyDerivation } from '@repo/platform/services/sqlDriver';

export type DeriveKey = (secret: string, salt: Uint8Array, cost: SqlKeyCost, length: number) => Promise<Uint8Array>;
type SqlKeyCost = Pick<SqlKeyDerivation, 'memoryKiB' | 'iterations' | 'parallelism'>;

export const deriveInScript: DeriveKey = (secret, salt, cost, length) =>
  argon2idAsync(secret, salt, { m: cost.memoryKiB, t: cost.iterations, p: cost.parallelism, dkLen: length });
