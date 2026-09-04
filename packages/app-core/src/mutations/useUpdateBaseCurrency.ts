// @repo/app-core — level 2.
// Backs Settings → Preferences. Always through the repository, so the journal-before-database
// rule is never bypassed by a shortcut (app-core-inventory.md §5).

import type { WorkspaceSettings } from '@repo/domain/entities/workspaceSettings';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { DomainError } from '@repo/domain/primitives/errors';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export function useUpdateBaseCurrency(): UseMutationResult<WorkspaceSettings, DomainError, CurrencyCode> {
  const { workspaceSettings } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currency: CurrencyCode) => unwrapResult(workspaceSettings.setBaseCurrency(currency)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaceSettings() });
    },
  });
}
