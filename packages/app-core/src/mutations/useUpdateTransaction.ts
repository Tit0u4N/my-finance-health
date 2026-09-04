// @repo/app-core — level 2.
// Backs the Transactions ledger's edit action (app-core-inventory.md §5). A patch can move the
// account balance (amount changed) or move it between two accounts (acc changed), so this
// invalidates accounts too, not just transactions.

import type { Transaction, TransactionPatch } from '@repo/domain/entities/transaction';
import type { TransactionId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpdateTransactionInput = { readonly id: TransactionId; readonly patch: TransactionPatch };

export function useUpdateTransaction(): UseMutationResult<Transaction, DomainError, UpdateTransactionInput> {
  const { transactions } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateTransactionInput) => unwrapResult(transactions.update(id, patch)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    },
  });
}
