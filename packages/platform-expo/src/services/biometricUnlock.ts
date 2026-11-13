// @repo/platform-expo — level 1.
// BiometricUnlockService on expo-secure-store (iOS Keychain / Android Keystore) + expo-local-
// authentication — mobile's counterpart of platform-tauri's Touch ID adapter (open-questions.md
// #23). The passphrase copy is written with `requireAuthentication`, so the OS itself refuses to
// release it without Face ID / Touch ID / fingerprint, and `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`,
// so it never leaves this device (no iCloud Keychain, no backup restore onto another phone) and
// disappears if the device passcode is removed.
//
// `has()` must never prompt, but reading an authentication-bound item always does: each entry is
// therefore paired with a plain marker item (`<key>.enrolled`) that only says "an entry exists".
// The marker uses its own key — expo-secure-store's `getItemAsync` looks for an unauthenticated
// item under the same key first, so sharing the key would shadow the real entry.
//
// `get()` never throws: cancelled, refused, lockout, an entry invalidated by a biometric change
// (Android) — everything degrades to `null`, and the caller falls back to the passphrase form.

import type { BiometricUnlockService, BiometricUnlockStatus } from '@repo/platform/services/biometricUnlock';
import {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication';
import {
  canUseBiometricAuthentication,
  deleteItemAsync,
  getItemAsync,
  isAvailableAsync,
  type SecureStoreOptions,
  setItemAsync,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} from 'expo-secure-store';

export type ExpoBiometricUnlockOptions = {
  /** Decides the fingerprint copy only ("Touch ID" vs "Fingerprint") — supplied by the app, the
   *  one place allowed to know which OS it runs on. */
  readonly os: 'ios' | 'android';
};

const KEYCHAIN_SERVICE = 'mfh.biometric-unlock';
const KEY_PREFIX = 'mfh.workspace.';
const MARKER_SUFFIX = '.enrolled';
const FALLBACK_LABEL = 'Biometric unlock';

const SECRET_OPTIONS: SecureStoreOptions = {
  keychainService: KEYCHAIN_SERVICE,
  requireAuthentication: true,
  keychainAccessible: WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};
const MARKER_OPTIONS: SecureStoreOptions = {
  keychainService: KEYCHAIN_SERVICE,
  keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** expo-secure-store only accepts `[A-Za-z0-9._-]` keys, and a workspace id is a path or uuid.
 * Every other character (and `_` itself, so the mapping stays injective) becomes `_xxxx`. */
export function toStoreKey(workspaceKey: string): string {
  const escaped = Array.from(workspaceKey, (char) =>
    /[A-Za-z0-9.-]/.test(char) ? char : `_${(char.codePointAt(0) ?? 0).toString(16).padStart(4, '0')}`,
  ).join('');
  return `${KEY_PREFIX}${escaped}`;
}

export function labelFor(types: readonly AuthenticationType[], os: ExpoBiometricUnlockOptions['os']): string {
  if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
    return os === 'ios' ? 'Face ID' : 'Face unlock';
  }
  if (types.includes(AuthenticationType.FINGERPRINT)) {
    return os === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  if (types.includes(AuthenticationType.IRIS)) {
    return 'Iris unlock';
  }
  return FALLBACK_LABEL;
}

export function createExpoBiometricUnlock({ os }: ExpoBiometricUnlockOptions): BiometricUnlockService {
  return {
    status: async (): Promise<BiometricUnlockStatus> => {
      try {
        const [hasHardware, isEnrolled, types, isStoreAvailable] = await Promise.all([
          hasHardwareAsync(),
          isEnrolledAsync(),
          supportedAuthenticationTypesAsync(),
          isAvailableAsync(),
        ]);
        const label = labelFor(types, os);
        return {
          isAvailable: hasHardware && isEnrolled && isStoreAvailable && canUseBiometricAuthentication(),
          label,
        };
      } catch {
        return { isAvailable: false, label: FALLBACK_LABEL };
      }
    },

    has: async (key) => {
      try {
        return (await getItemAsync(`${toStoreKey(key)}${MARKER_SUFFIX}`, MARKER_OPTIONS)) !== null;
      } catch {
        return false;
      }
    },

    get: async (key, reason) => {
      try {
        return await getItemAsync(toStoreKey(key), { ...SECRET_OPTIONS, authenticationPrompt: reason });
      } catch {
        return null;
      }
    },

    set: async (key, value) => {
      const storeKey = toStoreKey(key);
      await setItemAsync(storeKey, value, SECRET_OPTIONS);
      await setItemAsync(`${storeKey}${MARKER_SUFFIX}`, '1', MARKER_OPTIONS);
    },

    remove: async (key) => {
      const storeKey = toStoreKey(key);
      // Marker first: if the second delete fails, the worst case is an orphan secret nobody
      // offers to use, never a marker pointing at nothing that re-prompts on every launch.
      await deleteItemAsync(`${storeKey}${MARKER_SUFFIX}`, MARKER_OPTIONS);
      await deleteItemAsync(storeKey, SECRET_OPTIONS);
    },
  };
}
