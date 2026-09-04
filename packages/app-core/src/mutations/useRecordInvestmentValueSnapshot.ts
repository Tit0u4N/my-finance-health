// @repo/app-core — level 2.
// Backs Investment detail's "Record value" (app-core-inventory.md §5). The repository batches
// the snapshot write with the Investment.current update, so this invalidates both the position
// and its history.

import type { InvestmentValueSnapshot } from '@repo/domain/entities/investmentValueSnapshot';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { DomainError } from '@repo/domain/primitives/errors';
import type { RecordValueSnapshotInput } from '@repo/domain/repositories/investmentRepository';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type RecordInvestmentValueSnapshotInput = {
  readonly id: InvestmentId;
  readonly snapshot: RecordValueSnapshotInput;
};

export function useRecordInvestmentValueSnapshot(): UseMutationResult<
  InvestmentValueSnapshot,
  DomainError,
  RecordInvestmentValueSnapshotInput
> {
  const { investments } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, snapshot }: RecordInvestmentValueSnapshotInput) =>
      unwrapResult(investments.recordValueSnapshot(id, snapshot)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.investment(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ['investments', variables.id, 'valueHistory'] });
    },
  });
}
