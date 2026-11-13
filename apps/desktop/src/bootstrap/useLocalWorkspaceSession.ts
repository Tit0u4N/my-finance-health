import { startOccupancyHeartbeat } from '@repo/app-core/bootstrap/occupancyHeartbeat';
import type { LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useRef } from 'react';

// Must match QUIT_REQUESTED_EVENT in src-tauri/src/quit.rs.
const QUIT_REQUESTED_EVENT = 'mfh://quit-requested';

/** Keeps the occupancy lock fresh while a workspace is open, and releases it (plus closing the SQL
 * connection) when the app ends — audit P6:
 * - a window close goes through `onCloseRequested`;
 * - ⌘Q, the Dock menu and an OS shutdown never reach it, so the Rust side holds the exit back
 *   while a session is registered (`set_session_open`), emits `mfh://quit-requested`, and waits
 *   for `quit_app` — with a watchdog, so a stuck session cannot block quitting;
 * - a crash is still covered only by the lock's staleness timeout (start-roadmap.md §9).
 * If another device takes the lock over, `onLost` fires and the app locks itself. */
export function useLocalWorkspaceSession(session: LocalWorkspaceSession | null, onLost: () => void): void {
  // The latest callback without restarting the heartbeat whenever the caller re-renders.
  const onLostRef = useRef(onLost);
  useEffect(() => {
    onLostRef.current = onLost;
  });

  useEffect(() => {
    if (!session) {
      return;
    }

    const stopBeating = startOccupancyHeartbeat(session, () => onLostRef.current());

    void invoke('set_session_open', { open: true });

    let unlistenClose: (() => void) | undefined;
    let unlistenQuit: (() => void) | undefined;
    let cancelled = false;
    const keep = (assign: (fn: () => void) => void) => (fn: () => void) => {
      if (cancelled) {
        fn();
        return;
      }
      assign(fn);
    };
    void getCurrentWindow()
      .onCloseRequested(async () => {
        await session.close();
      })
      .then(keep((fn) => (unlistenClose = fn)));
    void listen(QUIT_REQUESTED_EVENT, async () => {
      await session.close();
      await invoke('quit_app');
    }).then(keep((fn) => (unlistenQuit = fn)));

    return () => {
      cancelled = true;
      stopBeating();
      unlistenClose?.();
      unlistenQuit?.();
      void invoke('set_session_open', { open: false });
    };
  }, [session]);
}
