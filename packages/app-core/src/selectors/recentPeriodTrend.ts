// @repo/app-core — level 2.
// Overview `StatTile` income/spending sparklines (`MiniBar`, ui-inventory.md §3). Decided in
// open-questions.md #17: daily income/expense buckets over the trailing 30 days, clipped to the
// earliest transaction in the given set rather than padding fabricated zero-days before it — the
// caller passes an already-bounded (last-30-days) transaction list, same pattern as
// periodTotals.ts, so "earliest in the set" and "earliest in the workspace" coincide whenever the
// workspace itself is younger than the window.

import type { Transaction } from '@repo/domain/entities/transaction';
import { compareIsoDate, type IsoDate, isoDateSchema } from '@repo/domain/primitives/dateTime';
import {
  addMoney,
  isNegativeMoney,
  isPositiveMoney,
  type Money,
  negateMoney,
  toMoney,
} from '@repo/domain/primitives/money';
import { addFrequency } from '@repo/domain/time/workspaceTime';

export type RecentPeriodTrendPoint = {
  readonly date: IsoDate;
  readonly income: Money;
  readonly expense: Money;
};

const MS_PER_DAY = 86_400_000;
const DEFAULT_WINDOW_DAYS = 30;

function dateOnly(isoDateTime: string): IsoDate {
  return isoDateSchema.parse(isoDateTime.slice(0, 10));
}

function subtractDays(date: IsoDate, days: number): IsoDate {
  const ms = Date.parse(`${date}T00:00:00.000Z`) - days * MS_PER_DAY;
  return isoDateSchema.parse(new Date(ms).toISOString().slice(0, 10));
}

export function computeRecentPeriodTrend(
  transactions: readonly Transaction[],
  today: IsoDate,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): readonly RecentPeriodTrendPoint[] {
  if (transactions.length === 0) {
    return [];
  }

  const earliest = transactions
    .map((transaction) => dateOnly(transaction.date))
    .reduce((min, date) => (compareIsoDate(date, min) < 0 ? date : min));
  const naiveStart = subtractDays(today, windowDays - 1);
  const start = compareIsoDate(earliest, naiveStart) > 0 ? earliest : naiveStart;

  const buckets = new Map<IsoDate, { income: Money; expense: Money }>();
  for (const transaction of transactions) {
    const date = dateOnly(transaction.date);
    if (compareIsoDate(date, start) < 0) {
      continue;
    }
    const entry = buckets.get(date) ?? { income: toMoney(0), expense: toMoney(0) };
    if (isPositiveMoney(transaction.amount)) {
      entry.income = addMoney(entry.income, transaction.amount);
    } else if (isNegativeMoney(transaction.amount)) {
      entry.expense = addMoney(entry.expense, negateMoney(transaction.amount));
    }
    buckets.set(date, entry);
  }

  const points: RecentPeriodTrendPoint[] = [];
  let cursor = start;
  while (compareIsoDate(cursor, today) <= 0) {
    const entry = buckets.get(cursor) ?? { income: toMoney(0), expense: toMoney(0) };
    points.push({ date: cursor, income: entry.income, expense: entry.expense });
    cursor = addFrequency(cursor, 'Daily');
  }
  return points;
}
