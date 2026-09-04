// @repo/domain — level 0.
// The three currencies the product supports (domain-model.md Account, WorkspaceSettings).

import { z } from 'zod';

export const currencyCodeSchema = z.enum(['EUR', 'USD', 'GBP']);
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
