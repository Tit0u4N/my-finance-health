// ViewModel for DashboardScreen.tsx (docs/spec/screens-mobile.md "Dashboard (Home tab)"). Composes
// the same @repo/app-core query/selector hooks apps/desktop's Overview does (its own
// useOverviewScreen.ts) — no account-scope filter (the mobile mock has none on this screen) and
// no per-account balance history or upcoming-recurring section (the mobile mock doesn't show
// either on this tab; both stay Accounts-tab/Activity-tab work for a later pass).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
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
import { computePeriodTotals } from '@repo/app-core/selectors/periodTotals';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { startOfMonthIn, todayIn } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import { useColor } from '@/theme/useColor';
import type { DonutSlice } from '@/ui/charts/Donut';
import type { SankeyLink, SankeyNode } from '@/ui/charts/Sankey';
import { categoryIcon } from '@/ui/visuals';
import { type TransactionFormState, useTransactionForm } from '../transactions/useTransactionForm';

const RECENT_ACTIVITY_LIMIT = 5;

export type DashboardKpi = {
  readonly id: string;
  readonly label: string;
  readonly valueLabel: string;
  readonly sparkData: readonly number[];
  readonly sparkColor: 'pos' | 'neg';
};

export type DashboardActivityRow = {
  readonly id: string;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly dateLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
};

export type UseDashboardScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly subtitle: string;
      readonly hidden: boolean;
      readonly onToggleHidden: () => void;
      readonly totalBalanceLabel: string;
      readonly balanceSubLabel: string;
      readonly netRateLabel: string;
      readonly netRateIsPositive: boolean;
      readonly kpis: readonly DashboardKpi[];
      readonly cashflow: {
        readonly nodes: readonly SankeyNode[];
        readonly links: readonly SankeyLink[];
        readonly legend: readonly {
          readonly id: string;
          readonly label: string;
          readonly color: string;
          readonly valueLabel: string;
        }[];
      };
      readonly breakdown: {
        readonly data: readonly DonutSlice[];
        readonly centerValueLabel: string;
        readonly legend: readonly {
          readonly id: string;
          readonly name: string;
          readonly color: string;
          readonly percentLabel: string;
        }[];
      };
      readonly activity: readonly DashboardActivityRow[];
      readonly addLabel: string;
      readonly onAdd: () => void;
      readonly transactionForm: TransactionFormState;
    };

export function useDashboardScreen(): UseDashboardScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const { colors } = useColor();

  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const categoriesQuery = useCategories();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const toggleAmountsHidden = usePreferencesStore((state) => state.toggleAmountsHidden);

  // Snapshotted once at mount — see useOverviewScreen.ts's identical comment: a live clock read
  // here would change `transactionsCriteria`'s query key on every render.
  const [nowIso] = useState(() => isoDateTimeSchema.parse(platform.clock.now()));
  const settings = settingsQuery.data;
  const monthStart = settings ? startOfMonthIn(nowIso, settings.timezone) : undefined;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const transactionsCriteria: TransactionCriteria = {
    ...(monthStart
      ? { dateRange: { start: isoDateTimeSchema.parse(`${monthStart}T00:00:00.000Z`), end: nowIso } }
      : {}),
    sort: { key: 'date', direction: 'desc' },
  };
  const transactionsQuery = useTransactions(transactionsCriteria);
  const trendQuery = useRecentPeriodTrend();

  const accounts = accountsQuery.data;
  const rates = ratesQuery.data;
  const categories = categoriesQuery.data;
  const transactions = transactionsQuery.data;
  const { form: transactionForm, openCreate: openCreateTransaction } = useTransactionForm(
    categories ?? [],
    accounts ?? [],
    today,
  );
  const trendPoints = trendQuery.points;

  const ready =
    settings !== undefined &&
    today !== undefined &&
    accounts !== undefined &&
    rates !== undefined &&
    categories !== undefined &&
    transactions !== undefined &&
    trendPoints !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const totalBalance = sumAccountBalancesInBaseCurrency(accounts, settings.baseCurrency, rates);
  const periodTotals = computePeriodTotals(transactions);
  const expenseBreakdown = computeCategoryBreakdown(transactions, 'negative');
  const cashflowGraph = computeCashflowGraph(transactions);

  const cashflowNodes: SankeyNode[] = cashflowGraph.nodes.map((node) => {
    if (node.kind === 'total') {
      return { color: colors.muted, column: 1, id: node.id, label: '', value: node.amount };
    }
    const category = node.categoryId ? categoryById.get(node.categoryId) : undefined;
    const label =
      node.kind === 'savings' ? t('overview:cashflow.savings') : (category?.name ?? t('common:category.other'));
    const color = node.kind === 'savings' ? colors.pos : (category?.color ?? colors.muted);
    return {
      color,
      column: node.kind === 'income' ? 0 : 2,
      id: node.id,
      label,
      sub: money(node.amount, { compact: true }),
      value: node.amount,
    };
  });
  const cashflowLinks: SankeyLink[] = cashflowGraph.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.amount,
  }));
  const cashflowLegend = cashflowNodes
    .filter((node) => node.column === 2)
    .map((node) => ({ color: node.color, id: node.id, label: node.label, valueLabel: node.sub ?? '' }));

  const donutData: DonutSlice[] = expenseBreakdown.map((entry) => ({
    color: categoryById.get(entry.categoryId)?.color ?? colors.muted,
    id: entry.categoryId,
    value: entry.total,
  }));
  const breakdownLegend = expenseBreakdown.map((entry) => {
    const category = categoryById.get(entry.categoryId);
    return {
      color: category?.color ?? colors.muted,
      id: entry.categoryId,
      name: category?.name ?? t('common:category.other'),
      percentLabel: formatPercent(entry.share, locale),
    };
  });

  const kpis: DashboardKpi[] = [
    {
      id: 'income',
      label: t('overview:kpi.income', { month: monthLabel(monthStart ?? today, locale) }),
      sparkColor: 'pos',
      sparkData: trendPoints.map((point) => point.income as number),
      valueLabel: money(periodTotals.income),
    },
    {
      id: 'spending',
      label: t('overview:kpi.spending', { month: monthLabel(monthStart ?? today, locale) }),
      sparkColor: 'neg',
      sparkData: trendPoints.map((point) => point.expense as number),
      valueLabel: money(periodTotals.expense),
    },
  ];

  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const activity: DashboardActivityRow[] = transactions.slice(0, RECENT_ACTIVITY_LIMIT).map((transaction) => {
    const category = categoryById.get(transaction.cat);
    const account = accountById.get(transaction.acc);
    return {
      amountLabel: formatMoney(transaction.amount, account?.currency ?? settings.baseCurrency, locale),
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
    activity,
    addLabel: t('transactions:list.addTransaction'),
    balanceSubLabel: t('overview:kpi.balanceSub', { count: accounts.length, currency: settings.baseCurrency }),
    breakdown: {
      centerValueLabel: money(periodTotals.expense, { compact: true }),
      data: donutData,
      legend: breakdownLegend,
    },
    cashflow: { legend: cashflowLegend, links: cashflowLinks, nodes: cashflowNodes },
    hidden,
    kpis,
    netRateIsPositive: periodTotals.net >= 0,
    netRateLabel: t('overview:kpi.netRate', { percent: Math.round(periodTotals.rate * 100) }),
    onAdd: openCreateTransaction,
    onToggleHidden: toggleAmountsHidden,
    ready: true,
    subtitle: dayLabel(today, locale),
    totalBalanceLabel: money(totalBalance),
    transactionForm,
  };
}

function monthLabel(date: string, locale: string): string {
  // `timeZone: 'UTC'` is load-bearing — see useOverviewScreen.ts's identical helper.
  return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`));
}

function dayLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC', weekday: 'long' }).format(
    new Date(`${date}T00:00:00.000Z`),
  );
}
