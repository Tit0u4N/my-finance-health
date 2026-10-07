// ViewModel for TransactionSheet.tsx — one draft serving both create and edit, mirroring the
// composition of packages/routes/src/transactions/useTransactionForm.ts (never importing it:
// @repo/routes is DOM-only and biome-blocked from apps/mobile).
//
// Two invariants carry over verbatim, because they are what `checkAmountMatchesCategoryKind`
// enforces at the repository:
//   1. the amount's sign comes from the picked category's `kind`, never from the income/expense
//      toggle — the toggle only re-filters which categories are offered and resets the pick;
//   2. on edit, `amount` and `cat` always travel together in the patch.
//
// What differs from the web form: no `DatePicker` dependency is approved for this pass, so the date
// is a Today / Yesterday / Custom chip set backed by a `YYYY-MM-DD` text field — hence `safeParse`
// on the date, which here can genuinely receive typed-in nonsense.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateTransaction } from '@repo/app-core/mutations/useCreateTransaction';
import { useUpdateTransaction } from '@repo/app-core/mutations/useUpdateTransaction';
import { useDescSuggestions } from '@repo/app-core/selectors/hooks/useDescSuggestions';
import { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
import type { Account } from '@repo/domain/entities/account';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import { createTransactionInputSchema, type Transaction } from '@repo/domain/entities/transaction';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { AccountId, CategoryId, TransactionId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { addDays } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import type { ChipSelectOption } from '@/ui/ChipSelect';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { type CategoryChoice, categoryChoices, firstCategoryOfKind } from './categoryChoices';

const FREQUENT_DESC_COUNT = 3;
const AUTOCOMPLETE_DESC_COUNT = 5;

export type TransactionDateMode = 'today' | 'yesterday' | 'custom';

export type TransactionFormState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly submitLabel: string;
  readonly kind: CategoryKind;
  readonly onKindChange: (kind: CategoryKind) => void;
  readonly kindOptions: readonly SegmentedOption<CategoryKind>[];
  readonly amount: string;
  readonly onAmountChange: (value: string) => void;
  readonly desc: string;
  readonly onDescChange: (value: string) => void;
  readonly descSuggestions: readonly string[];
  readonly onPickDescSuggestion: (name: string) => void;
  readonly categoryId: string;
  readonly onCategoryChange: (id: string) => void;
  readonly categories: readonly CategoryChoice[];
  readonly accountId: string;
  readonly onAccountChange: (id: string) => void;
  readonly accountOptions: readonly ChipSelectOption[];
  readonly dateMode: TransactionDateMode;
  readonly onDateModeChange: (mode: TransactionDateMode) => void;
  readonly dateModeOptions: readonly SegmentedOption<TransactionDateMode>[];
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
  readonly dateMode: TransactionDateMode;
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
  today: IsoDate | undefined,
): UseTransactionFormResult {
  const { t } = useTranslation();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  // Empty field: just the three most used descriptions. Typing: a fuzzy autocomplete.
  const isDescEmpty = (draft?.desc ?? '').trim() === '';
  const { names: descSuggestions } = useDescSuggestions(
    draft?.desc ?? '',
    isDescEmpty ? FREQUENT_DESC_COUNT : AUTOCOMPLETE_DESC_COUNT,
    'frequent',
  );

  const yesterday = today === undefined ? undefined : addDays(today, -1);
  const dateForMode = (mode: TransactionDateMode, current: string): string => {
    if (mode === 'today') {
      return today ?? current;
    }
    if (mode === 'yesterday') {
      return yesterday ?? current;
    }
    return current;
  };

  const patchDraft = (next: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...next } : current));

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const kind = draft?.kind ?? 'expense';
  const magnitude = draft ? parseAmountInput(draft.amount) : undefined;
  const selectedCategory = draft ? categoryById.get(draft.categoryId as CategoryId) : undefined;
  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;

  const submit = () => {
    if (!draft || magnitude === undefined || !selectedCategory) {
      return;
    }
    setErrorMessage(undefined);
    // Pinned to midnight UTC, never a mid-day stamp: Home's month-to-date range ends at `nowIso`,
    // so a later time-of-day would sort a same-day entry out of it.
    const dateResult = isoDateTimeSchema.safeParse(`${draft.date}T00:00:00.000Z`);
    if (!dateResult.success) {
      setErrorMessage(t('transactions:dialog.errorCheckDetails'));
      return;
    }
    const date = dateResult.data;
    const desc = draft.desc.trim();
    const note = draft.note.trim();
    const amount = toMoney(selectedCategory.kind === 'income' ? toMinorUnits(magnitude) : -toMinorUnits(magnitude));

    if (draft.mode === 'create') {
      const input = createTransactionInputSchema.safeParse({
        acc: draft.accountId as AccountId,
        amount,
        cat: selectedCategory.id,
        date,
        desc,
        ...(note === '' ? {} : { note }),
      });
      if (!input.success) {
        setErrorMessage(t('transactions:dialog.errorCheckDetails'));
        return;
      }
      createTransaction.mutate(input.data, {
        onError: () => setErrorMessage(t('transactions:dialog.errorCouldNotCreate')),
        onSuccess: () => setDraft(undefined),
      });
      return;
    }
    if (draft.id === undefined) {
      return;
    }
    updateTransaction.mutate(
      {
        id: draft.id as TransactionId,
        patch: { acc: draft.accountId as AccountId, amount, cat: selectedCategory.id, date, desc, note },
      },
      {
        onError: () => setErrorMessage(t('common:error.couldNotSaveChanges')),
        onSuccess: () => setDraft(undefined),
      },
    );
  };

  return {
    form: {
      accountId: draft?.accountId ?? '',
      accountOptions: accounts.map((account) => ({ color: account.color, label: account.name, value: account.id })),
      amount: draft?.amount ?? '',
      canSubmit:
        draft !== undefined &&
        draft.desc.trim().length > 0 &&
        magnitude !== undefined &&
        magnitude > 0 &&
        selectedCategory !== undefined &&
        draft.accountId !== '' &&
        !isSubmitting,
      categories: categoryChoices(categories, kind),
      categoryId: draft?.categoryId ?? '',
      date: draft?.date ?? today ?? '',
      dateMode: draft?.dateMode ?? 'today',
      dateModeOptions: [
        { label: t('transactions:dialog.dateToday'), value: 'today' },
        { label: t('transactions:dialog.dateYesterday'), value: 'yesterday' },
        { label: t('transactions:dialog.dateCustom'), value: 'custom' },
      ],
      desc: draft?.desc ?? '',
      descSuggestions,
      errorMessage,
      isOpen: draft !== undefined,
      isSubmitting,
      kind,
      kindOptions: [
        { label: t('common:categoryKind.expense'), tone: 'negative', value: 'expense' },
        { label: t('common:categoryKind.income'), tone: 'positive', value: 'income' },
      ],
      note: draft?.note ?? '',
      onAccountChange: (accountId) => patchDraft({ accountId }),
      onAmountChange: (amount) => patchDraft({ amount }),
      onCategoryChange: (categoryId) => patchDraft({ categoryId }),
      onClose: () => setDraft(undefined),
      onDateChange: (date) => patchDraft({ date }),
      onDateModeChange: (dateMode) =>
        setDraft((current) =>
          current ? { ...current, date: dateForMode(dateMode, current.date), dateMode } : current,
        ),
      onDescChange: (desc) => patchDraft({ desc }),
      onKindChange: (nextKind) =>
        setDraft((current) =>
          current ? { ...current, categoryId: firstCategoryOfKind(categories, nextKind), kind: nextKind } : current,
        ),
      onNoteChange: (note) => patchDraft({ note }),
      onPickDescSuggestion: (desc) => patchDraft({ desc }),
      onSubmit: submit,
      submitLabel: draft?.mode === 'edit' ? t('common:action.saveChanges') : t('transactions:dialog.createSubmit'),
      title: draft?.mode === 'edit' ? t('transactions:dialog.editTitle') : t('transactions:dialog.createTitle'),
    },
    openCreate: () => {
      setErrorMessage(undefined);
      setDraft({
        accountId: accounts[0]?.id ?? '',
        amount: '',
        categoryId: firstCategoryOfKind(categories, 'expense'),
        date: today ?? '',
        dateMode: 'today',
        desc: '',
        id: undefined,
        kind: 'expense',
        mode: 'create',
        note: '',
      });
    },
    openEdit: (transaction) => {
      const category = categoryById.get(transaction.cat);
      const date = transaction.date.slice(0, 10);
      setErrorMessage(undefined);
      setDraft({
        accountId: transaction.acc,
        // Minor units back to a major-unit editable string. `/ 100` then `String` is the same
        // round-trip the web form does — this is form state being re-seeded, not a displayed
        // number, so cross-app-pitfalls.md #5's `Intl` rule does not apply to it.
        amount: String(Math.abs(transaction.amount) / 100),
        categoryId: transaction.cat,
        date,
        dateMode: dateModeFor(date, today, yesterday),
        desc: transaction.desc,
        id: transaction.id,
        kind: category?.kind ?? 'expense',
        mode: 'edit',
        note: transaction.note ?? '',
      });
    },
  };
}

function dateModeFor(date: string, today: IsoDate | undefined, yesterday: IsoDate | undefined): TransactionDateMode {
  if (date === today) {
    return 'today';
  }
  if (date === yesterday) {
    return 'yesterday';
  }
  return 'custom';
}
