// Stands in for the real bootstrap → unlock → journal-replay → repository-construction sequence
// (start-roadmap.md §9, app-core-inventory.md §2) while @repo/data's SQLite/Tauri adapter isn't
// wired up yet. Everything downstream — screens, hooks, selectors — is real; only the gateway and
// platform are the in-memory/fake ones @repo/data and @repo/platform already ship for their own
// tests (createMemoryGateway, createFakePlatform). Delete this whole folder once real workspace
// opening lands; nothing outside apps/desktop references it.

import { createMemoryGateway } from '@repo/data/gateway/memoryGateway';
import { createRepositorySet } from '@repo/data/repositories/createRepositorySet';
import { timezoneSchema } from '@repo/domain/primitives/dateTime';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { Platform } from '@repo/platform/platform';
import { MOCK_NOW, mockSeed } from './seedData';

export type MockWorkspace = {
  readonly platform: Platform;
  readonly repositories: RepositorySet;
};

const TIMEZONE = timezoneSchema.parse('Europe/Paris');

export function createMockWorkspace(): MockWorkspace {
  const platform = createFakePlatform({ now: MOCK_NOW, systemTimezone: TIMEZONE, locale: 'en-US' });
  const gateway = createMemoryGateway(mockSeed);
  const repositories = createRepositorySet({
    gateway,
    clock: platform.clock,
    random: platform.random,
    timezone: TIMEZONE,
  });
  return { platform, repositories };
}
