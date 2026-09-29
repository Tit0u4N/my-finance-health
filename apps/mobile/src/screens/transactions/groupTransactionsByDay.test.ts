import type { Transaction } from '@repo/domain/entities/transaction';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { describe, expect, it } from 'vitest';
import { groupTransactionsByDay, transactionDayLabel } from './groupTransactionsByDay';

const TODAY = '2026-09-28' as IsoDate;

// Only the fields the helper reads are real; the audit/branding fields are irrelevant to grouping
// and asserting on them would test the schema instead of this module.
const transaction = (id: string, day: string, amount: number): Transaction =>
  ({
    acc: 'a1',
    amount,
    cat: 'c-grc',
    createdAt: '2026-09-28T00:00:00.000Z',
    date: `${day}T00:00:00.000Z`,
    desc: id,
    id,
    updatedAt: '2026-09-28T00:00:00.000Z',
  }) as unknown as Transaction;

describe('transactionDayLabel', () => {
  it('uses the relative selector inside the week', () => {
    expect(transactionDayLabel(TODAY, TODAY, 'en-US')).toBe('today');
    expect(transactionDayLabel('2026-09-27' as IsoDate, TODAY, 'en-US')).toBe('yesterday');
    expect(transactionDayLabel('2026-09-25' as IsoDate, TODAY, 'en-US')).toBe('3 days ago');
  });

  it('switches to an absolute date at a week out, where the relative selector would say "last week"', () => {
    expect(transactionDayLabel('2026-09-21' as IsoDate, TODAY, 'en-US')).toBe('Sep 21');
  });

  it('adds the year once the date is not in the current one', () => {
    expect(transactionDayLabel('2025-12-31' as IsoDate, TODAY, 'en-US')).toBe('Dec 31, 2025');
  });

  it('follows the requested locale rather than the host default', () => {
    expect(transactionDayLabel('2026-09-21' as IsoDate, TODAY, 'fr-FR')).toBe('21 sept.');
  });
});

describe('groupTransactionsByDay', () => {
  it('returns no groups for an empty list', () => {
    expect(groupTransactionsByDay([], TODAY, 'en-US')).toEqual([]);
  });

  it('buckets by calendar day, keeping the order the rows arrived in', () => {
    const groups = groupTransactionsByDay(
      [
        transaction('t1', '2026-09-28', -5_420),
        transaction('t2', '2026-09-27', -2_250),
        transaction('t3', '2026-09-27', -800),
        transaction('t4', '2026-09-20', 120_000),
      ],
      TODAY,
      'en-US',
    );

    expect(groups.map((group) => group.date)).toEqual(['2026-09-28', '2026-09-27', '2026-09-20']);
    expect(groups.map((group) => group.transactions.length)).toEqual([1, 2, 1]);
  });

  it('signs each day total from its own transactions, income and expense together', () => {
    const groups = groupTransactionsByDay(
      [transaction('t1', '2026-09-28', 120_000), transaction('t2', '2026-09-28', -5_420)],
      TODAY,
      'en-US',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.total).toBe(114_580);
  });

  it('keeps a same-day pair together even when non-adjacent in the input', () => {
    const groups = groupTransactionsByDay(
      [
        transaction('t1', '2026-09-28', -100),
        transaction('t2', '2026-09-27', -200),
        transaction('t3', '2026-09-28', -300),
      ],
      TODAY,
      'en-US',
    );

    expect(groups.map((group) => group.date)).toEqual(['2026-09-28', '2026-09-27']);
    expect(groups[0]?.transactions.map((item) => item.id)).toEqual(['t1', 't3']);
    expect(groups[0]?.total).toBe(-400);
  });

  it('labels each group through the same relative/absolute split as transactionDayLabel', () => {
    const groups = groupTransactionsByDay(
      [transaction('t1', '2026-09-28', -100), transaction('t2', '2026-09-01', -200)],
      TODAY,
      'en-US',
    );

    expect(groups.map((group) => group.label)).toEqual(['today', 'Sep 1']);
  });
});
