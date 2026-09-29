// ViewModel for AccountDetailScreen.tsx (screens.md "Account detail"), mirroring
// packages/routes/src/accounts/useAccountDetailScreen.ts's three-armed result union — not-ready,
// found:false (the not-found guard as testable ViewModel state, never a View-level `if (!account)`)
// and the full ready screen — minus `useNavigate`/`useSearch` (the route file injects `accountId`
// and `onBack`; the history range and the search/category filters are local `useState`, not router
// search params — mobile has no shareable URL) and minus the KPI tile row (screens-mobile.md's own
// "no KPI tile row" call for Activity applies here too: the mock's Account detail hero shows only
// the balance plus two badges, and `computePeriodTotals` has no consumer left without them).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccount } from '@repo/app-core/queries/useAccount';
import { useAccountBalanceHistory } from '@repo/app-core/queries/useAccountBalanceHistory';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { accountIdSchema } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/time/workspaceTime';
import { todayIn } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import { useColor } from '@/theme/useColor';
import type { ChipSelectOption } from '@/ui/ChipSelect';
import type { LineChartPoint } from '@/ui/charts/LineChart';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { ACCOUNT_TYPE_ICON, categoryIcon } from '@/ui/visuals';
import {
  accountTransactionsCriteria,
  EMPTY_ACCOUNT_DETAIL_FILTERS,
  isAccountDetailFiltered,
  rangeCaptionKey,
} from './accountRanges';
import { type AccountFormState, useAccountForm } from './useAccountForm';

export type AccountDetailRow = {
  readonly id: string;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly dateLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
};

export type UseAccountDetailScreenResult =
  | { readonly ready: false }
  | { readonly ready: true; readonly found: false; readonly onBack: () => void; readonly notFoundLabel: string }
  | {
      readonly ready: true;
      readonly found: true;
      readonly onBack: () => void;
      readonly hidden: boolean;
      readonly icon: (typeof ACCOUNT_TYPE_ICON)[keyof typeof ACCOUNT_TYPE_ICON];
      readonly color: string;
      readonly eyebrow: string;
      readonly title: string;
      readonly subtitle: string;
      readonly balanceLabel: string;
      readonly currencyLabel: string;
      readonly rowCountBadge: string;
      readonly overflowAriaLabel: string;
      readonly onOpenEdit: () => void;
      readonly editForm: AccountFormState;
      readonly trend: readonly LineChartPoint[];
      readonly trendColor: string;
      readonly range: HistoryRange;
      readonly rangeOptions: readonly SegmentedOption<HistoryRange>[];
      readonly onRangeChange: (range: HistoryRange) => void;
      readonly rangeCaption: string;
      readonly transactionsTitle: string;
      readonly searchValue: string;
      readonly onSearchChange: (value: string) => void;
      readonly onClearSearch: () => void;
      readonly searchPlaceholder: string;
      readonly categoryValue: string;
      readonly onCategoryChange: (value: string) => void;
      readonly categoryOptions: readonly ChipSelectOption[];
      readonly isFiltered: boolean;
      readonly rows: readonly AccountDetailRow[];
      readonly rowCountLabel: string;
      readonly emptyTitle: string;
      readonly emptySubtitle: string;
    };

export function useAccountDetailScreen(rawAccountId: string, onBack: () => void): UseAccountDetailScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const { colors } = useColor();
  const id = accountIdSchema.parse(rawAccountId);

  const accountQuery = useAccount(id);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const editForm = useAccountForm(accountsQuery.data ?? []);

  const [range, setRange] = useState<HistoryRange>('1m');
  const [filters, setFilters] = useState(EMPTY_ACCOUNT_DETAIL_FILTERS);

  const historyQuery = useAccountBalanceHistory(id, range);
  const transactionsQuery = useTransactions(accountTransactionsCriteria(id, filters), { keepPreviousData: true });

  if (accountQuery.isError) {
    return { found: false, notFoundLabel: t('common:state.notFound'), onBack, ready: true };
  }

  const ready =
    accountQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    settingsQuery.data !== undefined &&
    historyQuery.data !== undefined &&
    transactionsQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const account = accountQuery.data as NonNullable<typeof accountQuery.data>;
  const categories = categoriesQuery.data as NonNullable<typeof categoriesQuery.data>;
  const settings = settingsQuery.data as NonNullable<typeof settingsQuery.data>;
  const history = historyQuery.data as NonNullable<typeof historyQuery.data>;
  const transactions = transactionsQuery.data as NonNullable<typeof transactionsQuery.data>;

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const today = todayIn(isoDateTimeSchema.parse(platform.clock.now()), settings.timezone);
  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, account.currency, locale, options);

  const trend: LineChartPoint[] = history.map((point) => ({
    label: formatRelativeDate(point.date, today, locale),
    value: point.balance as number,
    valueLabel: money(point.balance as number, { compact: true }),
  }));

  const rows: AccountDetailRow[] = transactions.map((transaction) => {
    const category = categoryById.get(transaction.cat);
    return {
      amountLabel: money(transaction.amount),
      categoryColor: category?.color ?? colors.muted,
      categoryIcon: categoryIcon(category?.name),
      categoryName: category?.name ?? t('common:category.other'),
      dateLabel: formatRelativeDate(transaction.date.slice(0, 10) as never, today, locale),
      desc: transaction.desc,
      id: transaction.id,
      isPositive: transaction.amount > 0,
    };
  });

  return {
    balanceLabel: money(account.balance),
    categoryOptions: [
      { label: t('transactions:list.categoryAll'), value: 'all' },
      ...categories.map((category) => ({ color: category.color, label: category.name, value: category.id })),
    ],
    categoryValue: filters.category,
    color: account.color,
    currencyLabel: account.currency,
    editForm: editForm.form,
    emptySubtitle: t('accounts:detail.emptySubtitle'),
    emptyTitle: t('accounts:detail.emptyTitle'),
    eyebrow: t('accounts:detail.eyebrow', { type: t(`common:accountType.${account.type}`) }),
    found: true,
    hidden,
    icon: ACCOUNT_TYPE_ICON[account.type],
    isFiltered: isAccountDetailFiltered(filters),
    onBack,
    onCategoryChange: (category) => setFilters((current) => ({ ...current, category })),
    onClearSearch: () => setFilters((current) => ({ ...current, text: '' })),
    onOpenEdit: () => editForm.openEdit(account),
    onRangeChange: setRange,
    onSearchChange: (text) => setFilters((current) => ({ ...current, text })),
    overflowAriaLabel: t('accounts:detail.edit'),
    range,
    rangeCaption: t(rangeCaptionKey(range)),
    rangeOptions: [
      { label: '7d', value: '7d' },
      { label: '1m', value: '1m' },
      { label: '3m', value: '3m' },
      { label: '1y', value: '1y' },
      { label: t('common:historyRange.all'), value: 'all' },
    ],
    ready: true,
    rowCountBadge: t('accounts:detail.kpi.balanceSub', { count: transactions.length }),
    rowCountLabel: t('accounts:detail.rowCount', { count: rows.length }),
    rows,
    searchPlaceholder: t('transactions:list.searchPlaceholder'),
    searchValue: filters.text,
    subtitle: account.last4
      ? t('accounts:detail.subtitleWithLast4', { currency: account.currency, last4: account.last4 })
      : account.currency,
    title: account.name,
    transactionsTitle: t('accounts:detail.transactionsPanelTitle'),
    trend,
    trendColor: account.color,
  };
}
