// Desktop auto-update: checks the release feed once per launch and offers the update through a
// native dialog. Installing ends with a relaunch, which skips the quit handshake that releases the
// occupancy lock (src-tauri/src/quit.rs) — so the prompt only appears while no workspace session
// is open; an update found mid-session waits for the session to close (lock, lock lost) or for
// the next launch. Dev builds never check: they would offer to replace themselves with a release.

import type { LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import type { AvailableUpdate, UpdaterService } from '@repo/platform/services/updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { useEffect, useState } from 'react';

const IS_RELEASE_BUILD = import.meta.env.PROD;

export function useUpdatePrompt(updater: UpdaterService | undefined, session: LocalWorkspaceSession | null): void {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    if (!IS_RELEASE_BUILD || updater === undefined) {
      return;
    }
    let isCancelled = false;
    void updater.check().then((found) => {
      if (!isCancelled) {
        setUpdate(found);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [updater]);

  useEffect(() => {
    if (update === null || session !== null) {
      return;
    }
    // Asked once: declining is final until the next launch.
    setUpdate(null);
    void promptAndInstall(update);
  }, [update, session]);
}

async function promptAndInstall(update: AvailableUpdate): Promise<void> {
  const notes = update.notes ? `\n\n${update.notes}` : '';
  const isAccepted = await ask(`Version ${update.version} is available. Install it and restart now?${notes}`, {
    title: 'Update available',
    kind: 'info',
    okLabel: 'Install and restart',
    cancelLabel: 'Later',
  });
  if (!isAccepted) {
    return;
  }
  try {
    await update.install();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: a failed update leaves the current version running, but must not be silent
    console.error('[updater] install failed', error);
  }
}
