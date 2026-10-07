// ViewModel for InvestmentSheet.tsx — one draft serving both "Add position" (Invest's `+`) and
// "Edit position" (Investment detail's pencil), cloned from
// packages/routes/src/investments/useInvestmentForm.ts. `current` is only collected on create:
// InvestmentPatch omits it by design (it only ever moves together with a value snapshot).

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateInvestment } from '@repo/app-core/mutations/useCreateInvestment';
import { useUpdateInvestment } from '@repo/app-core/mutations/useUpdateInvestment';
import { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
import { createInvestmentInputSchema, type Investment } from '@repo/domain/entities/investment';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { useState } from 'react';
import { CATEGORY_SWATCHES } from '@/ui/ColorSwatchPicker';

export type InvestmentFormMode = 'create' | 'edit';

export type InvestmentFormState = {
  readonly isOpen: boolean;
  readonly mode: InvestmentFormMode;
  readonly title: string;
  readonly submitLabel: string;
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
  readonly mode: InvestmentFormMode;
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

const DEFAULT_COLOR = CATEGORY_SWATCHES[0] ?? '#6366f1';

export function useInvestmentForm(existingCount: number): UseInvestmentFormResult {
  const { t } = useTranslation();
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const patchDraft = (next: Partial<Draft>) => setDraft((previous) => (previous ? { ...previous, ...next } : previous));

  const qty = draft ? parseAmountInput(draft.qty) : undefined;
  const avg = draft ? parseAmountInput(draft.avg) : undefined;
  const current = draft ? parseAmountInput(draft.current) : undefined;
  const isSubmitting = createInvestment.isPending || updateInvestment.isPending;
  const canSubmit =
    draft !== undefined &&
    draft.name.trim().length > 0 &&
    draft.ticker.trim().length > 0 &&
    qty !== undefined &&
    qty > 0 &&
    avg !== undefined &&
    avg >= 0 &&
    (draft.mode === 'edit' || (current !== undefined && current >= 0)) &&
    !isSubmitting;

  const submit = () => {
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
        avg: toMoney(toMinorUnits(avg)),
        color: draft.color,
        current: toMoney(toMinorUnits(current)),
        name,
        qty,
        ticker,
      });
      if (!input.success) {
        setErrorMessage(t('investments:createDialog.errorCheckDetails'));
        return;
      }
      createInvestment.mutate(input.data, {
        onError: () => setErrorMessage(t('investments:createDialog.errorCouldNotAdd')),
        onSuccess: () => setDraft(undefined),
      });
      return;
    }
    if (draft.id === undefined) {
      return;
    }
    updateInvestment.mutate(
      {
        id: draft.id as InvestmentId,
        patch: { avg: toMoney(toMinorUnits(avg)), color: draft.color, name, qty, ticker },
      },
      {
        onError: () => setErrorMessage(t('common:error.couldNotSaveChanges')),
        onSuccess: () => setDraft(undefined),
      },
    );
  };

  const mode = draft?.mode ?? 'create';

  return {
    form: {
      avg: draft?.avg ?? '',
      canSubmit,
      color: draft?.color ?? DEFAULT_COLOR,
      current: draft?.current ?? '',
      errorMessage,
      isOpen: draft !== undefined,
      isSubmitting,
      mode,
      name: draft?.name ?? '',
      onAvgChange: (avgValue) => patchDraft({ avg: avgValue }),
      onClose: () => setDraft(undefined),
      onColorChange: (color) => patchDraft({ color }),
      onCurrentChange: (currentValue) => patchDraft({ current: currentValue }),
      onNameChange: (name) => patchDraft({ name }),
      onQtyChange: (qtyValue) => patchDraft({ qty: qtyValue }),
      onSubmit: submit,
      onTickerChange: (ticker) => patchDraft({ ticker }),
      qty: draft?.qty ?? '',
      submitLabel: mode === 'create' ? t('investments:createDialog.submitCreate') : t('common:action.saveChanges'),
      ticker: draft?.ticker ?? '',
      title: mode === 'create' ? t('investments:createDialog.addTitle') : t('investments:createDialog.editTitle'),
    },
    openCreate: () => {
      setErrorMessage(undefined);
      // design-system.md §3: "assign categorical-(n mod 8) to the n-th created record".
      setDraft({
        avg: '',
        color: CATEGORY_SWATCHES[existingCount % CATEGORY_SWATCHES.length] ?? DEFAULT_COLOR,
        current: '',
        id: undefined,
        mode: 'create',
        name: '',
        qty: '',
        ticker: '',
      });
    },
    openEdit: (investment) => {
      setErrorMessage(undefined);
      setDraft({
        avg: String(investment.avg / 100),
        color: investment.color,
        current: String(investment.current / 100),
        id: investment.id,
        mode: 'edit',
        name: investment.name,
        qty: String(investment.qty),
        ticker: investment.ticker,
      });
    },
  };
}
