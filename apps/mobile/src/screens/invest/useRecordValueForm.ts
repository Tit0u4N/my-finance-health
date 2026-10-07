// ViewModel for RecordValueSheet.tsx — the "Record value" sheet, opened from Investment detail's
// "Record" button. Cloned from packages/routes/src/investments/useRecordValueForm.ts, with the
// date typed as `YYYY-MM-DD` text (no native date picker dependency, same call as the
// transaction sheet's Custom date) and therefore validated with `safeParse`.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useRecordInvestmentValueSnapshot } from '@repo/app-core/mutations/useRecordInvestmentValueSnapshot';
import { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
import type { Investment } from '@repo/domain/entities/investment';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { useState } from 'react';

export type RecordValueFormState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly submitLabel: string;
  readonly date: string;
  readonly onDateChange: (value: string) => void;
  readonly price: string;
  readonly onPriceChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

type Draft = {
  readonly investmentId: string;
  readonly investmentName: string;
  readonly date: string;
  readonly price: string;
};

export type UseRecordValueFormResult = {
  readonly form: RecordValueFormState;
  readonly openRecordValue: (investment: Investment) => void;
};

export function useRecordValueForm(today: string): UseRecordValueFormResult {
  const { t } = useTranslation();
  const recordValueSnapshot = useRecordInvestmentValueSnapshot();
  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const price = draft ? parseAmountInput(draft.price) : undefined;
  const canSubmit = draft !== undefined && price !== undefined && price >= 0 && !recordValueSnapshot.isPending;

  const submit = () => {
    if (!draft || price === undefined) {
      return;
    }
    setErrorMessage(undefined);
    const date = isoDateTimeSchema.safeParse(`${draft.date.trim()}T00:00:00.000Z`);
    if (!date.success) {
      setErrorMessage(t('investments:recordValueDialog.errorCouldNotRecord'));
      return;
    }
    recordValueSnapshot.mutate(
      { id: draft.investmentId as InvestmentId, snapshot: { date: date.data, price: toMoney(toMinorUnits(price)) } },
      {
        onError: () => setErrorMessage(t('investments:recordValueDialog.errorCouldNotRecord')),
        onSuccess: () => setDraft(undefined),
      },
    );
  };

  return {
    form: {
      canSubmit,
      date: draft?.date ?? today,
      errorMessage,
      isOpen: draft !== undefined,
      isSubmitting: recordValueSnapshot.isPending,
      onClose: () => setDraft(undefined),
      onDateChange: (date) => setDraft((previous) => (previous ? { ...previous, date } : previous)),
      onPriceChange: (value) => setDraft((previous) => (previous ? { ...previous, price: value } : previous)),
      onSubmit: submit,
      price: draft?.price ?? '',
      submitLabel: t('investments:recordValueDialog.submit'),
      title: t('investments:recordValueDialog.title', { name: draft?.investmentName ?? '' }),
    },
    openRecordValue: (investment) => {
      setErrorMessage(undefined);
      setDraft({
        date: today,
        investmentId: investment.id,
        investmentName: investment.name,
        price: String(investment.current / 100),
      });
    },
  };
}
