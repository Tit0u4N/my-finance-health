import type { Transaction } from '@repo/domain/entities/transaction';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import type { Money } from '@repo/domain/primitives/money';
import { describe, expect, it } from 'vitest';
import { computeBalanceHistory } from './balanceHistory';

function transaction(date: string, amount: number): Transaction {
  return {
    id: `t-${date}-${amount}`,
    date: `${date}T00:00:00.000Z`,
    desc: 'test',
    amount,
    cat: 'c1',
    acc: 'a1',
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  } as Transaction;
}

describe('computeBalanceHistory', () => {
  it('walks backward from the current balance, one point per transaction date', () => {
    const currentBalance = 1000 as Money;
    const transactions = [
      transaction('2026-03-01', 200), // oldest
      transaction('2026-03-10', -50),
      transaction('2026-03-15', 100), // most recent, already reflected in currentBalance
    ];

    const history = computeBalanceHistory(currentBalance, transactions, {
      start: '2026-03-01' as IsoDate,
      end: '2026-03-15' as IsoDate,
    });

    // currentBalance (1000) already includes the 03-15 entry, so each earlier point is what the
    // balance was right after that day's own transaction, before the following day's.
    expect(history).toEqual([
      { date: '2026-03-01', balance: 950 },
      { date: '2026-03-10', balance: 900 },
      { date: '2026-03-15', balance: 1000 },
    ]);
  });

  it('sums same-day transactions into a single point', () => {
    const currentBalance = 500 as Money;
    const transactions = [transaction('2026-03-10', 100), transaction('2026-03-10', -300)];

    const history = computeBalanceHistory(currentBalance, transactions, {
      start: undefined,
      end: '2026-03-10' as IsoDate,
    });

    expect(history).toEqual([{ date: '2026-03-10', balance: 500 }]);
  });

  it('excludes transactions outside the requested range', () => {
    const currentBalance = 1000 as Money;
    const transactions = [transaction('2026-01-01', 50), transaction('2026-03-10', -20)];

    const history = computeBalanceHistory(currentBalance, transactions, {
      start: '2026-03-01' as IsoDate,
      end: '2026-03-15' as IsoDate,
    });

    expect(history).toEqual([{ date: '2026-03-10', balance: 1000 }]);
  });

  it('returns no points when there is no activity in range', () => {
    const history = computeBalanceHistory(1000 as Money, [], { start: undefined, end: '2026-03-15' as IsoDate });
    expect(history).toEqual([]);
  });
});
