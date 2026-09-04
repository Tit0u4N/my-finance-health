import type { Account } from '@repo/domain/entities/account';
import type { ExchangeRate } from '@repo/domain/entities/exchangeRate';
import { describe, expect, it } from 'vitest';
import { convertAmountToBaseCurrency, sumAccountBalancesInBaseCurrency } from './convertToBaseCurrency';

function account(overrides: Partial<Account>): Account {
  return {
    id: 'a1',
    name: 'Everyday',
    type: 'Checking',
    currency: 'EUR',
    balance: 100_000,
    color: '#3b82f6',
    icon: 'wallet',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Account;
}

const usdRate = { currency: 'USD', rateToBase: 900_000, updatedAt: '2026-01-01T00:00:00.000Z' } as ExchangeRate;

describe('convertAmountToBaseCurrency', () => {
  it('is identity when the currency already is the base currency', () => {
    expect(convertAmountToBaseCurrency(1000 as never, 'EUR', 'EUR', [])).toBe(1000);
  });

  it('converts using the matching rate', () => {
    expect(convertAmountToBaseCurrency(1000 as never, 'USD', 'EUR', [usdRate])).toBe(900);
  });
});

describe('sumAccountBalancesInBaseCurrency', () => {
  it('fixes the mock’s silent multi-currency bug by converting every account first', () => {
    const accounts = [
      account({ currency: 'EUR', balance: 100_000 as never }),
      account({ currency: 'USD', balance: 100_000 as never }),
    ];
    expect(sumAccountBalancesInBaseCurrency(accounts, 'EUR', [usdRate])).toBe(190_000);
  });

  it('sums to zero for an empty account list', () => {
    expect(sumAccountBalancesInBaseCurrency([], 'EUR', [])).toBe(0);
  });
});
