// @repo/platform-tauri — level 1.
// BiometricUnlockService implemented on the third-party tauri-plugin-biometry (no official Tauri
// 2 desktop biometric plugin exists — the official `tauri-plugin-biometric` is mobile-only;
// open-questions.md #23). Every entry is scoped under one fixed domain (this shell's
// tauri.conf.json `identifier`) — `key` is the biometry `name` within that domain.
//
// `get()` never throws: any failure while prompting (cancelled, refused, lockout, hardware
// absent, plugin missing on an unsupported OS like Linux) degrades to `null` so the caller can
// always fall back to the ordinary passphrase form — a stale or unreadable entry is not the
// caller's problem to diagnose, only to recover from.

import {
  BiometryType,
  checkStatus,
  getData,
  hasData,
  removeData,
  setData,
} from '@choochmeque/tauri-plugin-biometry-api';
import type { BiometricUnlockService, BiometricUnlockStatus } from '@repo/platform/services/biometricUnlock';

const DOMAIN = 'com.myfinancehealth.desktop';
// Never written by anyone; workspace keys are file paths, which can't collide with it.
const PROBE_KEY = '__keychain-probe__';

function labelFor(biometryType: BiometryType): string {
  switch (biometryType) {
    case BiometryType.TouchID:
      return 'Touch ID';
    case BiometryType.FaceID:
      return 'Face ID';
    case BiometryType.Iris:
      return 'Iris unlock';
    default:
      return 'Biometric unlock';
  }
}

export function createTauriBiometricUnlock(): BiometricUnlockService {
  return {
    status: async (): Promise<BiometricUnlockStatus> => {
      try {
        const result = await checkStatus();
        const label = labelFor(result.biometryType);
        if (!result.isAvailable) {
          return { isAvailable: false, label };
        }
        // Hardware present is not enough: the plugin's keychain needs a code-signed app carrying a
        // keychain-access-groups entitlement, and an unsigned build (`tauri dev`) rejects every
        // call with errSecMissingEntitlement (-34018). Deleting a key that cannot exist is a
        // no-op on a working keychain (the plugin maps "not found" to success), needs no
        // biometric prompt and writes nothing — so it only throws when the keychain is unusable.
        await removeData({ domain: DOMAIN, name: PROBE_KEY });
        return { isAvailable: true, label };
      } catch {
        return { isAvailable: false, label: 'Biometric unlock' };
      }
    },

    has: async (key) => {
      try {
        return await hasData({ domain: DOMAIN, name: key });
      } catch {
        return false;
      }
    },

    get: async (key, reason) => {
      try {
        const response = await getData({ domain: DOMAIN, name: key, reason });
        return response.data;
      } catch {
        return null;
      }
    },

    set: (key, value) => setData({ domain: DOMAIN, name: key, data: value }),

    remove: (key) => removeData({ domain: DOMAIN, name: key }),
  };
}
