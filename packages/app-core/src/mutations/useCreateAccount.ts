// @repo/app-core — level 2.
// Backs onboarding step 1 and the New account modal (app-core-inventory.md §5).

import type { Account, CreateAccountInput } from '@repo/domain/entities/account';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useCreateAccount(): UseMutationResult<Account, DomainError, CreateAccountInput> {
  const { accounts } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => unwrapResult(accounts.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    },
  });
}
