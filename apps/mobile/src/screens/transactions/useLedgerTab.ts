// ViewModel for LedgerTab.tsx — the Activity tab's "Transactions" segment
// (docs/spec/screens-mobile.md "Activity — ledger").
//
// Mirrors the composition of packages/routes/src/transactions/useTransactionsScreen.ts, minus the
// two things that are router-shaped rather than screen-shaped: filters are local `useState` instead
// of typed search params, and there is no cross-screen account scope (the mobile mock draws its own
// account chip — the same reason Home has no scope filter). Day grouping and the per-day total are
// mobile-only and live in `groupTransactionsByDay.ts`.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteTransaction } from '@repo/app-core/mutations/useDeleteTransaction';
import { useTransactions } from '@repo/app-core/queries/useTransactions';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import type { Transaction } from '@repo/domain/entities/transaction';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import type { TransactionId } from '@repo/domain/primitives/entityId';
import { useState } from 'react';
import type { ChipSelectOption } from '@/ui/ChipSelect';
import { categoryIcon } from '@/ui/visuals';
import { groupTransactionsByDay } from './groupTransactionsByDay';
import { EMPTY_LEDGER_FILTERS, isLedgerFiltered, type LedgerFilters, ledgerCriteria } from './ledgerCriteria';
import type { ActivityContext, ConfirmSheetModel, RowActionsModel } from './useTransactionsScreen';

export type LedgerRow = {
  readonly id: TransactionId;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly accountName: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
  readonly actionsAriaLabel: string;
};

export type LedgerDayGroup = {
  readonly key: string;
  readonly label: string;
  readonly totalLabel: string;
  readonly isPositiveTotal: boolean;
  /** Named `data` because `SectionList` requires that key on every section. */
  readonly data: readonly LedgerRow[];
};

export type LedgerTabModel = {
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly typeValue: string;
  readonly onTypeChange: (value: string) => void;
  readonly typeOptions: readonly ChipSelectOption[];
  readonly isTypeFiltered: boolean;
  readonly accountValue: string;
  readonly onAccountChange: (value: string) => void;
  readonly accountOptions: readonly ChipSelectOption[];
  readonly isAccountFiltered: boolean;
  readonly categoryValue: string;
  readonly onCategoryChange: (value: string) => void;
  readonly categoryOptions: readonly ChipSelectOption[];
  readonly isCategoryFiltered: boolean;
  readonly isFiltered: boolean;
  readonly onReset: () => void;
  readonly groups: readonly LedgerDayGroup[];
  readonly rowCountLabel: string;
  readonly hidden: boolean;
  readonly onOpenRowActions: (id: TransactionId) => void;
  readonly rowActions: RowActionsModel;
  readonly deleteSheet: ConfirmSheetModel;
};

export function useLedgerTab(context: ActivityContext): LedgerTabModel {
  const { t } = useTranslation();
  const deleteTransaction = useDeleteTransaction();

  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_LEDGER_FILTERS);
  const [actionsFor, setActionsFor] = useState<Transaction | undefined>(undefined);
  const [deleting, setDeleting] = useState<Transaction | undefined>(undefined);

  // No debounce, unlike desktop's `useDebouncedSearchParam`: there is no URL to write per keystroke
  // here, and `keepPreviousData` keeps the list on screen while the next criteria resolve.
  const transactionsQuery = useTransactions(ledgerCriteria(filters), { keepPreviousData: true });
  const transactions = transactionsQuery.data ?? [];

  const { accounts, categories, baseCurrency, today, locale, hidden } = context;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const currencyOf = (transaction: Transaction, fallback: CurrencyCode): CurrencyCode =>
    accountById.get(transaction.acc)?.currency ?? fallback;

  const patchFilters = (next: Partial<LedgerFilters>) => setFilters((current) => ({ ...current, ...next }));

  const buildGroups = (day: IsoDate, currency: CurrencyCode): readonly LedgerDayGroup[] =>
    groupTransactionsByDay(transactions, day, locale).map((group) => ({
      data: group.transactions.map((transaction) => {
        const category = categoryById.get(transaction.cat);
        return {
          accountName: accountById.get(transaction.acc)?.name ?? '',
          actionsAriaLabel: t('transactions:list.actionsAriaLabel', { name: transaction.desc }),
          amountLabel: formatMoney(transaction.amount, currencyOf(transaction, currency), locale),
          categoryColor: category?.color ?? context.mutedColor,
          categoryIcon: categoryIcon(category?.name),
          categoryName: category?.name ?? t('common:category.other'),
          desc: transaction.desc,
          id: transaction.id,
          isPositive: transaction.amount > 0,
        };
      }),
      isPositiveTotal: group.total >= 0,
      key: group.date,
      label: group.label,
      // A day can mix accounts, so its total is stated in the workspace's base currency — the same
      // choice desktop's ledger KPIs make for their cross-account sums.
      totalLabel: formatMoney(group.total, currency, locale),
    }));

  return {
    accountOptions: [
      { label: t('transactions:list.accountAll'), value: 'all' },
      ...accounts.map((account) => ({ color: account.color, label: account.name, value: account.id })),
    ],
    accountValue: filters.account,
    categoryOptions: [
      { label: t('transactions:list.categoryAll'), value: 'all' },
      ...categories.map((category) => ({ color: category.color, label: category.name, value: category.id })),
    ],
    categoryValue: filters.category,
    deleteSheet: {
      description:
        deleting && baseCurrency
          ? t('transactions:deleteDialog.description', {
              amount: formatMoney(deleting.amount, currencyOf(deleting, baseCurrency), locale),
            })
          : '',
      isOpen: deleting !== undefined,
      isSubmitting: deleteTransaction.isPending,
      onClose: () => setDeleting(undefined),
      onConfirm: () => {
        if (deleting) {
          deleteTransaction.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
        }
      },
      title: deleting ? t('transactions:deleteDialog.title', { name: deleting.desc }) : '',
    },
    // Both are `undefined` only before workspace settings land, at which point the shell's `ready`
    // gate is still false and none of this is on screen.
    groups: today === undefined || baseCurrency === undefined ? [] : buildGroups(today, baseCurrency),
    hidden,
    isAccountFiltered: filters.account !== 'all',
    isCategoryFiltered: filters.category !== 'all',
    isFiltered: isLedgerFiltered(filters),
    isTypeFiltered: filters.type !== 'all',
    onAccountChange: (account) => patchFilters({ account }),
    onCategoryChange: (category) => patchFilters({ category }),
    onClearSearch: () => patchFilters({ text: '' }),
    onOpenRowActions: (id) => setActionsFor(transactions.find((candidate) => candidate.id === id)),
    onReset: () => setFilters(EMPTY_LEDGER_FILTERS),
    onSearchChange: (text) => patchFilters({ text }),
    onTypeChange: (type) => patchFilters({ type: toLedgerType(type) }),
    rowActions: {
      isOpen: actionsFor !== undefined,
      onClose: () => setActionsFor(undefined),
      onDelete: () => {
        setDeleting(actionsFor);
        setActionsFor(undefined);
      },
      onEdit: () => {
        if (actionsFor) {
          context.onEditTransaction(actionsFor);
        }
        setActionsFor(undefined);
      },
      title: actionsFor?.desc ?? '',
    },
    rowCountLabel: t('transactions:list.rowCount', { count: transactions.length }),
    searchValue: filters.text,
    typeOptions: [
      { label: t('transactions:list.typeAll'), value: 'all' },
      { label: t('common:categoryKind.income'), value: 'income' },
      { label: t('common:categoryKind.expense'), value: 'expense' },
    ],
    typeValue: filters.type,
  };
}

/** `ChipSelect` hands back a plain string; anything unexpected falls back to the unfiltered default. */
function toLedgerType(value: string): LedgerFilters['type'] {
  return value === 'income' || value === 'expense' ? value : 'all';
}
