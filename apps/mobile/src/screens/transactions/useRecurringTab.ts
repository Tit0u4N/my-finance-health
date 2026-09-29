// ViewModel for RecurringTab.tsx — the Activity tab's "Recurring" segment
// (docs/spec/screens-mobile.md "Activity — recurring").
//
// Mirrors packages/routes/src/recurring/useRecurringScreen.ts: rules are sorted here by their next
// occurrence (`RecurringRuleCriteria` has no sort key at all) and paused rules stay in the list —
// the row's own `Switch` needs every rule, not just the upcoming ones. No account scope: mobile has
// none, so the criteria are always `{}`.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { useDeleteRecurringRule } from '@repo/app-core/mutations/useDeleteRecurringRule';
import { useUpdateRecurringRule } from '@repo/app-core/mutations/useUpdateRecurringRule';
import { useRecurringRules } from '@repo/app-core/queries/useRecurringRules';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import { formatRelativeDate } from '@repo/app-core/selectors/formatRelativeDate';
import { computeNextOccurrence } from '@repo/app-core/selectors/recurringNextOccurrence';
import type { RecurringRule } from '@repo/domain/entities/recurringRule';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { compareIsoDate } from '@repo/domain/primitives/dateTime';
import type { RecurringRuleId } from '@repo/domain/primitives/entityId';
import { useState } from 'react';
import { categoryIcon } from '@/ui/visuals';
import type { ActivityContext, ConfirmSheetModel, RowActionsModel } from './useTransactionsScreen';

export type RecurringCardModel = {
  readonly id: RecurringRuleId;
  readonly desc: string;
  readonly categoryName: string;
  readonly categoryColor: string;
  readonly categoryIcon: ReturnType<typeof categoryIcon>;
  readonly accountName: string;
  readonly freqLabel: string;
  readonly nextLabel: string;
  readonly amountLabel: string;
  readonly isPositive: boolean;
  readonly isActive: boolean;
  readonly activeAriaLabel: string;
  readonly actionsAriaLabel: string;
};

export type RecurringTabModel = {
  readonly cards: readonly RecurringCardModel[];
  readonly rowCountLabel: string;
  /** Non-paused rules, worded for the shell's header subtitle. */
  readonly activeCountLabel: string;
  readonly hidden: boolean;
  readonly onToggleActive: (id: RecurringRuleId, active: boolean) => void;
  readonly onOpenRowActions: (id: RecurringRuleId) => void;
  readonly onCreate: () => void;
  readonly rowActions: RowActionsModel;
  readonly deleteSheet: ConfirmSheetModel;
};

export function useRecurringTab(context: ActivityContext): RecurringTabModel {
  const { t } = useTranslation();
  const updateRecurringRule = useUpdateRecurringRule();
  const deleteRecurringRule = useDeleteRecurringRule();

  const [actionsFor, setActionsFor] = useState<RecurringRule | undefined>(undefined);
  const [deleting, setDeleting] = useState<RecurringRule | undefined>(undefined);

  const rulesQuery = useRecurringRules({});
  const rules = rulesQuery.data ?? [];

  const { accounts, categories, baseCurrency, today, locale, hidden } = context;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const buildCards = (day: IsoDate, currency: CurrencyCode): readonly RecurringCardModel[] =>
    [...rules]
      .sort((a, b) => compareIsoDate(computeNextOccurrence(a, day), computeNextOccurrence(b, day)))
      .map((rule) => {
        const category = categoryById.get(rule.cat);
        const account = accountById.get(rule.acc);
        return {
          accountName: account?.name ?? '',
          actionsAriaLabel: t('recurring:list.actionsAriaLabel', { name: rule.desc }),
          activeAriaLabel: t('recurring:list.activeAriaLabel', { name: rule.desc }),
          amountLabel: formatMoney(rule.amount, account?.currency ?? currency, locale),
          categoryColor: category?.color ?? context.mutedColor,
          categoryIcon: categoryIcon(category?.name),
          categoryName: category?.name ?? t('common:category.other'),
          desc: rule.desc,
          freqLabel: t(`common:recurringFrequency.${rule.freq}`),
          id: rule.id,
          isActive: rule.active,
          isPositive: rule.amount > 0,
          // `formatRelativeDate` handles future dates too ("in 3 days"), which is exactly what
          // "Next" needs — no `String(daysBetween(...))`, per docs/spec/cross-app-pitfalls.md #5.
          nextLabel: formatRelativeDate(computeNextOccurrence(rule, day), day, locale),
        };
      });

  return {
    activeCountLabel: t('recurring:list.activeCount', { count: rules.filter((rule) => rule.active).length }),
    // Both are `undefined` only before workspace settings land, at which point the shell's
    // `ready` gate is still false and none of this is on screen.
    cards: today === undefined || baseCurrency === undefined ? [] : buildCards(today, baseCurrency),
    deleteSheet: {
      description: t('recurring:deleteDialog.description'),
      isOpen: deleting !== undefined,
      isSubmitting: deleteRecurringRule.isPending,
      onClose: () => setDeleting(undefined),
      onConfirm: () => {
        if (deleting) {
          deleteRecurringRule.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) });
        }
      },
      title: deleting ? t('recurring:deleteDialog.title', { name: deleting.desc }) : '',
    },
    hidden,
    onCreate: context.onCreateRecurringRule,
    onOpenRowActions: (id) => setActionsFor(rules.find((candidate) => candidate.id === id)),
    onToggleActive: (id, active) => updateRecurringRule.mutate({ id, patch: { active } }),
    rowActions: {
      isOpen: actionsFor !== undefined,
      onClose: () => setActionsFor(undefined),
      onDelete: () => {
        setDeleting(actionsFor);
        setActionsFor(undefined);
      },
      onEdit: () => {
        if (actionsFor) {
          context.onEditRecurringRule(actionsFor);
        }
        setActionsFor(undefined);
      },
      title: actionsFor?.desc ?? '',
    },
    rowCountLabel: t('recurring:list.rowCount', { count: rules.length }),
  };
}
