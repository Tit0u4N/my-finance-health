// @repo/domain — level 0.
// "What day is it in the workspace's timezone" — the one implementation @repo/data and
// @repo/app-core both build on (domain-model.md decision 3: period boundaries use the
// workspace's timezone, never the opening device's). "Now" is always an explicit argument, read
// from the injected platform Clock — never `new Date()` — so every caller stays deterministic
// in tests.

import type { DateDuration } from '@internationalized/date';
import { parseAbsolute, parseDate, startOfMonth, toCalendarDate } from '@internationalized/date';
import { z } from 'zod';
import type { RecurringFrequency } from '../entities/recurringRule';
import { type IsoDate, type IsoDateTime, isoDateSchema, type Timezone } from '../primitives/dateTime';

/** Matches the range picker on Account detail / Investment detail (screens.md). A schema, not a
 * bare union, so route-level `validateSearch` (routes.md §3) can parse `?range=` against the
 * same vocabulary this module already owns, instead of redeclaring it. */
export const historyRangeSchema = z.enum(['7d', '1m', '3m', '1y', 'all']);
export type HistoryRange = z.infer<typeof historyRangeSchema>;

export type DateRange = {
  /** Inclusive lower bound. Absent for "all" — there is no meaningful start to bound by. */
  readonly start: IsoDate | undefined;
  /** Inclusive upper bound — "today" in the workspace timezone. */
  readonly end: IsoDate;
};

const toDate = (nowIso: IsoDateTime, tz: Timezone) => toCalendarDate(parseAbsolute(nowIso, tz));

/** The calendar date "now" falls on, read through the workspace timezone. */
export function todayIn(nowIso: IsoDateTime, tz: Timezone): IsoDate {
  return isoDateSchema.parse(toDate(nowIso, tz).toString());
}

/** The first day of the month "now" falls in, read through the workspace timezone. */
export function startOfMonthIn(nowIso: IsoDateTime, tz: Timezone): IsoDate {
  return isoDateSchema.parse(startOfMonth(toDate(nowIso, tz)).toString());
}

const RANGE_DURATIONS: Record<Exclude<HistoryRange, 'all'>, DateDuration> = {
  '7d': { days: 7 },
  '1m': { months: 1 },
  '3m': { months: 3 },
  '1y': { years: 1 },
};

/** Bounds a history query (getBalanceHistory / getValueHistory) so the gateway never over-fetches. */
export function rangeFor(range: HistoryRange, nowIso: IsoDateTime, tz: Timezone): DateRange {
  const end = todayIn(nowIso, tz);
  if (range === 'all') {
    return { start: undefined, end };
  }
  const start = toDate(nowIso, tz).subtract(RANGE_DURATIONS[range]);
  return { start: isoDateSchema.parse(start.toString()), end };
}

// A Record keyed by the (PascalCase) RecurringFrequency values would trip useNamingConvention,
// so this is a switch rather than a lookup table.
function frequencyDuration(freq: RecurringFrequency): DateDuration {
  switch (freq) {
    case 'Daily':
      return { days: 1 };
    case 'Weekly':
      return { weeks: 1 };
    case 'Monthly':
      return { months: 1 };
    case 'Yearly':
      return { years: 1 };
    default:
      throw new Error(`unhandled recurring frequency: ${freq satisfies never}`);
  }
}

/** Advances a date by one period of `freq` — the building block for the recurring-next-occurrence selector. */
export function addFrequency(date: IsoDate, freq: RecurringFrequency): IsoDate {
  const next = parseDate(date).add(frequencyDuration(freq));
  return isoDateSchema.parse(next.toString());
}
