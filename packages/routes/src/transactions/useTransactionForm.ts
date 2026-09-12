// @repo/routes — level 3.
// The New transaction modal's form state, reused for the ledger row's Edit dialog — one draft,
// like CategoriesScreen's create/edit dialog. The amount's sign is always derived from the
// picked category's `kind` (never from the income/expense tab directly), so a submit can never
// violate `checkAmountMatchesCategoryKind` — the tab only filters which categories are offered
// and resets the pick when it changes.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateTransaction } from '@repo/app-core/mutations/useCreateTransaction';
import { useUpdateTransaction } from '@repo/app-core/mutations/useUpdateTransaction';
import type { Account } from '@repo/domain/entities/account';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import { createTransactionInputSchema, type Transaction } from '@repo/domain/entities/transaction';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { AccountId, CategoryId, TransactionId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import type { CategoryChipItem } from '@repo/ui/components/CategoryChips';
import type { TabItem } from '@repo/ui/components/Tabs';
import { useState } from 'react';
import { parseAmountInput, toMinorUnits } from '../shared/moneyInput';
import { categoryIcon } from '../shared/visuals';

export type TransactionFormState = {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly dialogTitle: string;
  readonly submitLabel: string;
  readonly kind: CategoryKind;
  readonly onKindChange: (kind: CategoryKind) => void;
  readonly kindOptions: readonly TabItem<CategoryKind>[];
  readonly amount: string;
  readonly onAmountChange: (value: string) => void;
  readonly desc: string;
  readonly onDescChange: (value: string) => void;
  readonly categoryId: string;
  readonly onCategoryChange: (id: string) => void;
  readonly categoryChips: readonly CategoryChipItem[];
  readonly accountId: string;
  readonly onAccountChange: (id: string) => void;
  readonly accountOptions: readonly { readonly value: string; readonly label: string }[];
  readonly date: string;
  readonly onDateChange: (value: string) => void;
  readonly note: string;
  readonly onNoteChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

type Draft = {
  readonly mode: 'create' | 'edit';
  readonly id: string | undefined;
  readonly kind: CategoryKind;
  readonly amount: string;
  readonly desc: string;
  readonly categoryId: string;
  readonly accountId: string;
  readonly date: string;
  readonly note: string;
};

export type UseTransactionFormResult = {
  readonly form: TransactionFormState;
  readonly openCreate: () => void;
  readonly openEdit: (transaction: Transaction) => void;
};

export function useTransactionForm(
  categories: readonly Category[],
  accounts: readonly Account[],
  today: string,
): UseTransactionFormResult {
  const { t } = useTranslation();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const firstOfKind = (targetKind: CategoryKind): string =>
    categories.find((category) => category.kind === targetKind)?.id ?? '';

  const kindOptions: readonly TabItem<CategoryKind>[] = [
    { value: 'expense', label: t('common:categoryKind.expense') },
    { value: 'income', label: t('common:categoryKind.income') },
  ];

  const mode = draft?.mode ?? 'create';
  const kind = draft?.kind ?? 'expense';
  const categoryChips: CategoryChipItem[] = categories
    .filter((category) => category.kind === kind)
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: categoryIcon(category.name),
    }));

  const magnitude = draft ? parseAmountInput(draft.amount) : undefined;
  const selectedCategory = draft ? categoryById.get(draft.categoryId as CategoryId) : undefined;
  const canSubmit =
    draft !== undefined &&
    draft.desc.trim().length > 0 &&
    magnitude !== undefined &&
    magnitude > 0 &&
    selectedCategory !== undefined &&
    draft.accountId !== '' &&
    !createTransaction.isPending &&
    !updateTransaction.isPending;

  return {
    form: {
      isOpen: draft !== undefined,
      mode,
      dialogTitle: mode === 'create' ? t('transactions:dialog.createTitle') : t('transactions:dialog.editTitle'),
      submitLabel: mode === 'create' ? t('transactions:dialog.createSubmit') : t('common:action.saveChanges'),
      kind,
      onKindChange: (nextKind) =>
        setDraft((current) => (current ? { ...current, kind: nextKind, categoryId: firstOfKind(nextKind) } : current)),
      kindOptions,
      amount: draft?.amount ?? '',
      onAmountChange: (amount) => setDraft((current) => (current ? { ...current, amount } : current)),
      desc: draft?.desc ?? '',
      onDescChange: (desc) => setDraft((current) => (current ? { ...current, desc } : current)),
      categoryId: draft?.categoryId ?? '',
      onCategoryChange: (categoryId) => setDraft((current) => (current ? { ...current, categoryId } : current)),
      categoryChips,
      accountId: draft?.accountId ?? '',
      onAccountChange: (accountId) => setDraft((current) => (current ? { ...current, accountId } : current)),
      accountOptions: accounts.map((account) => ({ value: account.id, label: account.name })),
      date: draft?.date ?? today,
      onDateChange: (date) => setDraft((current) => (current ? { ...current, date } : current)),
      note: draft?.note ?? '',
      onNoteChange: (note) => setDraft((current) => (current ? { ...current, note } : current)),
      onSubmit: () => {
        if (!draft || magnitude === undefined || !selectedCategory) {
          return;
        }
        setErrorMessage(undefined);
        // T00:00:00.000Z, never a mid-day stamp — Overview's MTD range ends at `nowIso`
        // (09:00Z under the mock), so a later time-of-day would sort a same-day entry out of it.
        const date = isoDateTimeSchema.parse(`${draft.date}T00:00:00.000Z`);
        const desc = draft.desc.trim();
        const note = draft.note.trim();
        const amount = toMoney(selectedCategory.kind === 'income' ? toMinorUnits(magnitude) : -toMinorUnits(magnitude));

        if (draft.mode === 'create') {
          const input = createTransactionInputSchema.safeParse({
            date,
            desc,
            amount,
            cat: selectedCategory.id,
            acc: draft.accountId as AccountId,
            ...(note === '' ? {} : { note }),
          });
          if (!input.success) {
            setErrorMessage(t('transactions:dialog.errorCheckDetails'));
            return;
          }
          createTransaction.mutate(input.data, {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage(t('transactions:dialog.errorCouldNotCreate')),
          });
          return;
        }
        if (draft.id === undefined) {
          return;
        }
        // Amount and category always travel together, re-signed from the chosen category — a
        // patch touching only one of the two, across kinds, would fail the repository's
        // sign/kind invariant.
        updateTransaction.mutate(
          {
            id: draft.id as TransactionId,
            patch: { date, desc, amount, cat: selectedCategory.id, acc: draft.accountId as AccountId, note },
          },
          {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage(t('common:error.couldNotSaveChanges')),
          },
        );
      },
      onClose: () => setDraft(undefined),
      canSubmit,
      isSubmitting: createTransaction.isPending || updateTransaction.isPending,
      errorMessage,
    },
    openCreate: () => {
      setErrorMessage(undefined);
      setDraft({
        mode: 'create',
        id: undefined,
        kind: 'expense',
        amount: '',
        desc: '',
        categoryId: firstOfKind('expense'),
        accountId: accounts[0]?.id ?? '',
        date: today,
        note: '',
      });
    },
    openEdit: (transaction) => {
      const category = categoryById.get(transaction.cat);
      setErrorMessage(undefined);
      setDraft({
        mode: 'edit',
        id: transaction.id,
        kind: category?.kind ?? 'expense',
        amount: String(Math.abs(transaction.amount) / 100),
        desc: transaction.desc,
        categoryId: transaction.cat,
        accountId: transaction.acc,
        date: transaction.date.slice(0, 10),
        note: transaction.note ?? '',
      });
    },
  };
}
