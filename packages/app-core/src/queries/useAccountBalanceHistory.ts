// @repo/app-core — level 2.
// Backs Account detail's trend, Overview's per-account sparkline, and the Accounts card's
// 30-day delta (app-core-inventory.md §4).

import type { AccountId } from '@repo/domain/primitives/entityId';
import type { AccountBalancePoint } from '@repo/domain/repositories/accountRepository';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useAccountBalanceHistory(
  id: AccountId,
  range: HistoryRange,
): UseQueryResult<readonly AccountBalancePoint[]> {
  const { accounts } = useRepositories();
  return useQuery({
    queryKey: queryKeys.accountBalanceHistory(id, range),
    queryFn: () => unwrapResult(accounts.getBalanceHistory(id, range)),
  });
}
