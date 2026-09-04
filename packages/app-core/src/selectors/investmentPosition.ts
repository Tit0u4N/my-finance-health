// @repo/app-core — level 2.
// Backs the Investments table and Investment detail (app-core-inventory.md §6).

import type { Investment } from '@repo/domain/entities/investment';
import { type Money, scaleMoney, subtractMoney } from '@repo/domain/primitives/money';

export type InvestmentPosition = {
  readonly value: Money;
  readonly cost: Money;
  readonly profitLoss: Money;
  /** profitLoss / cost, 0 when cost is zero. */
  readonly profitLossPercent: number;
};

export function computeInvestmentPosition(investment: Investment): InvestmentPosition {
  const value = scaleMoney(investment.current, investment.qty);
  const cost = scaleMoney(investment.avg, investment.qty);
  const profitLoss = subtractMoney(value, cost);

  return { value, cost, profitLoss, profitLossPercent: cost === 0 ? 0 : profitLoss / cost };
}
