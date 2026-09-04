// @repo/domain — level 0.
// domain-model.md "Account". `balance` is a maintained running total, not derived on read (this
// pass's decision on the model's open question) — it is written only by AccountRepository.create
// and by TransactionRepository composing an account-balance adjustment into the same
// gateway.batch() as the transaction write, never through AccountPatch directly.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { currencyCodeSchema } from '../primitives/currency';
import { accountIdSchema } from '../primitives/entityId';
import { hexColorSchema } from '../primitives/hexColor';
import { moneySchema } from '../primitives/money';

export const accountTypeSchema = z.enum(['Checking', 'Savings', 'Investment', 'Cash']);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const accountSchema = z.object({
  id: accountIdSchema,
  name: z.string().min(1),
  type: accountTypeSchema,
  currency: currencyCodeSchema,
  balance: moneySchema,
  color: hexColorSchema,
  icon: z.string().min(1),
  last4: z.string().length(4).optional(),
  ...auditFieldsSchema.shape,
});
export type Account = z.infer<typeof accountSchema>;

/** `balance` here is the opening balance the user enters at creation, not a derived value. */
export const createAccountInputSchema = accountSchema.omit({ id: true, createdAt: true, updatedAt: true }).strict();
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

/** `balance` is excluded: it only ever moves through a transaction write. */
export const accountPatchSchema = accountSchema
  .omit({ id: true, balance: true, createdAt: true, updatedAt: true })
  .partial()
  .strict();
export type AccountPatch = z.infer<typeof accountPatchSchema>;
