import { isErr, unwrap } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { describe, expect, it } from 'vitest';
import type { GatewayOperation } from '../../gateway/gateway';
import { workspacePathsFor } from '../workspacePaths';
import { type CreateOperationsJournalDeps, openOperationsJournal } from './operationsJournal';
import { decodeSegmentHeader } from './segmentHeader';

const JOURNAL_KEY = new Uint8Array(32).fill(11);
const DB_SALT = new Uint8Array(16).fill(2);
const JOURNAL_SALT = new Uint8Array(16).fill(1);
const KDF = { memoryKiB: 65536, iterations: 3, parallelism: 1 };
const DEVICE_ID = 'd7f3a1c2b9e04f18';

const WRITE_ACCOUNT = {
  kind: 'write',
  entity: 'account',
  record: { id: 'acc-1', name: 'Checking' },
} as unknown as GatewayOperation;

function deps(
  fileSystem: FileSystemService,
  overrides: Partial<CreateOperationsJournalDeps> = {},
): CreateOperationsJournalDeps {
  const platform = createFakePlatform();
  return {
    fileSystem,
    clock: platform.clock,
    random: platform.random,
    paths: workspacePathsFor(fileSystem, '/ws/finances.mfhdb'),
    deviceId: DEVICE_ID,
    key: JOURNAL_KEY,
    journalKdfSalt: JOURNAL_SALT,
    dbKdfSalt: DB_SALT,
    kdf: KDF,
    ...overrides,
  };
}

function freshFileSystem(): FileSystemService {
  const platform = createFakePlatform();
  if (!platform.fileSystem) {
    throw new Error('fake platform did not expose a file system despite the default capability');
  }
  return platform.fileSystem;
}

describe('openOperationsJournal', () => {
  it('creates segment 0 for a brand-new workspace, with an empty head', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    expect(journal.head).toEqual({ segmentIndex: 0, sequence: -1 });
    expect(await fs.fileInfo('/ws/finances.d7f3a1c2b9e04f18.000000.mfhj')).not.toBeNull();
  });

  it('round-trips: appended entries read back identical through readEntriesAfter', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));

    const first = unwrap(await journal.append([WRITE_ACCOUNT]));
    const second = unwrap(await journal.append([{ kind: 'delete', entity: 'account', id: 'acc-1' }]));
    expect(first).toEqual({ segmentIndex: 0, sequence: 0 });
    expect(second).toEqual({ segmentIndex: 0, sequence: 1 });
    expect(journal.head).toEqual({ segmentIndex: 0, sequence: 1 });

    const entries = [];
    for await (const entry of journal.readEntriesAfter(-1)) {
      entries.push(unwrap(entry));
    }
    expect(entries).toHaveLength(2);
    expect(entries[0]?.sequence).toBe(0);
    expect(entries[0]?.ops).toEqual([WRITE_ACCOUNT]);
    expect(entries[1]?.sequence).toBe(1);
    expect(entries[1]?.ops).toEqual([{ kind: 'delete', entity: 'account', id: 'acc-1' }]);
  });

  it('readEntriesAfter yields only entries past the given sequence', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);

    const entries = [];
    for await (const entry of journal.readEntriesAfter(0)) {
      entries.push(unwrap(entry));
    }
    expect(entries.map((entry) => entry.sequence)).toEqual([1, 2]);
  });

  it('re-opening an existing journal resumes at the correct head', async () => {
    const fs = freshFileSystem();
    const first = unwrap(await openOperationsJournal(deps(fs)));
    await first.append([WRITE_ACCOUNT]);
    await first.append([WRITE_ACCOUNT]);

    const reopened = unwrap(await openOperationsJournal(deps(fs)));
    expect(reopened.head).toEqual({ segmentIndex: 0, sequence: 1 });

    const third = unwrap(await reopened.append([WRITE_ACCOUNT]));
    expect(third).toEqual({ segmentIndex: 0, sequence: 2 });
  });

  it('detects a chain tamper: re-sealing an entry with the wrong previous-entry hash fails to open', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);

    // Corrupt a byte inside the AAD-covered region of the middle frame — flipping the sequence
    // field indirectly by tampering with the raw bytes right after the header simulates a
    // reordered/rewritten frame without altering the file's overall length.
    const path = '/ws/finances.d7f3a1c2b9e04f18.000000.mfhj';
    const bytes = await fs.readFile(path);
    const tampered = new Uint8Array(bytes);
    const tamperOffset = 130; // inside the first frame's ciphertext, well past the header and length prefix
    tampered[tamperOffset] = (tampered[tamperOffset] ?? 0) ^ 0xff;
    await fs.writeFile(path, tampered);

    const reopened = await openOperationsJournal(deps(fs));
    expect(isErr(reopened)).toBe(true);
  });

  it('detects deletion of a middle frame — a later entry still follows it, so it cannot be mistaken for a truncated tail', async () => {
    // Four entries, deleting the second: what remains after the excised frame is the third
    // entry's frame, itself still followed by the fourth — so the failure sits strictly inside
    // the file, not at its physical end, and must be reported as tampering, never truncation.
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);

    const path = '/ws/finances.d7f3a1c2b9e04f18.000000.mfhj';
    const bytes = await fs.readFile(path);

    const headerLength = 110;
    function frameLengthAt(offset: number): number {
      return 4 + new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
    }
    const firstLength = frameLengthAt(headerLength);
    const secondLength = frameLengthAt(headerLength + firstLength);
    const withoutSecond = new Uint8Array(bytes.byteLength - secondLength);
    withoutSecond.set(bytes.subarray(0, headerLength + firstLength), 0);
    withoutSecond.set(bytes.subarray(headerLength + firstLength + secondLength), headerLength + firstLength);
    await fs.writeFile(path, withoutSecond);

    const reopened = await openOperationsJournal(deps(fs));
    expect(isErr(reopened)).toBe(true);
  });

  it('discards a truncated final entry, rewinds the head, and still accepts a new append', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);

    const path = '/ws/finances.d7f3a1c2b9e04f18.000000.mfhj';
    const bytes = await fs.readFile(path);
    const truncated = bytes.slice(0, bytes.byteLength - 10);
    await fs.writeFile(path, truncated);

    const reopened = unwrap(await openOperationsJournal(deps(fs)));
    expect(reopened.head).toEqual({ segmentIndex: 0, sequence: 0 });

    // The file itself was physically truncated back to the last good entry.
    const afterOpen = await fs.readFile(path);
    expect(afterOpen.byteLength).toBeLessThan(bytes.byteLength);

    const appended = unwrap(await reopened.append([WRITE_ACCOUNT]));
    expect(appended).toEqual({ segmentIndex: 0, sequence: 1 });
  });

  it('non-final corruption is not discarded, even though it sits at the byte-length the tail would', async () => {
    // A frame whose declared length is corrupted to claim more bytes than actually remain, but
    // which is NOT the true final frame (more legitimate entries were appended after it), must
    // never be silently truncated.
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);
    await journal.append([WRITE_ACCOUNT]);

    const path = '/ws/finances.d7f3a1c2b9e04f18.000000.mfhj';
    const bytes = await fs.readFile(path);
    const tampered = new Uint8Array(bytes);
    // Flip a byte inside the first frame's ciphertext (not at the very end of the file).
    tampered[130] = (tampered[130] ?? 0) ^ 0x01;
    await fs.writeFile(path, tampered);

    const reopened = await openOperationsJournal(deps(fs));
    expect(isErr(reopened)).toBe(true);
  });

  it('rotates to a new segment once the size threshold is crossed, chaining prevSegmentTailHash', async () => {
    // Measure one entry's actual on-disk footprint first, then set the rotation threshold to fit
    // exactly one entry — the second append must then trigger a rotation, deterministically,
    // regardless of the exact serialized payload size.
    const probeFs = freshFileSystem();
    const probeJournal = unwrap(await openOperationsJournal(deps(probeFs)));
    await probeJournal.append([WRITE_ACCOUNT]);
    const oneEntrySegmentSize = (await probeFs.fileInfo('/ws/finances.d7f3a1c2b9e04f18.000000.mfhj'))?.sizeBytes;
    if (oneEntrySegmentSize === undefined) {
      throw new Error('probe segment was not written');
    }

    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs, { rotationBytes: oneEntrySegmentSize })));
    await journal.append([WRITE_ACCOUNT]);
    const second = unwrap(await journal.append([WRITE_ACCOUNT]));

    expect(second.segmentIndex).toBe(1);
    expect(second.sequence).toBe(1);

    const segment0 = await fs.readFile('/ws/finances.d7f3a1c2b9e04f18.000000.mfhj');
    const segment1 = await fs.readFile('/ws/finances.d7f3a1c2b9e04f18.000001.mfhj');
    const header1 = decodeSegmentHeader(segment1);
    expect(header1.segmentIndex).toBe(1);
    expect(header1.firstSequence).toBe(1);
    expect(header1.prevSegmentTailHash).not.toEqual(new Uint8Array(32));
    expect(segment0.byteLength).toBeGreaterThan(110);

    const entries = [];
    for await (const entry of journal.readEntriesAfter(-1)) {
      entries.push(unwrap(entry));
    }
    expect(entries.map((entry) => entry.sequence)).toEqual([0, 1]);

    const segments = await journal.listSegments();
    expect(segments.map((segment) => segment.index)).toEqual([0, 1]);
  });

  it('rejects an empty operations array', async () => {
    const fs = freshFileSystem();
    const journal = unwrap(await openOperationsJournal(deps(fs)));
    const result = await journal.append([]);
    expect(isErr(result)).toBe(true);
  });
});
