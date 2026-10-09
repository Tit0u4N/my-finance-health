// @repo/data — level 1.
// Moving a local workspace in and out of the app (start-roadmap.md §9, "Mobile case"): mobile
// cannot open a file in place, so the database lives in the app sandbox and the user retrieves or
// brings back a copy explicitly — to iCloud Drive, another device, desktop. Which files make up a
// workspace, how the export folder is named and what counts as importable are the core's
// decisions (principle 4: adapters are silent); the platform only supplies read/write/list.
//
// A workspace is the `.mfhdb`, its cleartext `.mfhmeta`, and every journal segment
// (`<base>.<device>.<index>.mfhj`). The `.mfhlock` is never copied — it describes who is using
// the original, not the copy. The database is copied first and the journal last: the journal is
// the source of truth, so a copy that is slightly ahead of its database is repaired by replay at
// the next open, while the reverse would silently lose operations.

import {
  conflictError,
  type DomainError,
  integrityError,
  notFoundError,
  storageError,
} from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { Clock } from '@repo/platform/services/clock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { RandomService } from '@repo/platform/services/random';
import { type WorkspacePaths, workspaceLabelFromPath, workspacePathsFor } from '../local/workspacePaths';
import type { LocalWorkspaceRef } from './workspaceRef';

export const DATABASE_EXTENSION = '.mfhdb';
const META_EXTENSION = '.mfhmeta';
const JOURNAL_EXTENSION = '.mfhj';
const WORKSPACES_DIRECTORY = 'workspaces';
const DEFAULT_LABEL = 'workspace';

function fileNameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

function sanitizeLabel(label: string): string {
  const cleaned = label
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned.slice(0, 60) : DEFAULT_LABEL;
}

async function copyFile(fileSystem: FileSystemService, from: string, to: string): Promise<void> {
  await fileSystem.writeFile(to, await fileSystem.readFile(from));
}

/** Database, descriptor, then every journal segment — in that order, see the file header. */
export async function listWorkspaceFiles(fileSystem: FileSystemService, paths: WorkspacePaths): Promise<string[]> {
  const entries = await fileSystem.listDirectory(paths.directory);
  const segmentPrefix = `${paths.baseName}.`;
  const segments = entries
    .filter((entry) => {
      const name = fileNameOf(entry);
      return name.startsWith(segmentPrefix) && name.endsWith(JOURNAL_EXTENSION);
    })
    .sort();
  return [paths.database, paths.meta, ...segments];
}

function exportFolderName(baseName: string, now: string): string {
  // "2026-10-07T12:34:56.000Z" → "2026-10-07 1234": sortable, and free of ":" which Files/SAF reject.
  const stamp = `${now.slice(0, 10)} ${now.slice(11, 13)}${now.slice(14, 16)}`;
  return `${baseName} ${stamp}`;
}

export type ExportLocalWorkspaceInput = {
  readonly fileSystem: FileSystemService;
  readonly clock: Clock;
  readonly databasePath: string;
  /** A folder the user picked — the export lands in a fresh subfolder of it. */
  readonly targetDirectory: string;
};

export type ExportedWorkspace = {
  readonly directory: string;
  readonly databasePath: string;
  readonly fileCount: number;
};

export async function exportLocalWorkspace(
  input: ExportLocalWorkspaceInput,
): Promise<Result<ExportedWorkspace, DomainError>> {
  const { fileSystem, clock, databasePath, targetDirectory } = input;
  const paths = workspacePathsFor(fileSystem, databasePath);
  const destination = fileSystem.resolvePath(targetDirectory, exportFolderName(paths.baseName, clock.now()));
  try {
    await fileSystem.createDirectory(destination);
    const files = await listWorkspaceFiles(fileSystem, paths);
    for (const file of files) {
      await copyFile(fileSystem, file, fileSystem.resolvePath(destination, fileNameOf(file)));
    }
    return ok({
      directory: destination,
      databasePath: fileSystem.resolvePath(destination, fileNameOf(paths.database)),
      fileCount: files.length,
    });
  } catch (error) {
    return err(storageError(`workspace export: ${String(error)}`));
  }
}

/** `.mfhdb` files in `directory` whose `.mfhmeta` sibling exists — one without it cannot be unlocked. */
export async function findImportableWorkspaces(
  fileSystem: FileSystemService,
  directory: string,
): Promise<readonly string[]> {
  const entries = await fileSystem.listDirectory(directory);
  const names = new Set(entries.map(fileNameOf));
  return entries
    .filter((entry) => {
      const name = fileNameOf(entry);
      return (
        name.endsWith(DATABASE_EXTENSION) && names.has(`${name.slice(0, -DATABASE_EXTENSION.length)}${META_EXTENSION}`)
      );
    })
    .sort();
}

/** Creates `<root>/workspaces/<uuid>/` and returns the database path to create inside it. */
export async function sandboxWorkspacePath(
  fileSystem: FileSystemService,
  random: RandomService,
  label: string,
): Promise<string> {
  const root = await fileSystem.appDataDirectory();
  const directory = fileSystem.resolvePath(root, WORKSPACES_DIRECTORY, random.uuid());
  await fileSystem.createDirectory(directory);
  return fileSystem.resolvePath(directory, `${sanitizeLabel(label)}${DATABASE_EXTENSION}`);
}

export type ImportLocalWorkspaceInput = {
  readonly fileSystem: FileSystemService;
  readonly random: RandomService;
  /** The picked `.mfhdb`; its descriptor and journal segments are read from the same folder. */
  readonly sourceDatabasePath: string;
};

/**
 * Copies a workspace into the app sandbox and returns the ref to open it with. The copy is the
 * workspace from then on — it never refers back to the picked folder, so the original can be
 * moved or deleted. `.mfhmeta`'s `workspaceId` is informational only (nothing reads it), so it is
 * deliberately left untouched: the file stays byte-identical to what the other device wrote.
 */
export async function importLocalWorkspace(
  input: ImportLocalWorkspaceInput,
): Promise<Result<LocalWorkspaceRef, DomainError>> {
  const { fileSystem, random, sourceDatabasePath } = input;
  const source = workspacePathsFor(fileSystem, sourceDatabasePath);
  if (!(await fileSystem.fileInfo(source.database))) {
    return err(notFoundError('LocalWorkspace', sourceDatabasePath));
  }
  if (!(await fileSystem.fileInfo(source.meta))) {
    return err(integrityError(`workspace import: "${fileNameOf(source.meta)}" must sit next to the database`));
  }
  try {
    const databasePath = await sandboxWorkspacePath(fileSystem, random, source.baseName);
    const destination = workspacePathsFor(fileSystem, databasePath);
    if (await fileSystem.fileInfo(destination.database)) {
      return err(conflictError(`workspace import: a file already exists at "${databasePath}"`));
    }
    // The sandbox file is named after the sanitized label, which may differ from the source's
    // base name — every sibling is named after the base name, so each one follows the rename.
    for (const file of await listWorkspaceFiles(fileSystem, source)) {
      const renamed = `${destination.baseName}${fileNameOf(file).slice(source.baseName.length)}`;
      await copyFile(fileSystem, file, fileSystem.resolvePath(destination.directory, renamed));
    }
    return ok({ mode: 'local', id: databasePath, path: databasePath, label: workspaceLabelFromPath(databasePath) });
  } catch (error) {
    return err(storageError(`workspace import: ${String(error)}`));
  }
}
