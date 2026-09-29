// ViewModel for RecurringSheet.tsx — same shape as useTransactionForm.ts, mirroring the composition
// of packages/routes/src/recurring/useRecurringForm.ts. `active` is deliberately absent: pausing a
// rule is the list row's own `Switch`, and a newly created rule is always active.
//
// `startDate` goes through `safeParse`, not `parse`: on mobile it is a typed `YYYY-MM-DD` field (no
// date-picker dependency is approved for this pass), so it can genuinely receive nonsense — the web
// form's `isoDateSchema.parse` is only safe there because its `DatePicker` constrains the value.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateRecurringRule } from '@repo/app-core/mutations/useCreateRecurringRule';
import { useUpdateRecurringRule } from '@repo/app-core/mutations/useUpdateRecurringRule';
import { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
import type { Account } from '@repo/domain/entities/account';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import {
  createRecurringRuleInputSchema,
  type RecurringFrequency,
  type RecurringRule,
} from '@repo/domain/entities/recurringRule';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { isoDateSchema } from '@repo/domain/primitives/dateTime';
import type { AccountId, CategoryId, RecurringRuleId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { useState } from 'react';
import type { ChipSelectOption } from '@/ui/ChipSelect';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { type CategoryChoice, categoryChoices, firstCategoryOfKind } from './categoryChoices';

const FREQUENCIES: readonly RecurringFrequency[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

export type RecurringFormState = {
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
  readonly categoryId: string;
  readonly onCategoryChange: (id: string) => void;
  readonly categories: readonly CategoryChoice[];
  readonly accountId: string;
  readonly onAccountChange: (id: string) => void;
  readonly accountOptions: readonly ChipSelectOption[];
  readonly freq: RecurringFrequency;
  readonly onFreqChange: (freq: string) => void;
  readonly freqOptions: readonly ChipSelectOption[];
  readonly startDate: string;
  readonly onStartDateChange: (value: string) => void;
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
  readonly freq: RecurringFrequency;
  readonly startDate: string;
};

export type UseRecurringFormResult = {
  readonly form: RecurringFormState;
  readonly openCreate: () => void;
  readonly openEdit: (rule: RecurringRule) => void;
};

export function useRecurringForm(
  categories: readonly Category[],
  accounts: readonly Account[],
  today: IsoDate | undefined,
): UseRecurringFormResult {
  const { t } = useTranslation();
  const createRecurringRule = useCreateRecurringRule();
  const updateRecurringRule = useUpdateRecurringRule();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const patchDraft = (next: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...next } : current));

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const kind = draft?.kind ?? 'expense';
  const magnitude = draft ? parseAmountInput(draft.amount) : undefined;
  const selectedCategory = draft ? categoryById.get(draft.categoryId as CategoryId) : undefined;
  const isSubmitting = createRecurringRule.isPending || updateRecurringRule.isPending;

  const submit = () => {
    if (!draft || magnitude === undefined || !selectedCategory) {
      return;
    }
    setErrorMessage(undefined);
    const startDateResult = isoDateSchema.safeParse(draft.startDate);
    if (!startDateResult.success) {
      setErrorMessage(t('recurring:dialog.errorCheckDetails'));
      return;
    }
    const startDate = startDateResult.data;
    const desc = draft.desc.trim();
    // Sign from the category's kind, never from the toggle — see useTransactionForm.ts's docblock.
    const amount = toMoney(selectedCategory.kind === 'income' ? toMinorUnits(magnitude) : -toMinorUnits(magnitude));

    if (draft.mode === 'create') {
      const input = createRecurringRuleInputSchema.safeParse({
        acc: draft.accountId as AccountId,
        active: true,
        amount,
        cat: selectedCategory.id,
        desc,
        freq: draft.freq,
        startDate,
      });
      if (!input.success) {
        setErrorMessage(t('recurring:dialog.errorCheckDetails'));
        return;
      }
      createRecurringRule.mutate(input.data, {
        onError: () => setErrorMessage(t('recurring:dialog.errorCouldNotCreate')),
        onSuccess: () => setDraft(undefined),
      });
      return;
    }
    if (draft.id === undefined) {
      return;
    }
    updateRecurringRule.mutate(
      {
        id: draft.id as RecurringRuleId,
        patch: {
          acc: draft.accountId as AccountId,
          amount,
          cat: selectedCategory.id,
          desc,
          freq: draft.freq,
          startDate,
        },
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
      desc: draft?.desc ?? '',
      errorMessage,
      freq: draft?.freq ?? 'Monthly',
      freqOptions: FREQUENCIES.map((freq) => ({ label: t(`common:recurringFrequency.${freq}`), value: freq })),
      isOpen: draft !== undefined,
      isSubmitting,
      kind,
      kindOptions: [
        { label: t('common:categoryKind.expense'), tone: 'negative', value: 'expense' },
        { label: t('common:categoryKind.income'), tone: 'positive', value: 'income' },
      ],
      onAccountChange: (accountId) => patchDraft({ accountId }),
      onAmountChange: (amount) => patchDraft({ amount }),
      onCategoryChange: (categoryId) => patchDraft({ categoryId }),
      onClose: () => setDraft(undefined),
      onDescChange: (desc) => patchDraft({ desc }),
      // `ChipSelect` is generic over plain strings, so the frequency comes back untyped and is
      // narrowed here against the same list the options were built from.
      onFreqChange: (value) => {
        const freq = FREQUENCIES.find((candidate) => candidate === value);
        if (freq !== undefined) {
          patchDraft({ freq });
        }
      },
      onKindChange: (nextKind) =>
        setDraft((current) =>
          current ? { ...current, categoryId: firstCategoryOfKind(categories, nextKind), kind: nextKind } : current,
        ),
      onStartDateChange: (startDate) => patchDraft({ startDate }),
      onSubmit: submit,
      startDate: draft?.startDate ?? today ?? '',
      submitLabel: draft?.mode === 'edit' ? t('common:action.saveChanges') : t('recurring:dialog.createSubmit'),
      title: draft?.mode === 'edit' ? t('recurring:dialog.editTitle') : t('recurring:dialog.createTitle'),
    },
    openCreate: () => {
      setErrorMessage(undefined);
      setDraft({
        accountId: accounts[0]?.id ?? '',
        amount: '',
        categoryId: firstCategoryOfKind(categories, 'expense'),
        desc: '',
        freq: 'Monthly',
        id: undefined,
        kind: 'expense',
        mode: 'create',
        startDate: today ?? '',
      });
    },
    openEdit: (rule) => {
      const category = categoryById.get(rule.cat);
      setErrorMessage(undefined);
      setDraft({
        accountId: rule.acc,
        amount: String(Math.abs(rule.amount) / 100),
        categoryId: rule.cat,
        desc: rule.desc,
        freq: rule.freq,
        id: rule.id,
        kind: category?.kind ?? 'expense',
        mode: 'edit',
        startDate: rule.startDate,
      });
    },
  };
}
