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
  });
}
