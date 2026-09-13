// @repo/data — level 1.
// Derives every sibling path a local workspace needs from the single user-designated database
// path (start-roadmap.md §9). Pure string arithmetic over FileSystemService.resolvePath — no I/O
// here, so it is unit-testable and reused by the opener, the journal, and the occupancy lock.

import type { FileSystemService } from '@repo/platform/services/fileSystem';

const DATABASE_EXTENSION = '.mfhdb';
const META_EXTENSION = '.mfhmeta';
const LOCK_EXTENSION = '.mfhlock';
const JOURNAL_EXTENSION = '.mfhj';
const SEGMENT_INDEX_DIGITS = 6;

export type WorkspacePaths = {
  readonly database: string;
  readonly directory: string;
  readonly meta: string;
  readonly lock: string;
  readonly baseName: string;
  segment(deviceId: string, index: number): string;
};

function directoryOf(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash === -1 ? '.' : path.slice(0, lastSlash);
}

function baseNameOf(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  const fileName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  return fileName.endsWith(DATABASE_EXTENSION) ? fileName.slice(0, -DATABASE_EXTENSION.length) : fileName;
}

/** Basename minus the `.mfhdb` extension — the workspace's display label in the recent-workspaces list. */
export function workspaceLabelFromPath(databasePath: string): string {
  return baseNameOf(databasePath);
}

export function workspacePathsFor(fileSystem: FileSystemService, databasePath: string): WorkspacePaths {
  const directory = directoryOf(databasePath);
  const baseName = baseNameOf(databasePath);

  return {
    database: databasePath,
    directory,
    meta: fileSystem.resolvePath(directory, `${baseName}${META_EXTENSION}`),
    lock: fileSystem.resolvePath(directory, `${baseName}${LOCK_EXTENSION}`),
    baseName,
    segment: (deviceId, index) =>
      fileSystem.resolvePath(
        directory,
        `${baseName}.${deviceId}.${String(index).padStart(SEGMENT_INDEX_DIGITS, '0')}${JOURNAL_EXTENSION}`,
      ),
  };
}
