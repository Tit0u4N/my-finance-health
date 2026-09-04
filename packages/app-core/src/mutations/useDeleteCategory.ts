// @repo/app-core — level 2.
// Backs Settings → Categories (app-core-inventory.md §5).

import type { CategoryId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useDeleteCategory(): UseMutationResult<true, DomainError, CategoryId> {
  const { categories } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: CategoryId) => unwrapResult(categories.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}
