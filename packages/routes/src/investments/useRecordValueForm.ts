// @repo/routes — level 3.
// The "Record value" modal, opened from both the Investments row menu and Investment detail's
// header action — one small hook shared by both ViewModels, same "single draft" shape as the
// other forms in this pass.

import { useRecordInvestmentValueSnapshot } from '@repo/app-core/mutations/useRecordInvestmentValueSnapshot';
import type { Investment } from '@repo/domain/entities/investment';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { toMoney } from '@repo/domain/primitives/money';
import { useState } from 'react';
import { parseAmountInput, toMinorUnits } from '../shared/moneyInput';

export type RecordValueFormState = {
  readonly isOpen: boolean;
  readonly investmentName: string;
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
  const recordValueSnapshot = useRecordInvestmentValueSnapshot();
  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const price = draft ? parseAmountInput(draft.price) : undefined;
  const canSubmit = draft !== undefined && price !== undefined && price >= 0 && !recordValueSnapshot.isPending;

  return {
    form: {
      isOpen: draft !== undefined,
      investmentName: draft?.investmentName ?? '',
      date: draft?.date ?? today,
      onDateChange: (date) => setDraft((prev) => (prev ? { ...prev, date } : prev)),
      price: draft?.price ?? '',
      onPriceChange: (value) => setDraft((prev) => (prev ? { ...prev, price: value } : prev)),
      onSubmit: () => {
        if (!draft || price === undefined) {
          return;
        }
        setErrorMessage(undefined);
        recordValueSnapshot.mutate(
          {
            id: draft.investmentId as InvestmentId,
            snapshot: {
              date: isoDateTimeSchema.parse(`${draft.date}T00:00:00.000Z`),
              price: toMoney(toMinorUnits(price)),
            },
          },
          {
            onSuccess: () => setDraft(undefined),
            onError: () => setErrorMessage('Could not record the value. Try again.'),
          },
        );
      },
      onClose: () => setDraft(undefined),
      canSubmit,
      isSubmitting: recordValueSnapshot.isPending,
      errorMessage,
    },
    openRecordValue: (investment) => {
      setErrorMessage(undefined);
      setDraft({
        investmentId: investment.id,
        investmentName: investment.name,
        date: today,
        price: String(investment.current / 100),
      });
    },
  };
}
