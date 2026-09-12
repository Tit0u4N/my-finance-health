// @repo/app-core — level 2.
// The selectors that produce a share/P&L ratio (allocation.ts, investmentPosition.ts,
// portfolioTotals.ts, categoryBreakdown.ts) all return a plain 0..1 number, never a pre-formatted
// string (app-core's job stops at producing plain data) — this is the one place that ratio
// becomes display text, shared instead of hand-rolled per screen.

export type FormatPercentOptions = {
  readonly maximumFractionDigits?: number;
  /** 'always' surfaces a P&L's sign explicitly even when the tone/color already implies it. */
  readonly signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
};

export function formatPercent(ratio: number, locale: string, options: FormatPercentOptions = {}): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    signDisplay: options.signDisplay ?? 'auto',
  });
  return formatter.format(ratio);
}
