import type { Transaction } from '@repo/domain/entities/transaction';
import { describe, expect, it } from 'vitest';
import { computeCategoryBreakdown } from './categoryBreakdown';

function transaction(cat: string, amount: number): Transaction {
  return {
    id: `t-${cat}-${amount}`,
    date: '2026-03-01T00:00:00.000Z',
    desc: 'test',
    amount,
    cat,
    acc: 'a1',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  } as Transaction;
}

describe('computeCategoryBreakdown', () => {
  it('groups expense transactions by category, sorted by total descending, with shares summing to 1', () => {
    const entries = computeCategoryBreakdown([
      transaction('groceries', -3000),
      transaction('groceries', -2000),
      transaction('transport', -5000),
      transaction('salary', 200_000), // ignored — not an expense
    ]);

    // Both categories tie at 5000; Array.sort is stable, so insertion order (groceries first) wins the tie.
    expect(entries).toEqual([
      { categoryId: 'groceries', total: 5000, share: 0.5 },
      { categoryId: 'transport', total: 5000, share: 0.5 },
    ]);
  });

  it('switches to income categories when sign is positive', () => {
    const entries = computeCategoryBreakdown(
      [transaction('salary', 200_000), transaction('groceries', -3000)],
      'positive',
    );
    expect(entries).toEqual([{ categoryId: 'salary', total: 200_000, share: 1 }]);
  });

  it('is empty, not NaN-shares, for no matching transactions', () => {
    expect(computeCategoryBreakdown([])).toEqual([]);
  });
});
