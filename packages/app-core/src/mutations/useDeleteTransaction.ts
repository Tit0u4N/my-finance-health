// @repo/app-core — level 2.
// Backs the Transactions ledger's delete action (app-core-inventory.md §5).

import type { TransactionId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useDeleteTransaction(): UseMutationResult<true, DomainError, TransactionId> {
  const { transactions } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: TransactionId) => unwrapResult(transactions.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    },
  });
}
