// @repo/routes — level 3.
// ViewModel for TransactionsScreen.tsx (screens.md "Transactions (ledger)"). Search/type/category/
// sort are typed router search params (routes.md §3); account scope stays the cross-screen
// Zustand store (screens.md's "selected-account filter", shared with Overview/Recurring).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteTransaction } from '@repo/app-core/mutations/useDeleteTransaction';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { computePeriodTotals } from '@repo/app-core/selectors/periodTotals';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { Transaction } from '@repo/domain/entities/transaction';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { TransactionId } from '@repo/domain/primitives/entityId';
import type { TransactionSortKey } from '@repo/domain/repositories/criteria';
import { todayIn } from '@repo/domain/time/workspaceTime';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, type LucideIcon, Scale } from 'lucide-react';
import { useState } from 'react';
import { useAccountScope } from '../shared/useAccountScope';
import { useDebouncedSearchParam } from '../shared/useDebouncedSearchParam';
import { categoryIcon } from '../shared/visuals';
import {
  type LedgerSort,
  type LedgerType,
  ledgerCriteria,
  parseLedgerSort,
  transactionsSearchSchema,
} from './transactionSearch';
import { type TransactionFormState, useTransactionForm } from './useTransactionForm';

export type TransactionRow = {
  readonly id: TransactionId;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly accountName: string;
  readonly dateLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
  readonly actionsAriaLabel: string;
};

export type LedgerKpi = {
  readonly id: 'inflow' | 'outflow' | 'net';
  readonly label: string;
  readonly valueLabel: string;
  readonly icon: LucideIcon;
};

export type LedgerFilters = {
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly type: LedgerType;
  readonly onTypeChange: (type: LedgerType) => void;
  readonly typeOptions: readonly { readonly value: LedgerType; readonly label: string }[];
  readonly category: string;
  readonly onCategoryChange: (id: string) => void;
  readonly categoryOptions: readonly { readonly value: string; readonly label: string }[];
  readonly sortKey: TransactionSortKey;
  readonly sortDirection: 'asc' | 'desc';
  readonly onSortChange: (key: TransactionSortKey) => void;
  readonly onReset: () => void;
  readonly isFiltered: boolean;
};

export type TransactionDeleteState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseTransactionsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly hidden: boolean;
      readonly subtitle: string;
      readonly isFiltering: boolean;
      readonly kpis: readonly LedgerKpi[];
      readonly filters: LedgerFilters;
      readonly rows: readonly TransactionRow[];
      readonly rowCountLabel: string;
      readonly onCreate: () => void;
      readonly onEdit: (id: TransactionId) => void;
      readonly onDelete: (id: TransactionId) => void;
      readonly form: TransactionFormState;
      readonly deleteDialog: TransactionDeleteState;
      readonly accountFilter: ReturnType<typeof useAccountScope>['accountFilter'];
    };

export function useTransactionsScreen(): UseTransactionsScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Partial<Record<'q' | 'type' | 'category' | 'sort', string>>;
  const search = transactionsSearchSchema.parse(rawSearch);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const deleteTransaction = useDeleteTransaction();

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const scope = useAccountScope(accounts, (account) =>
    formatMoney(account.balance, account.currency, locale, { compact: true }),
  );

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const criteria = ledgerCriteria(search, scope.accountIds);
  const transactionsQuery = useTransactions(criteria, { keepPreviousData: true });

  const { form, openCreate, openEdit } = useTransactionForm(categories, accounts, today ?? '');

  const [deleting, setDeleting] = useState<Transaction | undefined>(undefined);

  const searchField = useDebouncedSearchParam(search.q, (next) => {
    void navigate({ to: '/transactions', search: { ...search, q: next }, replace: true });
  });

  const ready =
    accountsQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    settings !== undefined &&
    transactionsQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const transactions = transactionsQuery.data as NonNullable<typeof transactionsQuery.data>;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const rows: TransactionRow[] = transactions.map((transaction) => {
    const category = categoryById.get(transaction.cat);
    const account = accountById.get(transaction.acc);
    return {
      id: transaction.id,
      desc: transaction.desc,
      categoryName: category?.name ?? t('common:category.other'),
      categoryColor: category?.color ?? 'var(--mfh-muted)',
      categoryIcon: categoryIcon(category?.name),
      accountName: account?.name ?? '',
      dateLabel: formatAbsoluteDate(transaction.date.slice(0, 10) as never, locale),
      amountLabel: formatMoney(transaction.amount, account?.currency ?? 'EUR', locale),
      isPositive: transaction.amount > 0,
      actionsAriaLabel: t('transactions:list.actionsAriaLabel', { name: transaction.desc }),
    };
  });

  const totals = computePeriodTotals(transactions);
  const money = (amount: number) => formatMoney(amount as never, settings.baseCurrency, locale);

  const kpis: LedgerKpi[] = [
    { id: 'inflow', label: t('common:kpi.inflow'), valueLabel: money(totals.income), icon: ArrowDownRight },
    { id: 'outflow', label: t('common:kpi.outflow'), valueLabel: money(totals.expense), icon: ArrowUpRight },
    { id: 'net', label: t('common:kpi.net'), valueLabel: money(totals.net), icon: Scale },
  ];

  const { key: sortKey, direction: sortDirection } = parseLedgerSort(search.sort);
  const isFiltered = search.q.trim() !== '' || search.type !== 'all' || search.category !== 'all';

  const navigateSearch = (next: Partial<typeof search>) => {
    void navigate({ to: '/transactions', search: { ...search, ...next }, replace: true });
  };

  return {
    ready: true,
    hidden,
    subtitle: t('transactions:list.scopeSubtitle', { selected: scope.selectedIds.length, count: accounts.length }),
    isFiltering: transactionsQuery.isPlaceholderData,
    kpis,
    filters: {
      searchValue: searchField.value,
      onSearchChange: searchField.onChange,
      type: search.type,
      onTypeChange: (type) => navigateSearch({ type }),
      typeOptions: [
        { value: 'all', label: t('transactions:list.typeAll') },
        { value: 'income', label: t('common:categoryKind.income') },
        { value: 'expense', label: t('common:categoryKind.expense') },
      ],
      category: search.category,
      onCategoryChange: (category) => navigateSearch({ category }),
      categoryOptions: [
        { value: 'all', label: t('transactions:list.categoryAll') },
        ...categories.map((category) => ({ value: category.id, label: category.name })),
      ],
      sortKey,
      sortDirection,
      onSortChange: (key) => {
        const nextDirection = key === sortKey && sortDirection === 'desc' ? 'asc' : 'desc';
        navigateSearch({ sort: `${key}:${nextDirection}` as LedgerSort });
      },
      onReset: () => {
        void navigate({ to: '/transactions', search: { q: '', type: 'all', category: 'all', sort: 'date:desc' } });
      },
      isFiltered,
    },
    rows,
    rowCountLabel: t('transactions:list.rowCount', { count: transactions.length }),
    onCreate: openCreate,
    onEdit: (id) => {
      const transaction = transactions.find((candidate) => candidate.id === id);
      if (transaction) {
        openEdit(transaction);
      }
    },
    onDelete: (id) => {
      const transaction = transactions.find((candidate) => candidate.id === id);
      if (transaction) {
        setDeleting(transaction);
      }
    },
    form,
    deleteDialog: {
      isOpen: deleting !== undefined,
      title: deleting ? t('transactions:deleteDialog.title', { name: deleting.desc }) : '',
      description: deleting
        ? t('transactions:deleteDialog.description', {
            amount: formatMoney(
              deleting.amount,
              accountById.get(deleting.acc)?.currency ?? settings.baseCurrency,
              locale,
            ),
          })
        : '',
      onConfirm: () => {
        if (!deleting) {
          return;
        }
        deleteTransaction.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
      },
      onClose: () => setDeleting(undefined),
      isSubmitting: deleteTransaction.isPending,
    },
    accountFilter: scope.accountFilter,
  };
}
