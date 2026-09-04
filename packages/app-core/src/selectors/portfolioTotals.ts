// @repo/app-core — level 2.
// Investments' KPIs (app-core-inventory.md §6).

import type { Investment } from '@repo/domain/entities/investment';
import { type Money, subtractMoney, sumMoney } from '@repo/domain/primitives/money';
import { computeInvestmentPosition } from './investmentPosition';

export type PortfolioTotals = {
  readonly value: Money;
  readonly cost: Money;
  readonly profitLoss: Money;
  readonly profitLossPercent: number;
};

export function computePortfolioTotals(investments: readonly Investment[]): PortfolioTotals {
  const positions = investments.map(computeInvestmentPosition);
  const value = sumMoney(positions.map((position) => position.value));
  const cost = sumMoney(positions.map((position) => position.cost));
  const profitLoss = subtractMoney(value, cost);

  return { value, cost, profitLoss, profitLossPercent: cost === 0 ? 0 : profitLoss / cost };
}
