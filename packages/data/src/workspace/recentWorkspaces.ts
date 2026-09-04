// @repo/data — level 1.
// The recent-workspaces list falls under the platform's key-value contract (start-roadmap.md
// §9). Most-recently-used first; a corrupt or foreign value degrades to an empty list rather
// than failing the bootstrap sequence outright.

import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import { z } from 'zod';
import type { WorkspaceRef } from './workspaceRef';

const RECENT_WORKSPACES_KEY = 'recent-workspaces';

const workspaceRefSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('local'), id: z.string(), path: z.string(), label: z.string() }),
  z.object({ mode: z.literal('online'), id: z.string(), apiBaseUrl: z.string(), label: z.string() }),
]);

const recentWorkspacesSchema = z.array(workspaceRefSchema);

export async function listRecentWorkspaces(store: KeyValueStore): Promise<readonly WorkspaceRef[]> {
  const raw = await store.get(RECENT_WORKSPACES_KEY);
  if (raw === null) {
    return [];
  }
  const parsed = recentWorkspacesSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

/** Moves `ref` to the front of the list, deduplicating by id. */
export async function rememberWorkspace(store: KeyValueStore, ref: WorkspaceRef): Promise<void> {
  const existing = await listRecentWorkspaces(store);
  const next = [ref, ...existing.filter((entry) => entry.id !== ref.id)];
  await store.set(RECENT_WORKSPACES_KEY, JSON.stringify(next));
}

export async function forgetWorkspace(store: KeyValueStore, id: string): Promise<void> {
  const existing = await listRecentWorkspaces(store);
  await store.set(RECENT_WORKSPACES_KEY, JSON.stringify(existing.filter((entry) => entry.id !== id)));
}
