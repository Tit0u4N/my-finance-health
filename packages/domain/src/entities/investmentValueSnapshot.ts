// @repo/domain — level 0.
// domain-model.md "InvestmentValueSnapshot". User-entered only, no market-data feed
// (open-questions.md #9). Immutable once recorded: no patch/delete operation on the repository.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { isoDateTimeSchema } from '../primitives/dateTime';
import { investmentIdSchema, investmentValueSnapshotIdSchema } from '../primitives/entityId';
import { moneySchema } from '../primitives/money';

export const investmentValueSnapshotSchema = z.object({
  id: investmentValueSnapshotIdSchema,
  investmentId: investmentIdSchema,
  date: isoDateTimeSchema,
  /** Per-unit price at that date. */
  price: moneySchema,
  ...auditFieldsSchema.shape,
});
export type InvestmentValueSnapshot = z.infer<typeof investmentValueSnapshotSchema>;

export const recordInvestmentValueSnapshotInputSchema = investmentValueSnapshotSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .strict();
export type RecordInvestmentValueSnapshotInput = z.infer<typeof recordInvestmentValueSnapshotInputSchema>;
