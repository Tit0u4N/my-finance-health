// @repo/app-core — level 2.
// Backs Investment detail's price-history panel and snapshot table (app-core-inventory.md §4).

import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useInvestmentValueHistory(
  id: InvestmentId,
  range: HistoryRange,
): UseQueryResult<readonly InvestmentValuePoint[]> {
  const { investments } = useRepositories();
  return useQuery({
    queryKey: queryKeys.investmentValueHistory(id, range),
    queryFn: () => unwrapResult(investments.getValueHistory(id, range)),
  });
}
