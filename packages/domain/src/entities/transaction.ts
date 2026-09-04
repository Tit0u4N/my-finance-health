// @repo/domain — level 0.
// domain-model.md "Transaction". No `type` field (open-questions.md #6): income vs. expense is
// read off sign(amount), checked against the referenced Category.kind by invariants.ts, never a
// second source of truth.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { isoDateTimeSchema } from '../primitives/dateTime';
import { accountIdSchema, categoryIdSchema, transactionIdSchema } from '../primitives/entityId';
import { moneySchema } from '../primitives/money';

export const transactionSchema = z.object({
  id: transactionIdSchema,
  date: isoDateTimeSchema,
  desc: z.string().min(1),
  /** Signed: positive is income, negative is expense (open-questions.md #6). */
  amount: moneySchema,
  cat: categoryIdSchema,
  acc: accountIdSchema,
  note: z.string().optional(),
  ...auditFieldsSchema.shape,
});
export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = transactionSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict();
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const transactionPatchSchema = transactionSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .strict();
export type TransactionPatch = z.infer<typeof transactionPatchSchema>;
