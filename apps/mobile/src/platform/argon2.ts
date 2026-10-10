// apps/mobile — native Argon2id for the SQLCipher key and the journal key.
// Lives here rather than in platform-expo because native Argon2 libraries are React Native modules,
// which no shared package may import (biome.json's noRestrictedImports).
//
// Argon2id on the phone's native thread. The pure-JS implementation (@noble/hashes) needs many
// seconds for the 64 MiB / 3-pass cost on Hermes and is kept only as the fallback; the native
// one (react-native-quick-crypto → OpenSSL) produces the identical bytes in a fraction of a
// second. Parameters are never lowered: they come from each file's `.mfhmeta`.
//
// The native result is checked once per launch against the JS implementation on a tiny input.
// If the two ever disagree — a library upgrade changing defaults, say — the JS path takes over,
// because a different key would make every existing workspace look like a wrong passphrase.

import { type DeriveKey, deriveInScript } from '@repo/platform-expo/services/argon2Script';

type Argon2Cost = Parameters<DeriveKey>[2];

const ARGON2_VERSION = 0x13;
const SELF_CHECK_COST: Argon2Cost = { memoryKiB: 64, iterations: 1, parallelism: 1 };
const SELF_CHECK_SALT = Uint8Array.from('mfh-self-check-salt', (char) => char.charCodeAt(0));

// Imported on first use, not at startup: in a binary built before the native module was added,
// merely importing it throws, which must send us to the JS fallback instead of crashing the app.
async function nativeArgon2id(secret: string, salt: Uint8Array, cost: Argon2Cost, length: number): Promise<Uint8Array> {
  const { argon2 } = await import('react-native-quick-crypto');
  return new Promise((resolve, reject) => {
    argon2(
      'argon2id',
      {
        message: secret,
        nonce: salt,
        parallelism: cost.parallelism,
        tagLength: length,
        memory: cost.memoryKiB,
        passes: cost.iterations,
        version: ARGON2_VERSION,
      },
      (error, result) => (error ? reject(error) : resolve(Uint8Array.from(result))),
    );
  });
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

let nativeIsTrusted: Promise<boolean> | undefined;

function isNativeTrusted(): Promise<boolean> {
  nativeIsTrusted ??= (async () => {
    try {
      const native = await nativeArgon2id('self-check', SELF_CHECK_SALT, SELF_CHECK_COST, 32);
      const reference = await deriveInScript('self-check', SELF_CHECK_SALT, SELF_CHECK_COST, 32);
      return sameBytes(native, reference);
    } catch {
      return false;
    }
  })();
  return nativeIsTrusted;
}

export const deriveArgon2id: DeriveKey = async (secret, salt, cost, length) => {
  if (await isNativeTrusted()) {
    return nativeArgon2id(secret, salt, cost, length);
  }
  return deriveInScript(secret, salt, cost, length);
};
