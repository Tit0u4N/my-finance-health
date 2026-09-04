// @repo/app-core — level 2.

import { createContext, type ReactElement, type ReactNode, useContext, useEffect, useState } from 'react';
import { useStore } from 'zustand/react';
import type { StoreApi } from 'zustand/vanilla';
import { usePlatform } from '../providers/usePlatform';
import { createPreferencesStore, hydratePreferencesStore, type PreferencesState } from './createPreferencesStore';

const PreferencesStoreContext = createContext<StoreApi<PreferencesState> | null>(null);

export type PreferencesProviderProps = { readonly children: ReactNode };

export function PreferencesProvider({ children }: PreferencesProviderProps): ReactElement {
  const platform = usePlatform();
  const [store] = useState(() => createPreferencesStore(platform.keyValueStore));

  useEffect(() => {
    void hydratePreferencesStore(store, platform.keyValueStore);
  }, [store, platform.keyValueStore]);

  return <PreferencesStoreContext.Provider value={store}>{children}</PreferencesStoreContext.Provider>;
}

export function usePreferencesStore<T>(selector: (state: PreferencesState) => T): T {
  const store = useContext(PreferencesStoreContext);
  if (!store) {
    throw new Error('usePreferencesStore must be called within a PreferencesProvider');
  }
  return useStore(store, selector);
}
