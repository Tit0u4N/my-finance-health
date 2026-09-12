// @repo/app-core — level 2.
// Recurring screen's "monthly committed in/out/net across active rules" KPI row (screens.md).
// No spec defines how a Daily/Weekly/Yearly rule converts to a monthly figure — this is a
// normalized monthly average, not "what fires this calendar month": stable across months, and
// every active rule contributes instead of a Yearly rule reading €0 eleven months out of twelve.

import type { RecurringFrequency, RecurringRule } from '@repo/domain/entities/recurringRule';
import {
  addMoney,
  isNegativeMoney,
  isPositiveMoney,
  type Money,
  negateMoney,
  scaleMoney,
  sumMoney,
} from '@repo/domain/primitives/money';

// A Record keyed by the (PascalCase) RecurringFrequency values would trip useNamingConvention —
// same reason workspaceTime.ts's frequencyDuration is a switch, not a lookup table.
/** Occurrences per month: 365.25 / 12 days, / 7 weeks. */
export function monthlyFactorFor(freq: RecurringFrequency): number {
  switch (freq) {
    case 'Daily':
      return 30.44;
    case 'Weekly':
      return 4.348;
    case 'Monthly':
      return 1;
    case 'Yearly':
      return 1 / 12;
    default:
      throw new Error(`unhandled recurring frequency: ${freq satisfies never}`);
  }
}

/** A single rule's amount, normalized to a monthly equivalent. Rounds to the nearest minor unit
 * per rule (via `scaleMoney`) so the Recurring table's per-row "Monthly" column always sums to
 * the KPI row exactly — rounding the total instead would let the two drift apart. */
export function toMonthlyAmount(rule: RecurringRule): Money {
  return scaleMoney(rule.amount, monthlyFactorFor(rule.freq));
}

export type MonthlyCommitment = {
  /** Sum of normalized positive amounts across active rules. */
  readonly income: Money;
  /** Sum of normalized negative amounts across active rules, as a positive magnitude. */
  readonly expense: Money;
  readonly net: Money;
  readonly activeCount: number;
};

export function computeMonthlyCommitment(rules: readonly RecurringRule[]): MonthlyCommitment {
  const active = rules.filter((rule) => rule.active);
  const monthlyAmounts = active.map(toMonthlyAmount);

  const income = sumMoney(monthlyAmounts.filter((amount) => isPositiveMoney(amount)));
  const expenseSigned = sumMoney(monthlyAmounts.filter((amount) => isNegativeMoney(amount)));
  const net = addMoney(income, expenseSigned);

  return {
    income,
    expense: negateMoney(expenseSigned),
    net,
    activeCount: active.length,
  };
}
