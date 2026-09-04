// @repo/app-core — level 2.
// Backs transaction/recurring rows and the upcoming list (app-core-inventory.md §6) — same
// split as formatMoney: the logic here, the pixels in @repo/ui/native. Built on `Intl`, so exact
// wording follows the runtime's CLDR data rather than the mock's hand-rolled "3d ago" / "in 2w"
// abbreviations; the distance computed (today/yesterday/in N days/weeks/...) is the same.

import type { IsoDate } from '@repo/domain/primitives/dateTime';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function toUtcMidnightMs(date: IsoDate): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

/** Whole days from `from` to `to` — positive when `to` is later. Both are plain calendar dates, so this is exact. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMidnightMs(to) - toUtcMidnightMs(from)) / MS_PER_DAY);
}

export function formatRelativeDate(date: IsoDate, today: IsoDate, locale: string): string {
  const diffDays = daysBetween(today, date);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const magnitude = Math.abs(diffDays);

  if (magnitude < DAYS_PER_WEEK) {
    return rtf.format(diffDays, 'day');
  }
  if (magnitude < DAYS_PER_MONTH) {
    return rtf.format(Math.round(diffDays / DAYS_PER_WEEK), 'week');
  }
  if (magnitude < DAYS_PER_YEAR) {
    return rtf.format(Math.round(diffDays / DAYS_PER_MONTH), 'month');
  }
  return rtf.format(Math.round(diffDays / DAYS_PER_YEAR), 'year');
}
