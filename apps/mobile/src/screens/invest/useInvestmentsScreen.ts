// ViewModel for InvestmentsScreen.tsx (screens-mobile.md "Invest"), mirroring
// packages/routes/src/investments/useInvestmentsScreen.ts's data flow — same queries, same
// selectors, same `ready: false` gate — minus `useNavigate` (the route file injects
// `onOpenInvestment`), minus the sortable table and curve select (the mobile mock has a fixed
// list ordered as stored and a single portfolio curve), and minus the per-row edit/delete menu
// (those live on Investment detail on mobile).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useInvestments } from '@repo/app-core/queries/useInvestments';
import { useInvestmentsValueHistory } from '@repo/app-core/queries/useInvestmentsValueHistory';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { computeAllocation } from '@repo/app-core/selectors/allocation';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatPercent } from '@repo/app-core/selectors/formatPercent';
import { computeInvestmentPosition } from '@repo/app-core/selectors/investmentPosition';
import { computePortfolioTotals } from '@repo/app-core/selectors/portfolioTotals';
import { computePortfolioValueHistory } from '@repo/app-core/selectors/portfolioValueHistory';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentValuePoint } from '@repo/domain/repositories/investmentRepository';
import type { LineChartPoint } from '@/ui/charts/LineChart';
import { type InvestmentFormState, useInvestmentForm } from './useInvestmentForm';

// Same value Investment detail's default range requests — the two screens share the
// queryKeys.investmentValueHistory(id, '1m') cache entry.
const HISTORY_RANGE: HistoryRange = '1m';

export type InvestmentsRow = {
  readonly id: InvestmentId;
  readonly name: string;
  readonly meta: string;
  readonly color: string;
  readonly valueLabel: string;
  readonly percentLabel: string;
  readonly isPositive: boolean;
};

export type AllocationRow = {
  readonly id: InvestmentId;
  readonly name: string;
  readonly color: string;
  readonly share: number;
  readonly label: string;
};

export type UseInvestmentsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly hidden: boolean;
      readonly title: string;
      readonly subtitle: string;
      readonly addLabel: string;
      readonly onAdd: () => void;
      readonly isEmpty: boolean;
      readonly emptyTitle: string;
      readonly emptySubtitle: string;
      readonly valueTitle: string;
      readonly valueLabel: string;
      readonly profitLossLabel: string;
      readonly profitLossPercentLabel: string;
      readonly isProfitPositive: boolean;
      readonly trend: readonly LineChartPoint[];
      readonly allocationTitle: string;
      readonly allocation: readonly AllocationRow[];
      readonly positionsTitle: string;
      readonly rows: readonly InvestmentsRow[];
      readonly form: InvestmentFormState;
    };

export function useInvestmentsScreen(): UseInvestmentsScreenResult {
  const { t } = useTranslation();
  const locale = useFormattingLocale();

  const investmentsQuery = useInvestments();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);

  const investments = investmentsQuery.data ?? [];
  const historyQueries = useInvestmentsValueHistory(
    investments.map((investment) => investment.id),
    HISTORY_RANGE,
  );
  const { form, openCreate } = useInvestmentForm(investments.length);

  const settings = settingsQuery.data;
  const ready =
    settings !== undefined &&
    investmentsQuery.data !== undefined &&
    historyQueries.every((query) => query.data !== undefined);

  if (!ready) {
    return { ready: false };
  }

  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const totals = computePortfolioTotals(investments);
  const shareById = new Map(computeAllocation(investments).map((entry) => [entry.investmentId, entry.share]));
  const historyById = new Map<InvestmentId, readonly InvestmentValuePoint[]>(
    investments.map((investment, index) => [investment.id, historyQueries[index]?.data ?? []]),
  );

  const trend: LineChartPoint[] = computePortfolioValueHistory(investments, historyById).map((point) => ({
    label: formatAbsoluteDate(point.date, locale),
    value: point.value as number,
    valueLabel: money(point.value, { compact: true }),
  }));

  const rows: InvestmentsRow[] = investments.map((investment) => {
    const position = computeInvestmentPosition(investment);
    return {
      color: investment.color,
      id: investment.id,
      isPositive: position.profitLoss >= 0,
      meta: `${investment.ticker} · ${t('investments:detail.subtitleUnits', { count: investment.qty })}`,
      name: investment.name,
      percentLabel: formatPercent(position.profitLossPercent, locale, {
        maximumFractionDigits: 2,
        signDisplay: 'always',
      }),
      valueLabel: money(position.value, { compact: true }),
    };
  });

  const allocation: AllocationRow[] = investments.map((investment) => {
    const share = shareById.get(investment.id) ?? 0;
    return {
      color: investment.color,
      id: investment.id,
      label: `${formatPercent(share, locale, { maximumFractionDigits: 1 })} · ${money(
        computeInvestmentPosition(investment).value,
        { compact: true },
      )}`,
      name: investment.name,
      share,
    };
  });

  return {
    addLabel: t('investments:list.addPosition'),
    allocation,
    allocationTitle: t('investments:list.allocationTitle'),
    emptySubtitle: t('investments:list.emptySubtitle'),
    emptyTitle: t('investments:list.emptyTitle'),
    form,
    hidden,
    isEmpty: investments.length === 0,
    isProfitPositive: totals.profitLoss >= 0,
    onAdd: openCreate,
    positionsTitle: t('investments:list.positionsTitle'),
    profitLossLabel: money(totals.profitLoss),
    profitLossPercentLabel: formatPercent(totals.profitLossPercent, locale, {
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }),
    ready: true,
    rows,
    subtitle: t('investments:list.subtitle', { count: investments.length, total: money(totals.value) }),
    title: t('investments:list.title'),
    trend,
    valueLabel: money(totals.value),
    valueTitle: t('investments:kpi.portfolioValue'),
  };
}
