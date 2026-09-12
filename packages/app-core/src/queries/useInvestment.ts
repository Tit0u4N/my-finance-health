// @repo/app-core — level 2.
// Backs Investment detail (app-core-inventory.md §4).

import type { Investment } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useInvestment(id: InvestmentId): UseQueryResult<Investment> {
  const { investments } = useRepositories();
  return useQuery({
    queryKey: queryKeys.investment(id),
    queryFn: () => unwrapResult(investments.getById(id)),
    // A missing id is a deterministic "no such record" error, not a transient one — Investment
    // detail's not-found guard (useInvestmentDetailScreen.ts) reads investmentQuery.isError to
    // render "Not found", and the default 3-retry backoff would leave that screen stuck on its
    // loading state for several seconds first (useAccount.ts's identical fix).
    retry: false,
  });
}
