// apps/desktop — composes the real Tauri adapters into one `Platform` (start-roadmap.md §6: only
// apps wire concrete adapters). `hasSecretVault` is false: local mode derives its key from a
// user passphrase at every unlock (open-questions.md #5), so nothing here reads an OS keyring —
// adding one is deferred to whenever online mode needs to hold an API key.

import type { Platform } from '@repo/platform/platform';
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
  };
}
