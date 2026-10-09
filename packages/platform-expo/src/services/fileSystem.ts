// @repo/platform-expo — level 1.
// FileSystemService on expo-file-system's File/Directory API. Primitives only: naming, the
// workspace's logical tree, atomic writes and the export/import flow all live in @repo/data
// (principle 4: adapters are silent).
//
// The core does plain `/` string arithmetic on paths (dirname, basename, join), so every path this
// adapter hands out must survive that. Three kinds exist:
//   - sandbox paths, relative to the app's Documents directory — "MyFinanceHealth/workspaces/…".
//     Relative on purpose: the iOS container's absolute path changes across app updates and
//     reinstalls, so an absolute path remembered in the recent-workspaces list would go stale.
//   - `external:<n>/…` paths, rooted at a directory the user picked. A picked Android directory
//     is a SAF `content://` URI whose children cannot be built by appending "/name", and an iOS
//     one only grants access through the object the picker returned — so the picked Directory is
//     kept here under an opaque token and children are resolved by listing it.
//   - full `scheme://` URIs, passed through untouched (a picked file's own URI).

import type { FileInfo, FileSystemService } from '@repo/platform/services/fileSystem';
import { Directory, File, FileMode, Paths } from 'expo-file-system';

const APP_DIRECTORY = 'MyFinanceHealth';
const EXTERNAL_PREFIX = 'external:';
const URI_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const OPAQUE_MIME_TYPE = 'application/octet-stream';

type ExternalPath = { readonly root: Directory; readonly segments: readonly string[] };

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

function attempt<T>(read: () => T | null): T | null {
  try {
    return read();
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

export function createExpoFileSystem(): FileSystemService {
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

  function sandboxFile(path: string): File {
    return URI_SCHEME.test(path) ? new File(path) : new File(Paths.document, path);
  }

  function sandboxDirectory(path: string): Directory {
    return URI_SCHEME.test(path) ? new Directory(path) : new Directory(Paths.document, path);
  }

  /** The existing file at `path`, or null — never creates anything. */
  function findFile(path: string): File | null {
    const external = parseExternal(path);
    if (!external) {
      const file = sandboxFile(path);
      return file.exists ? file : null;
    }
    const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
    const entry = findChild(parent, nameOf(path));
    return entry instanceof File ? entry : null;
  }

  function requireFile(path: string): File {
    const file = findFile(path);
    if (!file) {
      throw new Error(`file system: no file at "${path}"`);
    }
    return file;
  }

  /** A fresh, empty file at `path` (replacing any existing one) with its parent folders created. */
  function createFreshFile(path: string): File {
    const external = parseExternal(path);
    if (!external) {
      const file = sandboxFile(path);
      file.create({ intermediates: true, overwrite: true });
      return file;
    }
    const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
    findChild(parent, nameOf(path))?.delete();
    return parent.createFile(nameOf(path), OPAQUE_MIME_TYPE);
  }

  function directoryAt(path: string): Directory {
    const external = parseExternal(path);
    return external ? walkDirectories(external.root, external.segments, path) : sandboxDirectory(path);
  }

  function isExternal(path: string): boolean {
    return path.startsWith(EXTERNAL_PREFIX);
  }

  return {
    readFile: (path) => run(() => requireFile(path).bytes()),

    writeFile: (path, data) =>
      run(() => {
        createFreshFile(path).write(data);
      }),

    appendFile: (path, data) =>
      run(() => {
        const file = findFile(path) ?? createFreshFile(path);
        const handle = file.open(FileMode.Append);
        try {
          handle.writeBytes(data);
        } finally {
          handle.close();
        }
      }),

    truncateFile: (path, length) =>
      run(async () => {
        const kept = (await requireFile(path).bytes()).slice(0, length);
        createFreshFile(path).write(kept);
      }),

    deleteFile: (path) =>
      run(() => {
        findFile(path)?.delete();
      }),

    fileInfo: (path) =>
      run((): FileInfo | null => {
        // A path whose parent folder is gone is "no such file", not an error — callers probe with this.
        const file = attempt(() => findFile(path));
        return file ? { sizeBytes: file.size, modifiedAt: new Date(file.modificationTime ?? 0).toISOString() } : null;
      }),

    rename: (from, to) =>
      run(async () => {
        if (isExternal(from) || isExternal(to)) {
          // A picked folder can't be moved within natively — copy, then drop the source.
          createFreshFile(to).write(await requireFile(from).bytes());
          requireFile(from).delete();
          return;
        }
        const source = requireFile(from);
        const parent = parentOf(to);
        if (parent !== '' && !URI_SCHEME.test(to)) {
          sandboxDirectory(parent).create({ intermediates: true, idempotent: true });
        }
        source.moveSync(sandboxFile(to), { overwrite: true });
      }),

    createDirectory: (path) =>
      run(() => {
        const external = parseExternal(path);
        if (!external) {
          sandboxDirectory(path).create({ intermediates: true, idempotent: true });
          return;
        }
        const parent = walkDirectories(external.root, external.segments.slice(0, -1), path);
        if (!findChild(parent, nameOf(path))) {
          parent.createDirectory(nameOf(path));
        }
      }),

    listDirectory: (path) =>
      run(() =>
        directoryAt(path)
          .list()
          .map((entry) => `${path}/${entry.name}`),
      ),

    resolvePath: (...segments) => segments.join('/'),

    appDataDirectory: () =>
      run(() => {
        sandboxDirectory(APP_DIRECTORY).create({ intermediates: true, idempotent: true });
        return APP_DIRECTORY;
      }),

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

    // Mobile never designates a not-yet-existing file: a workspace is created in the sandbox at a
    // path the core chooses (workspaceTransfer.ts's `sandboxWorkspacePath`).
    pickSaveLocation: () => Promise.resolve(null),
  };
}
