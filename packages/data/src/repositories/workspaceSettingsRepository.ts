// @repo/data — level 1.
// WorkspaceSettings is a singleton — one record per workspace, stored under a fixed id since the
// domain schema still carries an id field (every entity does, per start-roadmap.md §17). The
// initial record is written by the workspace opener at creation time, not by this repository —
// there is deliberately no `create` here, matching WorkspaceSettingsRepository's contract
// (repository-contracts.md): `timezone` is immutable, only `get`/`setBaseCurrency` exist.

import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { notFoundError } from '@repo/domain/primitives/errors';
import { err, isErr, ok } from '@repo/domain/primitives/result';
import type { WorkspaceSettingsRepository } from '@repo/domain/repositories/workspaceSettingsRepository';
import type { RepositoryDeps } from './shared';

export const WORKSPACE_SETTINGS_ID = 'workspace-settings';

export function createWorkspaceSettingsRepository({ gateway, clock }: RepositoryDeps): WorkspaceSettingsRepository {
  return {
    get: async () => {
      const result = await gateway.readById('workspaceSettings', WORKSPACE_SETTINGS_ID);
      if (isErr(result)) {
        return err(notFoundError('WorkspaceSettings', WORKSPACE_SETTINGS_ID));
      }
      return ok(result.value);
    },

    setBaseCurrency: async (currency: CurrencyCode) => {
      const current = await gateway.readById('workspaceSettings', WORKSPACE_SETTINGS_ID);
      if (isErr(current)) {
        return err(notFoundError('WorkspaceSettings', WORKSPACE_SETTINGS_ID));
      }
      const updated = workspaceSettingsSchema.parse({
        ...current.value,
        baseCurrency: currency,
        updatedAt: clock.now(),
      });
      return gateway.write('workspaceSettings', updated);
    },
  };
}
