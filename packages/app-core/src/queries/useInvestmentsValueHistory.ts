// @repo/app-core — level 2.
// Fan-out sibling of useInvestmentValueHistory: one query per position, same cache keys. Lives here
// for the same reason useAccountsBalanceHistory does — apps/mobile must not import
// @tanstack/react-query itself, its copy can't see the QueryClientProvider app-core mounts.

import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';
import { type UseQueryResult, useQueries } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useInvestmentsValueHistory(
  ids: readonly InvestmentId[],
  range: HistoryRange,
): UseQueryResult<readonly InvestmentValuePoint[]>[] {
  const { investments } = useRepositories();
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.investmentValueHistory(id, range),
      queryFn: () => unwrapResult(investments.getValueHistory(id, range)),
    })),
  });
}
