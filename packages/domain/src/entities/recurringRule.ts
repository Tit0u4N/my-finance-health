// @repo/domain — level 0.
// domain-model.md "RecurringRule". No `next` field (open-questions.md #7): the next occurrence
// is a selector output in @repo/app-core, computed from `freq` + `startDate` + "today" in the
// workspace timezone. Never links to a Transaction (open-questions.md #8) — purely informational.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { isoDateSchema } from '../primitives/dateTime';
import { accountIdSchema, categoryIdSchema, recurringRuleIdSchema } from '../primitives/entityId';
import { moneySchema } from '../primitives/money';

export const recurringFrequencySchema = z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']);
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

export const recurringRuleSchema = z.object({
  id: recurringRuleIdSchema,
  desc: z.string().min(1),
  /** Same sign convention as Transaction.amount (open-questions.md #6). */
  amount: moneySchema,
  freq: recurringFrequencySchema,
  cat: categoryIdSchema,
  acc: accountIdSchema,
  /** Anchor date the occurrence schedule is computed from. */
  startDate: isoDateSchema,
  /** Paused rules are kept, not deleted. */
  active: z.boolean(),
  ...auditFieldsSchema.shape,
});
export type RecurringRule = z.infer<typeof recurringRuleSchema>;

export const createRecurringRuleInputSchema = recurringRuleSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .strict();
export type CreateRecurringRuleInput = z.infer<typeof createRecurringRuleInputSchema>;

/** Partial covers both an ordinary edit and the active toggle — same operation (repository-contracts.md). */
export const recurringRulePatchSchema = recurringRuleSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .strict();
export type RecurringRulePatch = z.infer<typeof recurringRulePatchSchema>;
