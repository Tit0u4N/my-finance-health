// @repo/platform-expo — level 1.
// FileSystemService on expo-file-system's File/Directory API. Primitives only: naming, the
// workspace's logical tree, atomic writes and the export/import flow all live in @repo/data
// (principle 4: adapters are silent).
//
// The core does plain `/` string arithmetic on paths (dirname, basename, join), so every path this
// adapter hands out must survive that. Four kinds exist:
//   - sandbox paths, relative to the app's Documents directory — "MyFinanceHealth/workspaces/…".
//     Relative on purpose: the iOS container's absolute path changes across app updates and
//     reinstalls, so an absolute path remembered in the recent-workspaces list would go stale.
//   - `cloud:/…` paths, inside the system-synced app folder (iCloud Drive's, see
//     cloudContainer.ts). Plain files the app may open in place — SQLite included — resolved
//     against the folder's current location at every call. Reads first make sure the file is on
//     the device: iCloud may have evicted it, or another device may have written a newer version.
//   - `external:<n>/…` paths, rooted at a directory the user picked. A picked Android directory
//     is a SAF `content://` URI whose children cannot be built by appending "/name", and an iOS
//     one only grants access through the object the picker returned — so the picked Directory is
//     kept here under an opaque token and children are resolved by listing it.
//   - full `scheme://` URIs, passed through untouched (a picked file's own URI).

import type { FileInfo, FileSystemService } from '@repo/platform/services/fileSystem';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import {
  CLOUD_ROOT,
  type CloudContainer,
  cloudRelativePath,
  isCloudPath,
  nameBehindPlaceholder,
} from './cloudContainer';

const APP_DIRECTORY = 'MyFinanceHealth';
const EXTERNAL_PREFIX = 'external:';
const URI_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const OPAQUE_MIME_TYPE = 'application/octet-stream';

type ExternalPath = { readonly root: Directory; readonly segments: readonly string[] };

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

async function attempt<T>(read: () => Promise<T | null>): Promise<T | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

/** Runs `job` so that a synchronous throw reaches the caller as a rejection, like every other method of the contract. */
function run<T>(job: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve) => resolve(job()));
}

function parentOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

export type ExpoFileSystemOptions = {
  /** The synced app folder's native primitives. Absent, `cloud:` paths do not exist and
   * `syncedDirectory()` is null — Android, or an iOS build without the iCloud module. */
  readonly cloud?: CloudContainer;
};

export function createExpoFileSystem({ cloud }: ExpoFileSystemOptions = {}): FileSystemService {
  const externalRoots = new Map<string, Directory>();
  let externalCounter = 0;

  function parseExternal(path: string): ExternalPath | null {
    if (!path.startsWith(EXTERNAL_PREFIX)) {
      return null;
    }
    const [token = '', ...segments] = path.split('/');
    const root = externalRoots.get(token);
    if (!root) {
      throw new Error(`file system: "${token}" is not a folder picked in this session`);
    }
    return { root, segments };
  }

  function findChild(directory: Directory, name: string): File | Directory | undefined {
    return directory.list().find((entry) => entry.name === name);
  }

  function walkDirectories(root: Directory, segments: readonly string[], fullPath: string): Directory {
    let current = root;
    for (const segment of segments) {
      const next = findChild(current, segment);
      if (!(next instanceof Directory)) {
        throw new Error(`file system: no folder at "${fullPath}"`);
      }
      current = next;
    }
    return current;
  }

  async function cloudRoot(): Promise<Directory> {
    const uri = cloud ? await cloud.documentsDirectory() : null;
    if (uri === null) {
      throw new Error('file system: iCloud Drive is not available on this device right now');
    }
    return new Directory(uri);
  }

  /** The File object behind a sandbox, cloud or URI path — never an external one. */
  async function plainFile(path: string): Promise<File> {
    if (isCloudPath(path)) {
      return new File(await cloudRoot(), cloudRelativePath(path));
    }
    return URI_SCHEME.test(path) ? new File(path) : new File(Paths.document, path);
  }

  async function plainDirectory(path: string): Promise<Directory> {
    if (isCloudPath(path)) {
      const root = await cloudRoot();
      const relative = cloudRelativePath(path);
      return relative === '' ? root : new Directory(root, relative);
    }
    return URI_SCHEME.test(path) ? new Directory(path) : new Directory(Paths.document, path);
  }

  /** The existing file at `path`, or null — never creates anything. */
  async function findFile(path: string): Promise<File | null> {
    const external = parseExternal(path);
    if (!external) {
      const file = await plainFile(path);
      if (isCloudPath(path)) {
        await cloud?.ensureDownloaded(file.uri);
      }
      return file.exists ? file : null;
    }
    const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
    const entry = findChild(parent, nameOf(path));
    return entry instanceof File ? entry : null;
  }

  async function requireFile(path: string): Promise<File> {
    const file = await findFile(path);
    if (!file) {
      throw new Error(`file system: no file at "${path}"`);
    }
    return file;
  }

  /** A fresh, empty file at `path` (replacing any existing one) with its parent folders created. */
  async function createFreshFile(path: string): Promise<File> {
    const external = parseExternal(path);
    if (!external) {
      const file = await plainFile(path);
      file.create({ intermediates: true, overwrite: true });
      return file;
    }
    const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
    findChild(parent, nameOf(path))?.delete();
    return parent.createFile(nameOf(path), OPAQUE_MIME_TYPE);
  }

  function directoryAt(path: string): Promise<Directory> {
    const external = parseExternal(path);
    return external ? Promise.resolve(walkDirectories(external.root, external.segments, path)) : plainDirectory(path);
  }

  function isExternal(path: string): boolean {
    return path.startsWith(EXTERNAL_PREFIX);
  }

  return {
    readFile: (path) => run(async () => (await requireFile(path)).bytes()),

    writeFile: (path, data) =>
      run(async () => {
        (await createFreshFile(path)).write(data);
      }),

    appendFile: (path, data) =>
      run(async () => {
        const file = (await findFile(path)) ?? (await createFreshFile(path));
        const handle = file.open(FileMode.Append);
        try {
          handle.writeBytes(data);
        } finally {
          handle.close();
        }
      }),

    truncateFile: (path, length) =>
      run(async () => {
        const kept = (await (await requireFile(path)).bytes()).slice(0, length);
        (await createFreshFile(path)).write(kept);
      }),

    deleteFile: (path) =>
      run(async () => {
        (await findFile(path))?.delete();
      }),

    fileInfo: (path) =>
      run(async (): Promise<FileInfo | null> => {
        // A path whose parent folder is gone is "no such file", not an error — callers probe with this.
        const file = await attempt(() => findFile(path));
        return file ? { sizeBytes: file.size, modifiedAt: new Date(file.modificationTime ?? 0).toISOString() } : null;
      }),

    rename: (from, to) =>
      run(async () => {
        if (isExternal(from) || isExternal(to)) {
          // A picked folder can't be moved within natively — copy, then drop the source.
          (await createFreshFile(to)).write(await (await requireFile(from)).bytes());
          (await requireFile(from)).delete();
          return;
        }
        const source = await requireFile(from);
        const parent = parentOf(to);
        if (parent !== '' && !URI_SCHEME.test(to)) {
          (await plainDirectory(parent)).create({ intermediates: true, idempotent: true });
        }
        source.moveSync(await plainFile(to), { overwrite: true });
      }),

    createDirectory: (path) =>
      run(async () => {
        const external = parseExternal(path);
        if (!external) {
          (await plainDirectory(path)).create({ intermediates: true, idempotent: true });
          return;
        }
        const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
        if (!findChild(parent, nameOf(path))) {
          parent.createDirectory(nameOf(path));
        }
      }),

    listDirectory: (path) =>
      run(async () => {
        const names = (await directoryAt(path)).list().map((entry) => entry.name);
        // An evicted iCloud file is listed as its `.<name>.icloud` placeholder; the core only ever
        // knows it by its real name (reading it downloads it, see findFile).
        const visible = isCloudPath(path) ? [...new Set(names.map(nameBehindPlaceholder))] : names;
        return visible.map((name) => `${path}/${name}`);
      }),

    resolvePath: (...segments) => segments.join('/'),

    appDataDirectory: () =>
      run(async () => {
        (await plainDirectory(APP_DIRECTORY)).create({ intermediates: true, idempotent: true });
        return APP_DIRECTORY;
      }),

    syncedDirectory: async () => {
      if (!cloud) {
        return null;
      }
      try {
        return (await cloud.documentsDirectory()) === null ? null : CLOUD_ROOT;
      } catch {
        return null;
      }
    },

    pickFile: async () => {
      const picked = await File.pickFileAsync({ multipleFiles: false });
      return picked.canceled ? null : picked.result.uri;
    },

    pickDirectory: async () => {
      let directory: Directory;
      try {
        directory = await Directory.pickDirectoryAsync();
      } catch {
        // Dismissing the system picker rejects rather than resolving to null.
        return null;
      }
      externalCounter += 1;
      const token = `${EXTERNAL_PREFIX}${externalCounter}`;
      externalRoots.set(token, directory);
      return token;
    },

    // Mobile never designates a not-yet-existing file: a workspace is created at a path the core
    // chooses (workspaceTransfer.ts's `newWorkspacePath`), in the sandbox or the synced folder.
    pickSaveLocation: () => Promise.resolve(null),
  };
}
