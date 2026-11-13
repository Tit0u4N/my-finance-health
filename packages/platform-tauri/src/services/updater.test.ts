// @repo/platform-tauri — level 1.
// Verifies the plugin call shape and the graceful degradation of a failed check — the updater
// itself is exercised under a real Tauri runtime, not here (start-roadmap.md §13).

import { describe, expect, it, vi } from 'vitest';

const check = vi.fn();
const relaunch = vi.fn();

vi.mock('@tauri-apps/plugin-updater', () => ({ check: (...args: unknown[]) => check(...args) }));
vi.mock('@tauri-apps/plugin-process', () => ({ relaunch: (...args: unknown[]) => relaunch(...args) }));

const { createTauriUpdater } = await import('./updater');

describe('createTauriUpdater', () => {
  it('resolves null when the app is up to date', async () => {
    check.mockResolvedValueOnce(null);

    await expect(createTauriUpdater().check()).resolves.toBeNull();
  });

  it('resolves null when the check fails (offline, no release feed yet)', async () => {
    check.mockRejectedValueOnce(new Error('Could not fetch a valid release JSON from the remote'));

    await expect(createTauriUpdater().check()).resolves.toBeNull();
  });

  it('exposes the version and notes, and relaunches after installing', async () => {
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined);
    check.mockResolvedValueOnce({ version: '1.1.0', body: 'Fixes', downloadAndInstall });
    relaunch.mockResolvedValueOnce(undefined);

    const update = await createTauriUpdater().check();

    expect(update).toMatchObject({ version: '1.1.0', notes: 'Fixes' });
    await update?.install();
    expect(downloadAndInstall).toHaveBeenCalledOnce();
    expect(relaunch).toHaveBeenCalledOnce();
  });

  it('maps missing release notes to null', async () => {
    check.mockResolvedValueOnce({ version: '1.1.0', body: undefined, downloadAndInstall: vi.fn() });

    await expect(createTauriUpdater().check()).resolves.toMatchObject({ notes: null });
  });
});
