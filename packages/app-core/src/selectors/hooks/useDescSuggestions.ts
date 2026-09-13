// @repo/app-core — level 2.
// Composes the query hooks computeDescSuggestions.ts needs — the New/Edit transaction dialog's
// description Autocomplete (app-core-inventory.md §6).

import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import { usePlatform } from '../../providers/usePlatform';
import { useTransactions } from '../../queries/useTransactions';
import { useWorkspaceSettings } from '../../queries/useWorkspaceSettings';
import { computeDescSuggestions } from '../descSuggestions';
import { startOfDayIso } from './startOfDayIso';

export type UseDescSuggestionsResult = {
  readonly names: readonly string[];
  readonly isLoading: boolean;
};

export function useDescSuggestions(query: string, limit?: number): UseDescSuggestionsResult {
  const platform = usePlatform();
  const settingsQuery = useWorkspaceSettings();
  const settings = settingsQuery.data;
  const nowIso = isoDateTimeSchema.parse(platform.clock.now());

  // A year back is a generous, cheap-enough bound for recall — no `TransactionCriteria` supports
  // pagination (repository-contracts.md), so an unbounded `useTransactions({})` would fetch every
  // transaction ever recorded just to suggest a description.
  const yearRange = settings ? rangeFor('1y', nowIso, settings.timezone) : undefined;
  const criteria: TransactionCriteria = {
    ...(yearRange?.start ? { dateRange: { start: startOfDayIso(yearRange.start), end: nowIso } } : {}),
  };
  const transactionsQuery = useTransactions(criteria);
  const isLoading = settingsQuery.isLoading || transactionsQuery.isLoading;

  if (!transactionsQuery.data) {
    return { names: [], isLoading };
  }

  return { names: computeDescSuggestions(transactionsQuery.data, query, limit), isLoading };
}
