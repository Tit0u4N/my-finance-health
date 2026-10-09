import type { LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import { useEffect } from 'react';
import { AppState } from 'react-native';

const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Keeps the occupancy lock fresh while a workspace is open and the app is in the foreground.
 * Counterpart of apps/desktop's hook of the same name, minus window-close handling: a phone app is
 * never "closed" in an observable way, so the session is released only by the user locking or
 * switching. A suspended app stops heartbeating — the lock goes stale after the staleness window
 * and this same device reclaims it on return (the lock is keyed by device id), while another
 * device correctly sees the workspace as free once it is stale (start-roadmap.md §9's
 * expiration rule).
 */
export function useLocalWorkspaceSession(session: LocalWorkspaceSession | null): void {
  useEffect(() => {
    if (!session) {
      return;
    }

    const beat = (): void => {
      void session.heartbeat();
    };
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = (): void => {
      beat();
      interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    };
    const stop = (): void => {
      clearInterval(interval);
      interval = undefined;
    };

    if (AppState.currentState === 'active') {
      start();
    }
    const subscription = AppState.addEventListener('change', (next) => {
      stop();
      if (next === 'active') {
        start();
      }
    });

    return () => {
      subscription.remove();
      stop();
    };
  }, [session]);
}
