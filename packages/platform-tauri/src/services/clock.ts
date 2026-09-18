// @repo/platform-tauri — level 1.
// Clock (@repo/platform/services/clock) on the WebView's own Date — a real Tauri window, no
// native primitive needed. `systemTimezone` is injected rather than read from `Intl` directly:
// this package's tsconfig has no DOM/Intl lib (it also builds for Tauri's Rust-side contracts),
// the same reason keyValueStore.ts injects `WebStorageLike` instead of naming `Storage`.

import type { Clock } from '@repo/platform/services/clock';

export type SystemTimezoneProvider = {
  /** `Intl.DateTimeFormat().resolvedOptions().timeZone`, computed by the caller (an app, which has the DOM lib). */
  systemTimezone(): string;
};

export function createSystemClock(deps: SystemTimezoneProvider): Clock {
  return {
    now: () => new Date().toISOString(),
    systemTimezone: deps.systemTimezone,
  };
}
