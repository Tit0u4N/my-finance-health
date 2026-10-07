// @repo/app-core — level 2.
// Fan-out sibling of useAccountBalanceHistory: one query per account, same cache keys. Lives here
// so a consumer (apps/mobile) never imports @tanstack/react-query itself — its own installed copy
// is a different module instance from app-core's, so `useQueries` there can't see the
// QueryClientProvider app-core mounts ("No QueryClient set").

import type { AccountId } from '@repo/domain/primitives/entityId';
import type { AccountBalancePoint } from '@repo/domain/repositories/accountRepository';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { type UseQueryResult, useQueries } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useAccountsBalanceHistory(
  ids: readonly AccountId[],
  range: HistoryRange,
): UseQueryResult<readonly AccountBalancePoint[]>[] {
  const { accounts } = useRepositories();
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.accountBalanceHistory(id, range),
      queryFn: () => unwrapResult(accounts.getBalanceHistory(id, range)),
    })),
  });
}
