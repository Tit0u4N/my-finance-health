// @repo/app-core — level 2.
// Backs Overview, Accounts, the account filter, and the New transaction/recurring modals
// (app-core-inventory.md §4).

import type { Account } from '@repo/domain/entities/account';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useAccounts(): UseQueryResult<readonly Account[]> {
  const { accounts } = useRepositories();
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: () => unwrapResult(accounts.list()),
  });
}
