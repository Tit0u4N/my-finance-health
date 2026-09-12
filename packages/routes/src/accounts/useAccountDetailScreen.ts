// @repo/routes — level 3.
// ViewModel for AccountDetailScreen.tsx (screens.md "Account detail"). Three-armed result union:
// not-ready (still loading), found:false (the not-found guard as testable ViewModel state, not a
// View-level `if (!account)` check), and the full ready screen.

import { useUpdateAccount } from '@repo/app-core/mutations/useUpdateAccount';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccount } from '@repo/app-core/queries/useAccount';
import { useAccountBalanceHistory } from '@repo/app-core/queries/useAccountBalanceHistory';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { computePeriodTotals } from '@repo/app-core/selectors/periodTotals';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { AccountType } from '@repo/domain/entities/account';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { accountIdSchema } from '@repo/domain/primitives/entityId';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import { todayIn } from '@repo/domain/time/workspaceTime';
import type { LineChartPoint } from '@repo/ui/components/charts/LineChart';
import type { RangePickerOption } from '@repo/ui/components/RangePicker';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Repeat } from 'lucide-react';
import { useState } from 'react';
import { HISTORY_RANGE_OPTIONS } from '../shared/historyRange';
import { ACCOUNT_TYPE_ICON, categoryIcon } from '../shared/visuals';
import { accountDetailSearchSchema, accountTransactionsCriteria } from './accountSearch';

export type AccountDetailKpi = {
  readonly id: 'balance' | 'inflow' | 'outflow' | 'net';
  readonly label: string;
  readonly valueLabel: string;
  /** Every KPI here always supplies one — required, not optional (exactOptionalPropertyTypes vs. StatTileProps). */
  readonly sub: string;
  readonly hero?: boolean;
  readonly icon: LucideIcon;
};

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

export type EditAccountDialogState = {
  readonly isOpen: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly type: AccountType;
  readonly onTypeChange: (type: AccountType) => void;
  readonly typeOptions: readonly { readonly value: AccountType; readonly label: string }[];
  readonly color: string;
  readonly onColorChange: (color: string) => void;
  readonly onSubmit: () => void;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | undefined;
};

export type UseAccountDetailScreenResult =
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
      readonly kpis: readonly AccountDetailKpi[];
      readonly range: HistoryRange;
      readonly rangeOptions: readonly RangePickerOption<HistoryRange>[];
      readonly onRangeChange: (range: HistoryRange) => void;
      readonly rangeCaption: string;
      readonly trend: readonly LineChartPoint[];
      readonly trendColor: string;
      readonly rows: readonly AccountDetailRow[];
      readonly rowCountLabel: string;
      readonly edit: EditAccountDialogState;
    };

const ACCOUNT_TYPES: readonly AccountType[] = ['Checking', 'Savings', 'Investment', 'Cash'];

const RANGE_CAPTION: Record<HistoryRange, string> = {
  '7d': 'Past 7 days',
  '1m': 'Past month',
  '3m': 'Past period',
  '1y': 'Past period',
  all: 'Past period',
};

export function useAccountDetailScreen(): UseAccountDetailScreenResult {
  const platform = usePlatform();
  const locale = platform.localization.locale();
  const navigate = useNavigate();
  const rawParams = useParams({ strict: false }) as { readonly accountId?: string };
  const rawSearch = useSearch({ strict: false }) as { readonly range?: HistoryRange };
  const id = accountIdSchema.parse(rawParams.accountId);
  const { range } = accountDetailSearchSchema.parse({ range: rawSearch.range });

  const accountQuery = useAccount(id);
  const transactionsQuery = useTransactions(accountTransactionsCriteria(id));
  const historyQuery = useAccountBalanceHistory(id, range);
  const categoriesQuery = useCategories();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const updateAccount = useUpdateAccount();

  const [isEditOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: 'Checking' as AccountType, color: '' });
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const onBack = () => {
    void navigate({ to: '/accounts' });
  };

  if (accountQuery.isError) {
    return { ready: true, found: false, onBack };
  }

  const ready =
    accountQuery.data !== undefined &&
    transactionsQuery.data !== undefined &&
    historyQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    settingsQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const account = accountQuery.data as NonNullable<typeof accountQuery.data>;
  const transactions = transactionsQuery.data as NonNullable<typeof transactionsQuery.data>;
  const history = historyQuery.data as NonNullable<typeof historyQuery.data>;
  const categories = categoriesQuery.data as NonNullable<typeof categoriesQuery.data>;
  const settings = settingsQuery.data as NonNullable<typeof settingsQuery.data>;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const today = todayIn(isoDateTimeSchema.parse(platform.clock.now()), settings.timezone);

  const money = (amount: number, options?: Parameters<typeof formatMoney>[3]) =>
    formatMoney(amount as never, account.currency, locale, options);

  const totals = computePeriodTotals(transactions);

  const kpis: AccountDetailKpi[] = [
    {
      id: 'balance',
      label: 'Current balance',
      valueLabel: money(account.balance),
      sub: `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`,
      hero: true,
      icon: ACCOUNT_TYPE_ICON[account.type],
    },
    { id: 'inflow', label: 'Inflow', valueLabel: money(totals.income), sub: 'all recorded', icon: ArrowDownRight },
    { id: 'outflow', label: 'Outflow', valueLabel: money(totals.expense), sub: 'all recorded', icon: ArrowUpRight },
    {
      id: 'net',
      label: 'Net',
      valueLabel: money(totals.net),
      sub: `${transactions.length} entries`,
      icon: Repeat,
    },
  ];

  const trend: LineChartPoint[] = history.map((point) => ({
    value: point.balance as number,
    label: formatRelativeDate(point.date, today, locale),
    valueLabel: money(point.balance as number, { compact: true }),
  }));

  const rows: AccountDetailRow[] = transactions.map((transaction) => {
    const category = categoryById.get(transaction.cat);
    return {
      id: transaction.id,
      desc: transaction.desc,
      categoryName: category?.name ?? 'Other',
      categoryColor: category?.color ?? 'var(--mfh-muted)',
      categoryIcon: categoryIcon(category?.name),
      dateLabel: formatRelativeDate(transaction.date.slice(0, 10) as never, today, locale),
      amountLabel: money(transaction.amount),
      isPositive: transaction.amount > 0,
    };
  });

  const typeOptions = ACCOUNT_TYPES.map((type) => ({ value: type, label: type }));
  const canSubmit = draft.name.trim().length > 0 && !updateAccount.isPending;

  return {
    ready: true,
    found: true,
    hidden,
    eyebrow: `Accounts · ${account.type}`,
    title: account.name,
    subtitle: account.last4 ? `Ending in ${account.last4} · ${account.currency}` : account.currency,
    onBack,
    kpis,
    range,
    rangeOptions: HISTORY_RANGE_OPTIONS,
    onRangeChange: (next) => {
      // replace: true — a range change updates the current view, it isn't a new page to walk
      // back through (routes.md §4's "no waterfall" intent extends to the back button too).
      void navigate({ to: '/accounts/$accountId', params: { accountId: id }, search: { range: next }, replace: true });
    },
    rangeCaption: RANGE_CAPTION[range],
    trend,
    trendColor: account.color,
    rows,
    rowCountLabel: `${transactions.length} on this account`,
    edit: {
      isOpen: isEditOpen,
      onOpen: () => {
        setDraft({ name: account.name, type: account.type, color: account.color });
        setErrorMessage(undefined);
        setEditOpen(true);
      },
      onClose: () => setEditOpen(false),
      name: draft.name,
      onNameChange: (name) => setDraft((current) => ({ ...current, name })),
      type: draft.type,
      onTypeChange: (type) => setDraft((current) => ({ ...current, type })),
      typeOptions,
      color: draft.color,
      onColorChange: (color) => setDraft((current) => ({ ...current, color })),
      onSubmit: () => {
        setErrorMessage(undefined);
        updateAccount.mutate(
          { id, patch: { name: draft.name.trim(), type: draft.type, color: draft.color } },
          {
            onSuccess: () => setEditOpen(false),
            onError: () => setErrorMessage('Could not save the changes. Try again.'),
          },
        );
      },
      canSubmit,
      isSubmitting: updateAccount.isPending,
      errorMessage,
    },
  };
}
