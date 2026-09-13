import type { Transaction } from '@repo/domain/entities/transaction';
import { describe, expect, it } from 'vitest';
import { computeDescSuggestions } from './descSuggestions';

function transaction(desc: string, date: string): Transaction {
  return {
    id: `t-${desc}-${date}`,
    date,
    desc,
    amount: -1000,
    cat: 'c1',
    acc: 'a1',
    createdAt: date,
    updatedAt: date,
  } as Transaction;
}

describe('computeDescSuggestions', () => {
  it('returns the most recent distinct descriptions when the query is empty', () => {
    const transactions = [
      transaction('Carrefour Market', '2026-03-01T00:00:00.000Z'),
      transaction('Netflix', '2026-03-05T00:00:00.000Z'),
      transaction('Monoprix', '2026-03-03T00:00:00.000Z'),
    ];

    expect(computeDescSuggestions(transactions, '')).toEqual(['Netflix', 'Monoprix', 'Carrefour Market']);
  });

  it('dedupes case-insensitively, keeping the most recent spelling', () => {
    const transactions = [
      transaction('carrefour market', '2026-03-01T00:00:00.000Z'),
      transaction('Carrefour Market', '2026-03-10T00:00:00.000Z'),
    ];

    expect(computeDescSuggestions(transactions, '')).toEqual(['Carrefour Market']);
  });

  it('caps the result at the given limit', () => {
    const transactions = ['a', 'b', 'c', 'd'].map((desc, index) =>
      transaction(desc, `2026-03-0${index + 1}T00:00:00.000Z`),
    );

    expect(computeDescSuggestions(transactions, '', 2)).toHaveLength(2);
  });

  it('fuzzy-matches a query against the descriptions, tolerating a typo', () => {
    const transactions = [
      transaction('Carrefour Market', '2026-03-01T00:00:00.000Z'),
      transaction('Netflix', '2026-03-05T00:00:00.000Z'),
    ];

    expect(computeDescSuggestions(transactions, 'carefour')).toEqual(['Carrefour Market']);
  });

  it('returns an empty list when nothing matches the query', () => {
    const transactions = [transaction('Carrefour Market', '2026-03-01T00:00:00.000Z')];

    expect(computeDescSuggestions(transactions, 'xyz123')).toEqual([]);
  });

  it('returns an empty list for no transactions', () => {
    expect(computeDescSuggestions([], '')).toEqual([]);
  });
});
