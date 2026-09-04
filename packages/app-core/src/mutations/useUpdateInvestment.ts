// @repo/app-core — level 2.
// Backs Investment detail's "Edit" (app-core-inventory.md §5). `current` is excluded from
// InvestmentPatch — it only ever moves through useRecordInvestmentValueSnapshot.

import type { Investment, InvestmentPatch } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpdateInvestmentInput = { readonly id: InvestmentId; readonly patch: InvestmentPatch };

export function useUpdateInvestment(): UseMutationResult<Investment, DomainError, UpdateInvestmentInput> {
  const { investments } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateInvestmentInput) => unwrapResult(investments.update(id, patch)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.investment(variables.id) });
    },
  });
}
