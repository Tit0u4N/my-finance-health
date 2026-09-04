// @repo/app-core — level 2.
// Composes the investments list — Investments' KPIs (app-core-inventory.md §6).

import { useInvestments } from '../../queries/useInvestments';
import { computePortfolioTotals, type PortfolioTotals } from '../portfolioTotals';

export type UsePortfolioTotalsResult = {
  readonly totals: PortfolioTotals | undefined;
  readonly isLoading: boolean;
};

export function usePortfolioTotals(): UsePortfolioTotalsResult {
  const investmentsQuery = useInvestments();

  if (!investmentsQuery.data) {
    return { totals: undefined, isLoading: investmentsQuery.isLoading };
  }
  return { totals: computePortfolioTotals(investmentsQuery.data), isLoading: investmentsQuery.isLoading };
}
