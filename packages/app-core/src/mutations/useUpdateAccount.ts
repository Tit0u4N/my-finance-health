// @repo/app-core — level 2.
// Backs Account detail's "Edit" (app-core-inventory.md §5).

import type { Account, AccountPatch } from '@repo/domain/entities/account';
import type { AccountId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpdateAccountInput = { readonly id: AccountId; readonly patch: AccountPatch };

export function useUpdateAccount(): UseMutationResult<Account, DomainError, UpdateAccountInput> {
  const { accounts } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateAccountInput) => unwrapResult(accounts.update(id, patch)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account(variables.id) });
    },
  });
}
