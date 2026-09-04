// @repo/app-core — level 2.
// Backs the New recurring modal (app-core-inventory.md §5).

import type { CreateRecurringRuleInput, RecurringRule } from '@repo/domain/entities/recurringRule';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useCreateRecurringRule(): UseMutationResult<RecurringRule, DomainError, CreateRecurringRuleInput> {
  const { recurringRules } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringRuleInput) => unwrapResult(recurringRules.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurringRulesRoot() });
    },
  });
}
