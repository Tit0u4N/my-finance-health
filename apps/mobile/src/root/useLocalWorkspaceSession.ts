import { startOccupancyHeartbeat } from '@repo/app-core/bootstrap/occupancyHeartbeat';
import type { LocalWorkspaceSession } from '@repo/data/workspace/localWorkspaceOpener';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Keeps the occupancy lock fresh while a workspace is open and the app is in the foreground.
 * Counterpart of apps/desktop's hook of the same name, minus window-close handling: a phone app is
 * never "closed" in an observable way, so the session is released only by the user locking or
 * switching.
 *
 * A suspended app stops heartbeating, so its lock goes stale and another device may take it over.
 * Coming back to the foreground beats immediately — before the user can act — and if the lock was
 * taken in the meantime `onLost` fires and the app locks itself instead of writing over the other
 * device (audit P6). A lock that is merely stale, with nobody having taken it, is simply refreshed.
 */
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

    let stopBeating: (() => void) | undefined;
    const start = (): void => {
      stopBeating = startOccupancyHeartbeat(session, () => {
        stopBeating = undefined;
        onLostRef.current();
      });
    };
    const stop = (): void => {
      stopBeating?.();
      stopBeating = undefined;
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
