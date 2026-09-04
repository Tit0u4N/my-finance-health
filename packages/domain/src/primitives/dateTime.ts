// @repo/domain — level 0.
// Branded string wrappers around the three date shapes the domain distinguishes. Calendar
// arithmetic against a workspace timezone lives in time/workspaceTime.ts, built on top of these.

import { z } from 'zod';

/** Calendar date only, no time-of-day — "YYYY-MM-DD". */
export const isoDateSchema = z.iso.date().brand<'IsoDate'>();
export type IsoDate = z.infer<typeof isoDateSchema>;

/** A full instant, with an explicit UTC offset. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true }).brand<'IsoDateTime'>();
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;

/** IANA timezone identifier, e.g. "Europe/Paris". Validated structurally, not against the tz database. */
export const timezoneSchema = z.string().min(1).brand<'Timezone'>();
export type Timezone = z.infer<typeof timezoneSchema>;

const compareStrings = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

export const compareIsoDateTime = (a: IsoDateTime, b: IsoDateTime): number => compareStrings(a, b);
export const compareIsoDate = (a: IsoDate, b: IsoDate): number => compareStrings(a, b);
