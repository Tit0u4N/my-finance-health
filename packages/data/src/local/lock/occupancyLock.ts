// @repo/data — level 1.
// The occupancy lock for a workspace in a synced folder (start-roadmap.md §9): a small file next
// to the database, distinct from it, holding the device id, a session id, and a periodically
// refreshed timestamp. Cleartext, and deliberately so: §9 orders the sequence as "occupancy-lock
// acquisition" before "cryptographic unlock", so the lock must be readable before the passphrase
// exists. Contents are minimised to opaque identifiers — no machine name — since the four-case
// table below only ever needs "is this me?".

import { conflictError, type DomainError } from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { Clock } from '@repo/platform/services/clock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { RandomService } from '@repo/platform/services/random';
import { z } from 'zod';

const lockFileSchema = z.object({
  v: z.literal(1),
  deviceId: z.string(),
  sessionId: z.string(),
  acquiredAt: z.string(),
  refreshedAt: z.string(),
});

export type LockFile = z.infer<typeof lockFileSchema>;

export type LockHolder = { readonly deviceId: string; readonly sessionId: string; readonly refreshedAt: string };

export type LockClassification =
  | { readonly kind: 'free' }
  | { readonly kind: 'same-device'; readonly uncleanShutdown: true; readonly holder: LockHolder }
  | { readonly kind: 'held-elsewhere'; readonly holder: LockHolder }
  | { readonly kind: 'stale-elsewhere'; readonly holder: LockHolder };

function toHolder(lock: LockFile): LockHolder {
  return { deviceId: lock.deviceId, sessionId: lock.sessionId, refreshedAt: lock.refreshedAt };
}

/**
 * Pure — no I/O, so the whole four-case table from start-roadmap.md §9 is unit-testable without
 * a file system. A lock left by this same device (however stale) always means the previous
 * session shut down uncleanly, since a clean close deletes the lock file (`releaseLock`).
 */
export function classifyLock(
  lock: LockFile | null,
  deviceId: string,
  now: string,
  stalenessMs: number,
): LockClassification {
  if (lock === null) {
    return { kind: 'free' };
  }
  if (lock.deviceId === deviceId) {
    return { kind: 'same-device', uncleanShutdown: true, holder: toHolder(lock) };
  }
  const elapsedMs = Date.parse(now) - Date.parse(lock.refreshedAt);
  return elapsedMs < stalenessMs
    ? { kind: 'held-elsewhere', holder: toHolder(lock) }
    : { kind: 'stale-elsewhere', holder: toHolder(lock) };
}

export type LockHandle = {
  readonly path: string;
  readonly deviceId: string;
  readonly sessionId: string;
};

export type OccupancyLockDeps = {
  readonly fileSystem: FileSystemService;
  readonly clock: Clock;
  readonly random: RandomService;
  readonly lockPath: string;
  readonly deviceId: string;
};

const TEMP_SUFFIX = '.tmp';

async function writeLockFileAtomically(fileSystem: FileSystemService, path: string, lock: LockFile): Promise<void> {
  const tempPath = `${path}${TEMP_SUFFIX}`;
  await fileSystem.writeFile(tempPath, new TextEncoder().encode(JSON.stringify(lock)));
  await fileSystem.rename(tempPath, path);
}

/** Returns `null` when the lock file is absent or fails to parse — a corrupt lock is treated as no useful information about a holder, and the next `acquireLock` overwrites it. */
export async function readLockFile(fileSystem: FileSystemService, path: string): Promise<LockFile | null> {
  const info = await fileSystem.fileInfo(path);
  if (!info) {
    return null;
  }
  const bytes = await fileSystem.readFile(path);
  const parsed = lockFileSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
  return parsed.success ? parsed.data : null;
}

/** Unconditionally writes a fresh lock — the caller is expected to have already classified the existing one (`classifyLock`) and decided acquisition is appropriate. */
export async function acquireLock(deps: OccupancyLockDeps): Promise<Result<LockHandle, DomainError>> {
  const sessionId = deps.random.uuid();
  const now = deps.clock.now();
  const lock: LockFile = { v: 1, deviceId: deps.deviceId, sessionId, acquiredAt: now, refreshedAt: now };
  await writeLockFileAtomically(deps.fileSystem, deps.lockPath, lock);
  return ok({ path: deps.lockPath, deviceId: deps.deviceId, sessionId });
}

/** Refreshes the timestamp — fails if another session has since taken over the lock, so a stale heartbeat never silently keeps writing over a peer. */
export async function refreshLock(deps: OccupancyLockDeps, handle: LockHandle): Promise<Result<true, DomainError>> {
  const current = await readLockFile(deps.fileSystem, handle.path);
  if (!current || current.sessionId !== handle.sessionId) {
    return err(conflictError('occupancy lock: this session no longer holds the lock'));
  }
  await writeLockFileAtomically(deps.fileSystem, handle.path, { ...current, refreshedAt: deps.clock.now() });
  return ok(true);
}

/** Deletes the lock only if this session still owns it — never removes a lock another session has since taken over. */
export async function releaseLock(deps: OccupancyLockDeps, handle: LockHandle): Promise<void> {
  const current = await readLockFile(deps.fileSystem, handle.path);
  if (current && current.sessionId === handle.sessionId) {
    await deps.fileSystem.deleteFile(handle.path);
  }
}
