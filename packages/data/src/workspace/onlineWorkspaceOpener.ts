// @repo/data — level 1.
// The live path this pass: online mode has no lock file, no journal, and no at-open passphrase
// — the API key is a header the app attaches when it builds the HTTP client, not a secret this
// opener ever sees (start-roadmap.md §9). `open` and `unlock` therefore behave identically;
// `unlock` only exists because the port is shared with the (not-yet-implemented) local opener.

import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import type { DomainError } from '@repo/domain/primitives/errors';
import { unsupportedCapabilityError } from '@repo/domain/primitives/errors';
import type { Result } from '@repo/domain/primitives/result';
import { err, isErr, ok } from '@repo/domain/primitives/result';
import type { Clock } from '@repo/platform/services/clock';
import type { HttpClientService } from '@repo/platform/services/httpClient';
import type { RandomService } from '@repo/platform/services/random';
import { createRemoteGateway } from '../gateway/remoteGateway';
import { createRepositorySet } from '../repositories/createRepositorySet';
import { WORKSPACE_SETTINGS_ID } from '../repositories/workspaceSettingsRepository';
import type { CreateWorkspaceInput, WorkspaceOpener, WorkspaceOpenStep } from './workspaceOpener';
import type { OnlineWorkspaceRef, WorkspaceRef } from './workspaceRef';

export type CreateOnlineWorkspaceOpenerDeps = {
  readonly clock: Clock;
  readonly random: RandomService;
  /** Builds the authenticated HTTP client for this specific workspace — assembled by the app (start-roadmap.md §8). */
  readonly createHttpClient: (ref: OnlineWorkspaceRef) => HttpClientService;
};

function requireOnline(ref: WorkspaceRef): Result<OnlineWorkspaceRef, DomainError> {
  return ref.mode === 'online' ? ok(ref) : err(unsupportedCapabilityError('local'));
}

export function createOnlineWorkspaceOpener({
  clock,
  random,
  createHttpClient,
}: CreateOnlineWorkspaceOpenerDeps): WorkspaceOpener {
  async function open(ref: OnlineWorkspaceRef): Promise<Result<WorkspaceOpenStep, DomainError>> {
    const gateway = createRemoteGateway({ http: createHttpClient(ref) });
    const settings = await gateway.readById('workspaceSettings', WORKSPACE_SETTINGS_ID);
    if (isErr(settings)) {
      return settings;
    }
    const repositories = createRepositorySet({ gateway, clock, random, timezone: settings.value.timezone });
    return ok({ kind: 'ready', repositories });
  }

  return {
    open: (ref) => {
      const online = requireOnline(ref);
      return isErr(online) ? Promise.resolve(online) : open(online.value);
    },

    unlock: (ref) => {
      const online = requireOnline(ref);
      return isErr(online) ? Promise.resolve(online) : open(online.value);
    },

    create: async (ref, input: CreateWorkspaceInput) => {
      const online = requireOnline(ref);
      if (isErr(online)) {
        return online;
      }
      const gateway = createRemoteGateway({ http: createHttpClient(online.value) });
      const now = clock.now();
      const settings = workspaceSettingsSchema.parse({
        id: WORKSPACE_SETTINGS_ID,
        timezone: input.timezone,
        baseCurrency: input.baseCurrency,
        createdAt: now,
        updatedAt: now,
      });
      const written = await gateway.write('workspaceSettings', settings);
      if (isErr(written)) {
        return written;
      }
      const repositories = createRepositorySet({ gateway, clock, random, timezone: settings.timezone });
      return ok({ kind: 'ready', repositories });
    },
  };
}
