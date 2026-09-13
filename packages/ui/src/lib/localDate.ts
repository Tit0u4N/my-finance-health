/** react-day-picker (Calendar) operates on local-time `Date` objects; every date-bearing prop in
 * this codebase is a bare `"YYYY-MM-DD"` string (`@repo/domain`'s `IsoDate`, which `@repo/ui` may
 * not import — see the DatePicker header comment). These two helpers are the only place the two
 * representations cross, and they must stay local-time on both sides: `new Date('2026-09-13')`
 * parses as UTC midnight, which renders as the 12th in any negative-offset timezone. */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toLocalDate(isoDate: string): Date | undefined {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) {
    return undefined;
  }
  const [, yearText, monthText, dayText] = match as unknown as [string, string, string, string];
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);
  // Guards against '2026-02-30': Date rolls it into March, which would silently pick the wrong day.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
