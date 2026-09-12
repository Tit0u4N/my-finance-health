// @repo/app-core — level 2.
// Investments list screen's "30-day portfolio value trend" (screens.md), which has no single
// data source: getValueHistory is per-position (app-core-inventory.md §4). This selector fans
// per-position histories (fetched via a useQueries loop, the same shape useAccountsScreen already
// uses for per-account sparklines) into one date-aligned series.

import type { Investment } from '@repo/domain/entities/investment';
import { compareIsoDate, type IsoDate, isoDateSchema } from '@repo/domain/primitives/dateTime';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { type Money, scaleMoney, sumMoney } from '@repo/domain/primitives/money';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';

export type PortfolioValuePoint = { readonly date: IsoDate; readonly value: Money };

function dateOnly(isoDateTime: string): IsoDate {
  return isoDateSchema.parse(isoDateTime.slice(0, 10));
}

function sortedByDate(history: readonly InvestmentValuePoint[]): readonly InvestmentValuePoint[] {
  return [...history].sort((a, b) => compareIsoDate(dateOnly(a.date), dateOnly(b.date)));
}

/** The per-unit price a position held on `date`: the latest recorded snapshot at or before it
 * (forward-fill), or — if `date` precedes every snapshot — the earliest one (backfill, so a
 * position joining the chart mid-window doesn't read as a step change up from zero). A position
 * with no snapshots at all in the window has only one known price: its current one. */
function priceAsOf(history: readonly InvestmentValuePoint[], date: IsoDate, current: Money): Money {
  const [first, ...rest] = history;
  if (first === undefined) {
    return current;
  }
  // Defaults to the earliest point (backfill); a later point at or before `date` then overrides
  // it as the walk proceeds (forward-fill), since `history` is sorted ascending.
  let latestAtOrBefore = first;
  for (const point of rest) {
    if (compareIsoDate(dateOnly(point.date), date) > 0) {
      break;
    }
    latestAtOrBefore = point;
  }
  return latestAtOrBefore.price;
}

export function computePortfolioValueHistory(
  investments: readonly Investment[],
  historyByInvestmentId: ReadonlyMap<InvestmentId, readonly InvestmentValuePoint[]>,
): readonly PortfolioValuePoint[] {
  const sortedHistoryById = new Map(
    investments.map((investment) => [investment.id, sortedByDate(historyByInvestmentId.get(investment.id) ?? [])]),
  );

  const dates = new Set<IsoDate>();
  for (const history of sortedHistoryById.values()) {
    for (const point of history) {
      dates.add(dateOnly(point.date));
    }
  }
  if (dates.size === 0) {
    return [];
  }

  return [...dates].sort(compareIsoDate).map((date) => {
    // Round per position then sum, so a per-position value column (if ever shown) always adds up
    // to this total exactly — the same rule computeMonthlyCommitment already applies.
    const positionValues = investments.map((investment) =>
      scaleMoney(priceAsOf(sortedHistoryById.get(investment.id) ?? [], date, investment.current), investment.qty),
    );
    return { date, value: sumMoney(positionValues) };
  });
}
