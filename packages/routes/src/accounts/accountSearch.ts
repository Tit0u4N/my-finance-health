// @repo/routes — level 3.
// routes.md §3's one decided search param: the Account detail history range. Defined once so
// routeTree.ts's loader and useAccountDetailScreen's useTransactions call can never disagree —
// the criteria object is itself part of the cache key.

import type { AccountId } from '@repo/domain/primitives/entityId';
import type { TransactionCriteria } from '@repo/domain/repositories/criteria';
import { historyRangeSchema } from '@repo/domain/time/workspaceTime';
import { z } from 'zod';

/** `.catch` keeps a bogus `?range=` from becoming a router error; `.default` covers it being
 * absent entirely. Both fall back to the mock's own default range, '1m'. */
export const accountDetailSearchSchema = z.object({
  range: historyRangeSchema.catch('1m').default('1m'),
});
export type AccountDetailSearch = z.infer<typeof accountDetailSearchSchema>;

/** All of this account's transactions, newest first — no date bound: the KPI row's
 * inflow/outflow/net totals are all-time, not range-scoped (screens.md). */
export function accountTransactionsCriteria(id: AccountId): TransactionCriteria {
  return {
    accountIds: [id],
    sort: { key: 'date', direction: 'desc' },
  };
}
