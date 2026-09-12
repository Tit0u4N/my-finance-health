// @repo/app-core — level 2.
// Backs Investments' row delete and Investment detail's delete action (app-core-inventory.md §5).
// Cascades to the position's value snapshots at the repository layer, in one batch — nothing to
// invalidate here for the snapshot query, since it can no longer be reached for a deleted id.

import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useDeleteInvestment(): UseMutationResult<true, DomainError, InvestmentId> {
  const { investments } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: InvestmentId) => unwrapResult(investments.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
    },
  });
}
