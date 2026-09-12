// @repo/app-core — level 2.
// Device-local display settings, persisted straight through the platform key-value contract —
// never a repository, never a journal entry (open-questions.md #4). A factory behind a
// provider, never a module singleton: test isolation, platform injection, and desktop
// multi-window each need their own instance (start-roadmap.md §5).

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import { createStore, type StoreApi } from 'zustand/vanilla';

export type ThemeMode = 'light' | 'dark' | 'system';
// 'hidden' dropped alongside accent/density below — Settings → Preferences ships exactly two
// sidebar options (Expanded / Icons only, ui-inventory.md's OptionGrid row), and no screen or
// consumer ever reads a third state (open-questions.md #11's "not an evidenced product feature").
export type SidebarMode = 'expanded' | 'collapsed';

export type PersistedPreferences = {
  readonly themeMode: ThemeMode;
  readonly sidebarMode: SidebarMode;
  readonly amountsHidden: boolean;
};

export type PreferencesState = PersistedPreferences & {
  readonly setThemeMode: (themeMode: ThemeMode) => void;
  readonly setSidebarMode: (sidebarMode: SidebarMode) => void;
  readonly toggleAmountsHidden: () => void;
};

const PREFERENCES_KEY = 'preferences';

const DEFAULT_PREFERENCES: PersistedPreferences = {
  themeMode: 'system',
  sidebarMode: 'expanded',
  amountsHidden: false,
};

function toPersisted(state: PreferencesState): PersistedPreferences {
  return {
    themeMode: state.themeMode,
    sidebarMode: state.sidebarMode,
    amountsHidden: state.amountsHidden,
  };
}

export function createPreferencesStore(keyValueStore: KeyValueStore): StoreApi<PreferencesState> {
  const persist = (state: PreferencesState): void => {
    void keyValueStore.set(PREFERENCES_KEY, JSON.stringify(toPersisted(state)));
  };

  return createStore<PreferencesState>((set, get) => ({
    ...DEFAULT_PREFERENCES,
    setThemeMode: (themeMode) => {
      set({ themeMode });
      persist(get());
    },
    setSidebarMode: (sidebarMode) => {
      set({ sidebarMode });
      persist(get());
    },
    toggleAmountsHidden: () => {
      set((state) => ({ amountsHidden: !state.amountsHidden }));
      persist(get());
    },
  }));
}

/** Loads a previously-persisted snapshot into an existing store; a missing or corrupt value keeps the defaults.
 * Picks only the known `PersistedPreferences` keys out of the parsed JSON rather than merging it wholesale —
 * a blob written by an older build (accent/density/sidebarMode:'hidden') must not re-inject a since-removed
 * field into an otherwise-current store. */
export async function hydratePreferencesStore(
  store: StoreApi<PreferencesState>,
  keyValueStore: KeyValueStore,
): Promise<void> {
  const raw = await keyValueStore.get(PREFERENCES_KEY);
  if (raw === null) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof PersistedPreferences, unknown>>;
    const themeMode =
      parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system'
        ? parsed.themeMode
        : undefined;
    const sidebarMode =
      parsed.sidebarMode === 'expanded' || parsed.sidebarMode === 'collapsed' ? parsed.sidebarMode : undefined;
    const amountsHidden = typeof parsed.amountsHidden === 'boolean' ? parsed.amountsHidden : undefined;
    store.setState({
      ...(themeMode !== undefined && { themeMode }),
      ...(sidebarMode !== undefined && { sidebarMode }),
      ...(amountsHidden !== undefined && { amountsHidden }),
    });
  } catch {
    // Corrupt value — keep the defaults already in the store rather than failing bootstrap over a display setting.
  }
}
