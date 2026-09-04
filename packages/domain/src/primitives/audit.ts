// @repo/domain — level 0.
// createdAt/updatedAt from schema v1, per every entity (start-roadmap.md §17) — zero cost now,
// costly to retrofit on deployed data.

import { z } from 'zod';
import { isoDateTimeSchema } from './dateTime';

export const auditFieldsSchema = z.object({
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type AuditFields = z.infer<typeof auditFieldsSchema>;
