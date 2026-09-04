// @repo/domain — level 0.
// domain-model.md "ExchangeRate" (open-questions.md #9a). `currency` is the record's key — one
// current rate per non-base currency, not a history — so there is no id and no CreateXInput /
// XPatch pair, only the upsert shape ExchangeRateRepository.upsert expects.

import { z } from 'zod';
import { currencyCodeSchema } from '../primitives/currency';
import { isoDateTimeSchema } from '../primitives/dateTime';
import { rateToBaseSchema } from '../primitives/rate';

export const exchangeRateSchema = z.object({
  /** The non-base currency this rate converts *from*. */
  currency: currencyCodeSchema,
  rateToBase: rateToBaseSchema,
  updatedAt: isoDateTimeSchema,
});
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

export const upsertExchangeRateInputSchema = exchangeRateSchema.omit({ updatedAt: true }).strict();
export type UpsertExchangeRateInput = z.infer<typeof upsertExchangeRateInputSchema>;
