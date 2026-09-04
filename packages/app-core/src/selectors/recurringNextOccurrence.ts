// @repo/app-core — level 2.
// Replaces the mock's stored `next` field (open-questions.md #7, domain-model.md). `today` is
// always an explicit argument — computed via @repo/domain's `todayIn(now, timezone)` — never
// read from the device clock directly, so this stays deterministic in tests and correct across
// devices in different timezones opening the same workspace.

import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { compareIsoDate } from '@repo/domain/primitives/dateTime';
import { addFrequency } from '@repo/domain/time/workspaceTime';

/** The first occurrence on or after `today` — advances one period at a time from `startDate`. */
export function computeNextOccurrence(rule: RecurringRule, today: IsoDate): IsoDate {
  let candidate = rule.startDate;
  while (compareIsoDate(candidate, today) < 0) {
    candidate = addFrequency(candidate, rule.freq);
  }
  return candidate;
}
