// @repo/routes — level 3.
// routes.md §3's Investment detail history range — the accountSearch.ts twin.

import { historyRangeSchema } from '@repo/domain/time/workspaceTime';
import { z } from 'zod';

/** `.catch` keeps a bogus `?range=` from becoming a router error; `.default` covers it being
 * absent entirely. Both fall back to the mock's own default range, '1m'. */
export const investmentDetailSearchSchema = z.object({
  range: historyRangeSchema.catch('1m').default('1m'),
});
export type InvestmentDetailSearch = z.infer<typeof investmentDetailSearchSchema>;
