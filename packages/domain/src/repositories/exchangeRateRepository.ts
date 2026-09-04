// @repo/domain — level 0.
// Interface only. `upsert` matches ExchangeRate's key-by-currency shape: no id, no separate
// create/update pair (repository-contracts.md, open-questions.md #9a).

import type { ExchangeRate } from '../entities/exchangeRate';
import type { CurrencyCode } from '../primitives/currency';
import type { DomainError } from '../primitives/errors';
import type { RateToBase } from '../primitives/rate';
import type { Result } from '../primitives/result';

export type ExchangeRateRepository = {
  list(): Promise<Result<readonly ExchangeRate[], DomainError>>;
  upsert(currency: CurrencyCode, rateToBase: RateToBase): Promise<Result<ExchangeRate, DomainError>>;
};
