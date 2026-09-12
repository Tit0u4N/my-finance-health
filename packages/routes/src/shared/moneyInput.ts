// @repo/routes — level 3.
// Parses a free-text amount input (comma or dot decimals) into major units, shared by the
// account/transaction/recurring creation forms. Extracted from useAccountsScreen.ts once a
// second form needed the identical parse.

/** Trims and normalizes a comma decimal to a dot; `undefined` when the result isn't a finite number. */
export function parseAmountInput(text: string): number | undefined {
  const parsed = Number(text.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Major units (e.g. euros) to minor units (cents), rounded to the nearest integer. */
export function toMinorUnits(major: number): number {
  return Math.round(major * 100);
}
