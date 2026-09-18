import type { LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';

const HEARTBEAT_INTERVAL_MS = 15_000;

/** Refreshes the occupancy lock while a workspace is open, and releases it (plus closing the SQL
 * connection) on window close — best-effort: the occupancy lock's staleness timeout is the
 * fallback for a shutdown this never gets to observe (start-roadmap.md §9's expiration rule). */
export function useLocalWorkspaceSession(session: LocalWorkspaceSession | null): void {
  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = setInterval(() => {
      void session.heartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void getCurrentWindow()
      .onCloseRequested(async () => {
        await session.close();
      })
      .then((fn) => {
        if (cancelled) {
          fn();
          return;
        }
        unlisten = fn;
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unlisten?.();
    };
  }, [session]);
}
