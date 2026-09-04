// @repo/domain — level 0.
// domain-model.md "Category". `kind` is an explicit field here (the mock encodes it structurally
// by which of two arrays a category lives in) and is excluded from CategoryPatch: changing a
// category's kind after transactions reference it would break the sign/kind invariant
// (invariants.ts).

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { categoryIdSchema } from '../primitives/entityId';
import { hexColorSchema } from '../primitives/hexColor';

export const categoryKindSchema = z.enum(['income', 'expense']);
export type CategoryKind = z.infer<typeof categoryKindSchema>;

export const categorySchema = z.object({
  id: categoryIdSchema,
  name: z.string().min(1),
  color: hexColorSchema,
  kind: categoryKindSchema,
  ...auditFieldsSchema.shape,
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = categorySchema.omit({ id: true, createdAt: true, updatedAt: true }).strict();
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const categoryPatchSchema = categorySchema
  .omit({ id: true, kind: true, createdAt: true, updatedAt: true })
  .partial()
  .strict();
export type CategoryPatch = z.infer<typeof categoryPatchSchema>;
