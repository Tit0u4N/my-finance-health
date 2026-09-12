// @repo/routes — level 3.
// ViewModel for OverviewScreen.tsx (screens.md "Overview (dashboard)"). Composes every app-core
// query/mutation hook and selector the screen needs, plus the two cross-screen stores (account
// scope, amounts-hidden) — returns plain data only, never JSX, per CLAUDE.md's MVVM split.

import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useRepositories } from '@repo/app-core/providers/useRepositories';
import { queryKeys } from '@repo/app-core/queries/queryKeys';
import { unwrapResult } from '@repo/app-core/queries/unwrapResult';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { computeCashflowGraph } from '@repo/app-core/selectors/cashflowGraph';
import { computeCategoryBreakdown } from '@repo/app-core/selectors/categoryBreakdown';
import { sumAccountBalancesInBaseCurrency } from '@repo/app-core/selectors/convertToBaseCurrency';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatPercent } from '@repo/app-core/selectors/formatPercent';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { useRecentPeriodTrend } from '@repo/app-core/selectors/hooks/useRecentPeriodTrend';
import { useUpcomingRecurring } from '@repo/app-core/selectors/hooks/useUpcomingRecurring';
import { computePeriodTotals } from '@repo/app-core/selectors/periodTotals';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { Account } from '@repo/domain/entities/account';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { HistoryRange, TransactionCriteria } from '@repo/domain/repositories/criteria';
import { startOfMonthIn, todayIn } from '@repo/domain/time/workspaceTime';
import type { AccountFilterRow } from '@repo/ui/components/AccountFilter';
import type { DonutSlice } from '@repo/ui/components/charts/Donut';
import type { SankeyLink, SankeyNode } from '@repo/ui/components/charts/Sankey';
import { useQueries } from '@tanstack/react-query';
import { useAccountScope } from '../shared/useAccountScope';
import { ACCOUNT_TYPE_ICON, categoryIcon } from '../shared/visuals';

const BALANCE_HISTORY_RANGE: HistoryRange = '1m';
const UPCOMING_LIMIT = 4;
const RECENT_ACTIVITY_LIMIT = 8;
const NEUTRAL_COLOR = 'var(--mfh-muted)';
const POSITIVE_COLOR = 'var(--mfh-pos)';

export type OverviewKpi = {
  readonly id: string;
  readonly label: string;
  readonly valueLabel: string;
  readonly sub: string;
  readonly deltaLabel?: string;
  readonly deltaTone?: 'positive' | 'negative' | 'accent';
  readonly hero?: boolean;
  readonly sparkData?: readonly number[];
  readonly sparkColor?: string;
};

export type OverviewAccountRow = {
  readonly id: string;
  readonly name: string;
  readonly typeLabel: string;
  readonly icon: (typeof ACCOUNT_TYPE_ICON)[Account['type']];
  readonly color: string;
  readonly sparkline: readonly number[];
  readonly balanceLabel: string;
};

export type OverviewUpcomingRow = {
  readonly id: string;
  readonly desc: string;
  readonly whenLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
};

export type OverviewActivityRow = {
  readonly id: string;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly accountName: string;
  readonly dateLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
};

export type OverviewCashflow = {
  readonly nodes: readonly SankeyNode[];
  readonly links: readonly SankeyLink[];
  readonly legend: readonly {
    readonly id: string;
    readonly label: string;
    readonly color: string;
    readonly valueLabel: string;
  }[];
};

export type OverviewBreakdown = {
  readonly data: readonly DonutSlice[];
  readonly centerValueLabel: string;
  readonly legend: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: string;
    readonly valueLabel: string;
    readonly percentLabel: string;
  }[];
};

export type UseOverviewScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly subtitle: string;
      readonly hidden: boolean;
      readonly kpis: readonly OverviewKpi[];
      readonly cashflow: OverviewCashflow;
      readonly breakdown: OverviewBreakdown;
      readonly accountRows: readonly OverviewAccountRow[];
      readonly totalBalanceLabel: string;
      readonly upcoming: readonly OverviewUpcomingRow[];
      readonly activity: readonly OverviewActivityRow[];
      readonly activityCountLabel: string;
      readonly accountFilter: {
        readonly accounts: readonly AccountFilterRow[];
        readonly selectedIds: readonly string[];
        readonly onToggle: (id: string) => void;
        readonly onSelectAll: () => void;
      };
    };

export function useOverviewScreen(): UseOverviewScreenResult {
  const platform = usePlatform();
  const repositories = useRepositories();
  const locale = platform.localization.locale();

  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const categoriesQuery = useCategories();

  const hidden = usePreferencesStore((state) => state.amountsHidden);

  const accounts = accountsQuery.data ?? [];
  const scope = useAccountScope(accounts, (account) =>
    formatMoney(account.balance, account.currency, locale, { compact: true }),
  );
  const scopedAccounts = accounts.filter((account) => scope.selectedIds.includes(account.id));

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;
  const monthStart = settings ? startOfMonthIn(nowIso, settings.timezone) : undefined;

  const scopeCriteria = scope.accountIds === undefined ? {} : { accountIds: scope.accountIds };
  const transactionsCriteria: TransactionCriteria = {
    ...scopeCriteria,
    ...(monthStart
      ? { dateRange: { start: isoDateTimeSchema.parse(`${monthStart}T00:00:00.000Z`), end: nowIso } }
      : {}),
    sort: { key: 'date', direction: 'desc' },
  };
  const transactionsQuery = useTransactions(transactionsCriteria);
  const recurringQuery = useUpcomingRecurring(scopeCriteria, UPCOMING_LIMIT);
  const trendQuery = useRecentPeriodTrend(scope.accountIds);

  const balanceHistoryQueries = useQueries({
    queries: scopedAccounts.map((account) => ({
      queryKey: queryKeys.accountBalanceHistory(account.id, BALANCE_HISTORY_RANGE),
      queryFn: () => unwrapResult(repositories.accounts.getBalanceHistory(account.id, BALANCE_HISTORY_RANGE)),
    })),
  });

  const ready =
    settings !== undefined &&
    today !== undefined &&
    ratesQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    transactionsQuery.data !== undefined &&
    trendQuery.points !== undefined &&
    balanceHistoryQueries.every((query) => query.data !== undefined);

  if (!ready) {
    return { ready: false };
  }

  const rates = ratesQuery.data as NonNullable<typeof ratesQuery.data>;
  const categories = categoriesQuery.data as NonNullable<typeof categoriesQuery.data>;
  const transactions = transactionsQuery.data as NonNullable<typeof transactionsQuery.data>;
  const trendPoints = trendQuery.points as NonNullable<typeof trendQuery.points>;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const totalBalance = sumAccountBalancesInBaseCurrency(scopedAccounts, settings.baseCurrency, rates);
  const periodTotals = computePeriodTotals(transactions);
  const expenseBreakdown = computeCategoryBreakdown(transactions, 'negative');
  const cashflowGraph = computeCashflowGraph(transactions);

  const cashflowNodes: SankeyNode[] = cashflowGraph.nodes.map((node) => {
    if (node.kind === 'total') {
      return { id: node.id, label: '', value: node.amount, color: NEUTRAL_COLOR, column: 1, labelSide: 'none' };
    }
    const category = node.categoryId ? categoryById.get(node.categoryId) : undefined;
    const label = node.kind === 'savings' ? 'Savings' : (category?.name ?? 'Other');
    const color = node.kind === 'savings' ? POSITIVE_COLOR : (category?.color ?? NEUTRAL_COLOR);
    return {
      id: node.id,
      label,
      sub: money(node.amount, { compact: true }),
      value: node.amount,
      color,
      column: node.kind === 'income' ? 0 : 2,
      labelSide: node.kind === 'income' ? 'right' : 'left',
    };
  });
  const cashflowLinks: SankeyLink[] = cashflowGraph.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.amount,
  }));
  const cashflowLegend = cashflowNodes
    .filter((node) => node.column === 2)
    .map((node) => ({ id: node.id, label: node.label, color: node.color, valueLabel: node.sub ?? '' }));

  const donutData: DonutSlice[] = expenseBreakdown.map((entry) => ({
    id: entry.categoryId,
    value: entry.total,
    color: categoryById.get(entry.categoryId)?.color ?? NEUTRAL_COLOR,
  }));
  const breakdownLegend = expenseBreakdown.map((entry) => {
    const category = categoryById.get(entry.categoryId);
    return {
      id: entry.categoryId,
      name: category?.name ?? 'Other',
      color: category?.color ?? NEUTRAL_COLOR,
      valueLabel: money(entry.total),
      percentLabel: formatPercent(entry.share, locale),
    };
  });

  const incomeTrend = trendPoints.map((point) => point.income as number);
  const expenseTrend = trendPoints.map((point) => point.expense as number);

  const kpis: OverviewKpi[] = [
    {
      id: 'balance',
      label: 'Total balance',
      valueLabel: money(totalBalance),
      sub: `${scopedAccounts.length} account${scopedAccounts.length === 1 ? '' : 's'} · ${settings.baseCurrency}`,
      hero: true,
    },
    {
      id: 'income',
      label: `Income · ${monthLabel(monthStart ?? today, locale)}`,
      valueLabel: money(periodTotals.income),
      sub: 'this month',
      sparkData: incomeTrend,
      sparkColor: POSITIVE_COLOR,
    },
    {
      id: 'spending',
      label: `Spending · ${monthLabel(monthStart ?? today, locale)}`,
      valueLabel: money(periodTotals.expense),
      sub: 'this month',
      sparkData: expenseTrend,
      sparkColor: 'var(--mfh-neg)',
    },
    {
      id: 'net',
      label: 'Net saved',
      valueLabel: money(periodTotals.net),
      deltaLabel: `${Math.round(periodTotals.rate * 100)}% rate`,
      deltaTone: 'accent',
      sub: 'of income kept',
    },
  ];

  const accountRows: OverviewAccountRow[] = scopedAccounts.map((account, index) => ({
    id: account.id,
    name: account.name,
    typeLabel: account.type,
    icon: ACCOUNT_TYPE_ICON[account.type],
    color: account.color,
    sparkline: (balanceHistoryQueries[index]?.data ?? []).map((point) => point.balance as number),
    balanceLabel: formatMoney(account.balance, account.currency, locale, { compact: true }),
  }));

  const upcoming: OverviewUpcomingRow[] = recurringQuery.entries
    ? recurringQuery.entries.map((entry) => ({
        id: entry.rule.id,
        desc: entry.rule.desc,
        whenLabel: formatRelativeDate(entry.nextOccurrence, today, locale),
        amountLabel: money(entry.rule.amount),
        isPositive: entry.rule.amount > 0,
      }))
    : [];

  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const activity: OverviewActivityRow[] = transactions.slice(0, RECENT_ACTIVITY_LIMIT).map((transaction) => {
    const category = categoryById.get(transaction.cat);
    const account = accountById.get(transaction.acc);
    return {
      id: transaction.id,
      desc: transaction.desc,
      categoryName: category?.name ?? 'Other',
      categoryColor: category?.color ?? NEUTRAL_COLOR,
      categoryIcon: categoryIcon(category?.name),
      accountName: account?.name ?? '',
      dateLabel: formatRelativeDate(transaction.date.slice(0, 10) as never, today, locale),
      amountLabel: formatMoney(transaction.amount, account?.currency ?? settings.baseCurrency, locale),
      isPositive: transaction.amount > 0,
    };
  });

  return {
    ready: true,
    subtitle: `${scopedAccounts.length} of ${accounts.length} accounts in scope`,
    hidden,
    kpis,
    cashflow: { nodes: cashflowNodes, links: cashflowLinks, legend: cashflowLegend },
    breakdown: {
      data: donutData,
      centerValueLabel: money(periodTotals.expense, { compact: true }),
      legend: breakdownLegend,
    },
    accountRows,
    totalBalanceLabel: money(totalBalance, { compact: true }),
    upcoming,
    activity,
    activityCountLabel: `${transactions.length} transactions this month`,
    accountFilter: scope.accountFilter,
  };
}

function monthLabel(date: string, locale: string): string {
  // `timeZone: 'UTC'` is load-bearing: `date` is a bare calendar day, so formatting it through
  // the host's local timezone can shift the displayed month on a host west of UTC.
  return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`));
}
