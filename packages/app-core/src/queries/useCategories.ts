// @repo/app-core — level 2.
// Backs every screen with a category picker or breakdown, and onboarding step 2
// (app-core-inventory.md §4).

import type { Category } from '@repo/domain/entities/category';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useCategories(): UseQueryResult<readonly Category[]> {
  const { categories } = useRepositories();
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => unwrapResult(categories.list()),
  });
}
