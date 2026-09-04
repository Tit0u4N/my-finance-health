// @repo/app-core — level 2.
// One key factory, shared by every query hook and every mutation hook's invalidation
// (app-core-inventory.md §4, §5) — the single source of truth for cache addressing.

import type { AccountId, InvestmentId } from '@repo/domain/primitives/entityId';
import type { HistoryRange, RecurringRuleCriteria, TransactionCriteria } from '@repo/domain/repositories/criteria';

export const queryKeys = {
  workspaceSettings: () => ['workspaceSettings'] as const,
  accounts: () => ['accounts'] as const,
  account: (id: AccountId) => ['accounts', id] as const,
  accountBalanceHistory: (id: AccountId, range: HistoryRange) => ['accounts', id, 'balanceHistory', range] as const,
  exchangeRates: () => ['exchangeRates'] as const,
  categories: () => ['categories'] as const,
  transactions: (criteria: TransactionCriteria) => ['transactions', criteria] as const,
  /** The prefix every `transactions(criteria)` key starts with — invalidate this to bust every criteria variant at once. */
  transactionsRoot: () => ['transactions'] as const,
  recurringRules: (criteria: RecurringRuleCriteria) => ['recurringRules', criteria] as const,
  recurringRulesRoot: () => ['recurringRules'] as const,
  investments: () => ['investments'] as const,
  investment: (id: InvestmentId) => ['investments', id] as const,
  investmentValueHistory: (id: InvestmentId, range: HistoryRange) =>
    ['investments', id, 'valueHistory', range] as const,
};
