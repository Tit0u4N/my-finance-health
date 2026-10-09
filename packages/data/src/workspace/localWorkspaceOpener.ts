// @repo/data — level 1.
// The local counterpart to onlineWorkspaceOpener.ts: resume/unlock/create a workspace backed by
// an encrypted SQLite file (start-roadmap.md §9's opening cycle — resume, accessibility check,
// occupancy-lock acquisition, cryptographic unlock, integrity check, schema-version check,
// migration application, journal replay, repository construction).
//
// `open` never acquires the lock — only `unlock` does — so cancelling the passphrase prompt
// leaves no stray `.mfhlock` (start-roadmap.md's lock table is about who is *using* the
// workspace, not who is merely looking at it). A lock `held-elsewhere` fails outright rather than
// offering a read-only mode: `BootstrapState` has no read-only kind, `RepositorySet` has no
// read-only variant, and `PersistenceGateway` would need a second implementation for one — the
// `failed` state's retry/choose-another affordance is the honest alternative for this pass.

import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import {
  conflictError,
  type DomainError,
  integrityError,
  notFoundError,
  unsupportedCapabilityError,
  validationError,
} from '@repo/domain/primitives/errors';
import { err, isErr, ok, type Result } from '@repo/domain/primitives/result';
import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { Clock } from '@repo/platform/services/clock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { KeyValueStore } from '@repo/platform/services/keyValueStore';
import type { RandomService } from '@repo/platform/services/random';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import type { PersistenceGateway } from '../gateway/gateway';
import { createLocalGateway } from '../gateway/localGateway';
import { decodeBase64, encodeBase64 } from '../local/crypto/base64';
import { deriveJournalKey } from '../local/crypto/keys';
import { getOrCreateDeviceId } from '../local/deviceId';
import { type KdfCostParams, openOperationsJournal } from '../local/journal/operationsJournal';
import {
  acquireLock,
  classifyLock,
  type LockHandle,
  readLockFile,
  refreshLock,
  releaseLock,
} from '../local/lock/occupancyLock';
import { readJournalPointer } from '../local/sql/journalPointer';
import { runMigrations } from '../local/sql/migrationRunner';
import { replayInto } from '../local/sql/replay';
import { readWorkspaceMeta, WORKSPACE_META_SUITE, writeWorkspaceMeta } from '../local/workspaceMeta';
import { type WorkspacePaths, workspacePathsFor } from '../local/workspacePaths';
import { createRepositorySet } from '../repositories/createRepositorySet';
import { WORKSPACE_SETTINGS_ID } from '../repositories/workspaceSettingsRepository';
import type { CreateWorkspaceInput, WorkspaceOpener, WorkspaceOpenStep } from './workspaceOpener';
import type { LocalWorkspaceRef, WorkspaceRef } from './workspaceRef';

const DEFAULT_LOCK_STALENESS_MS = 60_000;
const DEFAULT_KDF: KdfCostParams = { memoryKiB: 65_536, iterations: 3, parallelism: 1 };
const SALT_LENGTH = 16;

export type LocalWorkspaceSession = {
  readonly ref: LocalWorkspaceRef;
  /** Refreshes the occupancy lock — fails if another session has since taken it over. */
  heartbeat(): Promise<Result<true, DomainError>>;
  /** Releases the lock (only if still held by this session) and closes the SQL connection, in that order. */
  close(): Promise<void>;
};

export type CreateLocalWorkspaceOpenerDeps = {
  readonly fileSystem: FileSystemService;
  readonly sqlDriver: SqlDriver;
  readonly keyValueStore: KeyValueStore;
  readonly clock: Clock;
  readonly random: RandomService;
  readonly lockStalenessMs?: number;
  /** Cosmetic progress only — not part of the WorkspaceOpener port or BootstrapState, since a
   * single `unlock()`/`create()` call cannot report more than the one step it eventually resolves
   * to. The app may use this to label a spinner while the promise is in flight. */
  readonly onProgress?: (step: 'migrating' | 'replaying') => void;
  /** Handed the session once a workspace reaches `ready`, so the app can heartbeat and close it —
   * @repo/data owns neither timers nor window close events. */
  readonly onSessionOpen?: (session: LocalWorkspaceSession) => void;
};

function requireLocal(ref: WorkspaceRef): Result<LocalWorkspaceRef, DomainError> {
  return ref.mode === 'local' ? ok(ref) : err(unsupportedCapabilityError('online'));
}

type UnlockedContext = {
  readonly ref: LocalWorkspaceRef;
  readonly paths: WorkspacePaths;
  readonly deviceId: string;
  readonly lockHandle: LockHandle;
  readonly gateway: PersistenceGateway;
};

export function createLocalWorkspaceOpener(deps: CreateLocalWorkspaceOpenerDeps): WorkspaceOpener {
  const { fileSystem, sqlDriver, keyValueStore, clock, random } = deps;
  const lockStalenessMs = deps.lockStalenessMs ?? DEFAULT_LOCK_STALENESS_MS;

  function lockDepsFor(paths: WorkspacePaths, deviceId: string) {
    return { fileSystem, clock, random, lockPath: paths.lock, deviceId };
  }

  async function checkNotHeldElsewhere(paths: WorkspacePaths, deviceId: string): Promise<Result<true, DomainError>> {
    const lock = await readLockFile(fileSystem, paths.lock);
    const classification = classifyLock(lock, deviceId, clock.now(), lockStalenessMs);
    if (classification.kind === 'held-elsewhere') {
      return err(
        conflictError(`local workspace: locked by another device (last active ${classification.holder.refreshedAt})`),
      );
    }
    return ok(true);
  }

  async function open(ref: LocalWorkspaceRef): Promise<Result<WorkspaceOpenStep, DomainError>> {
    const paths = workspacePathsFor(fileSystem, ref.path);
    const info = await fileSystem.fileInfo(paths.database);
    if (!info) {
      return err(notFoundError('LocalWorkspace', ref.path));
    }
    const meta = await readWorkspaceMeta(fileSystem, paths.meta);
    if (!meta) {
      return err(integrityError(`local workspace: "${paths.meta}" is missing or unreadable`));
    }
    const deviceId = await getOrCreateDeviceId(keyValueStore, random);
    const notHeldElsewhere = await checkNotHeldElsewhere(paths, deviceId);
    return isErr(notHeldElsewhere) ? notHeldElsewhere : ok({ kind: 'needs-unlock' });
  }

  /**
   * The shared prefix of `unlock` and `create` once a passphrase and salts are in hand: acquire
   * the lock, unlock the database, migrate, open the journal, replay, build the gateway. Neither
   * reads nor writes `workspaceSettings` — `unlock` reads it for the timezone, `create` writes it
   * — so this step alone never fully "opens" a workspace on its own.
   */
  async function unlockToGateway(input: {
    readonly ref: LocalWorkspaceRef;
    readonly paths: WorkspacePaths;
    readonly deviceId: string;
    readonly secret: string;
    readonly dbSalt: string;
    readonly journalSaltBytes: Uint8Array;
    readonly kdf: KdfCostParams;
  }): Promise<Result<UnlockedContext, DomainError>> {
    const { ref, paths, deviceId, secret, dbSalt, journalSaltBytes, kdf } = input;
    const lockDeps = lockDepsFor(paths, deviceId);

    const lockHandleResult = await acquireLock(lockDeps);
    if (isErr(lockHandleResult)) {
      return lockHandleResult;
    }
    const lockHandle = lockHandleResult.value;

    async function failAfterLock(error: DomainError): Promise<Result<UnlockedContext, DomainError>> {
      await releaseLock(lockDeps, lockHandle);
      return err(error);
    }

    let journalKey: Uint8Array;
    try {
      journalKey = await deriveJournalKey(secret, { salt: journalSaltBytes, ...kdf });
      await sqlDriver.unlock(paths.database, secret, { salt: dbSalt, ...kdf });
    } catch (error) {
      return failAfterLock(validationError(`local workspace: failed to unlock (${String(error)})`));
    }

    async function failAfterUnlock(error: DomainError): Promise<Result<UnlockedContext, DomainError>> {
      await sqlDriver.close();
      return failAfterLock(error);
    }

    deps.onProgress?.('migrating');
    const migrated = await runMigrations(sqlDriver);
    if (isErr(migrated)) {
      return failAfterUnlock(migrated.error);
    }

    const journal = await openOperationsJournal({
      fileSystem,
      clock,
      random,
      paths,
      deviceId,
      key: journalKey,
      journalKdfSalt: journalSaltBytes,
      dbKdfSalt: decodeBase64(dbSalt),
      kdf,
    });
    if (isErr(journal)) {
      return failAfterUnlock(journal.error);
    }

    const gateway = createLocalGateway({ driver: sqlDriver, journal: journal.value });

    deps.onProgress?.('replaying');
    const pointer = await readJournalPointer(sqlDriver);
    const replayed = await replayInto(sqlDriver, journal.value, pointer);
    if (isErr(replayed)) {
      return failAfterUnlock(replayed.error);
    }

    return ok({ ref, paths, deviceId, lockHandle, gateway });
  }

  function finish(context: UnlockedContext, repositories: RepositorySet): WorkspaceOpenStep {
    const lockDeps = lockDepsFor(context.paths, context.deviceId);
    deps.onSessionOpen?.({
      ref: context.ref,
      heartbeat: () => refreshLock(lockDeps, context.lockHandle),
      close: async () => {
        await releaseLock(lockDeps, context.lockHandle);
        await sqlDriver.close();
      },
    });
    return { kind: 'ready', repositories };
  }

  async function failFinal(
    context: UnlockedContext,
    error: DomainError,
  ): Promise<Result<WorkspaceOpenStep, DomainError>> {
    await releaseLock(lockDepsFor(context.paths, context.deviceId), context.lockHandle);
    await sqlDriver.close();
    return err(error);
  }

  async function unlockExisting(
    ref: LocalWorkspaceRef,
    secret: string,
  ): Promise<Result<WorkspaceOpenStep, DomainError>> {
    const paths = workspacePathsFor(fileSystem, ref.path);
    const meta = await readWorkspaceMeta(fileSystem, paths.meta);
    if (!meta) {
      return err(integrityError(`local workspace: "${paths.meta}" is missing or unreadable`));
    }
    const deviceId = await getOrCreateDeviceId(keyValueStore, random);
    const notHeldElsewhere = await checkNotHeldElsewhere(paths, deviceId);
    if (isErr(notHeldElsewhere)) {
      return notHeldElsewhere;
    }

    const unlocked = await unlockToGateway({
      ref,
      paths,
      deviceId,
      secret,
      dbSalt: meta.dbSalt,
      journalSaltBytes: decodeBase64(meta.journalSalt),
      kdf: meta.kdf,
    });
    if (isErr(unlocked)) {
      return unlocked;
    }

    const settings = await unlocked.value.gateway.readById('workspaceSettings', WORKSPACE_SETTINGS_ID);
    if (isErr(settings)) {
      return failFinal(unlocked.value, settings.error);
    }

    const repositories = createRepositorySet({
      gateway: unlocked.value.gateway,
      clock,
      random,
      timezone: settings.value.timezone,
    });
    return ok(finish(unlocked.value, repositories));
  }

  async function create(
    ref: LocalWorkspaceRef,
    input: CreateWorkspaceInput,
  ): Promise<Result<WorkspaceOpenStep, DomainError>> {
    if (!input.secret) {
      return err(validationError('local workspace: a passphrase is required to create a local workspace'));
    }
    const paths = workspacePathsFor(fileSystem, ref.path);
    const existing = await fileSystem.fileInfo(paths.database);
    if (existing) {
      return err(conflictError(`local workspace: a file already exists at "${ref.path}"`));
    }

    const deviceId = await getOrCreateDeviceId(keyValueStore, random);
    const dbSaltBytes = random.bytes(SALT_LENGTH);
    const journalSaltBytes = random.bytes(SALT_LENGTH);
    const dbSalt = encodeBase64(dbSaltBytes);
    // Written before the database is ever unlocked: a crash between the two must never leave a
    // database file whose salts are unrecoverable.
    await writeWorkspaceMeta(fileSystem, paths.meta, {
      v: 1,
      workspaceId: ref.id,
      createdAt: clock.now(),
      dbSalt,
      journalSalt: encodeBase64(journalSaltBytes),
      kdf: DEFAULT_KDF,
      suite: WORKSPACE_META_SUITE,
    });

    const unlocked = await unlockToGateway({
      ref,
      paths,
      deviceId,
      secret: input.secret,
      dbSalt,
      journalSaltBytes,
      kdf: DEFAULT_KDF,
    });
    if (isErr(unlocked)) {
      return unlocked;
    }

    const now = clock.now();
    const settings = workspaceSettingsSchema.parse({
      id: WORKSPACE_SETTINGS_ID,
      timezone: input.timezone,
      baseCurrency: input.baseCurrency,
      createdAt: now,
      updatedAt: now,
    });
    const written = await unlocked.value.gateway.write('workspaceSettings', settings);
    if (isErr(written)) {
      return failFinal(unlocked.value, written.error);
    }

    const repositories = createRepositorySet({
      gateway: unlocked.value.gateway,
      clock,
      random,
      timezone: settings.timezone,
    });
    return ok(finish(unlocked.value, repositories));
  }

  return {
    open: (ref) => {
      const local = requireLocal(ref);
      return isErr(local) ? Promise.resolve(local) : open(local.value);
    },
    unlock: (ref, secret) => {
      const local = requireLocal(ref);
      return isErr(local) ? Promise.resolve(local) : unlockExisting(local.value, secret);
    },
    create: (ref, input) => {
      const local = requireLocal(ref);
      return isErr(local) ? Promise.resolve(local) : create(local.value, input);
    },
  };
}
