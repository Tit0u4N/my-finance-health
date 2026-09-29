// Pure presentation helper for the Activity tab's ledger (docs/spec/screens-mobile.md). The mobile
// mock groups the ledger by day with a per-day signed total, which desktop's flat table has no
// equivalent of — so this lives here rather than in @repo/app-core, where it would be a selector no
// other target consumes.
//
// The day label never goes through `String(date)`/template interpolation
// (docs/spec/cross-app-pitfalls.md #5): inside a week it is `formatRelativeDate` ("today",
// "yesterday", "3 days ago"), past that `formatAbsoluteDate` — the same two selectors desktop's own
// ledger and Recurring columns use.

import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { daysBetween, formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import type { Transaction } from '@repo/domain/entities/transaction';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { isoDateSchema } from '@repo/domain/primitives/dateTime';
import type { Money } from '@repo/domain/primitives/money';
import { sumMoney } from '@repo/domain/primitives/money';

/** `formatRelativeDate` itself switches from days to weeks at 7, so the same bound keeps the two
 * branches from ever both describing the same distance ("7 days ago" vs "last week"). */
const RELATIVE_DAY_WINDOW = 7;

export type TransactionDayGroup = {
  readonly date: IsoDate;
  readonly label: string;
  /** Signed sum of the day's amounts, in minor units — formatted by the ViewModel, never here. */
  readonly total: Money;
  readonly transactions: readonly Transaction[];
};

/** "Today" / "3 days ago" within the week, "12 May" (with the year, once it isn't the current one) beyond it. */
export function transactionDayLabel(date: IsoDate, today: IsoDate, locale: string): string {
  if (Math.abs(daysBetween(today, date)) < RELATIVE_DAY_WINDOW) {
    return formatRelativeDate(date, today, locale);
  }
  const isOtherYear = date.slice(0, 4) !== today.slice(0, 4);
  return formatAbsoluteDate(date, locale, isOtherYear ? { withYear: true } : {});
}

/**
 * Buckets a transaction list into one group per calendar day, in first-seen order.
 *
 * Order is inherited rather than re-sorted: the ledger's criteria always ask the repository for
 * `date:desc` (`ledgerCriteria.ts` — mobile exposes no sort control), so first-seen order *is*
 * newest-first. Re-sorting here would quietly fight whatever order the gateway was asked for.
 */
export function groupTransactionsByDay(
  transactions: readonly Transaction[],
  today: IsoDate,
  locale: string,
): readonly TransactionDayGroup[] {
  const byDate = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    // `date` is an IsoDateTime; the calendar day is its date part, which is how every other
    // date-bearing view of a transaction reads it (useDashboardScreen.ts does the same slice).
    const day = transaction.date.slice(0, 10);
    const bucket = byDate.get(day);
    if (bucket === undefined) {
      byDate.set(day, [transaction]);
    } else {
      bucket.push(transaction);
    }
  }

  return [...byDate].map(([day, dayTransactions]) => {
    const date = isoDateSchema.parse(day);
    return {
      date,
      label: transactionDayLabel(date, today, locale),
      total: sumMoney(dayTransactions.map((transaction) => transaction.amount)),
      transactions: dayTransactions,
    };
  });
}
