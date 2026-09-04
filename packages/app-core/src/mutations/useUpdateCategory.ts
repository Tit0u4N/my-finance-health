// @repo/app-core — level 2.
// Backs Settings → Categories (app-core-inventory.md §5).

import type { Category, CategoryPatch } from '@repo/domain/entities/category';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpdateCategoryInput = { readonly id: CategoryId; readonly patch: CategoryPatch };

export function useUpdateCategory(): UseMutationResult<Category, DomainError, UpdateCategoryInput> {
  const { categories } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateCategoryInput) => unwrapResult(categories.update(id, patch)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}
