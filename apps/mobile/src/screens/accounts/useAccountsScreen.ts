// ViewModel for AccountsScreen.tsx (screens.md "Accounts (list)"), mirroring
// packages/routes/src/accounts/useAccountsScreen.ts's data flow — same queries, same `AccountsCard`
// shape, same `ready: false` discriminated gate — minus `useNavigate` (the route file injects
// `onOpenAccount` instead, same as every other mobile screen: `expo-router` never reaches a
// ViewModel) and minus `@repo/ui`'s `CATEGORY_SWATCHES` (banned on mobile; `useAccountForm.ts`
// imports `categoricalPaletteHex` from `@repo/design-tokens` directly, which is the same source).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
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
import type { Account } from '@repo/domain/entities/account';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { toMoney } from '@repo/domain/primitives/money';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { ACCOUNT_TYPE_ICON } from '@/ui/visuals';
import { type AccountFormState, useAccountForm } from './useAccountForm';

// Same value the (not-yet-built) mobile Overview would use for a per-account sparkline — keeping
// it the literal desktop uses means this fan-out and Account detail's default range share the
// same queryKeys.accountBalanceHistory(id, '1m') cache entry.
const HISTORY_RANGE = '1m' as const;

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

export type UseAccountsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly title: string;
      readonly subtitle: string;
      readonly hidden: boolean;
      readonly cards: readonly AccountsCard[];
      readonly addLabel: string;
      readonly onAdd: () => void;
      readonly addAnotherLabel: string;
      readonly form: AccountFormState;
    };

export function useAccountsScreen(): UseAccountsScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const repositories = useRepositories();
  const locale = useFormattingLocale();

  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const hidden = usePreferencesStore((state) => state.amountsHidden);

  // Snapshotted once, same as useDashboardScreen.ts / useTransactionsScreen.ts: a live clock read
  // would change the 30-day window (and every query key derived from it) on every render.
  const [nowIso] = useState(() => isoDateTimeSchema.parse(platform.clock.now()));

  const accounts = accountsQuery.data ?? [];
  const accountForm = useAccountForm(accounts);

  const historyQueries = useQueries({
    queries: accounts.map((account) => ({
      queryFn: () => unwrapResult(repositories.accounts.getBalanceHistory(account.id, HISTORY_RANGE)),
      queryKey: queryKeys.accountBalanceHistory(account.id, HISTORY_RANGE),
    })),
  });

  const settings = settingsQuery.data;
  const window = settings ? rangeFor(HISTORY_RANGE, nowIso, settings.timezone) : undefined;
  const changeQuery = useTransactions(
    window
      ? { dateRange: { end: nowIso, start: isoDateTimeSchema.parse(`${window.start}T00:00:00.000Z`) } }
      : { dateRange: { end: nowIso, start: nowIso } },
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
  // 30-day per-account change comes from a date-bounded transaction sum, deliberately NOT from
  // getBalanceHistory's series — app-core-inventory.md §6: that series has no leading
  // window-start point, so a single-transaction account's last-minus-first reads as zero.
  const changeByAccount = computeChangeByAccount(changeQuery.data as NonNullable<typeof changeQuery.data>);
  const money = (amount: number, currency: Account['currency'], options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, currency, locale, options);

  const total = sumAccountBalancesInBaseCurrency(accounts, settings.baseCurrency, rates);
  const hasMissingRate = accounts.some(
    (account) => account.currency !== settings.baseCurrency && findExchangeRate(rates, account.currency) === undefined,
  );
  const subtitle =
    t('accounts:list.subtitle', { count: accounts.length, total: money(total, settings.baseCurrency) }) +
    (hasMissingRate ? t('accounts:list.subtitleMissingRate') : '');

  const cards: AccountsCard[] = accounts.map((account, index) => {
    const change = changeByAccount.get(account.id) ?? toMoney(0);
    const sparkline = (historyQueries[index]?.data ?? []).map((point) => point.balance as number);
    const typeLabel = t(`common:accountType.${account.type}`);
    return {
      balanceLabel: money(account.balance, account.currency),
      changeCaption: t('accounts:list.changeCaption'),
      changeLabel: money(change, account.currency, { compact: true, hideSign: change === 0 }),
      changeTone: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      color: account.color,
      currencyLabel: account.currency,
      icon: ACCOUNT_TYPE_ICON[account.type],
      id: account.id,
      meta: account.last4 ? `${typeLabel} · •• ${account.last4}` : typeLabel,
      name: account.name,
      sparkline,
    };
  });

  return {
    addAnotherLabel: t('accounts:list.addAnother'),
    addLabel: t('accounts:list.addAccount'),
    cards,
    form: accountForm.form,
    hidden,
    onAdd: accountForm.openCreate,
    ready: true,
    subtitle,
    title: t('accounts:list.title'),
  };
}
