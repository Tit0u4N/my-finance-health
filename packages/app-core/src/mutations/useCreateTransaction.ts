// @repo/app-core — level 2.
// Backs the New transaction modal (app-core-inventory.md §5). A transaction write always moves
// an account balance too (transactionRepository.ts), so this invalidates both.

import type { CreateTransactionInput, Transaction } from '@repo/domain/entities/transaction';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useCreateTransaction(): UseMutationResult<Transaction, DomainError, CreateTransactionInput> {
  const { transactions } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => unwrapResult(transactions.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    },
  });
}
