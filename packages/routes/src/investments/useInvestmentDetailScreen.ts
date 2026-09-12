// @repo/routes — level 3.
// ViewModel for InvestmentDetailScreen.tsx (screens.md "Investment detail"). Three-armed result
// union, cloned from useAccountDetailScreen.ts: not-ready, found:false (the not-found guard as
// testable ViewModel state), and the full ready screen. Every hook below runs before the
// found:false early return.

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteInvestment } from '@repo/app-core/mutations/useDeleteInvestment';
import { useUpdateInvestment } from '@repo/app-core/mutations/useUpdateInvestment';
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
import type { LineChartPoint } from '@repo/ui/components/charts/LineChart';
import type { RangePickerOption } from '@repo/ui/components/RangePicker';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { type LucideIcon, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useHistoryRangeOptions } from '../shared/historyRange';
import { investmentDetailSearchSchema } from './investmentSearch';
import type { InvestmentFormState } from './useInvestmentForm';
import { useInvestmentForm } from './useInvestmentForm';
import type { RecordValueFormState } from './useRecordValueForm';
import { useRecordValueForm } from './useRecordValueForm';

export type InvestmentDetailKpi = {
  readonly id: 'value' | 'cost' | 'profitLoss' | 'unitProfitLoss';
  readonly label: string;
  readonly valueLabel: string;
  readonly sub: string;
  readonly hero?: boolean;
  readonly icon: LucideIcon;
};

export type SnapshotRow = {
  readonly id: string;
  readonly dateLabel: string;
  readonly priceLabel: string;
  readonly changeLabel: string;
  readonly changeTone: 'positive' | 'negative' | 'muted';
};

export type InvestmentNoteState = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSave: () => void;
  readonly isSubmitting: boolean;
};

export type InvestmentDeleteState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onOpen: () => void;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseInvestmentDetailScreenResult =
  | { readonly ready: false }
  | { readonly ready: true; readonly found: false; readonly onBack: () => void }
  | {
      readonly ready: true;
      readonly found: true;
      readonly hidden: boolean;
      readonly eyebrow: string;
      readonly title: string;
      readonly subtitle: string;
      readonly onBack: () => void;
      readonly kpis: readonly InvestmentDetailKpi[];
      readonly range: HistoryRange;
      readonly rangeOptions: readonly RangePickerOption<HistoryRange>[];
      readonly onRangeChange: (range: HistoryRange) => void;
      readonly trend: readonly LineChartPoint[];
      readonly trendColor: string;
      readonly note: InvestmentNoteState;
      readonly snapshotRows: readonly SnapshotRow[];
      readonly snapshotCountLabel: string;
      readonly onEdit: () => void;
      readonly onRecordValue: () => void;
      readonly form: InvestmentFormState;
      readonly recordValueForm: RecordValueFormState;
      readonly deleteDialog: InvestmentDeleteState;
    };

export function useInvestmentDetailScreen(): UseInvestmentDetailScreenResult {
  const { t } = useTranslation();
  const rangeOptions = useHistoryRangeOptions();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const navigate = useNavigate();
  const rawParams = useParams({ strict: false }) as { readonly investmentId?: string };
  const rawSearch = useSearch({ strict: false }) as { readonly range?: HistoryRange };
  const id = investmentIdSchema.parse(rawParams.investmentId);
  const { range } = investmentDetailSearchSchema.parse({ range: rawSearch.range });

  const investmentQuery = useInvestment(id);
  const historyQuery = useInvestmentValueHistory(id, range);
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const updateNote = useUpdateInvestment();
  const deleteInvestment = useDeleteInvestment();

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const { form, openEdit } = useInvestmentForm(0);
  const { form: recordValueForm, openRecordValue } = useRecordValueForm(today ?? '');
  const [noteLoadedFor, setNoteLoadedFor] = useState<string | undefined>(undefined);
  const [noteDraft, setNoteDraft] = useState('');
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const onBack = () => {
    void navigate({ to: '/investments' });
  };

  if (investmentQuery.isError) {
    return { ready: true, found: false, onBack };
  }

  const ready =
    investmentQuery.data !== undefined &&
    historyQuery.data !== undefined &&
    settings !== undefined &&
    today !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const investment = investmentQuery.data;
  const history = historyQuery.data;

  if (investment.id !== noteLoadedFor) {
    setNoteLoadedFor(investment.id);
    setNoteDraft(investment.note ?? '');
  }

  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, settings.baseCurrency, locale, options);

  const position = computeInvestmentPosition(investment);
  const unitProfitLoss = subtractMoney(investment.current, investment.avg);

  const kpis: InvestmentDetailKpi[] = [
    {
      id: 'value',
      label: t('investments:kpi.positionValue'),
      valueLabel: money(position.value),
      sub: '',
      hero: true,
      icon: Wallet,
    },
    { id: 'cost', label: t('investments:kpi.costBasis'), valueLabel: money(position.cost), sub: '', icon: Scale },
    {
      id: 'profitLoss',
      label: t('investments:kpi.profitLoss'),
      valueLabel: money(position.profitLoss),
      sub: formatPercent(position.profitLossPercent, locale, { signDisplay: 'always' }),
      icon: position.profitLoss >= 0 ? TrendingUp : TrendingDown,
    },
    {
      id: 'unitProfitLoss',
      label: t('investments:kpi.unitProfitLoss'),
      valueLabel: money(unitProfitLoss),
      sub: '',
      icon: unitProfitLoss >= 0 ? TrendingUp : TrendingDown,
    },
  ];

  const trend: LineChartPoint[] = history.map((point) => ({
    value: point.price as number,
    label: formatRelativeDate(point.date.slice(0, 10) as never, today, locale),
    valueLabel: money(point.price, { compact: true }),
  }));

  // Newest first for the table, but the change column still reads against the previous
  // (chronologically earlier) snapshot — computed off the ascending array before reversing.
  const snapshotRows: SnapshotRow[] = history
    .map((point, index) => {
      const previous = history[index - 1];
      const change = previous ? subtractMoney(point.price, previous.price) : undefined;
      return {
        id: point.date,
        dateLabel: formatAbsoluteDate(point.date.slice(0, 10) as never, locale, { withYear: true }),
        priceLabel: money(point.price),
        changeLabel: change === undefined ? '—' : money(change, { hideSign: change === 0 }),
        changeTone: change === undefined || change === 0 ? 'muted' : change > 0 ? 'positive' : 'negative',
      } as const;
    })
    .reverse();

  return {
    ready: true,
    found: true,
    hidden,
    eyebrow: t('investments:detail.eyebrow', { ticker: investment.ticker }),
    title: investment.name,
    subtitle: t('investments:detail.subtitleUnits', { count: investment.qty }),
    onBack,
    kpis,
    range,
    rangeOptions,
    onRangeChange: (next) => {
      void navigate({
        to: '/investments/$investmentId',
        params: { investmentId: id },
        search: { range: next },
        replace: true,
      });
    },
    trend,
    trendColor: investment.color,
    note: {
      value: noteDraft,
      onChange: setNoteDraft,
      onSave: () => {
        updateNote.mutate({ id, patch: { note: noteDraft } });
      },
      isSubmitting: updateNote.isPending,
    },
    snapshotRows,
    snapshotCountLabel: t('investments:detail.snapshotCount', { count: history.length }),
    onEdit: () => openEdit(investment),
    onRecordValue: () => openRecordValue(investment),
    form,
    recordValueForm,
    deleteDialog: {
      isOpen: isDeleteOpen,
      title: t('investments:deleteConfirm.title', { name: investment.name }),
      onOpen: () => setDeleteOpen(true),
      onConfirm: () => {
        deleteInvestment.mutate(id, { onSuccess: () => navigate({ to: '/investments' }) });
      },
      onClose: () => setDeleteOpen(false),
      isSubmitting: deleteInvestment.isPending,
    },
  };
}
