// @repo/app-core — level 2.
// Backs Settings → Preferences (rate entry) and the base-currency-conversion selector
// (app-core-inventory.md §4).

import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../providers/useRepositories';
import { queryKeys } from './queryKeys';
import { unwrapResult } from './unwrapResult';

export function useExchangeRates(): UseQueryResult<readonly ExchangeRate[]> {
  const { exchangeRates } = useRepositories();
  return useQuery({
    queryKey: queryKeys.exchangeRates(),
    queryFn: () => unwrapResult(exchangeRates.list()),
  });
}
