// @repo/app-core — level 2.
// Backs the Investments list (app-core-inventory.md §4).

import type { Investment } from '@repo/domain/entities/investment';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useInvestments(): UseQueryResult<readonly Investment[]> {
  const { investments } = useRepositories();
  return useQuery({
    queryKey: queryKeys.investments(),
    queryFn: () => unwrapResult(investments.list()),
  });
}
