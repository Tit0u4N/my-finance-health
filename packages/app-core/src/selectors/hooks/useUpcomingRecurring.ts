// @repo/app-core — level 2.
// Composes recurring rules with the workspace's "today" (via its timezone) — Overview's
// "Upcoming" panel (app-core-inventory.md §6).

import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { RecurringRuleCriteria } from '@repo/domain/repositories/criteria';
import { todayIn } from '@repo/domain/time/workspaceTime';
import { usePlatform } from '../../providers/usePlatform';
import { useRecurringRules } from '../../queries/useRecurringRules';
import { useWorkspaceSettings } from '../../queries/useWorkspaceSettings';
import { computeUpcomingRecurring, type UpcomingRecurringEntry } from '../upcomingRecurring';

export type UseUpcomingRecurringResult = {
  readonly entries: readonly UpcomingRecurringEntry[] | undefined;
  readonly isLoading: boolean;
};

export function useUpcomingRecurring(criteria: RecurringRuleCriteria, limit: number): UseUpcomingRecurringResult {
  const platform = usePlatform();
  const rulesQuery = useRecurringRules(criteria);
  const settingsQuery = useWorkspaceSettings();
  const isLoading = rulesQuery.isLoading || settingsQuery.isLoading;

  if (!(rulesQuery.data && settingsQuery.data)) {
    return { entries: undefined, isLoading };
  }

  const today = todayIn(isoDateTimeSchema.parse(platform.clock.now()), settingsQuery.data.timezone);
  return { entries: computeUpcomingRecurring(rulesQuery.data, today, limit), isLoading };
}
