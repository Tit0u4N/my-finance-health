// @repo/app-core — level 2.
// Currently-scoped account ids, read by Overview, Transactions, and Recurring
// (app-core-inventory.md §3). Ephemeral — resets to "all accounts" every session, never
// persisted; a factory behind a provider for the same reasons as the preferences store.

import type { AccountId } from '@repo/domain/primitives/entityId';
import { createStore, type StoreApi } from 'zustand/vanilla';

/** `'all'` is the default scope; a concrete list is the user's explicit filter. */
export type AccountSelection = 'all' | readonly AccountId[];

export type AccountSelectionState = {
  readonly selection: AccountSelection;
  readonly setSelection: (selection: AccountSelection) => void;
};

export function createAccountSelectionStore(): StoreApi<AccountSelectionState> {
  return createStore<AccountSelectionState>((set) => ({
    selection: 'all',
    setSelection: (selection) => set({ selection }),
  }));
}
