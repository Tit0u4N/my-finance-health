// @repo/platform-tauri — level 1.
// UpdaterService on the official Tauri updater plugin. The feed (the repository's latest GitHub
// release `latest.json`) and the signature public key live in the shell's tauri.conf.json
// `plugins.updater`; the plugin rejects any payload not signed with the matching private key.

import type { AvailableUpdate, UpdaterService } from '@repo/platform/services/updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

export function createTauriUpdater(): UpdaterService {
  return {
    check: async (): Promise<AvailableUpdate | null> => {
      let update: Awaited<ReturnType<typeof check>>;
      try {
        update = await check();
      } catch {
        return null;
      }
      if (update === null) {
        return null;
      }
      return {
        version: update.version,
        notes: update.body ?? null,
        install: async () => {
          await update.downloadAndInstall();
          await relaunch();
        },
      };
    },
  };
}
