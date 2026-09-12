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
    // A missing id is a deterministic "no such record" error, not a transient one — Account
    // detail's not-found guard (useAccountDetailScreen.ts) reads accountQuery.isError to render
    // "Not found", and the default 3-retry backoff would leave that screen stuck on its loading
    // state for several seconds first.
    retry: false,
  });
}
