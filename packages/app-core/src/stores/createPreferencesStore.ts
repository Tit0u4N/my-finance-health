// @repo/app-core — level 2.
// Device-local display settings, persisted straight through the platform key-value contract —
// never a repository, never a journal entry (open-questions.md #4). A factory behind a
// provider, never a module singleton: test isolation, platform injection, and desktop
// multi-window each need their own instance (start-roadmap.md §5).

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import { createStore, type StoreApi } from 'zustand/vanilla';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

export type PersistedPreferences = {
  readonly themeMode: ThemeMode;
  readonly accent: string;
  readonly density: Density;
  readonly sidebarMode: SidebarMode;
  readonly amountsHidden: boolean;
};

export type PreferencesState = PersistedPreferences & {
  readonly setThemeMode: (themeMode: ThemeMode) => void;
  readonly setAccent: (accent: string) => void;
  readonly setDensity: (density: Density) => void;
  readonly setSidebarMode: (sidebarMode: SidebarMode) => void;
  readonly toggleAmountsHidden: () => void;
};

const PREFERENCES_KEY = 'preferences';

const DEFAULT_PREFERENCES: PersistedPreferences = {
  themeMode: 'system',
  accent: '#3b82f6',
  density: 'comfortable',
  sidebarMode: 'expanded',
  amountsHidden: false,
};

function toPersisted(state: PreferencesState): PersistedPreferences {
  return {
    themeMode: state.themeMode,
    accent: state.accent,
    density: state.density,
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
    setAccent: (accent) => {
      set({ accent });
      persist(get());
    },
    setDensity: (density) => {
      set({ density });
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

/** Loads a previously-persisted snapshot into an existing store; a missing or corrupt value keeps the defaults. */
export async function hydratePreferencesStore(
  store: StoreApi<PreferencesState>,
  keyValueStore: KeyValueStore,
): Promise<void> {
  const raw = await keyValueStore.get(PREFERENCES_KEY);
  if (raw === null) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPreferences>;
    store.setState(parsed);
  } catch {
    // Corrupt value — keep the defaults already in the store rather than failing bootstrap over a display setting.
  }
}
