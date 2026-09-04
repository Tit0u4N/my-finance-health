// @repo/app-core — level 2.
// Backs Settings → Preferences' rate entry (app-core-inventory.md §5).

import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { DomainError } from '@repo/domain/primitives/errors';
import type { RateToBase } from '@repo/domain/primitives/rate';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from '../queries/queryKeys';
import { unwrapResult } from '../queries/unwrapResult';

export type UpsertExchangeRateInput = { readonly currency: CurrencyCode; readonly rateToBase: RateToBase };

export function useUpsertExchangeRate(): UseMutationResult<ExchangeRate, DomainError, UpsertExchangeRateInput> {
  const { exchangeRates } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currency, rateToBase }: UpsertExchangeRateInput) =>
      unwrapResult(exchangeRates.upsert(currency, rateToBase)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRates() });
    },
  });
}
