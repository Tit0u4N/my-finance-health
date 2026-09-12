// @repo/app-core — level 2.
// Settings → Preferences' exchange-rate rows (app-core-inventory.md §6: "locale from i18n") —
// the one number in the app that used to bypass Intl entirely (`String(rateToDecimal(...))`),
// so it always showed a `.` decimal separator regardless of locale. rateToBase is 6-decimal
// fixed point (@repo/domain/primitives/rate) — the display never needs more than that.

import type { RateToBase } from '@repo/domain/primitives/rate';
import { rateToDecimal } from '@repo/domain/primitives/rate';

export function formatRate(rate: RateToBase, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  return formatter.format(rateToDecimal(rate));
}
