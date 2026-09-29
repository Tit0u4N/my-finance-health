import { describe, expect, it } from 'vitest';
import { EMPTY_LEDGER_FILTERS, isLedgerFiltered, type LedgerFilters, ledgerCriteria } from './ledgerCriteria';

const filters = (overrides: Partial<LedgerFilters> = {}): LedgerFilters => ({ ...EMPTY_LEDGER_FILTERS, ...overrides });

describe('ledgerCriteria', () => {
  it('emits only the sort when nothing is filtered', () => {
    // The point of the conditional spread: an unfiltered ledger must produce exactly this object,
    // not one carrying `text: ''` / `categoryId: undefined` keys that would hash to a second key.
    expect(ledgerCriteria(filters())).toEqual({ sort: { direction: 'desc', key: 'date' } });
  });

  it('omits a whitespace-only search instead of sending it', () => {
    expect(ledgerCriteria(filters({ text: '   ' }))).not.toHaveProperty('text');
  });

  it('trims the search text it does send', () => {
    expect(ledgerCriteria(filters({ text: '  monoprix ' })).text).toBe('monoprix');
  });

  it('maps the income type onto a positive amount sign', () => {
    expect(ledgerCriteria(filters({ type: 'income' })).amountSign).toBe('positive');
  });

  it('maps the expense type onto a negative amount sign', () => {
    expect(ledgerCriteria(filters({ type: 'expense' })).amountSign).toBe('negative');
  });

  it('omits the amount sign for the "all types" default', () => {
    expect(ledgerCriteria(filters({ type: 'all' }))).not.toHaveProperty('amountSign');
  });

  it('passes a picked category through as categoryId', () => {
    expect(ledgerCriteria(filters({ category: 'c-grc' })).categoryId).toBe('c-grc');
  });

  it('passes a picked account through as a single-element accountIds list', () => {
    expect(ledgerCriteria(filters({ account: 'a1' })).accountIds).toEqual(['a1']);
  });

  it('omits both entity filters for their "all" defaults', () => {
    const criteria = ledgerCriteria(filters({ account: 'all', category: 'all' }));
    expect(criteria).not.toHaveProperty('categoryId');
    expect(criteria).not.toHaveProperty('accountIds');
  });

  it('combines every filter into one criteria object', () => {
    expect(ledgerCriteria({ account: 'a1', category: 'c-grc', text: 'market', type: 'expense' })).toEqual({
      accountIds: ['a1'],
      amountSign: 'negative',
      categoryId: 'c-grc',
      sort: { direction: 'desc', key: 'date' },
      text: 'market',
    });
  });
});

describe('isLedgerFiltered', () => {
  it('is false for the empty filter state', () => {
    expect(isLedgerFiltered(EMPTY_LEDGER_FILTERS)).toBe(false);
  });

  it('is false for a whitespace-only search, matching what the criteria actually send', () => {
    expect(isLedgerFiltered(filters({ text: '  ' }))).toBe(false);
  });

  it('is true once any single filter narrows the list', () => {
    expect(isLedgerFiltered(filters({ text: 'a' }))).toBe(true);
    expect(isLedgerFiltered(filters({ type: 'income' }))).toBe(true);
    expect(isLedgerFiltered(filters({ category: 'c-grc' }))).toBe(true);
    expect(isLedgerFiltered(filters({ account: 'a1' }))).toBe(true);
  });
});
