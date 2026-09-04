// @repo/app-core — level 2.
// Overview's cashflow panel. This selector only shapes the `{nodes, links}` data — the sankey
// primitive itself lives in @repo/ui, out of scope here (app-core-inventory.md §6's
// rendering-boundary rule).

import type { Transaction } from '@repo/domain/entities/transaction';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import { isPositiveMoney, type Money, toMoney } from '@repo/domain/primitives/money';
import { computeCategoryBreakdown } from './categoryBreakdown';
import { computePeriodTotals } from './periodTotals';

export type CashflowNodeId = 'total' | `income:${CategoryId}` | `expense:${CategoryId}` | 'savings';

export type CashflowNode = {
  readonly id: CashflowNodeId;
  readonly kind: 'income' | 'total' | 'expense' | 'savings';
  readonly categoryId?: CategoryId;
  readonly amount: Money;
};

export type CashflowLink = {
  readonly source: CashflowNodeId;
  readonly target: CashflowNodeId;
  readonly amount: Money;
};

export type CashflowGraph = {
  readonly nodes: readonly CashflowNode[];
  readonly links: readonly CashflowLink[];
};

export function computeCashflowGraph(transactions: readonly Transaction[]): CashflowGraph {
  const incomeByCategory = computeCategoryBreakdown(transactions, 'positive');
  const expenseByCategory = computeCategoryBreakdown(transactions, 'negative');
  const { income, net } = computePeriodTotals(transactions);
  const savings = net > 0 ? (net as Money) : toMoney(0);

  const nodes: CashflowNode[] = [
    ...incomeByCategory.map(
      (entry): CashflowNode => ({
        id: `income:${entry.categoryId}`,
        kind: 'income',
        categoryId: entry.categoryId,
        amount: entry.total,
      }),
    ),
    { id: 'total', kind: 'total', amount: income },
    ...expenseByCategory.map(
      (entry): CashflowNode => ({
        id: `expense:${entry.categoryId}`,
        kind: 'expense',
        categoryId: entry.categoryId,
        amount: entry.total,
      }),
    ),
    ...(isPositiveMoney(savings) ? [{ id: 'savings' as const, kind: 'savings' as const, amount: savings }] : []),
  ];

  const links: CashflowLink[] = [
    ...incomeByCategory.map(
      (entry): CashflowLink => ({ source: `income:${entry.categoryId}`, target: 'total', amount: entry.total }),
    ),
    ...expenseByCategory.map(
      (entry): CashflowLink => ({ source: 'total', target: `expense:${entry.categoryId}`, amount: entry.total }),
    ),
    ...(isPositiveMoney(savings) ? [{ source: 'total' as const, target: 'savings' as const, amount: savings }] : []),
  ];

  return { nodes, links };
}
