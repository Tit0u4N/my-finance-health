// @repo/platform-expo — level 1.
// The `cloud:` path space: files inside the system-synced app folder (iCloud Drive's app folder
// on iOS). The native primitives that find that folder and pull evicted files back cannot live in
// this package (they are an Expo module of apps/mobile), so the app injects them through
// `CloudContainer`, the same way it injects the Argon2 engine. Free of expo imports so app-level
// tests can import it.
//
// Paths are `cloud:/<relative path>` and never the folder's absolute URI: like the sandbox's
// Documents directory, the container's location is resolved again at every launch.

export type CloudContainer = {
  /** file:// URI of the synced folder, or null when it is unavailable right now. */
  readonly documentsDirectory: () => Promise<string | null>;
  /** Waits until the file at this file:// URI is on the device (an evicted one is downloaded).
   * Returns at once for a plain local file or a missing one. */
  readonly ensureDownloaded: (uri: string) => Promise<void>;
};

export const CLOUD_ROOT = 'cloud:';

export function isCloudPath(path: string): boolean {
  return path === CLOUD_ROOT || path.startsWith(`${CLOUD_ROOT}/`);
}

/** "cloud:/A/b.mfhdb" → "A/b.mfhdb"; the root itself → "". */
export function cloudRelativePath(path: string): string {
  return path.slice(CLOUD_ROOT.length).replace(/^\/+/, '');
}

const PLACEHOLDER = /^\.(.+)\.icloud$/;

/** The real name behind an evicted file's `.<name>.icloud` placeholder, or the name unchanged. */
export function nameBehindPlaceholder(name: string): string {
  return PLACEHOLDER.exec(name)?.[1] ?? name;
}
