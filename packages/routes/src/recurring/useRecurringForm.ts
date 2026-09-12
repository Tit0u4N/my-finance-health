// @repo/routes — level 3.
// The New recurring rule modal's form state, reused for the row's Edit dialog — same shape as
// transactions/useTransactionForm.ts. The `active` toggle lives on the row's own Switch, not in
// this dialog (create defaults to active; screens.md's toggle is a list-row affordance).

import { useCreateRecurringRule } from '@repo/app-core/mutations/useCreateRecurringRule';
import { useUpdateRecurringRule } from '@repo/app-core/mutations/useUpdateRecurringRule';
import type { Account } from '@repo/domain/entities/account';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import {
  createRecurringRuleInputSchema,
  type RecurringFrequency,
  type RecurringRule,
} from '@repo/domain/entities/recurringRule';
import { isoDateSchema } from '@repo/domain/primitives/dateTime';
import type { AccountId, CategoryId, RecurringRuleId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import type { CategoryChipItem } from '@repo/ui/components/CategoryChips';
import type { SelectOption } from '@repo/ui/components/Select';
import type { TabItem } from '@repo/ui/components/Tabs';
import { useState } from 'react';
import { parseAmountInput, toMinorUnits } from '../shared/moneyInput';
import { categoryIcon } from '../shared/visuals';

const KIND_OPTIONS: readonly TabItem<CategoryKind>[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const FREQUENCIES: readonly RecurringFrequency[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
const FREQUENCY_OPTIONS: readonly SelectOption<RecurringFrequency>[] = FREQUENCIES.map((freq) => ({
  value: freq,
  label: freq,
}));

export type RecurringFormState = {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
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
  readonly freq: RecurringFrequency;
  readonly onFreqChange: (freq: RecurringFrequency) => void;
  readonly freqOptions: readonly SelectOption<RecurringFrequency>[];
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
  today: string,
): UseRecurringFormResult {
  const createRecurringRule = useCreateRecurringRule();
  const updateRecurringRule = useUpdateRecurringRule();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const firstOfKind = (targetKind: CategoryKind): string =>
    categories.find((category) => category.kind === targetKind)?.id ?? '';

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
    !createRecurringRule.isPending &&
    !updateRecurringRule.isPending;

  return {
    form: {
      isOpen: draft !== undefined,
      mode: draft?.mode ?? 'create',
      kind,
      onKindChange: (nextKind) =>
        setDraft((current) => (current ? { ...current, kind: nextKind, categoryId: firstOfKind(nextKind) } : current)),
      kindOptions: KIND_OPTIONS,
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
      freq: draft?.freq ?? 'Monthly',
      onFreqChange: (freq) => setDraft((current) => (current ? { ...current, freq } : current)),
      freqOptions: FREQUENCY_OPTIONS,
      startDate: draft?.startDate ?? today,
      onStartDateChange: (startDate) => setDraft((current) => (current ? { ...current, startDate } : current)),
      onSubmit: () => {
        if (!draft || magnitude === undefined || !selectedCategory) {
          return;
        }
        setErrorMessage(undefined);
        const startDate = isoDateSchema.parse(draft.startDate);
        const desc = draft.desc.trim();
        const amount = toMoney(selectedCategory.kind === 'income' ? toMinorUnits(magnitude) : -toMinorUnits(magnitude));

        if (draft.mode === 'create') {
          const input = createRecurringRuleInputSchema.safeParse({
            desc,
            amount,
            freq: draft.freq,
            cat: selectedCategory.id,
            acc: draft.accountId as AccountId,
            startDate,
            active: true,
          });
          if (!input.success) {
            setErrorMessage('Check the rule details and try again.');
            return;
          }
          createRecurringRule.mutate(input.data, {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage('Could not create the rule. Try again.'),
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
              desc,
              amount,
              freq: draft.freq,
              cat: selectedCategory.id,
              acc: draft.accountId as AccountId,
              startDate,
            },
          },
          {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage('Could not save the changes. Try again.'),
          },
        );
      },
      onClose: () => setDraft(undefined),
      canSubmit,
      isSubmitting: createRecurringRule.isPending || updateRecurringRule.isPending,
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
        freq: 'Monthly',
        startDate: today,
      });
    },
    openEdit: (rule) => {
      const category = categoryById.get(rule.cat);
      setErrorMessage(undefined);
      setDraft({
        mode: 'edit',
        id: rule.id,
        kind: category?.kind ?? 'expense',
        amount: String(Math.abs(rule.amount) / 100),
        desc: rule.desc,
        categoryId: rule.cat,
        accountId: rule.acc,
        freq: rule.freq,
        startDate: rule.startDate,
      });
    },
  };
}
