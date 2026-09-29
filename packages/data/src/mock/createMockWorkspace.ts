// Stands in for the real bootstrap → unlock → journal-replay → repository-construction sequence
// (start-roadmap.md §9, app-core-inventory.md §2) while @repo/data's SQLite/Tauri adapter isn't
// wired up yet. Everything downstream — screens, hooks, selectors — is real; only the gateway and
// platform are the in-memory/fake ones @repo/data and @repo/platform already ship for their own
// tests (createMemoryGateway, createFakePlatform). Delete this whole folder once real workspace
// opening lands; nothing outside apps/desktop references it.

import { timezoneSchema } from '@repo/domain/primitives/dateTime';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { PlatformCapabilities } from '@repo/platform/capabilities';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { Platform } from '@repo/platform/platform';
import { createMemoryGateway } from '../gateway/memoryGateway';
import { createRepositorySet } from '../repositories/createRepositorySet';
import { MOCK_NOW, mockSeed } from './seedData';

export type MockWorkspace = {
  readonly platform: Platform;
  readonly repositories: RepositorySet;
};

export type CreateMockWorkspaceOptions = {
  /** Overrides `createFakePlatform`'s all-`true` default capabilities — for a caller whose real
   * platform adapter is still a placeholder (apps/mobile: `@repo/platform-expo`) and would
   * otherwise report a service (file access, a secret vault, SQLCipher, …) it cannot actually
   * back yet. Never a platform-name branch — the caller states its own honest capability set. */
  readonly capabilities?: Partial<PlatformCapabilities>;
  readonly locale?: string;
};

const TIMEZONE = timezoneSchema.parse('Europe/Paris');

export function createMockWorkspace(options: CreateMockWorkspaceOptions = {}): MockWorkspace {
  const platform = createFakePlatform({
    now: MOCK_NOW,
    systemTimezone: TIMEZONE,
    locale: options.locale ?? 'en-US',
    ...(options.capabilities === undefined ? {} : { capabilities: options.capabilities }),
  });
  const gateway = createMemoryGateway(mockSeed);
  const repositories = createRepositorySet({
    gateway,
    clock: platform.clock,
    random: platform.random,
    timezone: TIMEZONE,
  });
  return { platform, repositories };
}
