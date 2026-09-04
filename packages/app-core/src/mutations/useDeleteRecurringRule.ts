// @repo/app-core — level 2.
// Backs the Recurring screen's delete action (app-core-inventory.md §5).

import type { RecurringRuleId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useDeleteRecurringRule(): UseMutationResult<true, DomainError, RecurringRuleId> {
  const { recurringRules } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: RecurringRuleId) => unwrapResult(recurringRules.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurringRulesRoot() });
    },
  });
}
