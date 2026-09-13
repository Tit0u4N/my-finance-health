import { describe, expect, it } from 'vitest';
import { decodeSegmentHeader, encodeSegmentHeader, SEGMENT_HEADER_LENGTH, type SegmentHeader } from './segmentHeader';

const SAMPLE: SegmentHeader = {
  journalKdfSalt: new Uint8Array(16).fill(1),
  dbKdfSalt: new Uint8Array(16).fill(2),
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
  deviceId: 'd7f3a1c2b9e04f18',
  segmentIndex: 0,
  prevSegmentTailHash: new Uint8Array(32),
  firstSequence: 0,
};

describe('segmentHeader', () => {
  it('encodes to exactly 110 bytes and round-trips through decode', () => {
    const encoded = encodeSegmentHeader(SAMPLE);
    expect(encoded.byteLength).toBe(SEGMENT_HEADER_LENGTH);

    const decoded = decodeSegmentHeader(encoded);
    expect(decoded.formatVersion).toBe(1);
    expect(decoded.suiteId).toBe(1);
    expect(decoded.journalKdfSalt).toEqual(SAMPLE.journalKdfSalt);
    expect(decoded.dbKdfSalt).toEqual(SAMPLE.dbKdfSalt);
    expect(decoded.memoryKiB).toBe(SAMPLE.memoryKiB);
    expect(decoded.iterations).toBe(SAMPLE.iterations);
    expect(decoded.parallelism).toBe(SAMPLE.parallelism);
    expect(decoded.deviceId).toBe(SAMPLE.deviceId);
    expect(decoded.segmentIndex).toBe(SAMPLE.segmentIndex);
    expect(decoded.prevSegmentTailHash).toEqual(SAMPLE.prevSegmentTailHash);
    expect(decoded.firstSequence).toBe(SAMPLE.firstSequence);
  });

  it('round-trips large segmentIndex and firstSequence values', () => {
    const encoded = encodeSegmentHeader({ ...SAMPLE, segmentIndex: 4_294_967_295, firstSequence: 123_456_789 });
    const decoded = decodeSegmentHeader(encoded);
    expect(decoded.segmentIndex).toBe(4_294_967_295);
    expect(decoded.firstSequence).toBe(123_456_789);
  });

  it('rejects a bad magic', () => {
    const encoded = encodeSegmentHeader(SAMPLE);
    encoded.set(new TextEncoder().encode('XXXXXXXX'), 0);
    expect(() => decodeSegmentHeader(encoded)).toThrow(/bad magic/);
  });

  it('rejects an unknown format version', () => {
    const encoded = encodeSegmentHeader(SAMPLE);
    encoded[8] = 99;
    expect(() => decodeSegmentHeader(encoded)).toThrow(/unsupported format version/);
  });

  it('rejects a salt of the wrong length', () => {
    expect(() => encodeSegmentHeader({ ...SAMPLE, journalKdfSalt: new Uint8Array(8) })).toThrow(/journalKdfSalt/);
  });

  it('rejects a malformed device id', () => {
    expect(() => encodeSegmentHeader({ ...SAMPLE, deviceId: 'NOT-HEX!' })).toThrow(/deviceId/);
  });

  it('rejects bytes shorter than the fixed header length', () => {
    expect(() => decodeSegmentHeader(new Uint8Array(50))).toThrow(/expected at least/);
  });
});
