import type { Transaction } from '@repo/domain/entities/transaction';
import type { AccountId } from '@repo/domain/primitives/entityId';
import { describe, expect, it } from 'vitest';
import { computeChangeByAccount } from './accountPeriodChange';

function transaction(acc: string, amount: number): Transaction {
  return {
    id: `t-${acc}-${amount}`,
    date: '2026-03-01T00:00:00.000Z',
    desc: 'test',
    amount,
    cat: 'c1',
    acc,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  } as Transaction;
}

describe('computeChangeByAccount', () => {
  it('sums each account group separately', () => {
    const result = computeChangeByAccount([transaction('a1', 1_000), transaction('a1', -400), transaction('a2', 500)]);

    expect(result.get('a1' as AccountId)).toBe(600);
    expect(result.get('a2' as AccountId)).toBe(500);
  });

  it('is an empty map for no transactions', () => {
    expect(computeChangeByAccount([]).size).toBe(0);
  });

  it('has no entry for an account with zero net transactions in the window', () => {
    const result = computeChangeByAccount([transaction('a1', 100), transaction('a1', -100)]);

    expect(result.get('a1' as AccountId)).toBe(0);
    expect(result.has('a2' as AccountId)).toBe(false);
  });

  it('sums a single transaction correctly — the case getBalanceHistory gets wrong (F3)', () => {
    const result = computeChangeByAccount([transaction('a2', 1_840)]);

    expect(result.get('a2' as AccountId)).toBe(1_840);
  });
});
