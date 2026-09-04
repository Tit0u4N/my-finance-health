// @repo/domain — level 0.
// Every `list` that takes criteria accepts them as one call — never a base list plus
// client-side filtering (repository-contracts.md). Re-exports HistoryRange/DateRange from
// time/workspaceTime.ts so a consumer only needs to import from repositories/*.

import type { IsoDateTime } from '../primitives/dateTime';
import type { AccountId, CategoryId } from '../primitives/entityId';

export type { DateRange, HistoryRange } from '../time/workspaceTime';

export type SortDirection = 'asc' | 'desc';
export type TransactionSortKey = 'date' | 'amount';
export type AmountSign = 'positive' | 'negative';

export type TransactionCriteria = {
  readonly accountIds?: readonly AccountId[];
  readonly dateRange?: { readonly start: IsoDateTime; readonly end: IsoDateTime };
  readonly categoryId?: CategoryId;
  readonly amountSign?: AmountSign;
  /** Free-text search against `desc` (and, per screens.md, effectively `note`). */
  readonly text?: string;
  readonly sort?: { readonly key: TransactionSortKey; readonly direction: SortDirection };
};

export type RecurringRuleCriteria = {
  readonly accountIds?: readonly AccountId[];
};
