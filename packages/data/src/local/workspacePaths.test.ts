import { createFakePlatform } from '@repo/platform/fakePlatform';
import { describe, expect, it } from 'vitest';
import { workspaceLabelFromPath, workspacePathsFor } from './workspacePaths';

function fileSystem() {
  const platform = createFakePlatform();
  if (!platform.fileSystem) {
    throw new Error('fake platform did not expose a file system despite the default capability');
  }
  return platform.fileSystem;
}

describe('workspacePathsFor', () => {
  it('derives sibling paths from the database path', () => {
    const paths = workspacePathsFor(fileSystem(), '/Users/alex/Documents/finances.mfhdb');

    expect(paths.database).toBe('/Users/alex/Documents/finances.mfhdb');
    expect(paths.directory).toBe('/Users/alex/Documents');
    expect(paths.baseName).toBe('finances');
    expect(paths.meta).toBe('/Users/alex/Documents/finances.mfhmeta');
    expect(paths.lock).toBe('/Users/alex/Documents/finances.mfhlock');
  });

  it('names journal segments with the device id and a zero-padded index', () => {
    const paths = workspacePathsFor(fileSystem(), '/Users/alex/Documents/finances.mfhdb');

    expect(paths.segment('d7f3a1c2b9e04f18', 0)).toBe('/Users/alex/Documents/finances.d7f3a1c2b9e04f18.000000.mfhj');
    expect(paths.segment('d7f3a1c2b9e04f18', 12)).toBe('/Users/alex/Documents/finances.d7f3a1c2b9e04f18.000012.mfhj');
  });

  it('handles a database path with no directory component', () => {
    const paths = workspacePathsFor(fileSystem(), 'finances.mfhdb');
    expect(paths.directory).toBe('.');
    expect(paths.baseName).toBe('finances');
  });
});

describe('workspaceLabelFromPath', () => {
  it('strips the directory and the .mfhdb extension', () => {
    expect(workspaceLabelFromPath('/Users/alex/Documents/finances.mfhdb')).toBe('finances');
  });
});
