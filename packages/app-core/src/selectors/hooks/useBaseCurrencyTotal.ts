// @repo/app-core — level 2.
// Composes the three query hooks convertToBaseCurrency.ts needs — Overview's total balance
// (app-core-inventory.md §6).

import type { Money } from '@repo/domain/primitives/money';
import { useAccounts } from '../../queries/useAccounts';
import { useExchangeRates } from '../../queries/useExchangeRates';
import { useWorkspaceSettings } from '../../queries/useWorkspaceSettings';
import { sumAccountBalancesInBaseCurrency } from '../convertToBaseCurrency';

export type UseBaseCurrencyTotalResult = {
  readonly total: Money | undefined;
  readonly isLoading: boolean;
};

export function useBaseCurrencyTotal(): UseBaseCurrencyTotalResult {
  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const isLoading = accountsQuery.isLoading || settingsQuery.isLoading || ratesQuery.isLoading;

  if (!(accountsQuery.data && settingsQuery.data && ratesQuery.data)) {
    return { total: undefined, isLoading };
  }

  return {
    total: sumAccountBalancesInBaseCurrency(accountsQuery.data, settingsQuery.data.baseCurrency, ratesQuery.data),
    isLoading,
  };
}
