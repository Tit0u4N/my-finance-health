// @repo/routes — level 3.
// routes.md §3 gives /recurring no search params — the only filter is the cross-screen account
// scope, which goes through criteria the same way accountSearch.ts / transactionSearch.ts do.

import type { AccountId } from '@repo/domain/primitives/entityId';
import type { RecurringRuleCriteria } from '@repo/domain/repositories/criteria';

export function recurringCriteria(accountIds: readonly AccountId[] | undefined): RecurringRuleCriteria {
  return accountIds === undefined ? {} : { accountIds };
}
