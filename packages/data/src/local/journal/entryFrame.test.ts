import { describe, expect, it } from 'vitest';
import { decodeEntryFrame, encodeEntryFrame, hashFrame, readDeclaredFrameLength, ZERO_HASH } from './entryFrame';

const KEY = new Uint8Array(32).fill(5);
const HEADER = new Uint8Array(110).fill(9);
const NONCE = new Uint8Array(24).fill(3);
const PLAINTEXT = new TextEncoder().encode('{"v":1,"id":"01ABC","ops":[]}');

describe('entryFrame', () => {
  it('round-trips a frame at sequence 0 with the zero previous-entry hash', () => {
    const frame = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    const decoded = decodeEntryFrame({ key: KEY, frame, header: HEADER, sequence: 0, prevEntryHash: ZERO_HASH });
    expect(decoded).toEqual(PLAINTEXT);
  });

  it("chains: the next entry authenticates only against the previous frame's exact hash", () => {
    const first = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    const secondPlaintext = new TextEncoder().encode('{"v":1,"id":"01DEF","ops":[]}');
    const second = encodeEntryFrame({
      key: KEY,
      nonce: new Uint8Array(24).fill(4),
      plaintext: secondPlaintext,
      header: HEADER,
      sequence: 1,
      prevEntryHash: hashFrame(first),
    });

    const decoded = decodeEntryFrame({
      key: KEY,
      frame: second,
      header: HEADER,
      sequence: 1,
      prevEntryHash: hashFrame(first),
    });
    expect(decoded).toEqual(secondPlaintext);
  });

  it('fails to decode when the previous-entry hash does not match (chain tamper)', () => {
    const first = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    const second = encodeEntryFrame({
      key: KEY,
      nonce: new Uint8Array(24).fill(4),
      plaintext: new TextEncoder().encode('{}'),
      header: HEADER,
      sequence: 1,
      prevEntryHash: hashFrame(first),
    });

    const wrongPrevHash = new Uint8Array(32).fill(0xaa);
    expect(
      decodeEntryFrame({ key: KEY, frame: second, header: HEADER, sequence: 1, prevEntryHash: wrongPrevHash }),
    ).toBeNull();
  });

  it('fails to decode at the wrong sequence number', () => {
    const frame = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 5,
      prevEntryHash: ZERO_HASH,
    });
    expect(decodeEntryFrame({ key: KEY, frame, header: HEADER, sequence: 6, prevEntryHash: ZERO_HASH })).toBeNull();
  });

  it('fails to decode when the header (AAD) differs', () => {
    const frame = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    const otherHeader = new Uint8Array(110).fill(1);
    expect(
      decodeEntryFrame({ key: KEY, frame, header: otherHeader, sequence: 0, prevEntryHash: ZERO_HASH }),
    ).toBeNull();
  });

  it('reads the declared frame length from the length prefix', () => {
    const frame = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    expect(readDeclaredFrameLength(frame, 0)).toBe(frame.byteLength);
  });

  it('produces different SHA-256 hashes for different frames', () => {
    const a = encodeEntryFrame({
      key: KEY,
      nonce: NONCE,
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    const b = encodeEntryFrame({
      key: KEY,
      nonce: new Uint8Array(24).fill(8),
      plaintext: PLAINTEXT,
      header: HEADER,
      sequence: 0,
      prevEntryHash: ZERO_HASH,
    });
    expect(hashFrame(a)).not.toEqual(hashFrame(b));
  });
});
