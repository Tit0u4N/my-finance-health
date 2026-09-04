import type { Investment } from '@repo/domain/entities/investment';
import { describe, expect, it } from 'vitest';
import { computeInvestmentPosition } from './investmentPosition';

function investment(overrides: Partial<Investment>): Investment {
  return {
    id: 'i1',
    name: 'World ETF (CW8)',
    ticker: 'CW8',
    qty: 10,
    avg: 40_000,
    current: 45_000,
    color: '#6366f1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Investment;
}

describe('computeInvestmentPosition', () => {
  it('computes value, cost, P/L, and P/L%', () => {
    const position = computeInvestmentPosition(investment({}));
    expect(position).toEqual({ value: 450_000, cost: 400_000, profitLoss: 50_000, profitLossPercent: 0.125 });
  });

  it('allows a negative P/L when current is below avg', () => {
    const position = computeInvestmentPosition(investment({ current: 30_000 as never }));
    expect(position.profitLoss).toBe(-100_000);
    expect(position.profitLossPercent).toBe(-0.25);
  });

  it('handles a fractional qty', () => {
    const position = computeInvestmentPosition(
      investment({ qty: 2.5, avg: 100_000 as never, current: 120_000 as never }),
    );
    expect(position.value).toBe(300_000);
    expect(position.cost).toBe(250_000);
  });
});
