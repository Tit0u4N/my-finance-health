// @repo/data — level 1.
// Byte-level behaviour only: the test SQL driver keeps its data in a registry keyed by path, not
// in the file system, so a copied `.mfhdb` carries no rows here — the real encrypted round-trip is
// the platform adapter's concern. What the core owns, and what is checked here, is which files
// move, where they land, and what is refused.

import { isErr, isOk } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { workspacePathsFor } from '../local/workspacePaths';
import {
  exportLocalWorkspace,
  findImportableWorkspaces,
  findWorkspaceFolders,
  importLocalWorkspace,
  listWorkspaceFiles,
  newWorkspacePath,
} from './workspaceTransfer';

function setup() {
  const platform = createFakePlatform();
  const fileSystem = platform.fileSystem as NonNullable<typeof platform.fileSystem>;
  return { platform, fileSystem };
}

async function seedWorkspace(fileSystem: ReturnType<typeof setup>['fileSystem'], directory: string, base = 'Home') {
  await fileSystem.writeFile(`${directory}/${base}.mfhdb`, new Uint8Array([1, 2, 3]));
  await fileSystem.writeFile(`${directory}/${base}.mfhmeta`, new Uint8Array([4]));
  await fileSystem.writeFile(`${directory}/${base}.dev1.000000.mfhj`, new Uint8Array([5]));
  await fileSystem.writeFile(`${directory}/${base}.dev1.000001.mfhj`, new Uint8Array([6]));
  await fileSystem.writeFile(`${directory}/${base}.mfhlock`, new Uint8Array([7]));
}

describe('listWorkspaceFiles', () => {
  it('lists database, descriptor and segments — never the lock, never another workspace', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/src');
    await seedWorkspace(fileSystem, '/src', 'Other');

    const files = await listWorkspaceFiles(fileSystem, workspacePathsFor(fileSystem, '/src/Home.mfhdb'));

    expect(files).toEqual([
      '/src/Home.mfhdb',
      '/src/Home.mfhmeta',
      '/src/Home.dev1.000000.mfhj',
      '/src/Home.dev1.000001.mfhj',
    ]);
  });
});

describe('exportLocalWorkspace', () => {
  it('copies every workspace file into a dated subfolder of the picked directory', async () => {
    const { platform, fileSystem } = setup();
    await seedWorkspace(fileSystem, '/src');

    const result = await exportLocalWorkspace({
      fileSystem,
      clock: platform.clock,
      databasePath: '/src/Home.mfhdb',
      targetDirectory: '/icloud',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.fileCount).toBe(4);
      expect(result.value.directory).toMatch(/^\/icloud\/Home \d{4}-\d{2}-\d{2} \d{4}$/);
      expect(await fileSystem.readFile(result.value.databasePath)).toEqual(new Uint8Array([1, 2, 3]));
      expect(await fileSystem.fileInfo(`${result.value.directory}/Home.mfhlock`)).toBeNull();
    }
  });

  it('reports a storage error when the source cannot be read', async () => {
    const { platform, fileSystem } = setup();

    const result = await exportLocalWorkspace({
      fileSystem,
      clock: platform.clock,
      databasePath: '/missing/Home.mfhdb',
      targetDirectory: '/icloud',
    });

    expect(isErr(result) && result.error.kind).toBe('storage');
  });
});

describe('findImportableWorkspaces', () => {
  it('returns only databases that have a descriptor next to them', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/picked');
    await fileSystem.writeFile('/picked/Orphan.mfhdb', new Uint8Array([9]));

    expect(await findImportableWorkspaces(fileSystem, '/picked')).toEqual(['/picked/Home.mfhdb']);
  });
});

describe('importLocalWorkspace', () => {
  it('copies the workspace into the sandbox and returns a ref pointing at the copy', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/picked');

    const result = await importLocalWorkspace({
      fileSystem,
      sourceDatabasePath: '/picked/Home.mfhdb',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.path.startsWith('/app-data/workspaces/')).toBe(true);
      expect(result.value.id).toBe(result.value.path);
      expect(result.value.label).toBe('Home');
      expect(await fileSystem.readFile(result.value.path)).toEqual(new Uint8Array([1, 2, 3]));
      const copied = await listWorkspaceFiles(fileSystem, workspacePathsFor(fileSystem, result.value.path));
      expect(copied).toHaveLength(4);
    }
  });

  it('renames siblings along with the database when the label has to be sanitized', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/picked', 'My: budget?');

    const result = await importLocalWorkspace({
      fileSystem,
      sourceDatabasePath: '/picked/My: budget?.mfhdb',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.path.endsWith('/My budget.mfhdb')).toBe(true);
      const copied = await listWorkspaceFiles(fileSystem, workspacePathsFor(fileSystem, result.value.path));
      expect(copied.map((file) => file.slice(file.lastIndexOf('/') + 1))).toEqual([
        'My budget.mfhdb',
        'My budget.mfhmeta',
        'My budget.dev1.000000.mfhj',
        'My budget.dev1.000001.mfhj',
      ]);
    }
  });

  it('refuses a database whose descriptor is missing', async () => {
    const { fileSystem } = setup();
    await fileSystem.writeFile('/picked/Home.mfhdb', new Uint8Array([1]));

    const result = await importLocalWorkspace({
      fileSystem,
      sourceDatabasePath: '/picked/Home.mfhdb',
    });

    expect(isErr(result) && result.error.kind).toBe('integrity');
  });

  it('reports not-found for a database that does not exist', async () => {
    const { fileSystem } = setup();

    const result = await importLocalWorkspace({
      fileSystem,
      sourceDatabasePath: '/picked/Nope.mfhdb',
    });

    expect(isErr(result) && result.error.kind).toBe('not-found');
  });
});

describe('newWorkspacePath', () => {
  it('gives each workspace a folder named like it, holding a database named like it', async () => {
    const { fileSystem } = setup();

    expect(await newWorkspacePath(fileSystem, 'cloud:', 'Home')).toBe('cloud:/Home/Home.mfhdb');
  });

  it('suffixes the name when that folder already holds a workspace', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/root/Home');
    await seedWorkspace(fileSystem, '/root/Home 2', 'Home 2');

    expect(await newWorkspacePath(fileSystem, '/root', 'Home')).toBe('/root/Home 3/Home 3.mfhdb');
  });

  it('falls back to a default name when the label has no usable characters', async () => {
    const { fileSystem } = setup();

    expect(await newWorkspacePath(fileSystem, '/root', '???')).toBe('/root/workspace/workspace.mfhdb');
  });
});

describe('findWorkspaceFolders', () => {
  it('finds the workspaces one folder below the root, whichever device created them', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, 'cloud:/Home');
    await seedWorkspace(fileSystem, 'cloud:/Home 2026-10-07 1200');
    await fileSystem.writeFile('cloud:/Loose/Orphan.mfhdb', new Uint8Array([9]));
    await fileSystem.writeFile('cloud:/notes.txt', new Uint8Array([1]));

    expect(await findWorkspaceFolders(fileSystem, 'cloud:')).toEqual([
      'cloud:/Home 2026-10-07 1200/Home.mfhdb',
      'cloud:/Home/Home.mfhdb',
    ]);
  });

  it('skips entries it cannot list instead of failing', async () => {
    const { fileSystem } = setup();
    await seedWorkspace(fileSystem, '/root/Home');
    const listDirectory = fileSystem.listDirectory;
    const flaky = {
      ...fileSystem,
      listDirectory: (path: string) =>
        path === '/root'
          ? Promise.resolve(['/root/Broken', '/root/Home'])
          : path === '/root/Broken'
            ? Promise.reject(new Error('evicted'))
            : listDirectory(path),
    };

    expect(await findWorkspaceFolders(flaky, '/root')).toEqual(['/root/Home/Home.mfhdb']);
  });
});
