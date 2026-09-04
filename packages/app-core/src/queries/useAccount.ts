// @repo/app-core — level 2.
// Backs Account detail (app-core-inventory.md §4).

import type { Account } from '@repo/domain/entities/account';
import type { AccountId } from '@repo/domain/primitives/entityId';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useAccount(id: AccountId): UseQueryResult<Account> {
  const { accounts } = useRepositories();
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => unwrapResult(accounts.getById(id)),
  });
}
