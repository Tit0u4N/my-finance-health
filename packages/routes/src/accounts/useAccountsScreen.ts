// @repo/routes — level 3.
// ViewModel for AccountsScreen.tsx (screens.md "Accounts (list)"). Deliberately does NOT read
// useAccountSelectionStore — this screen shows every account, ignoring the cross-screen scope
// filter Overview/Transactions/Recurring share (screens.md's Accounts row lists no scoping).

import { useCreateAccount } from '@repo/app-core/mutations/useCreateAccount';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useRepositories } from '@repo/app-core/providers/useRepositories';
import { queryKeys } from '@repo/app-core/queries/queryKeys';
import { unwrapResult } from '@repo/app-core/queries/unwrapResult';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { computeChangeByAccount } from '@repo/app-core/selectors/accountPeriodChange';
import { findExchangeRate, sumAccountBalancesInBaseCurrency } from '@repo/app-core/selectors/convertToBaseCurrency';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { Account, AccountType } from '@repo/domain/entities/account';
import { createAccountInputSchema } from '@repo/domain/entities/account';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { toMoney } from '@repo/domain/primitives/money';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import { CATEGORY_SWATCHES } from '@repo/ui/components/ColorSwatchPicker';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { parseAmountInput, toMinorUnits } from '../shared/moneyInput';
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_ICON_SLUG } from '../shared/visuals';

// Same value Overview's per-account sparkline uses — the two screens then share the exact same
// queryKeys.accountBalanceHistory(id, '1m') cache entry, so navigating between them is a hit.
const HISTORY_RANGE: HistoryRange = '1m';

const ACCOUNT_TYPES: readonly AccountType[] = ['Checking', 'Savings', 'Investment', 'Cash'];
const CURRENCIES: readonly CurrencyCode[] = ['EUR', 'USD', 'GBP'];

export type AccountsCard = {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly icon: (typeof ACCOUNT_TYPE_ICON)[Account['type']];
  readonly color: string;
  readonly balanceLabel: string;
  readonly currencyLabel: string;
  readonly changeLabel: string;
  readonly changeTone: 'positive' | 'negative' | 'neutral';
  readonly changeCaption: string;
  readonly sparkline: readonly number[];
};

export type AddAccountDialogState = {
  readonly isOpen: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly type: AccountType;
  readonly onTypeChange: (type: AccountType) => void;
  readonly typeOptions: readonly { readonly value: AccountType; readonly label: string }[];
  readonly currency: CurrencyCode;
  readonly onCurrencyChange: (currency: CurrencyCode) => void;
  readonly currencyOptions: readonly { readonly value: CurrencyCode; readonly label: string }[];
  readonly initialBalance: string;
  readonly onInitialBalanceChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

export type UseAccountsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly subtitle: string;
      readonly hidden: boolean;
      readonly cards: readonly AccountsCard[];
      readonly onOpenAccount: (id: string) => void;
      readonly addAccount: AddAccountDialogState;
    };

const emptyDraft = { name: '', type: 'Checking' as AccountType, currency: 'EUR' as CurrencyCode, initialBalance: '' };

export function useAccountsScreen(): UseAccountsScreenResult {
  const platform = usePlatform();
  const repositories = useRepositories();
  const locale = platform.localization.locale();
  const navigate = useNavigate();

  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const createAccount = useCreateAccount();

  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const accounts = accountsQuery.data ?? [];

  const historyQueries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: queryKeys.accountBalanceHistory(account.id, HISTORY_RANGE),
      queryFn: () => unwrapResult(repositories.accounts.getBalanceHistory(account.id, HISTORY_RANGE)),
    })),
  });

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const window = settings ? rangeFor(HISTORY_RANGE, nowIso, settings.timezone) : undefined;
  const changeQuery = useTransactions(
    window
      ? { dateRange: { start: isoDateTimeSchema.parse(`${window.start}T00:00:00.000Z`), end: nowIso } }
      : { dateRange: { start: nowIso, end: nowIso } },
  );

  const ready =
    settings !== undefined &&
    ratesQuery.data !== undefined &&
    changeQuery.data !== undefined &&
    historyQueries.every((query) => query.data !== undefined);

  if (!ready) {
    return { ready: false };
  }

  const rates = ratesQuery.data as NonNullable<typeof ratesQuery.data>;
  const changeByAccount = computeChangeByAccount(changeQuery.data as NonNullable<typeof changeQuery.data>);
  const money = (amount: number, currency: CurrencyCode, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, currency, locale, options);

  const total = sumAccountBalancesInBaseCurrency(accounts, settings.baseCurrency, rates);
  const hasMissingRate = accounts.some(
    (account) => account.currency !== settings.baseCurrency && findExchangeRate(rates, account.currency) === undefined,
  );
  const subtitle = `${accounts.length} account${accounts.length === 1 ? '' : 's'} · ${money(total, settings.baseCurrency)} total${hasMissingRate ? ' (some rates missing)' : ''}`;

  const cards: AccountsCard[] = accounts.map((account, index) => {
    const change = changeByAccount.get(account.id) ?? toMoney(0);
    const sparkline = (historyQueries[index]?.data ?? []).map((point) => point.balance as number);
    return {
      id: account.id,
      name: account.name,
      meta: account.last4 ? `${account.type} · •• ${account.last4}` : account.type,
      icon: ACCOUNT_TYPE_ICON[account.type],
      color: account.color,
      balanceLabel: money(account.balance, account.currency),
      currencyLabel: account.currency,
      changeLabel: money(change, account.currency, { compact: true, hideSign: change === 0 }),
      changeTone: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      changeCaption: 'past month',
      sparkline,
    };
  });

  const typeOptions = ACCOUNT_TYPES.map((type) => ({ value: type, label: type }));
  const currencyOptions = CURRENCIES.map((currency) => ({ value: currency, label: currency }));
  const parsedBalance = parseAmountInput(draft.initialBalance);
  const canSubmit = draft.name.trim().length > 0 && parsedBalance !== undefined && !createAccount.isPending;

  return {
    ready: true,
    subtitle,
    hidden,
    cards,
    onOpenAccount: (id) => {
      void navigate({ to: '/accounts/$accountId', params: { accountId: id } });
    },
    addAccount: {
      isOpen,
      onOpen: () => {
        setDraft(emptyDraft);
        setErrorMessage(undefined);
        setOpen(true);
      },
      onClose: () => setOpen(false),
      name: draft.name,
      onNameChange: (name) => setDraft((current) => ({ ...current, name })),
      type: draft.type,
      onTypeChange: (type) => setDraft((current) => ({ ...current, type })),
      typeOptions,
      currency: draft.currency,
      onCurrencyChange: (currency) => setDraft((current) => ({ ...current, currency })),
      currencyOptions,
      initialBalance: draft.initialBalance,
      onInitialBalanceChange: (initialBalance) => setDraft((current) => ({ ...current, initialBalance })),
      onSubmit: () => {
        setErrorMessage(undefined);
        const input = createAccountInputSchema.safeParse({
          name: draft.name.trim(),
          type: draft.type,
          currency: draft.currency,
          balance: toMinorUnits(parsedBalance ?? 0),
          // design-system.md §3: "assign categorical-(n mod 8) to the n-th created record".
          color: CATEGORY_SWATCHES[accounts.length % CATEGORY_SWATCHES.length],
          icon: ACCOUNT_TYPE_ICON_SLUG[draft.type],
        });
        if (!input.success) {
          setErrorMessage('Check the account details and try again.');
          return;
        }
        createAccount.mutate(input.data, {
          onSuccess: () => setOpen(false),
          onError: () => setErrorMessage('Could not create the account. Try again.'),
        });
      },
      canSubmit,
      isSubmitting: createAccount.isPending,
      errorMessage,
    },
  };
}
