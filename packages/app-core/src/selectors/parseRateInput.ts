// @repo/app-core — level 2.
// Settings → Preferences' exchange-rate rows are free-text decimal input (open-questions.md #9a:
// "manual entry"). rateFromDecimal (@repo/domain/primitives/rate) calls rateToBaseSchema.parse,
// which THROWS on anything non-positive or non-integer-after-scaling — so raw keystrokes must
// never reach it directly. This is the guard in between.

import { type RateToBase, rateFromDecimal } from '@repo/domain/primitives/rate';

/** Parses a user-typed exchange-rate decimal (e.g. "0.9234" or the comma-decimal "0,9234") into a
 * `RateToBase`, or `undefined` when the text isn't a usable positive number. Never throws. */
export function parseRateInput(text: string): RateToBase | undefined {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') {
    return undefined;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return rateFromDecimal(value);
}
