// @repo/routes — level 3.
// The selected-account filter (screens.md's "accSel") shared by Overview, Transactions and
// Recurring — the Zustand selection store projected into criteria plus AccountFilter props.
// Extracted once a third screen needed the exact idiom useOverviewScreen.ts already had inline.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
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
    readonly triggerLabel: string;
    readonly groupLabel: string;
    readonly selectAllLabel: string;
  };
};

/** `balanceLabel` is supplied by the caller (an already-formatted string, per @repo/ui's
 * no-formatting rule) rather than computed here, since it needs `locale` and the account's own
 * currency — both already in scope at every call site. */
export function useAccountScope(
  accounts: readonly Account[],
  balanceLabel: (account: Account) => string,
): AccountScope {
  const { t } = useTranslation();
  const selection = useAccountSelectionStore((state) => state.selection);
  const setSelection = useAccountSelectionStore((state) => state.setSelection);

  const selectedIds: readonly AccountId[] = selection === 'all' ? accounts.map((a) => a.id) : selection;
  const accountIds = selection === 'all' ? undefined : selectedIds;
  const allSelected = selection === 'all';

  const accountFilterRows: AccountFilterRow[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    typeLabel: t(`common:accountType.${account.type}`),
    icon: ACCOUNT_TYPE_ICON[account.type],
    color: account.color,
    balanceLabel: balanceLabel(account),
  }));

  // Exactly one account selected shows that account's own name, not a "1 account" count — only
  // the fallback (data inconsistency: a selected id no longer in `accounts`) uses the count form.
  const singleSelectionName =
    selectedIds.length === 1 ? accounts.find((account) => account.id === selectedIds[0])?.name : undefined;
  const triggerLabel = allSelected
    ? t('common:accountFilter.allAccounts')
    : (singleSelectionName ?? t('common:accountFilter.count', { count: selectedIds.length }));

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
      triggerLabel,
      groupLabel: t('common:accountFilter.groupLabel'),
      selectAllLabel: t('common:accountFilter.selectAll'),
    },
  };
}
