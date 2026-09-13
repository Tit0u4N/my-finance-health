import { type IsoDate, type IsoDateTime, isoDateTimeSchema } from '@repo/domain/primitives/dateTime';

// UTC-midnight of the calendar date — approximate, not workspace-timezone-exact (unlike
// `computeBalanceHistory`, which compares calendar dates directly and sidesteps this). Acceptable
// wherever this only bounds a query so it stays a single, cheap fetch — a selector's own precise
// clipping is what actually shapes the result.
export function startOfDayIso(date: IsoDate): IsoDateTime {
  return isoDateTimeSchema.parse(`${date}T00:00:00.000Z`);
}
