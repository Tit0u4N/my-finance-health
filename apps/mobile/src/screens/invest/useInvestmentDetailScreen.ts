// ViewModel for InvestmentDetailScreen.tsx (screens-mobile.md "Invest → detail"), mirroring
// packages/routes/src/investments/useInvestmentDetailScreen.ts's three-armed result union —
// not-ready, found:false and the full screen — minus `useNavigate`/`useSearch` (the route file
// injects `investmentId` and `onBack`; the range is local `useState`), minus the KPI tile row and
// the notes panel (the mobile mock has neither: its hero shows price, P/L badge and position
// value only). Edit, Record value and Delete are kept: screens.md's full-CRUD decision (#19, #21).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteInvestment } from '@repo/app-core/mutations/useDeleteInvestment';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useInvestment } from '@repo/app-core/queries/useInvestment';
import { useInvestmentValueHistory } from '@repo/app-core/queries/useInvestmentValueHistory';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatPercent } from '@repo/app-core/selectors/formatPercent';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { computeInvestmentPosition } from '@repo/app-core/selectors/investmentPosition';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { investmentIdSchema } from '@repo/domain/primitives/entityId';
import { subtractMoney } from '@repo/domain/primitives/money';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { todayIn } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import type { LineChartPoint } from '@/ui/charts/LineChart';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { type InvestmentFormState, useInvestmentForm } from './useInvestmentForm';
import { type RecordValueFormState, useRecordValueForm } from './useRecordValueForm';

export type SnapshotRow = {
  readonly id: string;
  readonly dateLabel: string;
  readonly priceLabel: string;
  readonly changeLabel: string;
  readonly changeTone: 'positive' | 'negative' | 'muted';
};

export type InvestmentDeleteState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly onOpen: () => void;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseInvestmentDetailScreenResult =
  | { readonly ready: false }
  | { readonly ready: true; readonly found: false; readonly onBack: () => void; readonly notFoundLabel: string }
  | {
      readonly ready: true;
      readonly found: true;
      readonly hidden: boolean;
      readonly onBack: () => void;
      readonly eyebrow: string;
      readonly title: string;
      readonly subtitle: string;
      readonly color: string;
      readonly priceLabel: string;
      readonly profitLossLabel: string;
      readonly profitLossPercentLabel: string;
      readonly isProfitPositive: boolean;
      readonly positionLabel: string;
      readonly editLabel: string;
      readonly onEdit: () => void;
      readonly priceHistoryTitle: string;
      readonly trend: readonly LineChartPoint[];
      readonly range: HistoryRange;
      readonly rangeOptions: readonly SegmentedOption<HistoryRange>[];
      readonly onRangeChange: (range: HistoryRange) => void;
      readonly snapshotsTitle: string;
      readonly recordLabel: string;
      readonly onRecordValue: () => void;
      readonly snapshotRows: readonly SnapshotRow[];
      readonly emptyTitle: string;
      readonly emptySubtitle: string;
      readonly deleteLabel: string;
      readonly form: InvestmentFormState;
      readonly recordValueForm: RecordValueFormState;
      readonly deleteDialog: InvestmentDeleteState;
    };

export function useInvestmentDetailScreen(
  rawInvestmentId: string,
  onBack: () => void,
): UseInvestmentDetailScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const id = investmentIdSchema.parse(rawInvestmentId);

  const [range, setRange] = useState<HistoryRange>('1m');
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const investmentQuery = useInvestment(id);
  const historyQuery = useInvestmentValueHistory(id, range);
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const deleteInvestment = useDeleteInvestment();

  const settings = settingsQuery.data;
  const today = settings ? todayIn(isoDateTimeSchema.parse(platform.clock.now()), settings.timezone) : undefined;

  const { form, openEdit } = useInvestmentForm(0);
  const { form: recordValueForm, openRecordValue } = useRecordValueForm(today ?? '');

  if (investmentQuery.isError) {
    return { found: false, notFoundLabel: t('common:state.notFound'), onBack, ready: true };
  }

  if (
    investmentQuery.data === undefined ||
    historyQuery.data === undefined ||
    settings === undefined ||
    today === undefined
  ) {
    return { ready: false };
  }

  const investment = investmentQuery.data;
  const history = historyQuery.data;
  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const position = computeInvestmentPosition(investment);

  const trend: LineChartPoint[] = history.map((point) => ({
    label: formatRelativeDate(point.date.slice(0, 10) as never, today, locale),
    value: point.price as number,
    valueLabel: money(point.price, { compact: true }),
  }));

  // Newest first for the list, but each change still reads against the chronologically earlier
  // snapshot — computed off the ascending array before reversing.
  const snapshotRows: SnapshotRow[] = history
    .map((point, index) => {
      const previous = history[index - 1];
      const change = previous ? subtractMoney(point.price, previous.price) : undefined;
      return {
        changeLabel: change === undefined ? '—' : money(change, { hideSign: change === 0 }),
        changeTone: change === undefined || change === 0 ? 'muted' : change > 0 ? 'positive' : 'negative',
        dateLabel: formatAbsoluteDate(point.date.slice(0, 10) as never, locale, { withYear: true }),
        id: point.date,
        priceLabel: money(point.price),
      } as const;
    })
    .reverse();

  return {
    color: investment.color,
    deleteDialog: {
      description: t('investments:deleteConfirm.description'),
      isOpen: isDeleteOpen,
      isSubmitting: deleteInvestment.isPending,
      onClose: () => setDeleteOpen(false),
      onConfirm: () => deleteInvestment.mutate(id, { onSuccess: onBack }),
      onOpen: () => setDeleteOpen(true),
      title: t('investments:deleteConfirm.title', { name: investment.name }),
    },
    deleteLabel: t('investments:detail.deletePosition'),
    editLabel: t('investments:createDialog.editTitle'),
    emptySubtitle: t('investments:detail.emptySubtitle'),
    emptyTitle: t('investments:detail.emptyTitle'),
    eyebrow: t('investments:detail.eyebrow', { ticker: investment.ticker }),
    form,
    found: true,
    hidden,
    isProfitPositive: position.profitLoss >= 0,
    onBack,
    onEdit: () => openEdit(investment),
    onRangeChange: setRange,
    onRecordValue: () => openRecordValue(investment),
    positionLabel: `${t('investments:kpi.positionValue')} ${money(position.value, { compact: true })}`,
    priceHistoryTitle: t('investments:detail.priceHistoryTitle'),
    priceLabel: money(investment.current),
    profitLossLabel: money(position.profitLoss),
    profitLossPercentLabel: formatPercent(position.profitLossPercent, locale, {
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }),
    range,
    rangeOptions: [
      { label: '7d', value: '7d' },
      { label: '1m', value: '1m' },
      { label: '3m', value: '3m' },
      { label: '1y', value: '1y' },
      { label: t('common:historyRange.all'), value: 'all' },
    ],
    ready: true,
    recordLabel: t('investments:action.recordValue'),
    recordValueForm,
    snapshotRows,
    snapshotsTitle: t('investments:detail.snapshotsTitle'),
    subtitle: `${t('investments:detail.subtitleUnits', { count: investment.qty })} @ ${money(investment.avg, { compact: true })}`,
    title: investment.name,
    trend,
  };
}
