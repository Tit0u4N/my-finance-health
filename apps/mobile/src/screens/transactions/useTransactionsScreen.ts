// ViewModel for TransactionsScreen.tsx — the Activity tab's shell
// (docs/spec/screens-mobile.md "Activity"). It owns the segmented tab, the workspace-wide facts both
// segments need, and the two create/edit sheets; each segment's own list logic lives in
// `useLedgerTab.ts` / `useRecurringTab.ts`.
//
// Both segment hooks are called unconditionally, not only for the visible one: React forbids a
// conditional hook, and the cost is one already-cached query for the hidden segment in exchange for
// an instant tab switch and a header subtitle that can count either segment.

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { Account } from '@repo/domain/entities/account';
import type { Category } from '@repo/domain/entities/category';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { Transaction } from '@repo/domain/entities/transaction';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import { todayIn } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import { useColor } from '@/theme/useColor';
import type { SegmentedOption } from '@/ui/SegmentedTabs';
import { type LedgerTabModel, useLedgerTab } from './useLedgerTab';
import { type RecurringFormState, useRecurringForm } from './useRecurringForm';
import { type RecurringTabModel, useRecurringTab } from './useRecurringTab';
import { type TransactionFormState, useTransactionForm } from './useTransactionForm';

export type ActivityTab = 'ledger' | 'recurring';

/** Everything both segments read but neither owns — resolved once by the shell. */
export type ActivityContext = {
  readonly accounts: readonly Account[];
  readonly categories: readonly Category[];
  /** `undefined` until workspace settings land, exactly like `today` — each segment then produces an
   * empty list, which is never seen because the shell's own `ready` gate is still false. */
  readonly baseCurrency: CurrencyCode | undefined;
  readonly today: IsoDate | undefined;
  readonly locale: string;
  readonly hidden: boolean;
  /** Fallback for a row whose category was deleted — the palette's muted grey, resolved by the shell. */
  readonly mutedColor: string;
  readonly onEditTransaction: (transaction: Transaction) => void;
  readonly onEditRecurringRule: (rule: RecurringRule) => void;
  readonly onCreateRecurringRule: () => void;
};

/** Shared by both segments' `RowActionsSheet`. */
export type RowActionsModel = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
};

/** Shared by both segments' delete `ConfirmSheet`. */
export type ConfirmSheetModel = {
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
      readonly title: string;
      readonly subtitle: string;
      readonly addLabel: string;
      readonly onAdd: () => void;
      readonly tab: ActivityTab;
      readonly onTabChange: (tab: ActivityTab) => void;
      readonly tabOptions: readonly SegmentedOption<ActivityTab>[];
      readonly ledger: LedgerTabModel;
      readonly recurring: RecurringTabModel;
      readonly transactionForm: TransactionFormState;
      readonly recurringForm: RecurringFormState;
    };

export function useTransactionsScreen(): UseTransactionsScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const locale = useFormattingLocale();
  const { colors } = useColor();

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);

  const [tab, setTab] = useState<ActivityTab>('ledger');

  // Snapshotted once at mount, same as useDashboardScreen.ts: a live clock read would change
  // "today" — and with it every day label and next-occurrence sort — on every render.
  const [nowIso] = useState(() => isoDateTimeSchema.parse(platform.clock.now()));
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const baseCurrency = settings?.baseCurrency;

  const transaction = useTransactionForm(categories, accounts, today);
  const recurringRule = useRecurringForm(categories, accounts, today);

  const context: ActivityContext = {
    accounts,
    baseCurrency,
    categories,
    hidden,
    locale,
    mutedColor: colors.muted,
    onCreateRecurringRule: recurringRule.openCreate,
    onEditRecurringRule: recurringRule.openEdit,
    onEditTransaction: transaction.openEdit,
    today,
  };

  const ledger = useLedgerTab(context);
  const recurring = useRecurringTab(context);

  const ready = settings !== undefined && today !== undefined && baseCurrency !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const isLedger = tab === 'ledger';

  return {
    // The `+` follows the visible segment, as the mock's single header action does.
    addLabel: isLedger ? t('transactions:list.addTransaction') : t('recurring:list.addRule'),
    ledger,
    onAdd: isLedger ? transaction.openCreate : recurringRule.openCreate,
    onTabChange: setTab,
    ready: true,
    recurring,
    recurringForm: recurringRule.form,
    subtitle: isLedger ? ledger.rowCountLabel : recurring.activeCountLabel,
    tab,
    tabOptions: [
      { label: t('transactions:list.title'), value: 'ledger' },
      { label: t('recurring:list.title'), value: 'recurring' },
    ],
    title: t('common:nav.activity'),
    transactionForm: transaction.form,
  };
}
