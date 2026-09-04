// @repo/app-core — level 2.
// Backs onboarding step 2 (batched create) and Settings → Categories (app-core-inventory.md §5).

import type { Category, CreateCategoryInput } from '@repo/domain/entities/category';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useCreateCategory(): UseMutationResult<Category, DomainError, CreateCategoryInput> {
  const { categories } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => unwrapResult(categories.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}
