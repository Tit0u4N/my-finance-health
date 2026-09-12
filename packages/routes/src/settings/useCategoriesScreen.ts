// @repo/routes — level 3.
// ViewModel for CategoriesScreen.tsx (screens.md "Settings → Categories").

import { useCreateCategory } from '@repo/app-core/mutations/useCreateCategory';
import { useDeleteCategory } from '@repo/app-core/mutations/useDeleteCategory';
import { useUpdateCategory } from '@repo/app-core/mutations/useUpdateCategory';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import { CATEGORY_SWATCHES } from '@repo/ui/components/ColorSwatchPicker';
import { useState } from 'react';

export type CategoryRow = { readonly id: CategoryId; readonly name: string; readonly color: string };

export type CategoryDialogState = {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly kindLabel: string;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly color: string;
  readonly onColorChange: (color: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

export type CategoryDeleteState = {
  readonly isOpen: boolean;
  readonly name: string;
  readonly usageWarning: string | undefined;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseCategoriesScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly expenses: readonly CategoryRow[];
      readonly income: readonly CategoryRow[];
      readonly expensesCountLabel: string;
      readonly incomeCountLabel: string;
      readonly onAdd: (kind: CategoryKind) => void;
      readonly onEdit: (id: CategoryId) => void;
      readonly onDelete: (id: CategoryId) => void;
      readonly dialog: CategoryDialogState;
      readonly deleteDialog: CategoryDeleteState;
    };

type Draft = {
  readonly mode: 'create' | 'edit';
  readonly id?: CategoryId;
  readonly kind: CategoryKind;
  readonly name: string;
  readonly color: string;
};

export function useCategoriesScreen(): UseCategoriesScreenResult {
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
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
  const expenses = categories.filter((category) => category.kind === 'expense');
  const income = categories.filter((category) => category.kind === 'income');
  const toRow = (category: Category): CategoryRow => ({ id: category.id, name: category.name, color: category.color });

  const usageCount = usageQuery.data?.length;
  const usageWarning =
    deleting && usageCount !== undefined
      ? usageCount === 0
        ? undefined
        : `${usageCount} transaction${usageCount === 1 ? '' : 's'} use${usageCount === 1 ? 's' : ''} this category.`
      : undefined;

  return {
    ready: true,
    expenses: expenses.map(toRow),
    income: income.map(toRow),
    expensesCountLabel: `${expenses.length} categor${expenses.length === 1 ? 'y' : 'ies'}`,
    incomeCountLabel: `${income.length} categor${income.length === 1 ? 'y' : 'ies'}`,
    onAdd: (kind) => {
      setErrorMessage(undefined);
      setDraft({
        mode: 'create',
        kind,
        name: '',
        color: CATEGORY_SWATCHES[categories.length % CATEGORY_SWATCHES.length] as string,
      });
    },
    onEdit: (id) => {
      const category = categoryById.get(id);
      if (!category) {
        return;
      }
      setErrorMessage(undefined);
      setDraft({ mode: 'edit', id: category.id, kind: category.kind, name: category.name, color: category.color });
    },
    onDelete: (id) => {
      const category = categoryById.get(id);
      if (category) {
        setDeleting(category);
      }
    },
    dialog: {
      isOpen: draft !== undefined,
      mode: draft?.mode ?? 'create',
      kindLabel: draft?.kind === 'income' ? 'Income' : 'Expense',
      name: draft?.name ?? '',
      onNameChange: (name) => setDraft((current) => (current ? { ...current, name } : current)),
      color: draft?.color ?? (CATEGORY_SWATCHES[0] as string),
      onColorChange: (color) => setDraft((current) => (current ? { ...current, color } : current)),
      onSubmit: () => {
        if (!draft) {
          return;
        }
        setErrorMessage(undefined);
        const name = draft.name.trim();
        if (draft.mode === 'create') {
          createCategory.mutate(
            { name, color: draft.color, kind: draft.kind },
            { onSuccess: () => setDraft(undefined), onError: () => setErrorMessage('Could not create the category.') },
          );
          return;
        }
        if (draft.id === undefined) {
          return;
        }
        updateCategory.mutate(
          { id: draft.id, patch: { name, color: draft.color } },
          { onSuccess: () => setDraft(undefined), onError: () => setErrorMessage('Could not save the changes.') },
        );
      },
      onClose: () => setDraft(undefined),
      canSubmit: (draft?.name.trim().length ?? 0) > 0 && !createCategory.isPending && !updateCategory.isPending,
      isSubmitting: createCategory.isPending || updateCategory.isPending,
      errorMessage,
    },
    deleteDialog: {
      isOpen: deleting !== undefined,
      name: deleting?.name ?? '',
      usageWarning,
      onConfirm: () => {
        if (!deleting) {
          return;
        }
        deleteCategory.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
      },
      onClose: () => setDeleting(undefined),
      isSubmitting: deleteCategory.isPending,
    },
  };
}
