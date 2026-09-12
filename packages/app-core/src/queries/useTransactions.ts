// @repo/app-core — level 2.
// Backs Overview (MTD + recent), Transactions, and Account detail (app-core-inventory.md §4).
// `criteria` is passed straight through to the repository — filtering happens server/gateway
// side in one call, never client-side after an unfiltered fetch (repository-contracts.md).

import type { Transaction } from '@repo/domain/entities/transaction';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { keepPreviousData as keepPreviousDataFn, type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export type UseTransactionsOptions = {
  /** Settings → Categories' delete-confirm usage count: this query should only run while a
   * delete is actually pending, not on every render of a screen that merely has the capability. */
  readonly enabled?: boolean;
  /** The ledger's every committed filter change is a new criteria object, hence a new cache key —
   * without this, `data` goes briefly `undefined` on each change and the screen's `ready` gate
   * blanks the whole page. Only the ledger opts in; every other caller wants the plain behavior. */
  readonly keepPreviousData?: boolean;
};

export function useTransactions(
  criteria: TransactionCriteria,
  options: UseTransactionsOptions = {},
): UseQueryResult<readonly Transaction[]> {
  const { transactions } = useRepositories();
  return useQuery({
    queryKey: queryKeys.transactions(criteria),
    queryFn: () => unwrapResult(transactions.list(criteria)),
    enabled: options.enabled ?? true,
    ...(options.keepPreviousData ? { placeholderData: keepPreviousDataFn } : {}),
  });
}
