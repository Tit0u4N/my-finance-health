import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { readWorkspaceMeta, WORKSPACE_META_SUITE, writeWorkspaceMeta } from './workspaceMeta';

function fileSystem() {
  const platform = createFakePlatform();
  if (!platform.fileSystem) {
    throw new Error('fake platform did not expose a file system despite the default capability');
  }
  return platform.fileSystem;
}

const META = {
  v: 1 as const,
  workspaceId: 'ws-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  dbSalt: 'ZGItc2FsdC0xNmJ5dGVzIQ==',
  journalSalt: 'am91cm5hbC1zYWx0LTE2Yg==',
  kdf: { memoryKiB: 65536, iterations: 3, parallelism: 1 },
  suite: WORKSPACE_META_SUITE,
};

describe('workspaceMeta', () => {
  it('round-trips through write and read', async () => {
    const fs = fileSystem();
    await writeWorkspaceMeta(fs, '/ws/finances.mfhmeta', META);
    expect(await readWorkspaceMeta(fs, '/ws/finances.mfhmeta')).toEqual(META);
  });

  it('writes via a temp-file-then-rename swap, leaving no temp file behind', async () => {
    const fs = fileSystem();
    await writeWorkspaceMeta(fs, '/ws/finances.mfhmeta', META);
    expect(await fs.fileInfo('/ws/finances.mfhmeta.tmp')).toBeNull();
    expect(await fs.fileInfo('/ws/finances.mfhmeta')).not.toBeNull();
  });

  it('returns null when the descriptor does not exist', async () => {
    expect(await readWorkspaceMeta(fileSystem(), '/ws/missing.mfhmeta')).toBeNull();
  });

  it('returns null for a corrupt descriptor rather than throwing', async () => {
    const fs = fileSystem();
    await fs.writeFile('/ws/finances.mfhmeta', new TextEncoder().encode('{"not":"a valid descriptor"}'));
    expect(await readWorkspaceMeta(fs, '/ws/finances.mfhmeta')).toBeNull();
  });
});
