// Pure helpers shared by useAccountsScreen.ts and useAccountDetailScreen.ts — extracted the same
// way ledgerCriteria.ts/groupTransactionsByDay.ts were, so they get a real unit test instead of
// living inline in a ViewModel that needs providers to render.

import type { AccountId, CategoryId } from '@repo/domain/primitives/entityId';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import type { HistoryRange } from '@repo/domain/time/workspaceTime';

export type AccountDetailFilters = {
  readonly text: string;
  /** `'all'` or a `CategoryId` — a plain string, so a stale id yields zero rows instead of an error. */
  readonly category: string;
};

export const EMPTY_ACCOUNT_DETAIL_FILTERS: AccountDetailFilters = { category: 'all', text: '' };

/**
 * This account's transactions, filtered and newest first — no date bound: the transaction list is
 * shown in full, not range-scoped (the range picker only ever drives the trend chart). Mirrors
 * packages/routes/src/accounts/accountSearch.ts's `accountTransactionsCriteria` minus its zod
 * search-param schema — there is no URL to validate against on mobile, so both the range and these
 * filters live in local `useState` instead (`useLedgerTab.ts`'s docblock already made the same
 * call), and adds the search/category filters `useLedgerTab.ts`'s `ledgerCriteria` already applies
 * server-side rather than after the fetch.
 */
export function accountTransactionsCriteria(
  id: AccountId,
  filters: AccountDetailFilters = EMPTY_ACCOUNT_DETAIL_FILTERS,
): TransactionCriteria {
  const text = filters.text.trim();
  return {
    accountIds: [id],
    ...(text === '' ? {} : { text }),
    ...(filters.category === 'all' ? {} : { categoryId: filters.category as CategoryId }),
    sort: { direction: 'desc', key: 'date' },
  };
}

/** Whether anything is narrowing the transaction list — drives the empty state's wording. */
export function isAccountDetailFiltered(filters: AccountDetailFilters): boolean {
  return filters.text.trim() !== '' || filters.category !== 'all';
}

// Only 7d and 1m get their own translation key — 3m/1y/all all resolve to the same "Past period"
// key, matching desktop's useAccountDetailScreen.ts RANGE_CAPTION_KEY shape exactly.
const RANGE_CAPTION_KEY: Record<
  HistoryRange,
  'accounts:detail.pastPeriod7d' | 'accounts:detail.pastPeriodMonth' | 'accounts:detail.pastPeriodOther'
> = {
  '1m': 'accounts:detail.pastPeriodMonth',
  '1y': 'accounts:detail.pastPeriodOther',
  '3m': 'accounts:detail.pastPeriodOther',
  '7d': 'accounts:detail.pastPeriod7d',
  all: 'accounts:detail.pastPeriodOther',
};

export function rangeCaptionKey(range: HistoryRange): (typeof RANGE_CAPTION_KEY)[HistoryRange] {
  return RANGE_CAPTION_KEY[range];
}
