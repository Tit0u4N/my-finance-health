// @repo/platform-expo — level 1.
// KeyValueStore on expo-sqlite's key-value store — persistent across launches, which the recent-
// workspaces list, the device id and the preferences all rely on. Unencrypted by design: nothing
// secret goes through this contract (start-roadmap.md §8: secrets have their own service).

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import Storage from 'expo-sqlite/kv-store';

export function createExpoKeyValueStore(): KeyValueStore {
  return {
    get: (key) => Storage.getItemAsync(key),
    set: (key, value) => Storage.setItemAsync(key, value),
    remove: async (key) => {
      await Storage.removeItemAsync(key);
    },
  };
}
