// @repo/app-core — level 2.
// The single source of truth for the categories offered right after a workspace is created
// (docs/audit-fonctionnel-2026-11.md, P1). Names are not stored here: each entry carries an i18n
// key under `bootstrap:starter.categories.*`, resolved in the user's language when the category is
// actually written, so a French workspace gets French category names.

import type { CategoryKind } from '@repo/domain/entities/category';

export type StarterCategoryKey =
  | 'salary'
  | 'freelance'
  | 'interest'
  | 'refunds'
  | 'rent'
  | 'groceries'
  | 'utilities'
  | 'transport'
  | 'eatingOut'
  | 'subscriptions'
  | 'health'
  | 'leisure'
  | 'shopping'
  | 'otherExpense';

export type StarterCategory = {
  readonly key: StarterCategoryKey;
  readonly kind: CategoryKind;
  readonly color: string;
};

export const STARTER_CATEGORIES: readonly StarterCategory[] = [
  { key: 'salary', kind: 'income', color: '#10B981' },
  { key: 'freelance', kind: 'income', color: '#06B6D4' },
  { key: 'interest', kind: 'income', color: '#84CC16' },
  { key: 'refunds', kind: 'income', color: '#8B5CF6' },
  { key: 'rent', kind: 'expense', color: '#635BFF' },
  { key: 'groceries', kind: 'expense', color: '#F59E0B' },
  { key: 'utilities', kind: 'expense', color: '#0EA5E9' },
  { key: 'transport', kind: 'expense', color: '#06B6D4' },
  { key: 'eatingOut', kind: 'expense', color: '#EC4899' },
  { key: 'subscriptions', kind: 'expense', color: '#8B5CF6' },
  { key: 'health', kind: 'expense', color: '#EF4444' },
  { key: 'leisure', kind: 'expense', color: '#F97316' },
  { key: 'shopping', kind: 'expense', color: '#14B8A6' },
  { key: 'otherExpense', kind: 'expense', color: '#64748B' },
];
