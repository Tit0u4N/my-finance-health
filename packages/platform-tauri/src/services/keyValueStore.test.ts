// @repo/platform-tauri — level 1.

import { describe, expect, it } from 'vitest';
import { createLocalStorageKeyValueStore, type WebStorageLike } from './keyValueStore';

function createFakeStorage(): WebStorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function createThrowingStorage(): WebStorageLike {
  return {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
}

describe('createLocalStorageKeyValueStore', () => {
  it('round-trips a value through set/get', async () => {
    const store = createLocalStorageKeyValueStore(createFakeStorage());

    await store.set('preferences', '{"themeMode":"dark"}');

    expect(await store.get('preferences')).toBe('{"themeMode":"dark"}');
  });

  it('returns null for a key that was never set', async () => {
    const store = createLocalStorageKeyValueStore(createFakeStorage());

    expect(await store.get('missing')).toBeNull();
  });

  it('removes a value', async () => {
    const store = createLocalStorageKeyValueStore(createFakeStorage());
    await store.set('preferences', 'x');

    await store.remove('preferences');

    expect(await store.get('preferences')).toBeNull();
  });

  it('never throws when the underlying storage is blocked (private mode, quota, disabled site data)', async () => {
    const store = createLocalStorageKeyValueStore(createThrowingStorage());

    await expect(store.set('preferences', 'x')).resolves.toBeUndefined();
    await expect(store.get('preferences')).resolves.toBeNull();
    await expect(store.remove('preferences')).resolves.toBeUndefined();
  });
});
