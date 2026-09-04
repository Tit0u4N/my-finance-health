// @repo/domain — level 0.
// ExchangeRate.rateToBase fixed-point convention (domain-model.md, left "TBD"): integer scaled
// by RATE_SCALE, i.e. 6 decimal places. 1 USD = 0.923400 EUR is stored as 923400.

import { z } from 'zod';
import { type Money, toMoney } from './money';

export const RATE_SCALE = 1_000_000;

export const rateToBaseSchema = z.number().int().positive().brand<'RateToBase'>();
export type RateToBase = z.infer<typeof rateToBaseSchema>;

/** Builds a RateToBase from the decimal a user types into the exchange-rate form, e.g. 0.9234. */
export const rateFromDecimal = (decimal: number): RateToBase =>
  rateToBaseSchema.parse(Math.round(decimal * RATE_SCALE));

/** Reads a RateToBase back out as the decimal the settings screen displays. */
export const rateToDecimal = (rate: RateToBase): number => rate / RATE_SCALE;

/**
 * Converts an amount from its own currency into the workspace's base currency.
 * `rate` is undefined exactly when the amount is already in the base currency (identity).
 */
export const convertToBase = (amount: Money, rate: RateToBase | undefined): Money =>
  rate === undefined ? amount : toMoney(Math.round((amount * rate) / RATE_SCALE));
