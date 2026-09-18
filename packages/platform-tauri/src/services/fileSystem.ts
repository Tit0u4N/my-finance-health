// @repo/platform-tauri — level 1.
// FileSystemService implemented on tauri-plugin-fs (read/write/stat primitives) and
// tauri-plugin-dialog (open/save pickers) — no custom Rust here, since these primitives have no
// SQLCipher-shaped gap the official plugins can't fill; custom Rust is reserved for the
// SQLCipher driver alone (start-roadmap.md §9, see services/sqlDriver.ts). A user-picked path may
// fall outside the static capabilities file's fs scope, so every method grants its directory at
// runtime first — that grant is per-process, never persisted, and is re-issued on every launch.

import type { FileInfo, FilePickerOptions, FileSystemService } from '@repo/platform/services/fileSystem';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import * as fs from '@tauri-apps/plugin-fs';

// Win32 accepts forward slashes, so every path this adapter produces is normalized to `/` —
// packages/data/src/local/workspacePaths.ts is deliberately `/`-only and never changes for this.
function normalize(path: string): string {
  return path.replace(/\\/g, '/');
}

function directoryOf(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash === -1 ? path : path.slice(0, lastSlash);
}

const grantedDirectories = new Set<string>();

async function ensureGranted(path: string): Promise<void> {
  const directory = directoryOf(path);
  if (grantedDirectories.has(directory)) {
    return;
  }
  await invoke('allow_workspace_directory', { path: directory });
  grantedDirectories.add(directory);
}

function filtersFor(extensions: FilePickerOptions['extensions']): { name: string; extensions: string[] }[] | undefined {
  return extensions && extensions.length > 0 ? [{ name: 'Workspace', extensions: [...extensions] }] : undefined;
}

export function createTauriFileSystem(): FileSystemService {
  return {
    readFile: async (path) => {
      await ensureGranted(path);
      return fs.readFile(path);
    },

    writeFile: async (path, data) => {
      await ensureGranted(path);
      await fs.writeFile(path, data);
    },

    appendFile: async (path, data) => {
      await ensureGranted(path);
      await fs.writeFile(path, data, { append: true });
    },

    truncateFile: async (path, length) => {
      await ensureGranted(path);
      await fs.truncate(path, length);
    },

    deleteFile: async (path) => {
      await ensureGranted(path);
      await fs.remove(path);
    },

    fileInfo: async (path): Promise<FileInfo | null> => {
      await ensureGranted(path);
      try {
        const info = await fs.stat(path);
        return { sizeBytes: info.size, modifiedAt: (info.mtime ?? new Date(0)).toISOString() };
      } catch {
        return null;
      }
    },

    rename: async (from, to) => {
      await ensureGranted(from);
      await ensureGranted(to);
      await fs.rename(from, to);
    },

    createDirectory: async (path) => {
      await ensureGranted(path);
      await fs.mkdir(path, { recursive: true });
    },

    listDirectory: async (path) => {
      await ensureGranted(path);
      const entries = await fs.readDir(path);
      return entries.map((entry) => `${path}/${entry.name}`);
    },

    resolvePath: (...segments) => segments.join('/'),

    appDataDirectory: async () => normalize(await appDataDir()),

    pickFile: async (options) => {
      const filters = filtersFor(options?.extensions);
      const selection = await openDialog({ multiple: false, directory: false, ...(filters ? { filters } : {}) });
      const path = typeof selection === 'string' ? selection : null;
      return path ? normalize(path) : null;
    },

    pickSaveLocation: async (options) => {
      const filters = filtersFor(options?.extensions);
      const selection = await saveDialog({
        ...(options?.suggestedName ? { defaultPath: options.suggestedName } : {}),
        ...(filters ? { filters } : {}),
      });
      return selection ? normalize(selection) : null;
    },
  };
}
