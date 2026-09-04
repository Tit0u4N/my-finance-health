// @repo/app-core — level 2.
// The fix for the mock's silent multi-currency bug (open-questions.md #2): every cross-account
// total must convert through this, never sum raw balances across currencies. Pure — no React,
// testable without a query client, reusable unchanged by mobile.

import type { Account } from '@repo/domain/entities/account';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { type Money, sumMoney } from '@repo/domain/primitives/money';
import { convertToBase } from '@repo/domain/primitives/rate';

export function findExchangeRate(rates: readonly ExchangeRate[], currency: CurrencyCode): ExchangeRate | undefined {
  return rates.find((rate) => rate.currency === currency);
}

/** Identity when `currency` already is `baseCurrency` — no rate lookup, no rounding drift. */
export function convertAmountToBaseCurrency(
  amount: Money,
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
  rates: readonly ExchangeRate[],
): Money {
  if (currency === baseCurrency) {
    return amount;
  }
  return convertToBase(amount, findExchangeRate(rates, currency)?.rateToBase);
}

/** Overview's total balance and any other cross-account sum. */
export function sumAccountBalancesInBaseCurrency(
  accounts: readonly Account[],
  baseCurrency: CurrencyCode,
  rates: readonly ExchangeRate[],
): Money {
  return sumMoney(
    accounts.map((account) => convertAmountToBaseCurrency(account.balance, account.currency, baseCurrency, rates)),
  );
}
