// @repo/data — level 1.
// ExchangeRate is keyed by currency, not id (domain-model.md) — `upsert` always overwrites the
// one current rate for that currency, never a history (open-questions.md #9a).

import { exchangeRateSchema } from '@repo/domain/entities/exchangeRate';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { RateToBase } from '@repo/domain/primitives/rate';
import type { ExchangeRateRepository } from '@repo/domain/repositories/exchangeRateRepository';
import type { RepositoryDeps } from './shared';

export function createExchangeRateRepository({ gateway, clock }: RepositoryDeps): ExchangeRateRepository {
  return {
    list: async () => gateway.readCollection('exchangeRate', {}),

    upsert: (currency: CurrencyCode, rateToBase: RateToBase) => {
      const record = exchangeRateSchema.parse({ currency, rateToBase, updatedAt: clock.now() });
      return gateway.write('exchangeRate', record);
    },
  };
}
