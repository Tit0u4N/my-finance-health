// @repo/platform-tauri — level 1.
// KeyValueStore (@repo/platform/services/keyValueStore) implemented on `localStorage` — the real
// backing for device-local preferences (theme/sidebar/language), wired in by apps/desktop at
// composition time (§6: only apps wire adapters). Tauri's window is a real WebView with a
// working `localStorage`, so this needs no `@tauri-apps/plugin-store` or other native plugin;
// it lives here rather than in @repo/platform-web only because apps/desktop may import its own
// adapter package alone (biome.json's apps/desktop override forbids @repo/platform-web there).

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';

/** The slice of the DOM `Storage` interface this adapter needs — spelled out locally rather than
 * naming `Storage` itself, since this package's tsconfig (base.json, no `DOM` lib — it also
 * builds for Tauri's Rust-side contracts) never has that global type in scope. The caller (an
 * app, which does have the DOM lib) passes `window.localStorage` in. */
export type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Every access is wrapped: a private window, a full quota, or site data disabled throws
 * synchronously in some browsers — a display setting must never break bootstrap over it, the
 * same tolerance `hydratePreferencesStore` already shows for a corrupt persisted value. */
export function createLocalStorageKeyValueStore(storage: WebStorageLike): KeyValueStore {
  return {
    get: (key) => {
      try {
        return Promise.resolve(storage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    },
    set: (key, value) => {
      try {
        storage.setItem(key, value);
      } catch {
        // Swallowed — see the function docblock.
      }
      return Promise.resolve();
    },
    remove: (key) => {
      try {
        storage.removeItem(key);
      } catch {
        // Swallowed — see the function docblock.
      }
      return Promise.resolve();
    },
  };
}
