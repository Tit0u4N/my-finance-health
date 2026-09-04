// @repo/app-core — level 2.
// The logic behind `fmtMoney` in the mock's ui.jsx moves here so it's shared with mobile; the
// pixels stay in @repo/ui/native (app-core-inventory.md §6). `locale` is an explicit argument —
// i18n itself is deferred, so nothing here reads from i18next.

import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { Money } from '@repo/domain/primitives/money';

export type FormatMoneyOptions = {
  /** Compact notation, e.g. "€1.2K" — for cards and KPI tiles with limited width. */
  readonly compact?: boolean;
  /** Renders the amount unsigned, for a display already carrying its own sign cue (a color, an icon). */
  readonly hideSign?: boolean;
};

// EUR, USD, and GBP — the product's full currency set (domain-model.md) — all use 2 minor-unit
// decimal places, so a fixed /100 is exact; this would need currency-aware precision if the set
// ever grows to include a 0- or 3-decimal currency.
const MINOR_UNITS_PER_MAJOR = 100;

export function formatMoney(
  amount: Money,
  currency: CurrencyCode,
  locale: string,
  options: FormatMoneyOptions = {},
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: options.compact ? 'compact' : 'standard',
    signDisplay: options.hideSign ? 'never' : 'auto',
  });
  const majorUnits = amount / MINOR_UNITS_PER_MAJOR;
  return formatter.format(options.hideSign ? Math.abs(majorUnits) : majorUnits);
}
