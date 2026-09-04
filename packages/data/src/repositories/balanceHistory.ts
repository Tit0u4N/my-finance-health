// @repo/data — level 1.
// getBalanceHistory is derived on read by replaying transactions backward from the current,
// maintained balance (this pass's decision on domain-model.md's open question) — no snapshot
// entity, no stored history (domain-model.md "Account balance history").

import type { Transaction } from '@repo/domain/entities/transaction';
import { compareIsoDate, type IsoDate, isoDateSchema } from '@repo/domain/primitives/dateTime';
import { addMoney, type Money, negateMoney, toMoney } from '@repo/domain/primitives/money';
import type { AccountBalancePoint } from '@repo/domain/repositories/accountRepository';
import type { DateRange } from '@repo/domain/repositories/criteria';

function dateOnly(isoDateTime: string): IsoDate {
  return isoDateSchema.parse(isoDateTime.slice(0, 10));
}

/**
 * One point per distinct date with at least one transaction, from `range.end` back to
 * `range.start` (or to the earliest transaction, for "all"). `currentBalance` already reflects
 * every transaction through today, so the walk only ever needs to subtract, never add.
 */
export function computeBalanceHistory(
  currentBalance: Money,
  transactions: readonly Transaction[],
  range: DateRange,
): readonly AccountBalancePoint[] {
  const deltaByDate = new Map<IsoDate, Money>();
  for (const transaction of transactions) {
    const date = dateOnly(transaction.date);
    if (compareIsoDate(date, range.end) > 0) {
      continue;
    }
    if (range.start !== undefined && compareIsoDate(date, range.start) < 0) {
      continue;
    }
    deltaByDate.set(date, addMoney(deltaByDate.get(date) ?? toMoney(0), transaction.amount));
  }

  const dates = [...deltaByDate.keys()].sort((a, b) => compareIsoDate(b, a));
  const points: AccountBalancePoint[] = [];
  let runningBalance = currentBalance;
  for (const date of dates) {
    points.push({ date, balance: runningBalance });
    const delta = deltaByDate.get(date);
    if (delta !== undefined) {
      runningBalance = addMoney(runningBalance, negateMoney(delta));
    }
  }
  return points.reverse();
}
