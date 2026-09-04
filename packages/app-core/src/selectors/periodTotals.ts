// @repo/app-core — level 2.
// Overview's MTD KPIs. The caller bounds `transactions` to the period first (a
// useTransactions({ dateRange }) call) — this selector only sums what it's given.

import type { Transaction } from '@repo/domain/entities/transaction';
import {
  addMoney,
  isNegativeMoney,
  isPositiveMoney,
  type Money,
  negateMoney,
  sumMoney,
} from '@repo/domain/primitives/money';

export type PeriodTotals = {
  /** Sum of positive-amount transactions. */
  readonly income: Money;
  /** Sum of negative-amount transactions, expressed as a positive magnitude. */
  readonly expense: Money;
  readonly net: Money;
  /** net / income, 0 when there is no income to divide by. */
  readonly rate: number;
};

export function computePeriodTotals(transactions: readonly Transaction[]): PeriodTotals {
  const income = sumMoney(
    transactions.filter((transaction) => isPositiveMoney(transaction.amount)).map((t) => t.amount),
  );
  const expenseSigned = sumMoney(
    transactions.filter((transaction) => isNegativeMoney(transaction.amount)).map((t) => t.amount),
  );
  const net = addMoney(income, expenseSigned);

  return {
    income,
    expense: negateMoney(expenseSigned),
    net,
    rate: income === 0 ? 0 : net / income,
  };
}
