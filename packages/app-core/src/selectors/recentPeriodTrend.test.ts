import type { Transaction } from '@repo/domain/entities/transaction';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { describe, expect, it } from 'vitest';
import { computeRecentPeriodTrend } from './recentPeriodTrend';

function transaction(date: string, amount: number): Transaction {
  return {
    id: `t-${date}-${amount}`,
    date: `${date}T10:00:00.000Z`,
    desc: 'test',
    amount,
    cat: 'c1',
    acc: 'a1',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  } as Transaction;
}

describe('computeRecentPeriodTrend', () => {
  const today = '2026-03-10' as IsoDate;

  it('is empty for no transactions', () => {
    expect(computeRecentPeriodTrend([], today)).toEqual([]);
  });

  it('buckets income and expense separately per day, filling genuine zero-days when earlier history exists', () => {
    const points = computeRecentPeriodTrend(
      [
        // Well before the 5-day window — its only role is proving history predates the window,
        // so the window isn't clipped and 03-06/03-07 below are real zero-activity days, not
        // fabricated pre-history padding.
        transaction('2026-01-01', 100),
        transaction('2026-03-08', 5000),
        transaction('2026-03-08', -1200),
        transaction('2026-03-10', -300),
      ],
      today,
      5,
    );

    expect(points.map((p) => p.date)).toEqual(['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);
    expect(points.find((p) => p.date === '2026-03-08')).toEqual({ date: '2026-03-08', income: 5000, expense: 1200 });
    expect(points.find((p) => p.date === '2026-03-06')).toEqual({ date: '2026-03-06', income: 0, expense: 0 });
    expect(points.find((p) => p.date === '2026-03-10')).toEqual({ date: '2026-03-10', income: 0, expense: 300 });
  });

  it('clips the window start to the earliest transaction instead of padding fabricated leading zero-days', () => {
    const points = computeRecentPeriodTrend([transaction('2026-03-09', 100)], today, 30);

    expect(points.map((p) => p.date)).toEqual(['2026-03-09', '2026-03-10']);
  });
});
