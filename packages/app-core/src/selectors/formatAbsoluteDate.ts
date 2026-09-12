// @repo/app-core — level 2.
// Absolute date display for the ledger's Date column and Recurring's "Next" column — a relative
// label ("3 days ago") is unreadable once the ledger is sorted by amount instead of date.

import type { IsoDate } from '@repo/domain/primitives/dateTime';

export type FormatAbsoluteDateOptions = {
  readonly withYear?: boolean;
};

/** `timeZone: 'UTC'` is load-bearing, not cosmetic: `date` is a bare calendar day with no time
 * component, so parsing it as a Date and formatting through the host's local timezone can shift
 * the displayed day by one (a host west of UTC reads "2026-09-01" back as "Aug 31"). */
export function formatAbsoluteDate(date: IsoDate, locale: string, options: FormatAbsoluteDateOptions = {}): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(options.withYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  });
  return formatter.format(new Date(`${date}T00:00:00.000Z`));
}
