// apps/desktop — composes the real Tauri adapters into one `Platform` (start-roadmap.md §6: only
// apps wire concrete adapters). `hasSecretVault` stays false: local mode still derives its key
// from a user passphrase at every unlock (open-questions.md #5), and no general-purpose keyring
// is wired for it — that's deferred to whenever online mode needs to hold an API key.
// `hasBiometricUnlock` is a separate, narrower capability (open-questions.md #23, amending #5):
// an opt-in, per-device, biometric-bound *copy* of a workspace passphrase. The passphrase stays
// the only key material and a workspace file copied to another device is still unopenable
// without it — only the daily-launch prompt is silent, never the key derivation itself.

import type { Platform } from '@repo/platform/platform';
import { createTauriBiometricUnlock } from '@repo/platform-tauri/services/biometricUnlock';
import { createSystemClock } from '@repo/platform-tauri/services/clock';
import { createTauriFileSystem } from '@repo/platform-tauri/services/fileSystem';
import { createLocalStorageKeyValueStore } from '@repo/platform-tauri/services/keyValueStore';
import { createNavigatorLocalization } from '@repo/platform-tauri/services/localization';
import { createWebCryptoRandom } from '@repo/platform-tauri/services/random';
import { createTauriSqlDriver } from '@repo/platform-tauri/services/sqlDriver';
import ky from 'ky';

export function createDesktopPlatform(): Platform {
  return {
    capabilities: {
      canWriteFile: true,
      canPickFile: true,
      canResumeLocation: true,
      hasSecretVault: false,
      hasBiometricUnlock: true,
      hasEncryptedSqlDriver: true,
      worksOffline: true,
      canControlWindow: true,
      canUpdate: false,
    },
    keyValueStore: createLocalStorageKeyValueStore(window.localStorage),
    clock: createSystemClock({ systemTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone }),
    random: createWebCryptoRandom(window.crypto),
    localization: createNavigatorLocalization(navigator),
    http: { instance: ky.create() },
    fileSystem: createTauriFileSystem(),
    sqlDriver: createTauriSqlDriver(),
    biometricUnlock: createTauriBiometricUnlock(),
  };
}
