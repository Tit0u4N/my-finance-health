// @repo/routes — level 3.
// The Investments list's "Add position" modal, reused for a row's Edit dialog — one draft, same
// pattern as useTransactionForm.ts. `current` is only collected on create: InvestmentPatch omits
// it by design (domain-model.md — it only ever moves together with a value snapshot), so an edit
// never touches price at all.

import { useCreateInvestment } from '@repo/app-core/mutations/useCreateInvestment';
import { useUpdateInvestment } from '@repo/app-core/mutations/useUpdateInvestment';
import { createInvestmentInputSchema, type Investment } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { CATEGORY_SWATCHES } from '@repo/ui/components/ColorSwatchPicker';
import { useState } from 'react';
import { parseAmountInput, toMinorUnits } from '../shared/moneyInput';

export type InvestmentFormState = {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'edit';
  readonly name: string;
  readonly onNameChange: (value: string) => void;
  readonly ticker: string;
  readonly onTickerChange: (value: string) => void;
  readonly qty: string;
  readonly onQtyChange: (value: string) => void;
  readonly avg: string;
  readonly onAvgChange: (value: string) => void;
  readonly current: string;
  readonly onCurrentChange: (value: string) => void;
  readonly color: string;
  readonly onColorChange: (color: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

type Draft = {
  readonly mode: 'create' | 'edit';
  readonly id: string | undefined;
  readonly name: string;
  readonly ticker: string;
  readonly qty: string;
  readonly avg: string;
  readonly current: string;
  readonly color: string;
};

export type UseInvestmentFormResult = {
  readonly form: InvestmentFormState;
  readonly openCreate: () => void;
  readonly openEdit: (investment: Investment) => void;
};

const emptyDraft = (color: string): Draft => ({
  mode: 'create',
  id: undefined,
  name: '',
  ticker: '',
  qty: '',
  avg: '',
  current: '',
  color,
});

export function useInvestmentForm(existingCount: number): UseInvestmentFormResult {
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const qty = draft ? parseAmountInput(draft.qty) : undefined;
  const avg = draft ? parseAmountInput(draft.avg) : undefined;
  const current = draft ? parseAmountInput(draft.current) : undefined;
  const canSubmit =
    draft !== undefined &&
    draft.name.trim().length > 0 &&
    draft.ticker.trim().length > 0 &&
    qty !== undefined &&
    qty > 0 &&
    avg !== undefined &&
    avg >= 0 &&
    (draft.mode === 'edit' || (current !== undefined && current >= 0)) &&
    !createInvestment.isPending &&
    !updateInvestment.isPending;

  return {
    form: {
      isOpen: draft !== undefined,
      mode: draft?.mode ?? 'create',
      name: draft?.name ?? '',
      onNameChange: (name) => setDraft((prev) => (prev ? { ...prev, name } : prev)),
      ticker: draft?.ticker ?? '',
      onTickerChange: (ticker) => setDraft((prev) => (prev ? { ...prev, ticker } : prev)),
      qty: draft?.qty ?? '',
      onQtyChange: (value) => setDraft((prev) => (prev ? { ...prev, qty: value } : prev)),
      avg: draft?.avg ?? '',
      onAvgChange: (value) => setDraft((prev) => (prev ? { ...prev, avg: value } : prev)),
      current: draft?.current ?? '',
      onCurrentChange: (value) => setDraft((prev) => (prev ? { ...prev, current: value } : prev)),
      color: draft?.color ?? CATEGORY_SWATCHES[0] ?? '#6366f1',
      onColorChange: (color) => setDraft((prev) => (prev ? { ...prev, color } : prev)),
      onSubmit: () => {
        if (!draft || qty === undefined || avg === undefined) {
          return;
        }
        setErrorMessage(undefined);
        const name = draft.name.trim();
        const ticker = draft.ticker.trim();

        if (draft.mode === 'create') {
          if (current === undefined) {
            return;
          }
          const input = createInvestmentInputSchema.safeParse({
            name,
            ticker,
            qty,
            avg: toMoney(toMinorUnits(avg)),
            current: toMoney(toMinorUnits(current)),
            color: draft.color,
          });
          if (!input.success) {
            setErrorMessage('Check the position details and try again.');
            return;
          }
          createInvestment.mutate(input.data, {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage('Could not add the position. Try again.'),
          });
          return;
        }
        if (draft.id === undefined) {
          return;
        }
        updateInvestment.mutate(
          {
            id: draft.id as InvestmentId,
            patch: { name, ticker, qty, avg: toMoney(toMinorUnits(avg)), color: draft.color },
          },
          {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage('Could not save the changes. Try again.'),
          },
        );
      },
      onClose: () => setDraft(undefined),
      canSubmit,
      isSubmitting: createInvestment.isPending || updateInvestment.isPending,
      errorMessage,
    },
    openCreate: () => {
      setErrorMessage(undefined);
      // design-system.md §3: "assign categorical-(n mod 8) to the n-th created record".
      setDraft(emptyDraft(CATEGORY_SWATCHES[existingCount % CATEGORY_SWATCHES.length] ?? '#6366f1'));
    },
    openEdit: (investment) => {
      setErrorMessage(undefined);
      setDraft({
        mode: 'edit',
        id: investment.id,
        name: investment.name,
        ticker: investment.ticker,
        qty: String(investment.qty),
        avg: String(investment.avg / 100),
        current: String(investment.current / 100),
        color: investment.color,
      });
    },
  };
}
