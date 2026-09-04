import type { Transaction } from '@repo/domain/entities/transaction';
import { describe, expect, it } from 'vitest';
import { computePeriodTotals } from './periodTotals';

function transaction(amount: number): Transaction {
  return {
    id: `t-${amount}`,
    date: '2026-03-01T00:00:00.000Z',
    desc: 'test',
    amount,
    cat: 'c1',
    acc: 'a1',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  } as Transaction;
}

describe('computePeriodTotals', () => {
  it('sums income and expense separately, both as positive magnitudes', () => {
    const totals = computePeriodTotals([transaction(250_000), transaction(-120_000), transaction(-30_000)]);
    expect(totals).toEqual({ income: 250_000, expense: 150_000, net: 100_000, rate: 100_000 / 250_000 });
  });

  it('is all zero for no transactions, with a zero rate rather than NaN', () => {
    expect(computePeriodTotals([])).toEqual({ income: 0, expense: 0, net: 0, rate: 0 });
  });

  it('allows a negative net when expenses exceed income', () => {
    const totals = computePeriodTotals([transaction(1000), transaction(-5000)]);
    expect(totals.net).toBe(-4000);
  });
});
