// @repo/app-core — level 2.
// Backs the Recurring screen's active toggle and any edit (app-core-inventory.md §5) — one
// operation for both, since RecurringRulePatch is already fully partial.

import type { RecurringRule, RecurringRulePatch } from '@repo/domain/entities/recurringRule';
import type { RecurringRuleId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpdateRecurringRuleInput = { readonly id: RecurringRuleId; readonly patch: RecurringRulePatch };

export function useUpdateRecurringRule(): UseMutationResult<RecurringRule, DomainError, UpdateRecurringRuleInput> {
  const { recurringRules } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateRecurringRuleInput) => unwrapResult(recurringRules.update(id, patch)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurringRulesRoot() });
    },
  });
}
