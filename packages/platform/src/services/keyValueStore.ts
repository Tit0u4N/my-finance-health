// @repo/platform — level 0.
// Unstructured string storage: recent-workspaces list, device-local preferences. Persistence
// guarantees (localStorage, a plist, SharedPreferences, ...) are the adapter's problem.

export type KeyValueStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
