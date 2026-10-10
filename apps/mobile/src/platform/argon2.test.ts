// The native engine isn't reachable from Node, so it is stood in for by @noble's sync Argon2 —
// what is pinned here is the parameter mapping, the one-time self-check and the fallback, not
// OpenSSL itself.

import { deriveInScript } from '@repo/platform-expo/services/argon2Script';
import { afterEach, describe, expect, it, vi } from 'vitest';

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

type Params = {
  message: string;
  nonce: Uint8Array;
  parallelism: number;
  tagLength: number;
  memory: number;
  passes: number;
  version: number;
};

const reference = (
  secret: string,
  salt: Uint8Array,
  memoryKiB: number,
  iterations: number,
  parallelism: number,
  length: number,
) => deriveInScript(secret, salt, { memoryKiB, iterations, parallelism }, length);

const nativeCalls: Params[] = [];
let nativeBehaviour: 'correct' | 'wrong' | 'throws' = 'correct';

vi.mock('react-native-quick-crypto', () => ({
  argon2: (_algorithm: string, params: Params, callback: (error: Error | null, result: Uint8Array) => void) => {
    nativeCalls.push(params);
    if (nativeBehaviour === 'throws') {
      callback(new Error('native module unavailable'), new Uint8Array());
      return;
    }
    void reference(
      params.message,
      params.nonce,
      params.memory,
      params.passes,
      params.parallelism,
      params.tagLength,
    ).then((bytes) => callback(null, nativeBehaviour === 'wrong' ? bytes.map((byte) => byte ^ 1) : bytes));
  },
}));

const SALT = Uint8Array.from('somesalt', (char) => char.charCodeAt(0));
const COST = { memoryKiB: 65_536, iterations: 2, parallelism: 1 };

function freshModule() {
  vi.resetModules();
  nativeCalls.length = 0;
  return import('./argon2');
}

afterEach(() => {
  nativeBehaviour = 'correct';
});

describe('deriveArgon2id', () => {
  it('derives through the native engine with v1.3 and the descriptor cost', async () => {
    const { deriveArgon2id } = await freshModule();
    const key = await deriveArgon2id('password', SALT, COST, 32);

    expect(toHex(key)).toBe(toHex(await reference('password', SALT, 65_536, 2, 1, 32)));
    const real = nativeCalls.at(-1);
    expect(real).toMatchObject({ memory: 65_536, passes: 2, parallelism: 1, tagLength: 32, version: 0x13 });
  });

  it('checks the native engine once, not on every derivation', async () => {
    const { deriveArgon2id } = await freshModule();
    await deriveArgon2id('password', SALT, { memoryKiB: 64, iterations: 1, parallelism: 1 }, 32);
    await deriveArgon2id('password', SALT, { memoryKiB: 64, iterations: 1, parallelism: 1 }, 32);

    // 1 self-check + 2 real derivations
    expect(nativeCalls).toHaveLength(3);
  });

  it('falls back to the JS engine when the native one disagrees with it', async () => {
    nativeBehaviour = 'wrong';
    const { deriveArgon2id } = await freshModule();
    const key = await deriveArgon2id('password', SALT, { memoryKiB: 64, iterations: 1, parallelism: 1 }, 32);

    expect(toHex(key)).toBe(toHex(await reference('password', SALT, 64, 1, 1, 32)));
    expect(nativeCalls).toHaveLength(1);
  });

  it('falls back to the JS engine when the native module is unavailable', async () => {
    nativeBehaviour = 'throws';
    const { deriveArgon2id } = await freshModule();
    const key = await deriveArgon2id('password', SALT, { memoryKiB: 64, iterations: 1, parallelism: 1 }, 32);

    expect(toHex(key)).toBe(toHex(await reference('password', SALT, 64, 1, 1, 32)));
  });
});
