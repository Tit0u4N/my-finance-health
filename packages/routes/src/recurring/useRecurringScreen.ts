// @repo/routes — level 3.
// ViewModel for RecurringScreen.tsx (screens.md "Recurring"). No search params (routes.md §3);
// account scope is the same cross-screen store Overview/Transactions share. Rows are sorted here
// (RecurringRuleCriteria has no sort key at all — this isn't the "filter then client-side
// narrow" anti-pattern routes.md §4 bans, since accountIds, the only filter, does go through
// criteria) and include paused rules, unlike computeUpcomingRecurring which drops them — the
// active toggle needs every row, not just the upcoming ones.

import { useDeleteRecurringRule } from '@repo/app-core/mutations/useDeleteRecurringRule';
import { useUpdateRecurringRule } from '@repo/app-core/mutations/useUpdateRecurringRule';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useCategories } from '@repo/app-core/queries/useCategories';
import { useRecurringRules } from '@repo/app-core/queries/useRecurringRules';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { computeMonthlyCommitment, toMonthlyAmount } from '@repo/app-core/selectors/monthlyCommitment';
import { computeNextOccurrence } from '@repo/app-core/selectors/recurringNextOccurrence';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import { compareIsoDate, isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { RecurringRuleId } from '@repo/domain/primitives/entityId';
import { todayIn } from '@repo/domain/time/workspaceTime';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, Layers, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useAccountScope } from '../shared/useAccountScope';
import { categoryIcon } from '../shared/visuals';
import { recurringCriteria } from './recurringCriteria';
import { type RecurringFormState, useRecurringForm } from './useRecurringForm';

export type RecurringRow = {
  readonly id: RecurringRuleId;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly accountName: string;
  readonly freqLabel: string;
  readonly nextLabel: string;
  readonly nextRelativeLabel: string;
  readonly amountLabel: string;
  readonly monthlyLabel: string;
  readonly isPositive: boolean;
  readonly isActive: boolean;
};

export type RecurringKpi = {
  readonly id: 'in' | 'out' | 'net' | 'active';
  readonly label: string;
  readonly valueLabel: string;
  readonly icon: LucideIcon;
  readonly hero?: boolean;
};

export type RecurringDeleteState = {
  readonly isOpen: boolean;
  readonly desc: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

export type UseRecurringScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly hidden: boolean;
      readonly subtitle: string;
      readonly kpis: readonly RecurringKpi[];
      readonly rows: readonly RecurringRow[];
      readonly rowCountLabel: string;
      readonly onToggleActive: (id: RecurringRuleId, active: boolean) => void;
      readonly onEdit: (id: RecurringRuleId) => void;
      readonly onDelete: (id: RecurringRuleId) => void;
      readonly onCreate: () => void;
      readonly form: RecurringFormState;
      readonly deleteDialog: RecurringDeleteState;
      readonly accountFilter: ReturnType<typeof useAccountScope>['accountFilter'];
    };

export function useRecurringScreen(): UseRecurringScreenResult {
  const platform = usePlatform();
  const locale = platform.localization.locale();

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const settingsQuery = useWorkspaceSettings();
  const hidden = usePreferencesStore((state) => state.amountsHidden);
  const updateRecurringRule = useUpdateRecurringRule();
  const deleteRecurringRule = useDeleteRecurringRule();

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const scope = useAccountScope(accounts, (account) =>
    formatMoney(account.balance, account.currency, locale, { compact: true }),
  );

  const rulesQuery = useRecurringRules(recurringCriteria(scope.accountIds));

  const nowIso = isoDateTimeSchema.parse(platform.clock.now());
  const settings = settingsQuery.data;
  const today = settings ? todayIn(nowIso, settings.timezone) : undefined;

  const { form, openCreate, openEdit } = useRecurringForm(categories, accounts, today ?? '');

  const [deleting, setDeleting] = useState<RecurringRule | undefined>(undefined);

  const ready =
    accountsQuery.data !== undefined &&
    categoriesQuery.data !== undefined &&
    settings !== undefined &&
    today !== undefined &&
    rulesQuery.data !== undefined;

  if (!ready) {
    return { ready: false };
  }

  const rules = rulesQuery.data as NonNullable<typeof rulesQuery.data>;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const sortedRules = [...rules].sort((a, b) =>
    compareIsoDate(computeNextOccurrence(a, today), computeNextOccurrence(b, today)),
  );

  const rows: RecurringRow[] = sortedRules.map((rule) => {
    const category = categoryById.get(rule.cat);
    const account = accountById.get(rule.acc);
    const next = computeNextOccurrence(rule, today);
    const currency = account?.currency ?? 'EUR';
    return {
      id: rule.id,
      desc: rule.desc,
      categoryName: category?.name ?? 'Other',
      categoryColor: category?.color ?? 'var(--mfh-muted)',
      categoryIcon: categoryIcon(category?.name),
      accountName: account?.name ?? '',
      freqLabel: rule.freq,
      nextLabel: formatAbsoluteDate(next, locale),
      nextRelativeLabel: formatRelativeDate(next, today, locale),
      amountLabel: formatMoney(rule.amount, currency, locale),
      monthlyLabel: formatMoney(toMonthlyAmount(rule), currency, locale, { compact: true }),
      isPositive: rule.amount > 0,
      isActive: rule.active,
    };
  });

  const commitment = computeMonthlyCommitment(rules);
  const money = (amount: number) => formatMoney(amount as never, settings.baseCurrency, locale);

  const kpis: RecurringKpi[] = [
    { id: 'in', label: 'Monthly in', valueLabel: money(commitment.income), icon: TrendingUp },
    { id: 'out', label: 'Monthly out', valueLabel: money(commitment.expense), icon: TrendingDown },
    { id: 'net', label: 'Monthly net', valueLabel: money(commitment.net), icon: CalendarClock, hero: true },
    {
      id: 'active',
      label: 'Active rules',
      valueLabel: `${commitment.activeCount}`,
      icon: Layers,
    },
  ];

  return {
    ready: true,
    hidden,
    subtitle: `${scope.selectedIds.length} of ${accounts.length} accounts in scope`,
    kpis,
    rows,
    rowCountLabel: `${rules.length} rule${rules.length === 1 ? '' : 's'}`,
    onToggleActive: (id, active) => {
      updateRecurringRule.mutate({ id, patch: { active } });
    },
    onEdit: (id) => {
      const rule = rules.find((r) => r.id === id);
      if (rule) {
        openEdit(rule);
      }
    },
    onDelete: (id) => {
      const rule = rules.find((r) => r.id === id);
      if (rule) {
        setDeleting(rule);
      }
    },
    onCreate: openCreate,
    form,
    deleteDialog: {
      isOpen: deleting !== undefined,
      desc: deleting?.desc ?? '',
      onConfirm: () => {
        if (!deleting) {
          return;
        }
        deleteRecurringRule.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
      },
      onClose: () => setDeleting(undefined),
      isSubmitting: deleteRecurringRule.isPending,
    },
    accountFilter: scope.accountFilter,
  };
}
