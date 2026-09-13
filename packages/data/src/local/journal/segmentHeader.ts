// @repo/data — level 1.
// The operations journal's per-segment cleartext header (start-roadmap.md §9: "only a minimal
// header remains in the clear: format version, cryptographic suite, and derivation elements").
// Fixed 110 bytes for format v1. No CRC: the header is covered as AAD by every entry's seal, so
// tampering with it fails that entry's authentication instead.

export const SEGMENT_HEADER_LENGTH = 110;
export const SEGMENT_MAGIC = 'MFHJRNL1';
export const FORMAT_VERSION = 1;
export const SUITE_ARGON2ID_XCHACHA20POLY1305_SHA256 = 1;

const MAGIC_LENGTH = 8;
const SALT_LENGTH = 16;
const DEVICE_ID_TEXT_LENGTH = 16;
const TAIL_HASH_LENGTH = 32;

export type SegmentHeader = {
  readonly journalKdfSalt: Uint8Array; // 16 bytes
  readonly dbKdfSalt: Uint8Array; // 16 bytes — so a lone journal can rebuild a lost database
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
  readonly deviceId: string; // 16 lowercase hex characters
  readonly segmentIndex: number;
  readonly prevSegmentTailHash: Uint8Array; // 32 bytes, all zero for segment 0
  readonly firstSequence: number;
};

export type DecodedSegmentHeader = SegmentHeader & { readonly formatVersion: number; readonly suiteId: number };

function assertLength(bytes: Uint8Array, expected: number, name: string): void {
  if (bytes.byteLength !== expected) {
    throw new Error(`encodeSegmentHeader: "${name}" must be ${expected} bytes, got ${bytes.byteLength}`);
  }
}

export function encodeSegmentHeader(header: SegmentHeader): Uint8Array {
  assertLength(header.journalKdfSalt, SALT_LENGTH, 'journalKdfSalt');
  assertLength(header.dbKdfSalt, SALT_LENGTH, 'dbKdfSalt');
  assertLength(header.prevSegmentTailHash, TAIL_HASH_LENGTH, 'prevSegmentTailHash');
  if (!/^[0-9a-f]{16}$/.test(header.deviceId)) {
    throw new Error(`encodeSegmentHeader: deviceId must be 16 lowercase hex characters, got "${header.deviceId}"`);
  }

  const out = new Uint8Array(SEGMENT_HEADER_LENGTH);
  const view = new DataView(out.buffer);
  const encoder = new TextEncoder();

  out.set(encoder.encode(SEGMENT_MAGIC), 0);
  view.setUint8(8, FORMAT_VERSION);
  view.setUint8(9, SUITE_ARGON2ID_XCHACHA20POLY1305_SHA256);
  view.setUint16(10, SEGMENT_HEADER_LENGTH, true);
  out.set(header.journalKdfSalt, 12);
  out.set(header.dbKdfSalt, 28);
  view.setUint32(44, header.memoryKiB, true);
  view.setUint8(48, header.iterations);
  view.setUint8(49, header.parallelism);
  out.set(encoder.encode(header.deviceId), 50);
  view.setUint32(66, header.segmentIndex, true);
  out.set(header.prevSegmentTailHash, 70);
  view.setBigUint64(102, BigInt(header.firstSequence), true);

  return out;
}

export function decodeSegmentHeader(bytes: Uint8Array): DecodedSegmentHeader {
  if (bytes.byteLength < SEGMENT_HEADER_LENGTH) {
    throw new Error(`decodeSegmentHeader: expected at least ${SEGMENT_HEADER_LENGTH} bytes, got ${bytes.byteLength}`);
  }
  const decoder = new TextDecoder();
  const magic = decoder.decode(bytes.slice(0, MAGIC_LENGTH));
  if (magic !== SEGMENT_MAGIC) {
    throw new Error(`decodeSegmentHeader: bad magic "${magic}"`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const formatVersion = view.getUint8(8);
  if (formatVersion !== FORMAT_VERSION) {
    throw new Error(`decodeSegmentHeader: unsupported format version ${formatVersion}`);
  }
  const headerLength = view.getUint16(10, true);
  if (headerLength !== SEGMENT_HEADER_LENGTH) {
    throw new Error(`decodeSegmentHeader: unexpected header length ${headerLength}`);
  }

  return {
    formatVersion,
    suiteId: view.getUint8(9),
    journalKdfSalt: bytes.slice(12, 28),
    dbKdfSalt: bytes.slice(28, 44),
    memoryKiB: view.getUint32(44, true),
    iterations: view.getUint8(48),
    parallelism: view.getUint8(49),
    deviceId: decoder.decode(bytes.slice(50, 50 + DEVICE_ID_TEXT_LENGTH)),
    segmentIndex: view.getUint32(66, true),
    prevSegmentTailHash: bytes.slice(70, 70 + TAIL_HASH_LENGTH),
    firstSequence: Number(view.getBigUint64(102, true)),
  };
}
