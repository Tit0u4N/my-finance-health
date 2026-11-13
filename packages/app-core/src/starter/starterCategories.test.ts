import { describe, expect, it } from 'vitest';
import { STARTER_CATEGORIES } from './starterCategories';

describe('STARTER_CATEGORIES', () => {
  it('has unique keys', () => {
    const keys = STARTER_CATEGORIES.map((category) => category.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('offers both income and expense categories, so any transaction kind can be recorded', () => {
    expect(STARTER_CATEGORIES.some((category) => category.kind === 'income')).toBe(true);
    expect(STARTER_CATEGORIES.some((category) => category.kind === 'expense')).toBe(true);
  });

  it('uses valid hex colours', () => {
    for (const category of STARTER_CATEGORIES) {
      expect(category.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
