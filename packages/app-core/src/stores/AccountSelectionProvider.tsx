// @repo/app-core — level 2.

import { createContext, type ReactElement, type ReactNode, useContext, useState } from 'react';
import { useStore } from 'zustand/react';
import type { StoreApi } from 'zustand/vanilla';
import { type AccountSelectionState, createAccountSelectionStore } from './createAccountSelectionStore';

const AccountSelectionStoreContext = createContext<StoreApi<AccountSelectionState> | null>(null);

export type AccountSelectionProviderProps = { readonly children: ReactNode };

export function AccountSelectionProvider({ children }: AccountSelectionProviderProps): ReactElement {
  const [store] = useState(() => createAccountSelectionStore());

  return <AccountSelectionStoreContext.Provider value={store}>{children}</AccountSelectionStoreContext.Provider>;
}

export function useAccountSelectionStore<T>(selector: (state: AccountSelectionState) => T): T {
  const store = useContext(AccountSelectionStoreContext);
  if (!store) {
    throw new Error('useAccountSelectionStore must be called within an AccountSelectionProvider');
  }
  return useStore(store, selector);
}
