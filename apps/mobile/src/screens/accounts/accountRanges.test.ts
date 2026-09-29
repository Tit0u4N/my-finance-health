import { accountIdSchema, categoryIdSchema } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/time/workspaceTime';
import { describe, expect, it } from 'vitest';
import {
  accountTransactionsCriteria,
  EMPTY_ACCOUNT_DETAIL_FILTERS,
  isAccountDetailFiltered,
  rangeCaptionKey,
} from './accountRanges';

describe('accountTransactionsCriteria', () => {
  const id = accountIdSchema.parse('a1');

  it('scopes to the one account, sorted newest first, with no date bound, when unfiltered', () => {
    expect(accountTransactionsCriteria(id)).toEqual({
      accountIds: [id],
      sort: { direction: 'desc', key: 'date' },
    });
    expect(accountTransactionsCriteria(id, EMPTY_ACCOUNT_DETAIL_FILTERS)).toEqual({
      accountIds: [id],
      sort: { direction: 'desc', key: 'date' },
    });
  });

  it('adds a trimmed text filter only when non-blank', () => {
    expect(accountTransactionsCriteria(id, { category: 'all', text: '  groceries  ' })).toEqual({
      accountIds: [id],
      sort: { direction: 'desc', key: 'date' },
      text: 'groceries',
    });
    expect(accountTransactionsCriteria(id, { category: 'all', text: '   ' })).toEqual({
      accountIds: [id],
      sort: { direction: 'desc', key: 'date' },
    });
  });

  it('adds a category filter only when narrowed off "all"', () => {
    const categoryId = categoryIdSchema.parse('c1');
    expect(accountTransactionsCriteria(id, { category: categoryId, text: '' })).toEqual({
      accountIds: [id],
      categoryId,
      sort: { direction: 'desc', key: 'date' },
    });
  });
});

describe('isAccountDetailFiltered', () => {
  it('is false only for the empty filters', () => {
    expect(isAccountDetailFiltered(EMPTY_ACCOUNT_DETAIL_FILTERS)).toBe(false);
    expect(isAccountDetailFiltered({ category: 'all', text: 'x' })).toBe(true);
    expect(isAccountDetailFiltered({ category: categoryIdSchema.parse('c1'), text: '' })).toBe(true);
  });
});

describe('rangeCaptionKey', () => {
  it('gives 7d and 1m their own key', () => {
    expect(rangeCaptionKey('7d')).toBe('accounts:detail.pastPeriod7d');
    expect(rangeCaptionKey('1m')).toBe('accounts:detail.pastPeriodMonth');
  });

  it('resolves 3m, 1y and all to the same "past period" key', () => {
    const longRanges: readonly HistoryRange[] = ['3m', '1y', 'all'];
    for (const range of longRanges) {
      expect(rangeCaptionKey(range)).toBe('accounts:detail.pastPeriodOther');
    }
  });
});
