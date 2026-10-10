// apps/mobile — composes the real Expo adapters into one `Platform` (start-roadmap.md §6: only
// apps wire concrete adapters). Capabilities are declared honestly, the way desktop's are:
//   - the file system is the app sandbox plus folders the user picks for export/import, so
//     `canWriteFile`/`canPickFile` are true but a remembered location is not resumable
//     (`canResumeLocation`: a picked iOS folder only stays accessible for the session);
//   - no secret vault and no biometric unlock yet — both stay off until their adapters exist
//     (expo-secure-store / expo-local-authentication, start-roadmap.md §8).

import type { Platform } from '@repo/platform/platform';
import { createExpoClock } from '@repo/platform-expo/services/clock';
import { createExpoFileSystem } from '@repo/platform-expo/services/fileSystem';
import { createExpoKeyValueStore } from '@repo/platform-expo/services/keyValueStore';
import { createExpoLocalization } from '@repo/platform-expo/services/localization';
import { createExpoRandom } from '@repo/platform-expo/services/random';
import { createExpoSqlDriver } from '@repo/platform-expo/services/sqlDriver';
import ky from 'ky';
import { deriveArgon2id } from './argon2';

export function createMobilePlatform(): Platform {
  return {
    capabilities: {
      canWriteFile: true,
      canPickFile: true,
      canResumeLocation: false,
      hasSecretVault: false,
      hasBiometricUnlock: false,
      hasEncryptedSqlDriver: true,
      worksOffline: true,
      canControlWindow: false,
      canUpdate: false,
    },
    keyValueStore: createExpoKeyValueStore(),
    clock: createExpoClock(),
    random: createExpoRandom(),
    localization: createExpoLocalization(),
    http: { instance: ky.create() },
    fileSystem: createExpoFileSystem(),
    sqlDriver: createExpoSqlDriver({ deriveKey: deriveArgon2id }),
  };
}
