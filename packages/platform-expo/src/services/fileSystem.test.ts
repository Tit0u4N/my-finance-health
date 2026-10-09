// Runs the adapter against a small in-memory stand-in for expo-file-system's File/Directory
// objects. What is under test is this adapter's own logic: the three path kinds, creating parents
// on write, overwrite-on-rename, and resolving picked-folder children by listing.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const DOCUMENTS = 'file:///documents/';

const store = vi.hoisted(() => ({
  files: new Map<string, Uint8Array>(),
  directories: new Set<string>(),
  picked: null as string | null,
  pickedFile: null as string | null,
}));

function join(...parts: unknown[]): string {
  const uris = parts.map((part) => (typeof part === 'string' ? part : (part as { uri: string }).uri));
  return uris.reduce((acc, next) => `${acc.replace(/\/$/, '')}/${next.replace(/^\//, '')}`);
}

vi.mock('expo-file-system', () => {
  class FakeFile {
    readonly uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(...parts);
    }
    get name() {
      return this.uri.slice(this.uri.lastIndexOf('/') + 1);
    }
    get exists() {
      return store.files.has(this.uri);
    }
    get size() {
      return store.files.get(this.uri)?.byteLength ?? 0;
    }
    get modificationTime() {
      return 1_700_000_000_000;
    }
    create(options?: { intermediates?: boolean; overwrite?: boolean }) {
      const parent = this.uri.slice(0, this.uri.lastIndexOf('/'));
      if (!(options?.intermediates || store.directories.has(parent))) {
        throw new Error(`no parent folder ${parent}`);
      }
      if (store.files.has(this.uri) && !options?.overwrite) {
        throw new Error('exists');
      }
      store.files.set(this.uri, new Uint8Array());
    }
    write(data: Uint8Array) {
      store.files.set(this.uri, data);
    }
    bytes() {
      const data = store.files.get(this.uri);
      return data ? Promise.resolve(data) : Promise.reject(new Error('missing'));
    }
    delete() {
      store.files.delete(this.uri);
    }
    moveSync(destination: FakeFile, options?: { overwrite?: boolean }) {
      if (store.files.has(destination.uri) && !options?.overwrite) {
        throw new Error('exists');
      }
      store.files.set(destination.uri, store.files.get(this.uri) as Uint8Array);
      store.files.delete(this.uri);
    }
    open() {
      const uri = this.uri;
      return {
        writeBytes: (bytes: Uint8Array) => {
          const existing = store.files.get(uri) ?? new Uint8Array();
          store.files.set(uri, new Uint8Array([...existing, ...bytes]));
        },
        close: () => undefined,
      };
    }
    static pickFileAsync() {
      return Promise.resolve(
        store.pickedFile
          ? { canceled: false, result: new FakeFile(store.pickedFile) }
          : { canceled: true, result: null },
      );
    }
  }

  class FakeDirectory {
    readonly uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(...parts);
    }
    get name() {
      return this.uri.slice(this.uri.lastIndexOf('/') + 1);
    }
    create() {
      store.directories.add(this.uri);
    }
    list() {
      const prefix = `${this.uri}/`;
      const children: (FakeFile | FakeDirectory)[] = [];
      for (const uri of store.files.keys()) {
        if (uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/')) {
          children.push(new FakeFile(uri));
        }
      }
      for (const uri of store.directories) {
        if (uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/')) {
          children.push(new FakeDirectory(uri));
        }
      }
      return children;
    }
    createFile(name: string) {
      const file = new FakeFile(this.uri, name);
      store.files.set(file.uri, new Uint8Array());
      return file;
    }
    createDirectory(name: string) {
      const directory = new FakeDirectory(this.uri, name);
      store.directories.add(directory.uri);
      return directory;
    }
    static pickDirectoryAsync() {
      return store.picked ? Promise.resolve(new FakeDirectory(store.picked)) : Promise.reject(new Error('cancelled'));
    }
  }

  return {
    File: FakeFile,
    Directory: FakeDirectory,
    FileMode: { Append: 'wa' },
    Paths: { document: new FakeDirectory('file:///documents/') },
  };
});

const { createExpoFileSystem } = await import('./fileSystem');

const bytes = (...values: number[]) => new Uint8Array(values);

beforeEach(() => {
  store.files.clear();
  store.directories.clear();
  store.picked = null;
  store.pickedFile = null;
});

describe('sandbox paths', () => {
  it('lives under a MyFinanceHealth folder inside Documents, created on demand', async () => {
    const fs = createExpoFileSystem();

    const root = await fs.appDataDirectory();

    expect(root).toBe('MyFinanceHealth');
    expect(store.directories.has(`${DOCUMENTS}MyFinanceHealth`)).toBe(true);
  });

  it('creates missing parent folders when writing, then reads the bytes back', async () => {
    const fs = createExpoFileSystem();

    await fs.writeFile('MyFinanceHealth/workspaces/a/Home.mfhmeta', bytes(1, 2));

    expect(await fs.readFile('MyFinanceHealth/workspaces/a/Home.mfhmeta')).toEqual(bytes(1, 2));
  });

  it('replaces the previous content on write instead of keeping a longer tail', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/f', bytes(1, 2, 3, 4));

    await fs.writeFile('d/f', bytes(9));

    expect(await fs.readFile('d/f')).toEqual(bytes(9));
  });

  it('appends without rewriting, creating the file when absent', async () => {
    const fs = createExpoFileSystem();

    await fs.appendFile('d/j', bytes(1));
    await fs.appendFile('d/j', bytes(2, 3));

    expect(await fs.readFile('d/j')).toEqual(bytes(1, 2, 3));
  });

  it('truncates to the requested length', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/j', bytes(1, 2, 3, 4));

    await fs.truncateFile('d/j', 2);

    expect(await fs.readFile('d/j')).toEqual(bytes(1, 2));
  });

  it('reports size and modification time, and null for a missing file', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/f', bytes(1, 2, 3));

    expect(await fs.fileInfo('d/f')).toEqual({ sizeBytes: 3, modifiedAt: '2023-11-14T22:13:20.000Z' });
    expect(await fs.fileInfo('d/nope')).toBeNull();
  });

  it('rename replaces an existing target — the core relies on it for atomic writes', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/meta', bytes(1));
    await fs.writeFile('d/meta.tmp', bytes(2));

    await fs.rename('d/meta.tmp', 'd/meta');

    expect(await fs.readFile('d/meta')).toEqual(bytes(2));
    expect(await fs.fileInfo('d/meta.tmp')).toBeNull();
  });

  it('deletes a file, and ignores one that is already gone', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/f', bytes(1));

    await fs.deleteFile('d/f');
    await fs.deleteFile('d/f');

    expect(await fs.fileInfo('d/f')).toBeNull();
  });

  it('lists direct children as paths in the same space', async () => {
    const fs = createExpoFileSystem();
    await fs.writeFile('d/a', bytes(1));
    await fs.writeFile('d/b', bytes(1));
    await fs.writeFile('d/sub/c', bytes(1));

    expect([...(await fs.listDirectory('d'))].sort()).toEqual(['d/a', 'd/b']);
  });

  it('never designates a save location — mobile creates workspaces in the sandbox', async () => {
    expect(await createExpoFileSystem().pickSaveLocation()).toBeNull();
  });
});

describe('picked folders', () => {
  async function pickedFolder() {
    store.picked = 'content://provider/tree/icloud';
    const fs = createExpoFileSystem();
    const token = await fs.pickDirectory();
    if (!token) {
      throw new Error('expected a folder');
    }
    return { fs, token };
  }

  it('hands back an opaque token, never the raw URI, so "/" arithmetic stays valid', async () => {
    const { token } = await pickedFolder();

    expect(token).toBe('external:1');
  });

  it('returns null when the user dismisses the picker', async () => {
    expect(await createExpoFileSystem().pickDirectory()).toBeNull();
  });

  it('creates a subfolder, writes into it and reads back through the token', async () => {
    const { fs, token } = await pickedFolder();

    await fs.createDirectory(`${token}/Home 2026-10-07 1200`);
    await fs.writeFile(`${token}/Home 2026-10-07 1200/Home.mfhdb`, bytes(7, 8));

    expect(await fs.readFile(`${token}/Home 2026-10-07 1200/Home.mfhdb`)).toEqual(bytes(7, 8));
    expect(await fs.listDirectory(`${token}/Home 2026-10-07 1200`)).toEqual([
      `${token}/Home 2026-10-07 1200/Home.mfhdb`,
    ]);
  });

  it('overwrites an existing picked-folder file by replacing it', async () => {
    const { fs, token } = await pickedFolder();
    await fs.writeFile(`${token}/f`, bytes(1, 2, 3));

    await fs.writeFile(`${token}/f`, bytes(4));

    expect(await fs.readFile(`${token}/f`)).toEqual(bytes(4));
  });

  it('reports a missing file under a picked folder as absent, and a stale token as an error', async () => {
    const { fs, token } = await pickedFolder();

    expect(await fs.fileInfo(`${token}/nope`)).toBeNull();
    await expect(fs.readFile('external:99/x')).rejects.toThrow(/not a folder picked/);
  });

  it('copies across the sandbox boundary on rename, since a picked folder cannot be moved within', async () => {
    const { fs, token } = await pickedFolder();
    await fs.writeFile('d/f', bytes(5));

    await fs.rename('d/f', `${token}/f`);

    expect(await fs.readFile(`${token}/f`)).toEqual(bytes(5));
    expect(await fs.fileInfo('d/f')).toBeNull();
  });
});

describe('pickFile', () => {
  it('resolves the picked file URI, or null when cancelled', async () => {
    const fs = createExpoFileSystem();
    expect(await fs.pickFile()).toBeNull();

    store.pickedFile = 'file:///tmp/Home.mfhdb';
    expect(await fs.pickFile()).toBe('file:///tmp/Home.mfhdb');
  });
});
