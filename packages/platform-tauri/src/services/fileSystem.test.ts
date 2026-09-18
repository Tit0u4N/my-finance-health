// @repo/platform-tauri — level 1.
// Verifies the plugin call shape and the runtime fs-scope grant behavior — the plugins
// themselves (tauri-plugin-fs, tauri-plugin-dialog) are exercised under a real Tauri runtime,
// not here (start-roadmap.md §13: no shared/adapter test starts Tauri).

import { describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
const readFile = vi.fn();
const writeFile = vi.fn();
const truncate = vi.fn();
const remove = vi.fn();
const stat = vi.fn();
const rename = vi.fn();
const mkdir = vi.fn();
const readDir = vi.fn();
const openDialog = vi.fn();
const saveDialog = vi.fn();
const appDataDir = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => invoke(...args) }));
vi.mock('@tauri-apps/api/path', () => ({ appDataDir: () => appDataDir() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: unknown[]) => openDialog(...args),
  save: (...args: unknown[]) => saveDialog(...args),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: (...args: unknown[]) => readFile(...args),
  writeFile: (...args: unknown[]) => writeFile(...args),
  truncate: (...args: unknown[]) => truncate(...args),
  remove: (...args: unknown[]) => remove(...args),
  stat: (...args: unknown[]) => stat(...args),
  rename: (...args: unknown[]) => rename(...args),
  mkdir: (...args: unknown[]) => mkdir(...args),
  readDir: (...args: unknown[]) => readDir(...args),
}));

const { createTauriFileSystem } = await import('./fileSystem');

describe('createTauriFileSystem', () => {
  it('grants the directory once before reading, then reuses the grant for a second read', async () => {
    invoke.mockResolvedValue(undefined);
    readFile.mockResolvedValue(new Uint8Array([1]));
    const fileSystem = createTauriFileSystem();

    await fileSystem.readFile('/workspace-a/w.mfhdb');
    await fileSystem.readFile('/workspace-a/w.mfhmeta');

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('allow_workspace_directory', { path: '/workspace-a' });
  });

  it('maps appendFile to writeFile with append:true', async () => {
    invoke.mockResolvedValue(undefined);
    writeFile.mockResolvedValue(undefined);
    const fileSystem = createTauriFileSystem();
    const data = new Uint8Array([1, 2, 3]);

    await fileSystem.appendFile('/workspace-b/w.mfhj', data);

    expect(writeFile).toHaveBeenCalledWith('/workspace-b/w.mfhj', data, { append: true });
  });

  it('fileInfo returns null when stat throws (missing file)', async () => {
    invoke.mockResolvedValue(undefined);
    stat.mockRejectedValueOnce(new Error('not found'));
    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.fileInfo('/workspace-c/missing.mfhdb')).resolves.toBeNull();
  });

  it('fileInfo maps size/mtime when stat succeeds', async () => {
    invoke.mockResolvedValue(undefined);
    stat.mockResolvedValueOnce({ size: 42, mtime: new Date('2026-01-01T00:00:00.000Z') });
    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.fileInfo('/workspace-d/w.mfhdb')).resolves.toEqual({
      sizeBytes: 42,
      modifiedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('listDirectory re-joins entry names into absolute paths', async () => {
    invoke.mockResolvedValue(undefined);
    readDir.mockResolvedValueOnce([{ name: 'a.mfhj', isFile: true, isDirectory: false, isSymlink: false }]);
    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.listDirectory('/workspace-e')).resolves.toEqual(['/workspace-e/a.mfhj']);
  });

  it('normalizes a backslash path returned by the picker', async () => {
    openDialog.mockResolvedValueOnce('C:\\Users\\me\\workspace.mfhdb');
    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.pickFile()).resolves.toBe('C:/Users/me/workspace.mfhdb');
  });

  it('pickFile returns null when the user cancels', async () => {
    openDialog.mockResolvedValueOnce(null);
    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.pickFile()).resolves.toBeNull();
  });

  it('appDataDirectory normalizes the resolved path', async () => {
    appDataDir.mockResolvedValueOnce('C:\\Users\\me\\AppData');

    const fileSystem = createTauriFileSystem();

    await expect(fileSystem.appDataDirectory()).resolves.toBe('C:/Users/me/AppData');
  });
});
