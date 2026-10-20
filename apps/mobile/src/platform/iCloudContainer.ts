// apps/mobile — the JS face of the local Expo module in modules/icloud-container (Swift, iOS only).
// It hands platform-expo the two primitives behind `cloud:` paths (see
// packages/platform-expo/src/services/cloudContainer.ts).
//
// Absent on Android, and on a binary built before the module existed: `requireOptionalNativeModule`
// then returns null and the app simply offers no iCloud location. Present but unentitled (no paid
// Apple Developer team yet, docs/owner-setup.md §2) or with no iCloud account signed in, the
// folder resolves to null — same outcome, nothing errors.

import type { CloudContainer } from '@repo/platform-expo/services/cloudContainer';
import { requireOptionalNativeModule } from 'expo';

type ICloudContainerModule = {
  documentsDirectory(): Promise<string | null>;
  ensureDownloaded(uri: string, timeoutMs: number): Promise<void>;
};

/** How long a read waits for an evicted file to come down from iCloud before failing. */
const DOWNLOAD_TIMEOUT_MS = 30_000;

export function createICloudContainer(): CloudContainer | undefined {
  const native = requireOptionalNativeModule<ICloudContainerModule>('ICloudContainer');
  if (!native) {
    return undefined;
  }
  // The folder's location is stable for the whole launch once found; while it is unavailable
  // (signed out, iCloud Drive off) every call asks again, so signing in takes effect without a restart.
  let documents: string | null = null;
  return {
    documentsDirectory: async () => {
      documents ??= await native.documentsDirectory();
      return documents;
    },
    ensureDownloaded: (uri) => native.ensureDownloaded(uri, DOWNLOAD_TIMEOUT_MS),
  };
}
