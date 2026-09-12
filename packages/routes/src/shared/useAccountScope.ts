// @repo/routes — level 3.
// The selected-account filter (screens.md's "accSel") shared by Overview, Transactions and
// Recurring — the Zustand selection store projected into criteria plus AccountFilter props.
// Extracted once a third screen needed the exact idiom useOverviewScreen.ts already had inline.

import { useAccountSelectionStore } from '@repo/app-core/stores/AccountSelectionProvider';
import type { Account } from '@repo/domain/entities/account';
import type { AccountId } from '@repo/domain/primitives/entityId';
import type { AccountFilterRow } from '@repo/ui/components/AccountFilter';
import { ACCOUNT_TYPE_ICON } from './visuals';

export type AccountScope = {
  /** `undefined` when every account is in scope — pass straight through to criteria via a
   * conditional spread, never re-derived into an explicit id list of every account. */
  readonly accountIds: readonly AccountId[] | undefined;
  readonly selectedIds: readonly AccountId[];
  readonly accountFilter: {
    readonly accounts: readonly AccountFilterRow[];
    readonly selectedIds: readonly string[];
    readonly onToggle: (id: string) => void;
    readonly onSelectAll: () => void;
  };
};

/** `balanceLabel` is supplied by the caller (an already-formatted string, per @repo/ui's
 * no-formatting rule) rather than computed here, since it needs `locale` and the account's own
 * currency — both already in scope at every call site. */
export function useAccountScope(
  accounts: readonly Account[],
  balanceLabel: (account: Account) => string,
): AccountScope {
  const selection = useAccountSelectionStore((state) => state.selection);
  const setSelection = useAccountSelectionStore((state) => state.setSelection);

  const selectedIds: readonly AccountId[] = selection === 'all' ? accounts.map((a) => a.id) : selection;
  const accountIds = selection === 'all' ? undefined : selectedIds;

  const accountFilterRows: AccountFilterRow[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    typeLabel: account.type,
    icon: ACCOUNT_TYPE_ICON[account.type],
    color: account.color,
    balanceLabel: balanceLabel(account),
  }));

  return {
    accountIds,
    selectedIds,
    accountFilter: {
      accounts: accountFilterRows,
      selectedIds,
      onToggle: (id) => {
        const idAsAccountId = id as AccountId;
        const current = selection === 'all' ? accounts.map((a) => a.id) : selection;
        const next = current.includes(idAsAccountId)
          ? current.filter((x) => x !== idAsAccountId)
          : [...current, idAsAccountId];
        if (next.length > 0) {
          setSelection(next);
        }
      },
      onSelectAll: () => setSelection('all'),
    },
  };
}
