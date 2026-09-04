// @repo/app-core — level 2.
// Overview's "Upcoming" panel. Account scoping already happened one layer down, in the
// `useRecurringRules({ accountIds })` criteria — this selector only sorts and caps.

import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { compareIsoDate } from '@repo/domain/primitives/dateTime';
import { computeNextOccurrence } from './recurringNextOccurrence';

export type UpcomingRecurringEntry = {
  readonly rule: RecurringRule;
  readonly nextOccurrence: IsoDate;
};

export function computeUpcomingRecurring(
  rules: readonly RecurringRule[],
  today: IsoDate,
  limit: number,
): readonly UpcomingRecurringEntry[] {
  return rules
    .filter((rule) => rule.active)
    .map((rule) => ({ rule, nextOccurrence: computeNextOccurrence(rule, today) }))
    .sort((a, b) => compareIsoDate(a.nextOccurrence, b.nextOccurrence))
    .slice(0, limit);
}
