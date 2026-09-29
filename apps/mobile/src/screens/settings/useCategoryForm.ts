// ViewModel for CategorySheet.tsx — one draft serving both create and edit, mirroring
// packages/routes/src/settings/useCategoriesScreen.ts's `dialog` state.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateCategory } from '@repo/app-core/mutations/useCreateCategory';
import { useUpdateCategory } from '@repo/app-core/mutations/useUpdateCategory';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import { useState } from 'react';
import { CATEGORY_SWATCHES } from '@/ui/ColorSwatchPicker';

export type CategoryFormState = {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly title: string;
  readonly submitLabel: string;
  readonly kindLabel: string;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly color: string;
  readonly onColorChange: (color: string) => void;
  readonly colorAriaLabel: string;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

type Draft = {
  readonly mode: 'create' | 'edit';
  readonly id?: CategoryId;
  readonly kind: CategoryKind;
  readonly name: string;
  readonly color: string;
};

export type UseCategoryFormResult = {
  readonly form: CategoryFormState;
  readonly openCreate: (kind: CategoryKind, existingCount: number) => void;
  readonly openEdit: (category: Category) => void;
};

export function useCategoryForm(): UseCategoryFormResult {
  const { t } = useTranslation();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const submit = () => {
    if (!draft) {
      return;
    }
    setErrorMessage(undefined);
    const name = draft.name.trim();
    if (draft.mode === 'create') {
      createCategory.mutate(
        { color: draft.color, kind: draft.kind, name },
        {
          onError: () => setErrorMessage(t('settings:categories.errorCouldNotCreate')),
          onSuccess: () => setDraft(undefined),
        },
      );
      return;
    }
    if (draft.id === undefined) {
      return;
    }
    updateCategory.mutate(
      { id: draft.id, patch: { color: draft.color, name } },
      { onError: () => setErrorMessage(t('common:error.couldNotSaveChanges')), onSuccess: () => setDraft(undefined) },
    );
  };

  return {
    form: {
      canSubmit: (draft?.name.trim().length ?? 0) > 0 && !createCategory.isPending && !updateCategory.isPending,
      color: draft?.color ?? (CATEGORY_SWATCHES[0] as string),
      colorAriaLabel: t('settings:categories.dialog.colourAriaLabel'),
      errorMessage,
      isOpen: draft !== undefined,
      isSubmitting: createCategory.isPending || updateCategory.isPending,
      kindLabel: draft?.kind === 'income' ? t('common:categoryKind.income') : t('common:categoryKind.expense'),
      mode: draft?.mode ?? 'create',
      name: draft?.name ?? '',
      onClose: () => setDraft(undefined),
      onColorChange: (color) => setDraft((current) => (current ? { ...current, color } : current)),
      onNameChange: (name) => setDraft((current) => (current ? { ...current, name } : current)),
      onSubmit: submit,
      submitLabel:
        draft?.mode === 'edit' ? t('common:action.saveChanges') : t('settings:categories.dialog.createSubmit'),
      title:
        draft?.mode === 'edit'
          ? t('settings:categories.dialog.editTitle')
          : t('settings:categories.dialog.createTitle'),
    },
    openCreate: (kind, existingCount) => {
      setErrorMessage(undefined);
      setDraft({
        color: CATEGORY_SWATCHES[existingCount % CATEGORY_SWATCHES.length] as string,
        kind,
        mode: 'create',
        name: '',
      });
    },
    openEdit: (category) => {
      setErrorMessage(undefined);
      setDraft({ color: category.color, id: category.id, kind: category.kind, mode: 'edit', name: category.name });
    },
  };
}
