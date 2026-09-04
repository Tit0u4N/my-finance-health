import { describe, expect, it } from 'vitest';
import { categoryPatchSchema, categorySchema, createCategoryInputSchema } from './category';

const valid = {
  id: 'c1',
  name: 'Groceries',
  color: '#22c55e',
  kind: 'expense',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('category', () => {
  it('parses a valid record', () => {
    expect(categorySchema.parse(valid)).toEqual(valid);
  });

  it('rejects an unknown kind', () => {
    expect(() => categorySchema.parse({ ...valid, kind: 'transfer' })).toThrow();
  });

  it('create input requires kind', () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = valid;
    expect(createCategoryInputSchema.parse(rest)).toEqual(rest);
  });

  it('patch rejects an attempt to change kind', () => {
    expect(() => categoryPatchSchema.parse({ kind: 'income' })).toThrow();
    expect(categoryPatchSchema.parse({ name: 'Rent' })).toEqual({ name: 'Rent' });
  });
});
