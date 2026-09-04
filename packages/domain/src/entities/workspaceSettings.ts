// @repo/domain — level 0.
// domain-model.md "WorkspaceSettings": workspace-level facts owned by no single entity, one
// record per workspace. `timezone` is set once at creation and never updated afterward
// (open-questions.md #3) — there is deliberately no WorkspaceSettingsPatch; the only mutation is
// the dedicated setBaseCurrency operation on WorkspaceSettingsRepository.

import { z } from 'zod';
import { auditFieldsSchema } from '../primitives/audit';
import { currencyCodeSchema } from '../primitives/currency';
import { timezoneSchema } from '../primitives/dateTime';
import { workspaceSettingsIdSchema } from '../primitives/entityId';

export const workspaceSettingsSchema = z.object({
  id: workspaceSettingsIdSchema,
  /** Immutable once set — every period boundary is computed against it, never the device's local timezone. */
  timezone: timezoneSchema,
  /** Mutable. The currency cross-account totals convert into. */
  baseCurrency: currencyCodeSchema,
  ...auditFieldsSchema.shape,
});
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;

export const createWorkspaceSettingsInputSchema = workspaceSettingsSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .strict();
export type CreateWorkspaceSettingsInput = z.infer<typeof createWorkspaceSettingsInputSchema>;
