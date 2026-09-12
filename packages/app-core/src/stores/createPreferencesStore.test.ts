import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import { describe, expect, it } from 'vitest';
import { createPreferencesStore, hydratePreferencesStore } from './createPreferencesStore';

function buildKeyValueStore(): KeyValueStore {
  return createFakePlatform().keyValueStore;
}

describe('createPreferencesStore', () => {
  it('starts at the documented defaults', () => {
    const store = createPreferencesStore(buildKeyValueStore());

    expect(store.getState()).toMatchObject({
      themeMode: 'system',
      sidebarMode: 'expanded',
      amountsHidden: false,
      language: 'system',
    });
  });

  it('has no accent or density field — dropped per open-questions.md #11', () => {
    const store = createPreferencesStore(buildKeyValueStore());

    expect(store.getState()).not.toHaveProperty('accent');
    expect(store.getState()).not.toHaveProperty('density');
  });

  it('persists each setter to the key-value store', async () => {
    const keyValueStore = buildKeyValueStore();
    const store = createPreferencesStore(keyValueStore);

    store.getState().setThemeMode('dark');
    store.getState().setSidebarMode('collapsed');

    const raw = await keyValueStore.get('preferences');
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ themeMode: 'dark', sidebarMode: 'collapsed' });
  });

  it('toggleAmountsHidden flips and persists the flag', async () => {
    const keyValueStore = buildKeyValueStore();
    const store = createPreferencesStore(keyValueStore);

    store.getState().toggleAmountsHidden();

    expect(store.getState().amountsHidden).toBe(true);
    const raw = await keyValueStore.get('preferences');
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ amountsHidden: true });
  });

  it('setLanguage persists a shipped language', async () => {
    const keyValueStore = buildKeyValueStore();
    const store = createPreferencesStore(keyValueStore);

    store.getState().setLanguage('fr');

    expect(store.getState().language).toBe('fr');
    const raw = await keyValueStore.get('preferences');
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ language: 'fr' });
  });

  it('setLanguage accepts the "system" sentinel', () => {
    const store = createPreferencesStore(buildKeyValueStore());

    store.getState().setLanguage('fr');
    store.getState().setLanguage('system');

    expect(store.getState().language).toBe('system');
  });
});

describe('hydratePreferencesStore', () => {
  it('loads a valid persisted snapshot', async () => {
    const keyValueStore = buildKeyValueStore();
    await keyValueStore.set(
      'preferences',
      JSON.stringify({ themeMode: 'dark', sidebarMode: 'collapsed', amountsHidden: true }),
    );
    const store = createPreferencesStore(keyValueStore);

    await hydratePreferencesStore(store, keyValueStore);

    expect(store.getState()).toMatchObject({ themeMode: 'dark', sidebarMode: 'collapsed', amountsHidden: true });
  });

  it('keeps the defaults when nothing is persisted', async () => {
    const keyValueStore = buildKeyValueStore();
    const store = createPreferencesStore(keyValueStore);

    await hydratePreferencesStore(store, keyValueStore);

    expect(store.getState()).toMatchObject({
      themeMode: 'system',
      sidebarMode: 'expanded',
      amountsHidden: false,
      language: 'system',
    });
  });

  it('keeps the defaults when the persisted value is corrupt JSON', async () => {
    const keyValueStore = buildKeyValueStore();
    await keyValueStore.set('preferences', '{not json');
    const store = createPreferencesStore(keyValueStore);

    await hydratePreferencesStore(store, keyValueStore);

    expect(store.getState()).toMatchObject({
      themeMode: 'system',
      sidebarMode: 'expanded',
      amountsHidden: false,
      language: 'system',
    });
  });

  it('loads a persisted language and rejects an unshipped one', async () => {
    const keyValueStore = buildKeyValueStore();
    await keyValueStore.set('preferences', JSON.stringify({ language: 'fr' }));
    const store = createPreferencesStore(keyValueStore);
    await hydratePreferencesStore(store, keyValueStore);
    expect(store.getState().language).toBe('fr');

    const otherKeyValueStore = buildKeyValueStore();
    await otherKeyValueStore.set('preferences', JSON.stringify({ language: 'de' }));
    const otherStore = createPreferencesStore(otherKeyValueStore);
    await hydratePreferencesStore(otherStore, otherKeyValueStore);
    expect(otherStore.getState().language).toBe('system');
  });

  it('does not reintroduce accent/density from a legacy blob written by an older build', async () => {
    const keyValueStore = buildKeyValueStore();
    await keyValueStore.set(
      'preferences',
      JSON.stringify({
        themeMode: 'dark',
        accent: '#3b82f6',
        density: 'compact',
        sidebarMode: 'hidden',
        amountsHidden: false,
      }),
    );
    const store = createPreferencesStore(keyValueStore);

    await hydratePreferencesStore(store, keyValueStore);

    const state = store.getState();
    expect(state).not.toHaveProperty('accent');
    expect(state).not.toHaveProperty('density');
    // 'hidden' isn't a valid SidebarMode anymore — the picker must fall back to a real default, not carry it through.
    expect(state.sidebarMode).toBe('expanded');
    expect(state.themeMode).toBe('dark');
  });
});
