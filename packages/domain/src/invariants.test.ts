import { describe, expect, it } from 'vitest';
import type { Account } from './entities/account';
import type { Category } from './entities/category';
import {
  checkAmountMatchesCategoryKind,
  checkTransactionAccountExists,
  patchTouchesAmountOrCategory,
} from './invariants';
import type { AccountId } from './primitives/entityId';
import type { Money } from './primitives/money';
import { isErr, isOk } from './primitives/result';

const expenseCategory = {
  id: 'c1',
  name: 'Groceries',
  color: '#22c55e',
  kind: 'expense',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Category;

const incomeCategory = { ...expenseCategory, id: 'c2', kind: 'income' } as Category;

const account = {
  id: 'a1',
  name: 'Everyday',
  type: 'Checking',
  currency: 'EUR',
  balance: 0,
  color: '#3b82f6',
  icon: 'wallet',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Account;

describe('checkAmountMatchesCategoryKind', () => {
  it('accepts a negative amount against an expense category', () => {
    expect(isOk(checkAmountMatchesCategoryKind(-500 as Money, expenseCategory))).toBe(true);
  });

  it('accepts a positive amount against an income category', () => {
    expect(isOk(checkAmountMatchesCategoryKind(500 as Money, incomeCategory))).toBe(true);
  });

  it('rejects a positive amount against an expense category', () => {
    expect(isErr(checkAmountMatchesCategoryKind(500 as Money, expenseCategory))).toBe(true);
  });

  it('rejects a negative amount against an income category', () => {
    expect(isErr(checkAmountMatchesCategoryKind(-500 as Money, incomeCategory))).toBe(true);
  });
});

describe('checkTransactionAccountExists', () => {
  it('accepts a known account', () => {
    expect(isOk(checkTransactionAccountExists('a1' as AccountId, account))).toBe(true);
  });

  it('rejects a missing account', () => {
    expect(isErr(checkTransactionAccountExists('a1' as AccountId, undefined))).toBe(true);
  });
});

describe('patchTouchesAmountOrCategory', () => {
  it('is false for an unrelated patch', () => {
    expect(patchTouchesAmountOrCategory({ desc: 'renamed' })).toBe(false);
  });

  it('is true when amount or cat is present', () => {
    expect(patchTouchesAmountOrCategory({ amount: -100 as Money })).toBe(true);
    expect(patchTouchesAmountOrCategory({ cat: incomeCategory.id })).toBe(true);
  });
});
