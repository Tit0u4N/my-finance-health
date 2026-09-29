// The Activity tab's ledger filters. Mirrors packages/routes/src/transactions/transactionSearch.ts's
// `ledgerCriteria` — same criteria shape, same conditional-spread discipline — but fed by
// per-screen `useState` instead of typed router search params: mobile has no shareable URL to
// round-trip a filtered view through, and the mock draws its own account chip rather than reusing a
// cross-screen account scope (docs/spec/screens-mobile.md).

import type { AccountId, CategoryId } from '@repo/domain/primitives/entityId';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';

export type LedgerType = 'all' | 'income' | 'expense';

export type LedgerFilters = {
  readonly text: string;
  readonly type: LedgerType;
  /** `'all'` or a `CategoryId` — a plain string, so a stale id yields zero rows instead of an error. */
  readonly category: string;
  /** `'all'` or an `AccountId`. */
  readonly account: string;
};

export const EMPTY_LEDGER_FILTERS: LedgerFilters = { account: 'all', category: 'all', text: '', type: 'all' };

/**
 * Every absent filter is omitted by conditional spread, never set to `undefined` or `''`: React
 * Query's `hashKey` treats `{ text: '' }` and `{}` as different cache keys, so a "cleared" filter
 * that still emitted its key would refetch against a second, permanently-cold entry.
 *
 * The sort is fixed at `date:desc` — the mobile ledger has no sort control, and
 * `groupTransactionsByDay` relies on the rows arriving newest-first.
 */
export function ledgerCriteria(filters: LedgerFilters): TransactionCriteria {
  const text = filters.text.trim();
  return {
    ...(filters.account === 'all' ? {} : { accountIds: [filters.account as AccountId] }),
    ...(text === '' ? {} : { text }),
    ...(filters.type === 'all' ? {} : { amountSign: filters.type === 'income' ? 'positive' : 'negative' }),
    ...(filters.category === 'all' ? {} : { categoryId: filters.category as CategoryId }),
    sort: { direction: 'desc', key: 'date' },
  };
}

/** Whether anything is narrowing the list — drives the "Clear" chip and the empty state's wording. */
export function isLedgerFiltered(filters: LedgerFilters): boolean {
  return (
    filters.text.trim() !== '' || filters.type !== 'all' || filters.category !== 'all' || filters.account !== 'all'
  );
}
