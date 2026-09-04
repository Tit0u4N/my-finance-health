// @repo/app-core — level 2.
// Overview's donut. `sign` defaults to expense (the donut's own use), but the same shape backs
// income-by-category in the cashflow graph — see cashflowGraph.ts.

import type { Transaction } from '@repo/domain/entities/transaction';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import {
  addMoney,
  isNegativeMoney,
  isPositiveMoney,
  type Money,
  negateMoney,
  sumMoney,
  toMoney,
} from '@repo/domain/primitives/money';
import type { AmountSign } from '@repo/domain/repositories/criteria';

export type CategoryBreakdownEntry = {
  readonly categoryId: CategoryId;
  /** Positive magnitude, regardless of `sign`. */
  readonly total: Money;
  /** Share of the grand total, 0..1. 0 for every entry when the grand total is zero. */
  readonly share: number;
};

export function computeCategoryBreakdown(
  transactions: readonly Transaction[],
  sign: AmountSign = 'negative',
): readonly CategoryBreakdownEntry[] {
  const matches = transactions.filter((transaction) =>
    sign === 'negative' ? isNegativeMoney(transaction.amount) : isPositiveMoney(transaction.amount),
  );

  const totalsByCategory = new Map<CategoryId, Money>();
  for (const transaction of matches) {
    const magnitude = sign === 'negative' ? negateMoney(transaction.amount) : transaction.amount;
    totalsByCategory.set(transaction.cat, addMoney(totalsByCategory.get(transaction.cat) ?? toMoney(0), magnitude));
  }

  const grandTotal = sumMoney([...totalsByCategory.values()]);
  return [...totalsByCategory.entries()]
    .map(([categoryId, total]) => ({ categoryId, total, share: grandTotal === 0 ? 0 : total / grandTotal }))
    .sort((a, b) => b.total - a.total);
}
