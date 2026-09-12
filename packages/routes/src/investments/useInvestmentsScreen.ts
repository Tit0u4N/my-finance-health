// @repo/routes — level 3.
// ViewModel for InvestmentsScreen.tsx (screens.md "Investments (list)"). Not account-scoped —
// unlike Overview/Transactions/Recurring, screens.md's Investments row reads only `investments`.
// Sort is local component state, not a URL search param (routes.md §3's own filter: no
// bookmark/share use case for a small, fully-fetched table's sort order — the same reasoning
// Recurring's next-occurrence sort already relies on).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteInvestment } from '@repo/app-core/mutations/useDeleteInvestment';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useRepositories } from '@repo/app-core/providers/useRepositories';
import { queryKeys } from '@repo/app-core/queries/queryKeys';
import { unwrapResult } from '@repo/app-core/queries/unwrapResult';
import { useInvestments } from '@repo/app-core/queries/useInvestments';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { computeAllocation } from '@repo/app-core/selectors/allocation';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatPercent } from '@repo/app-core/selectors/formatPercent';
import { computeInvestmentPosition } from '@repo/app-core/selectors/investmentPosition';
import { computePortfolioTotals } from '@repo/app-core/selectors/portfolioTotals';
import { computePortfolioValueHistory } from '@repo/app-core/selectors/portfolioValueHistory';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { Investment } from '@repo/domain/entities/investment';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { Money } from '@repo/domain/primitives/money';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';
import { todayIn } from '@repo/domain/time/workspaceTime';
import type { DonutSlice } from '@repo/ui/components/charts/Donut';
import type { LineChartPoint } from '@repo/ui/components/charts/LineChart';
import type { SelectOption } from '@repo/ui/components/Select';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type LucideIcon, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { InvestmentFormState } from './useInvestmentForm';
import { useInvestmentForm } from './useInvestmentForm';
import type { RecordValueFormState } from './useRecordValueForm';
import { useRecordValueForm } from './useRecordValueForm';

// Same value Investment detail's own RangePicker defaults to — the two screens then share the
// exact same queryKeys.investmentValueHistory(id, '1m') cache entry, so opening a position from
// this list is a cache hit, not a second fetch (the same trick useAccountsScreen already relies
// on for its per-account sparklines).
const HISTORY_RANGE: HistoryRange = '1m';

export type InvestmentSortKey = 'value' | 'profitLoss' | 'allocation';

/** 'total' is the whole portfolio's value curve (the screen's original, only behavior); any other
 * value is a single position's own value curve (price × qty), picked from the trend panel's
 * curve select. */
export type InvestmentCurveSelection = 'total' | InvestmentId;

export type InvestmentRow = {
  readonly id: InvestmentId;
  readonly name: string;
  readonly ticker: string;
  readonly color: string;
  readonly qtyLabel: string;
  readonly avgLabel: string;
  readonly currentLabel: string;
  readonly valueLabel: string;
  readonly value: Money;
  readonly profitLossLabel: string;
  readonly profitLoss: Money;
  readonly isPositive: boolean;
  readonly profitLossPercentLabel: string;
  readonly allocationLabel: string;
  readonly allocationShare: number;
  readonly actionsAriaLabel: string;
};

export type PortfolioKpi = {
  readonly id: 'value' | 'cost' | 'profitLoss';
  readonly label: string;
  readonly valueLabel: string;
  /** Every KPI here always supplies one — required, not optional (exactOptionalPropertyTypes vs. StatTileProps). */
  readonly sub: string;
  readonly hero?: boolean;
  readonly icon: LucideIcon;
};

export type AllocationLegendEntry = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly valueLabel: string;
  readonly percentLabel: string;
};

export type InvestmentDeleteState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseInvestmentsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly hidden: boolean;
      readonly subtitle: string;
      readonly kpis: readonly PortfolioKpi[];
      readonly trendTitle: string;
      readonly trend: readonly LineChartPoint[];
      readonly trendColor: string;
      readonly curve: InvestmentCurveSelection;
      readonly curveOptions: readonly SelectOption<InvestmentCurveSelection>[];
      readonly onCurveChange: (curve: InvestmentCurveSelection) => void;
      readonly donutData: readonly DonutSlice[];
      readonly donutCenterLabel: string;
      readonly donutCenterValue: string;
      readonly legend: readonly AllocationLegendEntry[];
      readonly rows: readonly InvestmentRow[];
      readonly sortKey: InvestmentSortKey;
      readonly sortDirection: 'asc' | 'desc';
      readonly onSortChange: (key: InvestmentSortKey) => void;
      readonly onCreate: () => void;
      readonly onOpenInvestment: (id: InvestmentId) => void;
      readonly onEdit: (id: InvestmentId) => void;
      readonly onRecordValue: (id: InvestmentId) => void;
      readonly onDelete: (id: InvestmentId) => void;
      readonly form: InvestmentFormState;
      readonly recordValueForm: RecordValueFormState;
      readonly deleteDialog: InvestmentDeleteState;
    };

function sortRows(rows: readonly InvestmentRow[], key: InvestmentSortKey, direction: 'asc' | 'desc'): InvestmentRow[] {
  const factor = direction === 'asc' ? 1 : -1;
  const sortValue = (row: InvestmentRow): number =>
    key === 'value' ? row.value : key === 'profitLoss' ? row.profitLoss : row.allocationShare;
  return [...rows].sort((a, b) => (sortValue(a) - sortValue(b)) * factor);
}

export function useInvestmentsScreen(): UseInvestmentsScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const repositories = useRepositories();
  const locale = useFormattingLocale();
  const navigate = useNavigate();

  const investmentsQuery = useInvestments();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const deleteInvestment = useDeleteInvestment();

  const investments = investmentsQuery.data ?? [];

  const historyQueries = useQueries({
    queries: investments.map((investment) => ({
      queryKey: queryKeys.investmentValueHistory(investment.id, HISTORY_RANGE),
      queryFn: () => unwrapResult(repositories.investments.getValueHistory(investment.id, HISTORY_RANGE)),
    })),
  });

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const { form, openCreate, openEdit } = useInvestmentForm(investments.length);
  const { form: recordValueForm, openRecordValue } = useRecordValueForm(today ?? '');
  const [sortKey, setSortKey] = useState<InvestmentSortKey>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState<Investment | undefined>(undefined);
  // Local state, not a URL search param — investmentsRoute has no validateSearch (unlike
  // Investment detail's own range) and a chart curve pick has no bookmark/share use case, the
  // same reasoning sortKey/sortDirection above already rely on.
  const [curve, setCurve] = useState<InvestmentCurveSelection>('total');

  const ready =
    settings !== undefined &&
    investmentsQuery.data !== undefined &&
    historyQueries.every((query) => query.data !== undefined);

  if (!ready) {
    return { ready: false };
  }

  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const historyByInvestmentId = new Map<InvestmentId, readonly InvestmentValuePoint[]>(
    investments.map((investment, index) => [investment.id, historyQueries[index]?.data ?? []]),
  );

  const totals = computePortfolioTotals(investments);
  const allocation = computeAllocation(investments);
  const allocationById = new Map(allocation.map((entry) => [entry.investmentId, entry.share]));

  const rows: InvestmentRow[] = investments.map((investment) => {
    const position = computeInvestmentPosition(investment);
    const share = allocationById.get(investment.id) ?? 0;
    return {
      id: investment.id,
      name: investment.name,
      ticker: investment.ticker,
      color: investment.color,
      qtyLabel: String(investment.qty),
      avgLabel: money(investment.avg),
      currentLabel: money(investment.current),
      valueLabel: money(position.value),
      value: position.value,
      profitLossLabel: money(position.profitLoss, { hideSign: true }),
      profitLoss: position.profitLoss,
      isPositive: position.profitLoss >= 0,
      profitLossPercentLabel: formatPercent(position.profitLossPercent, locale, { signDisplay: 'always' }),
      allocationLabel: formatPercent(share, locale),
      allocationShare: share,
      actionsAriaLabel: t('investments:list.actionsAriaLabel', { name: investment.name }),
    };
  });

  // 'total' reuses the existing portfolio-wide history unchanged. Any other selection narrows
  // both arguments to that one position — computePortfolioValueHistory then returns that
  // position's own value curve (price × qty) on the same date grid, no separate selector needed.
  const selectedInvestment = curve === 'total' ? undefined : investments.find((item) => item.id === curve);
  const trendInvestments = selectedInvestment ? [selectedInvestment] : investments;
  const trendHistoryById =
    selectedInvestment === undefined
      ? historyByInvestmentId
      : new Map([[selectedInvestment.id, historyByInvestmentId.get(selectedInvestment.id) ?? []]]);
  const trendPoints = computePortfolioValueHistory(trendInvestments, trendHistoryById);
  const trend: LineChartPoint[] = trendPoints.map((point) => ({
    value: point.value as number,
    label: formatAbsoluteDate(point.date, locale),
    valueLabel: money(point.value, { compact: true }),
  }));
  const curveOptions: SelectOption<InvestmentCurveSelection>[] = [
    { value: 'total', label: t('investments:list.curveTotal') },
    ...investments.map((investment) => ({ value: investment.id, label: investment.name })),
  ];

  const donutData: DonutSlice[] = investments.map((investment) => ({
    id: investment.id,
    value: computeInvestmentPosition(investment).value,
    color: investment.color,
  }));
  const legend: AllocationLegendEntry[] = investments.map((investment) => ({
    id: investment.id,
    name: investment.name,
    color: investment.color,
    valueLabel: money(computeInvestmentPosition(investment).value),
    percentLabel: formatPercent(allocationById.get(investment.id) ?? 0, locale),
  }));

  const kpis: PortfolioKpi[] = [
    {
      id: 'value',
      label: t('investments:kpi.portfolioValue'),
      valueLabel: money(totals.value),
      sub: '',
      hero: true,
      icon: Wallet,
    },
    { id: 'cost', label: t('investments:kpi.costBasis'), valueLabel: money(totals.cost), sub: '', icon: Scale },
    {
      id: 'profitLoss',
      label: t('investments:kpi.profitLoss'),
      valueLabel: money(totals.profitLoss),
      sub: formatPercent(totals.profitLossPercent, locale, { signDisplay: 'always' }),
      icon: totals.profitLoss >= 0 ? TrendingUp : TrendingDown,
    },
  ];

  return {
    ready: true,
    hidden,
    subtitle: t('investments:list.subtitle', { count: investments.length, total: money(totals.value) }),
    kpis,
    trendTitle: selectedInvestment ? selectedInvestment.name : t('investments:list.portfolioTrendTitle'),
    trend,
    trendColor: selectedInvestment ? selectedInvestment.color : 'var(--mfh-accent)',
    curve,
    curveOptions,
    onCurveChange: setCurve,
    donutData,
    donutCenterLabel: t('investments:list.donutCenterLabel'),
    donutCenterValue: money(totals.value, { compact: true }),
    legend,
    rows: sortRows(rows, sortKey, sortDirection),
    sortKey,
    sortDirection,
    onSortChange: (key) => {
      setSortDirection((current) => (key === sortKey ? (current === 'desc' ? 'asc' : 'desc') : 'desc'));
      setSortKey(key);
    },
    onCreate: openCreate,
    onOpenInvestment: (id) => {
      void navigate({ to: '/investments/$investmentId', params: { investmentId: id } });
    },
    onEdit: (id) => {
      const investment = investments.find((item) => item.id === id);
      if (investment) {
        openEdit(investment);
      }
    },
    onRecordValue: (id) => {
      const investment = investments.find((item) => item.id === id);
      if (investment) {
        openRecordValue(investment);
      }
    },
    onDelete: (id) => {
      const investment = investments.find((item) => item.id === id);
      if (investment) {
        setDeleting(investment);
      }
    },
    form,
    recordValueForm,
    deleteDialog: {
      isOpen: deleting !== undefined,
      title: t('investments:deleteConfirm.title', { name: deleting?.name ?? '' }),
      onConfirm: () => {
        if (!deleting) {
          return;
        }
        deleteInvestment.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
      },
      onClose: () => setDeleting(undefined),
      isSubmitting: deleteInvestment.isPending,
    },
  };
}
