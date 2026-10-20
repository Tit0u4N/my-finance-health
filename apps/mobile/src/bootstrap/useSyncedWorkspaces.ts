// ViewModel helper for BootstrapScreen: the workspaces sitting in the system-synced app folder
// (iCloud Drive's), found by scanning it (`findWorkspaceFolders`) rather than remembered — a
// workspace another device created there has never been in this device's recent list. Opened in
// place like any recent workspace. Empty while the folder is unavailable.

import { workspaceLabelFromPath } from '@repo/data/local/workspacePaths';
import type { WorkspaceRef } from '@repo/data/workspace/workspaceRef';
import { findWorkspaceFolders } from '@repo/data/workspace/workspaceTransfer';
import type { Platform } from '@repo/platform/platform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { useEffect, useState } from 'react';

/** Scans the synced folder; never throws — an unreadable folder just shows nothing. */
export async function loadSyncedWorkspaces(fileSystem: FileSystemService): Promise<readonly WorkspaceRef[]> {
  try {
    const root = await fileSystem.syncedDirectory();
    if (root === null) {
      return [];
    }
    const paths = await findWorkspaceFolders(fileSystem, root);
    return paths.map((path) => ({ mode: 'local', id: path, path, label: workspaceLabelFromPath(path) }));
  } catch {
    return [];
  }
}

/** Rescans every time `isVisible` turns true, so returning to the picker shows what synced meanwhile. */
export function useSyncedWorkspaces(platform: Platform, isVisible: boolean): readonly WorkspaceRef[] {
  const [workspaces, setWorkspaces] = useState<readonly WorkspaceRef[]>([]);

  useEffect(() => {
    if (!(isVisible && platform.fileSystem)) {
      return;
    }
    let isCurrent = true;
    loadSyncedWorkspaces(platform.fileSystem)
      .then((found) => {
        if (isCurrent) {
          setWorkspaces(found);
        }
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [platform, isVisible]);

  return workspaces;
}
