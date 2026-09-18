// @repo/app-core — level 2.
// Composes the query hooks computeRecentPeriodTrend.ts needs — Overview's income/spending
// `StatTile` sparklines (app-core-inventory.md §6, open-questions.md #17).

import { isoDateTimeSchema } from '@repo/domain/primitives/dateTime';
import type { AccountId } from '@repo/domain/primitives/entityId';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { rangeFor, todayIn } from '@repo/domain/time/workspaceTime';
import { useState } from 'react';
import { usePlatform } from '../../providers/usePlatform';
import { useTransactions } from '../../queries/useTransactions';
import { useWorkspaceSettings } from '../../queries/useWorkspaceSettings';
import { computeRecentPeriodTrend, type RecentPeriodTrendPoint } from '../recentPeriodTrend';
import { startOfDayIso } from './startOfDayIso';

export type UseRecentPeriodTrendResult = {
  readonly points: readonly RecentPeriodTrendPoint[] | undefined;
  readonly isLoading: boolean;
};

export function useRecentPeriodTrend(accountIds?: readonly AccountId[]): UseRecentPeriodTrendResult {
  const platform = usePlatform();
  const settingsQuery = useWorkspaceSettings();
  const settings = settingsQuery.data;
  // Snapshotted once at mount, not recomputed every render — see useOverviewScreen.ts's identical
  // comment: this feeds `criteria.dateRange.end` below, part of `useTransactions`'s query key.
  const [nowIso] = useState(() => isoDateTimeSchema.parse(platform.clock.now()));

  // "1 month back" is always >= the 30 calendar days the selector needs — it does its own precise
  // clipping from there, so this only has to be a safe superset, not an exact bound.
  const monthRange = settings ? rangeFor('1m', nowIso, settings.timezone) : undefined;
  const criteria: TransactionCriteria = {
    ...(accountIds ? { accountIds } : {}),
    ...(monthRange?.start ? { dateRange: { start: startOfDayIso(monthRange.start), end: nowIso } } : {}),
  };
  const transactionsQuery = useTransactions(criteria);
  const isLoading = settingsQuery.isLoading || transactionsQuery.isLoading;

  if (!(settings && transactionsQuery.data)) {
    return { points: undefined, isLoading };
  }

  const today = todayIn(nowIso, settings.timezone);
  return { points: computeRecentPeriodTrend(transactionsQuery.data, today), isLoading };
}
