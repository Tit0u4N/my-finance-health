import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
const getCalendars = vi.hoisted(() => vi.fn());
const getLocales = vi.hoisted(() => vi.fn());

vi.mock('expo-sqlite/kv-store', () => ({
  default: {
    getItemAsync: (key: string) => Promise.resolve(storage.get(key) ?? null),
    setItemAsync: (key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    },
    removeItemAsync: (key: string) => Promise.resolve(storage.delete(key)),
  },
}));
vi.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000000',
  getRandomBytes: (length: number) => new Uint8Array(length).fill(7),
}));
vi.mock('expo-localization', () => ({
  getCalendars: () => getCalendars(),
  getLocales: () => getLocales(),
}));

const { createExpoKeyValueStore } = await import('./keyValueStore');
const { createExpoRandom } = await import('./random');
const { createExpoClock } = await import('./clock');
const { createExpoLocalization } = await import('./localization');

beforeEach(() => {
  storage.clear();
  getCalendars.mockReset();
  getLocales.mockReset();
});

describe('createExpoKeyValueStore', () => {
  it('stores, reads and removes values; a missing key reads as null', async () => {
    const store = createExpoKeyValueStore();

    await store.set('k', 'v');
    expect(await store.get('k')).toBe('v');
    await store.remove('k');
    expect(await store.get('k')).toBeNull();
  });
});

describe('createExpoRandom', () => {
  it('delegates to the native generator', () => {
    const random = createExpoRandom();

    expect(random.uuid()).toBe('00000000-0000-4000-8000-000000000000');
    expect(random.bytes(4)).toEqual(new Uint8Array([7, 7, 7, 7]));
  });
});

describe('createExpoClock', () => {
  it('reads the device timezone, and falls back to UTC when none is reported', () => {
    getCalendars.mockReturnValueOnce([{ timeZone: 'Europe/Paris' }]).mockReturnValueOnce([{ timeZone: null }]);
    const clock = createExpoClock();

    expect(clock.systemTimezone()).toBe('Europe/Paris');
    expect(clock.systemTimezone()).toBe('UTC');
    expect(clock.now()).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});

describe('createExpoLocalization', () => {
  it('reads the preferred language tag, with an en-US fallback', () => {
    getLocales.mockReturnValueOnce([{ languageTag: 'fr-FR' }]).mockReturnValueOnce([]);
    const localization = createExpoLocalization();

    expect(localization.locale()).toBe('fr-FR');
    expect(localization.locale()).toBe('en-US');
  });
});
