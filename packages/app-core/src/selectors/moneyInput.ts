// Parses a free-text amount input (comma or dot decimals) into major units, shared by every
// amount-entry form across every target. Moved here from @repo/routes/src/shared/moneyInput.ts
// (2026-09-28 mobile Activity pass) once apps/mobile needed the identical parse and could not
// import a level-3, DOM-only package — pure functions with no DOM belong in the core (CLAUDE.md
// principle 4).

/**
 * Trims and normalizes a comma decimal to a dot; `undefined` when the text doesn't denote a number.
 *
 * Blank input is `undefined`, not `0`: `Number('')` is `0`, so without the explicit guard an
 * untouched amount field reads back as a deliberate zero and sails through every
 * `parsed !== undefined` submit gate. A caller that genuinely wants blank-means-zero says so at its
 * own call site (`useAccountsScreen.ts`'s initial balance is the only one that does).
 */
export function parseAmountInput(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Major units (e.g. euros) to minor units (cents), rounded to the nearest integer. */
export function toMinorUnits(major: number): number {
  return Math.round(major * 100);
}
