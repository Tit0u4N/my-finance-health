// @repo/app-core — level 2.
// ViewModel of the "starter categories" step shown once, right after a workspace is created
// (audit P1). Shared by desktop and mobile: both render the same checklist from the same list and
// write the chosen entries through the ordinary `useCreateCategory` mutation — seeding is not a
// bootstrap special case (see useWorkspaceBootstrap.ts).

import type { CategoryKind } from '@repo/domain/entities/category';
import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useCreateCategory } from '../mutations/useCreateCategory';
import { STARTER_CATEGORIES, type StarterCategory } from './starterCategories';

export type StarterCategoryRow = StarterCategory & {
  readonly name: string;
  readonly enabled: boolean;
};

export type UseStarterCategoriesResult = {
  readonly income: readonly StarterCategoryRow[];
  readonly expense: readonly StarterCategoryRow[];
  readonly selectedCount: number;
  readonly isSaving: boolean;
  readonly hasError: boolean;
  readonly onToggle: (key: StarterCategory['key']) => void;
  /** Writes the ticked categories, then calls `onDone`. */
  readonly onConfirm: () => Promise<void>;
  /** Leaves with nothing written. */
  readonly onSkip: () => void;
};

export function useStarterCategories(onDone: () => void): UseStarterCategoriesResult {
  const { t } = useTranslation();
  const createCategory = useCreateCategory();
  const [disabled, setDisabled] = useState<ReadonlySet<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  const rows: StarterCategoryRow[] = STARTER_CATEGORIES.map((category) => ({
    ...category,
    enabled: !disabled.has(category.key),
    name: t(`bootstrap:starter.categories.${category.key}`),
  }));
  const ofKind = (kind: CategoryKind) => rows.filter((row) => row.kind === kind);

  const onToggle = (key: StarterCategory['key']): void => {
    setDisabled((current) => {
      const next = new Set(current);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  };

  const onConfirm = async (): Promise<void> => {
    setIsSaving(true);
    setHasError(false);
    try {
      // Sequential, in list order: the local store assigns no ordering of its own, so this keeps
      // the categories listed the way the checklist showed them.
      for (const row of rows) {
        if (row.enabled) {
          await createCategory.mutateAsync({ color: row.color, kind: row.kind, name: row.name });
        }
      }
      onDone();
    } catch {
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    expense: ofKind('expense'),
    hasError,
    income: ofKind('income'),
    isSaving,
    onConfirm,
    onSkip: onDone,
    onToggle,
    selectedCount: rows.filter((row) => row.enabled).length,
  };
}
