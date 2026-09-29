// ViewModel for AccountSheet.tsx — one draft serving both create (Accounts list's `+`) and edit
// (Account detail's "Edit"), mirroring packages/routes/src/accounts/useAccountsScreen.ts's
// `addAccount` dialog and useAccountDetailScreen.ts's `edit` dialog combined into a single sheet.
// On edit, only name and type are patchable — accountPatchSchema excludes `balance` (it only ever
// moves through a transaction write) and desktop's own edit dialog never exposes `currency`
// either, so this form hides both fields once `mode` is `'edit'` rather than inventing a new
// account-currency-change feature.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useCreateAccount } from '@repo/app-core/mutations/useCreateAccount';
import { useUpdateAccount } from '@repo/app-core/mutations/useUpdateAccount';
import { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
import { categoricalPaletteHex } from '@repo/design-tokens/colors';
import type { Account, AccountType } from '@repo/domain/entities/account';
import { createAccountInputSchema } from '@repo/domain/entities/account';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { AccountId } from '@repo/domain/primitives/entityId';
import { useState } from 'react';
import type { OptionGridItem } from '@/ui/OptionGrid';
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_ICON_SLUG } from '@/ui/visuals';

export type AccountFormMode = 'create' | 'edit';

export type AccountFormState = {
  readonly isOpen: boolean;
  readonly mode: AccountFormMode;
  readonly title: string;
  readonly submitLabel: string;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly type: AccountType;
  readonly onTypeChange: (type: AccountType) => void;
  readonly typeOptions: readonly OptionGridItem<AccountType>[];
  readonly typeAriaLabel: string;
  readonly currency: CurrencyCode;
  readonly onCurrencyChange: (currency: CurrencyCode) => void;
  readonly currencyOptions: readonly { readonly value: CurrencyCode; readonly label: string }[];
  readonly initialBalance: string;
  readonly onInitialBalanceChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

type Draft = {
  readonly mode: AccountFormMode;
  readonly id: string | undefined;
  readonly name: string;
  readonly type: AccountType;
  readonly currency: CurrencyCode;
  readonly initialBalance: string;
};

export type UseAccountFormResult = {
  readonly form: AccountFormState;
  readonly openCreate: () => void;
  readonly openEdit: (account: Account) => void;
};

const ACCOUNT_TYPES: readonly AccountType[] = ['Checking', 'Savings', 'Investment', 'Cash'];
const CURRENCIES: readonly CurrencyCode[] = ['EUR', 'USD', 'GBP'];

export function useAccountForm(accounts: readonly Account[]): UseAccountFormResult {
  const { t } = useTranslation();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const [draft, setDraft] = useState<Draft | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const patchDraft = (next: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...next } : current));

  const parsedBalance = draft ? parseAmountInput(draft.initialBalance) : undefined;
  // A blank initial balance is a legitimate "opens at zero" (same rule useAccountsScreen.ts's
  // desktop dialog applies) — only typed nonsense blocks the submit.
  const isBalanceUsable = draft ? draft.initialBalance.trim() === '' || parsedBalance !== undefined : false;
  const isSubmitting = createAccount.isPending || updateAccount.isPending;
  const canSubmit = draft !== undefined && draft.name.trim().length > 0 && isBalanceUsable && !isSubmitting;

  const submit = () => {
    if (!draft) {
      return;
    }
    setErrorMessage(undefined);
    if (draft.mode === 'create') {
      const input = createAccountInputSchema.safeParse({
        balance: toMinorUnits(parsedBalance ?? 0),
        color: categoricalPaletteHex[accounts.length % categoricalPaletteHex.length],
        currency: draft.currency,
        icon: ACCOUNT_TYPE_ICON_SLUG[draft.type],
        name: draft.name.trim(),
        type: draft.type,
      });
      if (!input.success) {
        setErrorMessage(t('accounts:createDialog.errorCheckDetails'));
        return;
      }
      createAccount.mutate(input.data, {
        onError: () => setErrorMessage(t('accounts:createDialog.errorCouldNotCreate')),
        onSuccess: () => setDraft(undefined),
      });
      return;
    }
    if (draft.id === undefined) {
      return;
    }
    updateAccount.mutate(
      { id: draft.id as AccountId, patch: { name: draft.name.trim(), type: draft.type } },
      {
        onError: () => setErrorMessage(t('common:error.couldNotSaveChanges')),
        onSuccess: () => setDraft(undefined),
      },
    );
  };

  return {
    form: {
      canSubmit,
      currency: draft?.currency ?? 'EUR',
      currencyOptions: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
      errorMessage,
      initialBalance: draft?.initialBalance ?? '',
      isOpen: draft !== undefined,
      isSubmitting,
      mode: draft?.mode ?? 'create',
      name: draft?.name ?? '',
      onClose: () => setDraft(undefined),
      onCurrencyChange: (currency) => patchDraft({ currency }),
      onInitialBalanceChange: (initialBalance) => patchDraft({ initialBalance }),
      onNameChange: (name) => patchDraft({ name }),
      onSubmit: submit,
      onTypeChange: (type) => patchDraft({ type }),
      submitLabel: draft?.mode === 'edit' ? t('common:action.saveChanges') : t('accounts:createDialog.submit'),
      title: draft?.mode === 'edit' ? t('accounts:editDialog.title') : t('accounts:createDialog.title'),
      type: draft?.type ?? 'Checking',
      typeAriaLabel: t('accounts:createDialog.typeAriaLabel'),
      typeOptions: ACCOUNT_TYPES.map((type) => ({
        icon: ACCOUNT_TYPE_ICON[type],
        label: t(`common:accountType.${type}`),
        value: type,
      })),
    },
    openCreate: () => {
      setErrorMessage(undefined);
      setDraft({ currency: 'EUR', id: undefined, initialBalance: '', mode: 'create', name: '', type: 'Checking' });
    },
    openEdit: (account) => {
      setErrorMessage(undefined);
      setDraft({
        currency: account.currency,
        id: account.id,
        initialBalance: '',
        mode: 'edit',
        name: account.name,
        type: account.type,
      });
    },
  };
}
