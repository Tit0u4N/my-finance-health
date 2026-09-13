// @repo/data — level 1.
// The append-only, per-device operations journal (start-roadmap.md §9): every mutating gateway
// operation is sealed into an entry and appended to this device's own segment chain before it is
// applied to the database, which makes the database a rebuildable projection. Scoped to one
// device's own chain — cross-device merge is explicitly not implemented ("two devices writing
// simultaneously produce two divergent projections until merge is implemented"), so this journal
// only ever needs to trust segments it wrote itself; the occupancy lock is what keeps a second
// device from writing concurrently in the first place.
//
// `openOperationsJournal` doubles as "create if absent": a brand-new workspace has no segments
// yet, so opening one for the first time creates segment 0 — there is no separate "initialize"
// step, and a workspace opened normally always already has at least one segment.

import { type DomainError, integrityError, storageError, validationError } from '@repo/domain/primitives/errors';
import { err, isErr, ok, type Result } from '@repo/domain/primitives/result';
import type { Clock } from '@repo/platform/services/clock';
import type { FileSystemService } from '@repo/platform/services/fileSystem';
import type { RandomService } from '@repo/platform/services/random';
import { z } from 'zod';
import type { GatewayOperation } from '../../gateway/gateway';
import { canonicalJsonStringify } from '../crypto/canonicalJson';
import { SEAL_NONCE_LENGTH, SEAL_TAG_LENGTH } from '../crypto/seal';
import { createSortableId } from '../crypto/sortableId';
import type { WorkspacePaths } from '../workspacePaths';
import {
  decodeEntryFrame,
  encodeEntryFrame,
  hashFrame,
  LENGTH_PREFIX_BYTES,
  readDeclaredFrameLength,
  ZERO_HASH,
} from './entryFrame';
import {
  type DecodedSegmentHeader,
  decodeSegmentHeader,
  encodeSegmentHeader,
  SEGMENT_HEADER_LENGTH,
  type SegmentHeader,
} from './segmentHeader';

const DEFAULT_ROTATION_BYTES = 4 * 1024 * 1024;

export type JournalPosition = {
  readonly segmentIndex: number;
  /** The last sequence number written, or -1 when the journal is empty. */
  readonly sequence: number;
};

export type JournalEntry = {
  readonly sequence: number;
  readonly id: string;
  readonly dev: string;
  readonly at: string;
  readonly ops: readonly GatewayOperation[];
};

export type JournalSegmentRef = { readonly path: string; readonly index: number };

export type OperationsJournal = {
  readonly head: JournalPosition;
  append(ops: readonly GatewayOperation[]): Promise<Result<JournalPosition, DomainError>>;
  /** Ordered replay source; yields nothing when `after` is already the head. */
  readEntriesAfter(after: number): AsyncGenerator<Result<JournalEntry, DomainError>>;
  listSegments(): Promise<readonly JournalSegmentRef[]>;
};

export type KdfCostParams = {
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
};

export type CreateOperationsJournalDeps = {
  readonly fileSystem: FileSystemService;
  readonly clock: Clock;
  readonly random: RandomService;
  readonly paths: WorkspacePaths;
  readonly deviceId: string;
  /** The already-derived journal key (32 bytes) — see local/crypto/keys.ts. */
  readonly key: Uint8Array;
  readonly journalKdfSalt: Uint8Array;
  readonly dbKdfSalt: Uint8Array;
  readonly kdf: KdfCostParams;
  readonly rotationBytes?: number;
};

const journalPayloadSchema = z.object({
  v: z.literal(1),
  id: z.string(),
  dev: z.string(),
  at: z.string(),
  ops: z.array(z.unknown()),
});

async function discoverSegmentIndexes(
  fileSystem: FileSystemService,
  paths: WorkspacePaths,
  deviceId: string,
): Promise<number[]> {
  const entries = await fileSystem.listDirectory(paths.directory);
  const prefix = `${paths.baseName}.${deviceId}.`;
  const suffix = '.mfhj';
  const indexes: number[] = [];
  for (const entry of entries) {
    const name = entry.slice(entry.lastIndexOf('/') + 1);
    if (name.startsWith(prefix) && name.endsWith(suffix)) {
      const indexText = name.slice(prefix.length, name.length - suffix.length);
      const index = Number(indexText);
      if (Number.isInteger(index)) {
        indexes.push(index);
      }
    }
  }
  return indexes.sort((a, b) => a - b);
}

type SegmentWalkOutcome = {
  readonly entries: readonly {
    readonly sequence: number;
    readonly frame: Uint8Array;
    readonly plaintext: Uint8Array;
  }[];
  readonly lastHash: Uint8Array;
  /** Set only when `isLastSegment` and the tail looks like a partial write from an abrupt shutdown. */
  readonly truncatedAtOffset: number | null;
};

/**
 * Walks one segment's frames end to end, decoding and chain-verifying each. An authentication
 * failure on any frame that is not the very last one on disk is tampering or corruption, never
 * silently discarded; an authentication failure exactly at the tail of the *last known segment*
 * is instead treated as a partial write from an abrupt shutdown and reported for truncation.
 */
function walkSegment(
  key: Uint8Array,
  headerBytes: Uint8Array,
  header: DecodedSegmentHeader,
  bytes: Uint8Array,
  isLastSegment: boolean,
): Result<SegmentWalkOutcome, DomainError> {
  const entries: { sequence: number; frame: Uint8Array; plaintext: Uint8Array }[] = [];
  let offset = SEGMENT_HEADER_LENGTH;
  let sequence = header.firstSequence;
  let prevHash = header.prevSegmentTailHash;

  while (offset < bytes.byteLength) {
    const remaining = bytes.byteLength - offset;
    if (remaining < LENGTH_PREFIX_BYTES) {
      if (isLastSegment) {
        return ok({ entries, lastHash: prevHash, truncatedAtOffset: offset });
      }
      return err(
        integrityError(
          `operations journal: segment ${header.segmentIndex} has a partial length prefix at byte ${offset}`,
        ),
      );
    }

    const declaredLength = readDeclaredFrameLength(bytes, offset);
    if (remaining < declaredLength) {
      if (isLastSegment) {
        return ok({ entries, lastHash: prevHash, truncatedAtOffset: offset });
      }
      return err(
        integrityError(`operations journal: segment ${header.segmentIndex} has a partial frame at byte ${offset}`),
      );
    }

    const frame = bytes.slice(offset, offset + declaredLength);
    const plaintext = decodeEntryFrame({ key, frame, header: headerBytes, sequence, prevEntryHash: prevHash });
    if (plaintext === null) {
      const isAtEndOfFile = offset + declaredLength === bytes.byteLength;
      if (isLastSegment && isAtEndOfFile) {
        return ok({ entries, lastHash: prevHash, truncatedAtOffset: offset });
      }
      return err(
        integrityError(
          `operations journal: entry at sequence ${sequence} in segment ${header.segmentIndex} failed to authenticate`,
        ),
      );
    }

    entries.push({ sequence, frame, plaintext });
    prevHash = hashFrame(frame);
    sequence += 1;
    offset += declaredLength;
  }

  return ok({ entries, lastHash: prevHash, truncatedAtOffset: null });
}

function parsePayload(plaintext: Uint8Array, sequence: number): Result<JournalEntry, DomainError> {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return err(integrityError(`operations journal: entry at sequence ${sequence} is not valid JSON after decryption`));
  }
  const parsed = journalPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return err(integrityError(`operations journal: entry at sequence ${sequence} has an unexpected shape`));
  }
  return ok({
    sequence,
    id: parsed.data.id,
    dev: parsed.data.dev,
    at: parsed.data.at,
    ops: parsed.data.ops as readonly GatewayOperation[],
  });
}

export async function openOperationsJournal(
  deps: CreateOperationsJournalDeps,
): Promise<Result<OperationsJournal, DomainError>> {
  const { fileSystem, clock, random, paths, deviceId, key, journalKdfSalt, dbKdfSalt, kdf } = deps;
  const rotationBytes = deps.rotationBytes ?? DEFAULT_ROTATION_BYTES;

  const buildHeader = (
    segmentIndex: number,
    prevSegmentTailHash: Uint8Array,
    firstSequence: number,
  ): SegmentHeader => ({
    journalKdfSalt,
    dbKdfSalt,
    memoryKiB: kdf.memoryKiB,
    iterations: kdf.iterations,
    parallelism: kdf.parallelism,
    deviceId,
    segmentIndex,
    prevSegmentTailHash,
    firstSequence,
  });

  const indexes = await discoverSegmentIndexes(fileSystem, paths, deviceId);

  let currentIndex: number;
  let currentHeaderBytes: Uint8Array;
  let currentSize: number;
  let prevHash: Uint8Array;
  let sequence: number;

  if (indexes.length === 0) {
    currentIndex = 0;
    currentHeaderBytes = encodeSegmentHeader(buildHeader(0, ZERO_HASH, 0));
    await fileSystem.writeFile(paths.segment(deviceId, 0), currentHeaderBytes);
    currentSize = SEGMENT_HEADER_LENGTH;
    prevHash = ZERO_HASH;
    sequence = -1;
  } else {
    currentIndex = indexes[indexes.length - 1] as number;
    const path = paths.segment(deviceId, currentIndex);
    const bytes = await fileSystem.readFile(path);
    let header: DecodedSegmentHeader;
    try {
      header = decodeSegmentHeader(bytes);
    } catch (error) {
      return err(integrityError(`operations journal: segment ${currentIndex} has a corrupt header (${String(error)})`));
    }
    currentHeaderBytes = bytes.slice(0, SEGMENT_HEADER_LENGTH);
    const walked = walkSegment(key, currentHeaderBytes, header, bytes, true);
    if (isErr(walked)) {
      return walked;
    }
    if (walked.value.truncatedAtOffset === null) {
      currentSize = bytes.byteLength;
    } else {
      await fileSystem.truncateFile(path, walked.value.truncatedAtOffset);
      currentSize = walked.value.truncatedAtOffset;
    }
    prevHash = walked.value.lastHash;
    const lastEntry = walked.value.entries.at(-1);
    sequence = lastEntry ? lastEntry.sequence : header.firstSequence - 1;
  }

  let head: JournalPosition = { segmentIndex: currentIndex, sequence };

  async function append(ops: readonly GatewayOperation[]): Promise<Result<JournalPosition, DomainError>> {
    if (ops.length === 0) {
      return err(validationError('operations journal: an entry must contain at least one operation'));
    }

    const nextSequence = head.sequence + 1;
    const payload = { v: 1 as const, id: createSortableId(clock, random), dev: deviceId, at: clock.now(), ops };
    let plaintext: Uint8Array;
    try {
      plaintext = new TextEncoder().encode(canonicalJsonStringify(payload));
    } catch (error) {
      return err(storageError(`operations journal: failed to serialize entry (${String(error)})`));
    }

    const estimatedFrameLength = LENGTH_PREFIX_BYTES + SEAL_NONCE_LENGTH + plaintext.byteLength + SEAL_TAG_LENGTH;
    if (currentSize + estimatedFrameLength > rotationBytes) {
      const newIndex = currentIndex + 1;
      currentHeaderBytes = encodeSegmentHeader(buildHeader(newIndex, prevHash, nextSequence));
      await fileSystem.writeFile(paths.segment(deviceId, newIndex), currentHeaderBytes);
      currentIndex = newIndex;
      currentSize = SEGMENT_HEADER_LENGTH;
    }

    const nonce = random.bytes(SEAL_NONCE_LENGTH);
    const frame = encodeEntryFrame({
      key,
      nonce,
      plaintext,
      header: currentHeaderBytes,
      sequence: nextSequence,
      prevEntryHash: prevHash,
    });

    try {
      await fileSystem.appendFile(paths.segment(deviceId, currentIndex), frame);
    } catch (error) {
      return err(storageError(`operations journal: failed to append entry (${String(error)})`));
    }

    currentSize += frame.byteLength;
    prevHash = hashFrame(frame);
    head = { segmentIndex: currentIndex, sequence: nextSequence };
    return ok(head);
  }

  async function* readEntriesAfter(after: number): AsyncGenerator<Result<JournalEntry, DomainError>> {
    for (let index = 0; index <= currentIndex; index += 1) {
      const path = paths.segment(deviceId, index);
      const bytes = await fileSystem.readFile(path);
      let header: DecodedSegmentHeader;
      try {
        header = decodeSegmentHeader(bytes);
      } catch (error) {
        yield err(integrityError(`operations journal: segment ${index} has a corrupt header (${String(error)})`));
        return;
      }
      const headerBytes = bytes.slice(0, SEGMENT_HEADER_LENGTH);
      const walked = walkSegment(key, headerBytes, header, bytes, index === currentIndex);
      if (isErr(walked)) {
        yield walked;
        return;
      }
      for (const entry of walked.value.entries) {
        if (entry.sequence <= after) {
          continue;
        }
        const parsedEntry = parsePayload(entry.plaintext, entry.sequence);
        yield parsedEntry;
        if (isErr(parsedEntry)) {
          return;
        }
      }
    }
  }

  function listSegments(): Promise<readonly JournalSegmentRef[]> {
    return Promise.resolve(
      Array.from({ length: currentIndex + 1 }, (_unused, index) => ({
        index,
        path: paths.segment(deviceId, index),
      })),
    );
  }

  return ok({
    get head() {
      return head;
    },
    append,
    readEntriesAfter,
    listSegments,
  });
}
