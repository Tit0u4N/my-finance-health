// @repo/app-core — level 2.
// Backs Overview (MTD + recent), Transactions, and Account detail (app-core-inventory.md §4).
// `criteria` is passed straight through to the repository — filtering happens server/gateway
// side in one call, never client-side after an unfiltered fetch (repository-contracts.md).

import type { Transaction } from '@repo/domain/entities/transaction';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useTransactions(criteria: TransactionCriteria): UseQueryResult<readonly Transaction[]> {
  const { transactions } = useRepositories();
  return useQuery({
    queryKey: queryKeys.transactions(criteria),
    queryFn: () => unwrapResult(transactions.list(criteria)),
  });
}
