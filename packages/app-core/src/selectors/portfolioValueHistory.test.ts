import type { Investment } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';
import { describe, expect, it } from 'vitest';
import { computePortfolioValueHistory } from './portfolioValueHistory';

function investment(overrides: Record<string, unknown>): Investment {
  return {
    id: 'i1',
    name: 'Position',
    ticker: 'X',
    qty: 1,
    avg: 0,
    current: 0,
    color: '#6366f1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Investment;
}

function point(date: string, price: number): InvestmentValuePoint {
  return { date: `${date}T00:00:00.000Z` as never, price: price as never };
}

function historyMap(
  entries: Record<string, readonly InvestmentValuePoint[]>,
): ReadonlyMap<InvestmentId, readonly InvestmentValuePoint[]> {
  return new Map(Object.entries(entries)) as unknown as ReadonlyMap<InvestmentId, readonly InvestmentValuePoint[]>;
}

describe('computePortfolioValueHistory', () => {
  it('forward-fills a position past its last snapshot in the window', () => {
    const i1 = investment({ id: 'i1', qty: 1, current: 999 });
    const i2 = investment({ id: 'i2', qty: 1, current: 1 });
    const history = historyMap({
      i1: [point('2026-01-01', 100), point('2026-01-03', 110)],
      i2: [point('2026-01-05', 1)],
    });

    const series = computePortfolioValueHistory([i1, i2], history);

    const lastPoint = series.at(-1);
    expect(lastPoint?.date).toBe('2026-01-05');
    // i1 forward-fills to its last known price (110), not its unrelated `current` (999).
    expect(lastPoint?.value).toBe(111);
  });

  it('backfills a position joining the chart mid-window to its earliest snapshot', () => {
    const i1 = investment({ id: 'i1', qty: 1, current: 999 });
    const i2 = investment({ id: 'i2', qty: 1, current: 1 });
    const history = historyMap({
      i1: [point('2026-01-03', 200)],
      i2: [point('2026-01-01', 5)],
    });

    const series = computePortfolioValueHistory([i1, i2], history);

    const firstPoint = series[0];
    expect(firstPoint?.date).toBe('2026-01-01');
    // i1 has no snapshot yet on 01-01 — backfills to its earliest (200), not zero.
    expect(firstPoint?.value).toBe(205);
  });

  it('a position with no snapshots at all contributes a flat qty × current on every date', () => {
    const flat = investment({ id: 'flat', qty: 2, current: 50 });
    const tracked = investment({ id: 'tracked', qty: 1, current: 999 });
    const history = historyMap({
      tracked: [point('2026-01-01', 10), point('2026-01-02', 20)],
    });

    const series = computePortfolioValueHistory([flat, tracked], history);

    expect(series).toEqual([
      { date: '2026-01-01', value: 110 }, // 2*50 + 1*10
      { date: '2026-01-02', value: 120 }, // 2*50 + 1*20
    ]);
  });

  it('aligns ragged, non-overlapping date sets on their union', () => {
    const i1 = investment({ id: 'i1', qty: 1, current: 0 });
    const i2 = investment({ id: 'i2', qty: 1, current: 0 });
    const history = historyMap({
      i1: [point('2026-01-01', 10), point('2026-01-10', 15)],
      i2: [point('2026-01-05', 7)],
    });

    const series = computePortfolioValueHistory([i1, i2], history);

    expect(series.map((entry) => entry.date)).toEqual(['2026-01-01', '2026-01-05', '2026-01-10']);
  });

  it('produces an empty series for no investments, or none with any recorded snapshot', () => {
    expect(computePortfolioValueHistory([], historyMap({}))).toEqual([]);

    const noHistory = investment({ id: 'i1', qty: 1, current: 100 });
    expect(computePortfolioValueHistory([noHistory], historyMap({}))).toEqual([]);
  });
});
