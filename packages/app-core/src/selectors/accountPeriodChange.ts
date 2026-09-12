// @repo/app-core — level 2.
// Accounts list's 30-day change per account (app-core-inventory.md §6). Deliberately NOT derived
// from getBalanceHistory's series: computeBalanceHistory (packages/data) emits one point per date
// with a transaction and no leading window-start point, so a single-transaction account's series
// is 1 point long — last-minus-first reads as zero even when the real change is not. The change
// over a window *is* the sum of that window's transactions, so this selector sums directly
// instead, off the same date-bounded useTransactions({ dateRange }) call the sparkline's
// useQueries fan-out already needs the account ids for.

import type { Transaction } from '@repo/domain/entities/transaction';
import type { AccountId } from '@repo/domain/primitives/entityId';
import { addMoney, type Money, toMoney } from '@repo/domain/primitives/money';

/** Groups a (date-bounded) transaction list by account and sums each group — the change in that
 * account's balance over the window the caller already bounded `transactions` to. */
export function computeChangeByAccount(transactions: readonly Transaction[]): ReadonlyMap<AccountId, Money> {
  const changeByAccount = new Map<AccountId, Money>();
  for (const transaction of transactions) {
    const current = changeByAccount.get(transaction.acc) ?? toMoney(0);
    changeByAccount.set(transaction.acc, addMoney(current, transaction.amount));
  }
  return changeByAccount;
}
