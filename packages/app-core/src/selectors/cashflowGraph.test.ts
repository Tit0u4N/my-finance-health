import type { Transaction } from '@repo/domain/entities/transaction';
import { describe, expect, it } from 'vitest';
import { computeCashflowGraph } from './cashflowGraph';

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

describe('computeCashflowGraph', () => {
  it('shapes income, total, expense, and savings nodes with proportional links', () => {
    const graph = computeCashflowGraph([
      transaction('salary', 300_000),
      transaction('rent', -120_000),
      transaction('groceries', -80_000),
    ]);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        { id: 'income:salary', kind: 'income', categoryId: 'salary', amount: 300_000 },
        { id: 'total', kind: 'total', amount: 300_000 },
        { id: 'expense:rent', kind: 'expense', categoryId: 'rent', amount: 120_000 },
        { id: 'expense:groceries', kind: 'expense', categoryId: 'groceries', amount: 80_000 },
        { id: 'savings', kind: 'savings', amount: 100_000 },
      ]),
    );
    expect(graph.links).toEqual(
      expect.arrayContaining([
        { source: 'income:salary', target: 'total', amount: 300_000 },
        { source: 'total', target: 'expense:rent', amount: 120_000 },
        { source: 'total', target: 'expense:groceries', amount: 80_000 },
        { source: 'total', target: 'savings', amount: 100_000 },
      ]),
    );
  });

  it('omits the savings node when nothing is left over', () => {
    const graph = computeCashflowGraph([transaction('salary', 100_000), transaction('rent', -150_000)]);
    expect(graph.nodes.some((node) => node.kind === 'savings')).toBe(false);
    expect(graph.links.some((link) => link.target === 'savings')).toBe(false);
  });
});
