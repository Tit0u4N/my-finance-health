// @repo/app-core — level 2.
// Investments' allocation panel (app-core-inventory.md §6).

import type { Investment } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { scaleMoney, sumMoney } from '@repo/domain/primitives/money';

export type AllocationEntry = {
  readonly investmentId: InvestmentId;
  /** Share of total portfolio value, 0..1. 0 for every entry when the portfolio is worth zero. */
  readonly share: number;
};

export function computeAllocation(investments: readonly Investment[]): readonly AllocationEntry[] {
  const values = investments.map((investment) => ({
    investmentId: investment.id,
    value: scaleMoney(investment.current, investment.qty),
  }));
  const total = sumMoney(values.map((entry) => entry.value));

  return values.map((entry) => ({ investmentId: entry.investmentId, share: total === 0 ? 0 : entry.value / total }));
}
