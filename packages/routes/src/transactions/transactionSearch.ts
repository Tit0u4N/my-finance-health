// @repo/routes — level 3.
// The ledger's search params (routes.md §3: "the whole point of a ledger screen is
// sharing/returning to a specific filtered view"). Defined once so routeTree.ts's loader and
// useTransactionsScreen's useTransactions call can never disagree — the criteria object is
// itself part of the cache key.

import type { AccountId, CategoryId } from '@repo/domain/primitives/entityId';
import type { TransactionCriteria, TransactionSortKey } from '@repo/domain/repositories/criteria';
import { z } from 'zod';

export const ledgerTypeSchema = z.enum(['all', 'income', 'expense']);
export type LedgerType = z.infer<typeof ledgerTypeSchema>;

// One enum covering all four valid combinations, rather than separate sort-key/direction
// params — `.catch` then covers garbage totally, with no need to validate the pair together.
export const ledgerSortSchema = z.enum(['date:desc', 'date:asc', 'amount:desc', 'amount:asc']);
export type LedgerSort = z.infer<typeof ledgerSortSchema>;

/** `q` rather than `search` — avoids a `search.search` field name on the parsed object.
 * `category` stays a plain string (not a branded CategoryId) so an unknown/stale id just yields
 * zero rows instead of a router error. */
export const transactionsSearchSchema = z.object({
  q: z.string().catch('').default(''),
  type: ledgerTypeSchema.catch('all').default('all'),
  category: z.string().catch('all').default('all'),
  sort: ledgerSortSchema.catch('date:desc').default('date:desc'),
});
export type TransactionsSearch = z.infer<typeof transactionsSearchSchema>;

export function parseLedgerSort(sort: LedgerSort): { key: TransactionSortKey; direction: 'asc' | 'desc' } {
  const [key, direction] = sort.split(':') as [TransactionSortKey, 'asc' | 'desc'];
  return { key, direction };
}

/** The one criteria builder — loader (no account scope, it can't reach the selection store) and
 * screen (full scope) both call it, so their cache keys can never drift apart. Every absent
 * filter is omitted by conditional spread, never set to `undefined` or `''`: React Query's
 * `hashKey` treats `{text:''}` and `{}` as different keys. */
export function ledgerCriteria(
  search: TransactionsSearch,
  accountIds: readonly AccountId[] | undefined,
): TransactionCriteria {
  const text = search.q.trim();
  return {
    ...(accountIds === undefined ? {} : { accountIds }),
    ...(text === '' ? {} : { text }),
    ...(search.type === 'all' ? {} : { amountSign: search.type === 'income' ? 'positive' : 'negative' }),
    ...(search.category === 'all' ? {} : { categoryId: search.category as CategoryId }),
    sort: parseLedgerSort(search.sort),
  };
}
