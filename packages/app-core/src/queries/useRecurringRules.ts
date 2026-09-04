// @repo/app-core — level 2.
// Backs Overview (upcoming) and Recurring (app-core-inventory.md §4).

import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { RecurringRuleCriteria } from '@repo/domain/repositories/criteria';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useRecurringRules(criteria: RecurringRuleCriteria): UseQueryResult<readonly RecurringRule[]> {
  const { recurringRules } = useRepositories();
  return useQuery({
    queryKey: queryKeys.recurringRules(criteria),
    queryFn: () => unwrapResult(recurringRules.list(criteria)),
  });
}
