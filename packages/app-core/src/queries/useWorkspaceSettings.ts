// @repo/app-core — level 2.
// Backs Settings → Preferences (base currency, read-only timezone display) and the
// base-currency-conversion selector (app-core-inventory.md §4).

import type { WorkspaceSettings } from '@repo/domain/entities/workspaceSettings';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useWorkspaceSettings(): UseQueryResult<WorkspaceSettings> {
  const { workspaceSettings } = useRepositories();
  return useQuery({
    queryKey: queryKeys.workspaceSettings(),
    queryFn: () => unwrapResult(workspaceSettings.get()),
  });
}
