// @repo/domain — level 0.
// Money is always an integer in minor units (cents), never a float — decision open-questions.md
// #1. Formatting to a display string happens only at the presentation edge.

import { z } from 'zod';

export const moneySchema = z.number().int().brand<'Money'>();
export type Money = z.infer<typeof moneySchema>;

export const toMoney = (amount: number): Money => moneySchema.parse(amount);

export const isPositiveMoney = (amount: Money): boolean => amount > 0;
export const isNegativeMoney = (amount: Money): boolean => amount < 0;
export const isZeroMoney = (amount: Money): boolean => amount === 0;

// `-amount || 0` rather than plain `-amount`: negating zero produces -0 in JS, which is
// bit-distinct from 0 and fails strict equality checks (e.g. Vitest's toEqual) even though it's
// mathematically the same amount.
export const negateMoney = (amount: Money): Money => toMoney(-amount || 0);

export const addMoney = (a: Money, b: Money): Money => toMoney(a + b);
export const subtractMoney = (a: Money, b: Money): Money => addMoney(a, negateMoney(b));

/** Sums a list of amounts, e.g. every transaction on an account. Empty list sums to zero. */
export const sumMoney = (amounts: readonly Money[]): Money =>
  toMoney(amounts.reduce((total, amount) => total + amount, 0));

/** Scales an amount by a plain factor (e.g. investment `qty`), rounding to the nearest minor unit. */
export const scaleMoney = (amount: Money, factor: number): Money => toMoney(Math.round(amount * factor));
