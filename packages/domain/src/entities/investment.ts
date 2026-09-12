// @repo/domain — level 0.
// domain-model.md "Investment". `current` is excluded from InvestmentPatch: it only ever moves
// together with an InvestmentValueSnapshot, through InvestmentRepository.recordValueSnapshot
// (see investmentValueSnapshot.ts) — one fact, two rows, never an independent edit.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { investmentIdSchema } from '../primitives/entityId';
import { hexColorSchema } from '../primitives/hexColor';
import { moneySchema } from '../primitives/money';

export const investmentSchema = z.object({
  id: investmentIdSchema,
  name: z.string().min(1),
  ticker: z.string().min(1),
  /** Units held. Not a money field — fractional units are plausible. */
  qty: z.number().positive(),
  /** Average cost per unit. Cost basis is qty * avg. */
  avg: moneySchema,
  /** Current price per unit. Value is qty * current. */
  current: moneySchema,
  color: hexColorSchema,
  /** Free-text description, edited via the Investment detail panel. Plain text, not rich text
   * (open-questions.md #15b — document.execCommand's replacement was resolved by dropping rich
   * text from v1 rather than reimplementing it). */
  note: z.string().optional(),
  ...auditFieldsSchema.shape,
});
export type Investment = z.infer<typeof investmentSchema>;

export const createInvestmentInputSchema = investmentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .strict();
export type CreateInvestmentInput = z.infer<typeof createInvestmentInputSchema>;

export const investmentPatchSchema = investmentSchema
  .omit({ id: true, current: true, createdAt: true, updatedAt: true })
  .partial()
  .strict();
export type InvestmentPatch = z.infer<typeof investmentPatchSchema>;
