// ViewModel for CategoriesScreen.tsx (screens.md "Settings → Categories"), mirroring
// packages/routes/src/settings/useCategoriesScreen.ts — one addition the desktop screen doesn't
// need: a `tab` (expense/income) driving a `SegmentedTabs`, because the mock shows one list at a
// time rather than desktop's two side-by-side columns.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteCategory } from '@repo/app-core/mutations/useDeleteCategory';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import { useState } from 'react';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { type CategoryFormState, useCategoryForm } from './useCategoryForm';

export type CategoryRow = { readonly id: CategoryId; readonly name: string; readonly color: string };

export type CategoryDeleteDialog = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseCategoriesScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly title: string;
      readonly tab: CategoryKind;
      readonly onTabChange: (tab: CategoryKind) => void;
      readonly tabOptions: readonly SegmentedOption<CategoryKind>[];
      readonly rows: readonly CategoryRow[];
      readonly countLabel: string;
      readonly addLabel: string;
      readonly onAdd: () => void;
      readonly onEdit: (id: CategoryId) => void;
      readonly onDelete: (id: CategoryId) => void;
      readonly editAriaLabel: (name: string) => string;
      readonly deleteAriaLabel: (name: string) => string;
      readonly form: CategoryFormState;
      readonly deleteDialog: CategoryDeleteDialog;
    };

export function useCategoriesScreen(): UseCategoriesScreenResult {
  const { t } = useTranslation();
  const categoriesQuery = useCategories();
  const deleteCategory = useDeleteCategory();
  const categoryForm = useCategoryForm();

  const [tab, setTab] = useState<CategoryKind>('expense');
  const [deleting, setDeleting] = useState<Category | undefined>(undefined);

  const usageQuery = useTransactions(
    { categoryId: deleting?.id ?? ('' as CategoryId) },
    { enabled: deleting !== undefined },
  );

  if (categoriesQuery.data === undefined) {
    return { ready: false };
  }

  const categories = categoriesQuery.data;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const rows: CategoryRow[] = categories
    .filter((category) => category.kind === tab)
    .map((category) => ({ color: category.color, id: category.id, name: category.name }));

  const usageCount = usageQuery.data?.length;
  const description =
    usageCount === undefined || usageCount === 0
      ? t('settings:categories.deleteDialog.noTransactions')
      : t('settings:categories.usageWarning', { count: usageCount });

  return {
    addLabel: t('settings:categories.addButton'),
    countLabel: t('settings:categories.countLabel', { count: rows.length }),
    deleteAriaLabel: (name) => t('settings:categories.deleteAriaLabel', { name }),
    deleteDialog: {
      description,
      isOpen: deleting !== undefined,
      isSubmitting: deleteCategory.isPending,
      onClose: () => setDeleting(undefined),
      onConfirm: () => {
        if (!deleting) {
          return;
        }
        deleteCategory.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
      },
      title: deleting ? t('settings:categories.deleteDialog.title', { name: deleting.name }) : '',
    },
    editAriaLabel: (name) => t('settings:categories.editAriaLabel', { name }),
    form: categoryForm.form,
    onAdd: () => categoryForm.openCreate(tab, categories.length),
    onDelete: (id) => {
      const category = categoryById.get(id);
      if (category) {
        setDeleting(category);
      }
    },
    onEdit: (id) => {
      const category = categoryById.get(id);
      if (category) {
        categoryForm.openEdit(category);
      }
    },
    onTabChange: setTab,
    ready: true,
    rows,
    tab,
    tabOptions: [
      { label: t('common:categoryKind.expense'), value: 'expense' },
      { label: t('common:categoryKind.income'), value: 'income' },
    ],
    title: t('settings:nav.categories.label'),
  };
}
