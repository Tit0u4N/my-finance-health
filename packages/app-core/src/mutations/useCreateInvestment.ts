// @repo/app-core — level 2.
// Backs Investments' "Add position" (app-core-inventory.md §5).

import type { CreateInvestmentInput, Investment } from '@repo/domain/entities/investment';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useCreateInvestment(): UseMutationResult<Investment, DomainError, CreateInvestmentInput> {
  const { investments } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvestmentInput) => unwrapResult(investments.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
    },
  });
}
