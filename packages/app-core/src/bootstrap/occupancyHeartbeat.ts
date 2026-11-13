// @repo/app-core — level 2.
// The heartbeat loop that keeps a workspace's occupancy lock fresh (audit P6). Platform-neutral
// and timer-injected so the policy is testable with a simulated clock: apps decide *when* it runs
// (always on desktop; foreground only on mobile) and what to do when the lock is lost.
//
// Policy: `refreshLock` reports a `conflict` when another session took the lock over. That is the
// only outcome treated as "lost" — the device must stop writing, so `onLost` fires once and the
// loop stops. A thrown error (a transient I/O failure, e.g. a synced folder briefly unavailable)
// is retried on the next beat: dropping a healthy session over one failed write would be worse.

import type { DomainError } from '@repo/domain/primitives/errors';
import { isErr, type Result } from '@repo/domain/primitives/result';

export type Heartbeatable = { readonly heartbeat: () => Promise<Result<true, DomainError>> };

export type HeartbeatTimers = {
  readonly setInterval: (callback: () => void, ms: number) => unknown;
  readonly clearInterval: (handle: unknown) => void;
};

// app-core's tsconfig carries neither the DOM nor the Node typings; timers exist on every target.
declare function setInterval(callback: () => void, ms: number): unknown;
declare function clearInterval(handle: unknown): void;

export const HEARTBEAT_INTERVAL_MS = 15_000;

/** Beats once immediately, then every interval. Returns a stop function. */
export function startOccupancyHeartbeat(
  session: Heartbeatable,
  onLost: () => void,
  timers: HeartbeatTimers = { clearInterval, setInterval },
  intervalMs: number = HEARTBEAT_INTERVAL_MS,
): () => void {
  let stopped = false;
  let handle: unknown;
  let inFlight = false;

  const stop = (): void => {
    stopped = true;
    timers.clearInterval(handle);
  };

  const beat = (): void => {
    if (stopped || inFlight) {
      return;
    }
    inFlight = true;
    session
      .heartbeat()
      .then((result) => {
        if (!stopped && isErr(result)) {
          stop();
          onLost();
        }
      })
      .catch(() => {
        // Transient failure: keep the loop, the next beat retries.
      })
      .finally(() => {
        inFlight = false;
      });
  };

  handle = timers.setInterval(beat, intervalMs);
  beat();
  return stop;
}
