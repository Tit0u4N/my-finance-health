import type { Investment } from '@repo/domain/entities/investment';
import { describe, expect, it } from 'vitest';
import { computePortfolioTotals } from './portfolioTotals';

function investment(overrides: Record<string, any>): Investment {
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

describe('computePortfolioTotals', () => {
  it('sums value and cost across positions and derives overall P/L%', () => {
    const totals = computePortfolioTotals([
      investment({ id: 'i1', qty: 10, avg: 40_000 as never, current: 45_000 as never }),
      investment({ id: 'i2', qty: 5, avg: 20_000 as never, current: 18_000 as never }),
    ]);

    expect(totals.value).toBe(540_000); // 450_000 + 90_000
    expect(totals.cost).toBe(500_000); // 400_000 + 100_000
    expect(totals.profitLoss).toBe(40_000);
    expect(totals.profitLossPercent).toBeCloseTo(0.08, 5);
  });

  it('is all zero for an empty portfolio, with a zero rate rather than NaN', () => {
    expect(computePortfolioTotals([])).toEqual({ value: 0, cost: 0, profitLoss: 0, profitLossPercent: 0 });
  });
});
