import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { Money } from '@repo/domain/primitives/money';
import { describe, expect, it } from 'vitest';
import { computeMonthlyCommitment, monthlyFactorFor, toMonthlyAmount } from './monthlyCommitment';

function rule(id: string, overrides: Partial<RecurringRule>): RecurringRule {
  return {
    id,
    desc: id,
    amount: -1000,
    freq: 'Monthly',
    cat: 'c1',
    acc: 'a1',
    startDate: '2026-01-01',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as RecurringRule;
}

describe('monthlyFactorFor', () => {
  it('normalizes every frequency to a monthly factor', () => {
    expect(monthlyFactorFor('Daily')).toBeCloseTo(30.44);
    expect(monthlyFactorFor('Weekly')).toBeCloseTo(4.348);
    expect(monthlyFactorFor('Monthly')).toBe(1);
    expect(monthlyFactorFor('Yearly')).toBeCloseTo(1 / 12);
  });
});

describe('toMonthlyAmount', () => {
  it('scales and rounds a single rule by its frequency factor', () => {
    expect(toMonthlyAmount(rule('daily', { amount: -100 as Money, freq: 'Daily' }))).toBe(-3044);
    expect(toMonthlyAmount(rule('weekly', { amount: -100 as Money, freq: 'Weekly' }))).toBe(-435);
    expect(toMonthlyAmount(rule('monthly', { amount: -100 as Money, freq: 'Monthly' }))).toBe(-100);
    expect(toMonthlyAmount(rule('yearly', { amount: -1200 as Money, freq: 'Yearly' }))).toBe(-100);
  });
});

describe('computeMonthlyCommitment', () => {
  it('matches the mock seed: r1-r4 active, r5 (Gym) paused', () => {
    const rules = [
      rule('r1', { desc: 'Salary — Studio Nord', amount: 340000 as Money, startDate: '2026-09-18' as never }),
      rule('r2', { desc: 'Rent', amount: -128000 as Money, startDate: '2026-09-18' as never }),
      rule('r3', { desc: 'Spotify Family', amount: -1099 as Money, startDate: '2026-09-30' as never }),
      rule('r4', { desc: 'Netflix', amount: -1349 as Money, startDate: '2026-09-12' as never }),
      rule('r5', { desc: 'Gym — Basic Fit', amount: -2990 as Money, active: false, startDate: '2026-09-21' as never }),
    ];

    const commitment = computeMonthlyCommitment(rules);

    expect(commitment).toEqual({ income: 340000, expense: 130448, net: 209552, activeCount: 4 });
    // The discriminator that proves the inactive Gym rule was dropped, not just under-summed.
    expect(commitment.expense).not.toBe(133438);
  });

  it('drops inactive rules from both the sum and the count', () => {
    const rules = [rule('a', { active: true }), rule('b', { active: false })];
    expect(computeMonthlyCommitment(rules).activeCount).toBe(1);
  });

  it('returns zeroed totals, not -0, for an empty or all-inactive list', () => {
    expect(computeMonthlyCommitment([])).toEqual({ income: 0, expense: 0, net: 0, activeCount: 0 });
    expect(computeMonthlyCommitment([rule('a', { active: false })])).toEqual({
      income: 0,
      expense: 0,
      net: 0,
      activeCount: 0,
    });
  });

  it('rounds per rule before summing, so three Weekly -100 rules do not equal a single -300 scaled once', () => {
    const rules = [
      rule('w1', { amount: -100 as Money, freq: 'Weekly' }),
      rule('w2', { amount: -100 as Money, freq: 'Weekly' }),
      rule('w3', { amount: -100 as Money, freq: 'Weekly' }),
    ];

    // Each -100 rounds to -435 individually; summed that's -1305, not -1304 (round-once-then-sum).
    expect(computeMonthlyCommitment(rules).expense).toBe(1305);
  });
});
