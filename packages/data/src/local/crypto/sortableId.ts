// @repo/data — level 1.
// A ULID-shaped sortable id for journal entries (start-roadmap.md §9: "each entry carries a
// sortable ID"). 48 bits of the entry's timestamp, encoded MSB-first into 10 Crockford-base32
// characters so lexicographic order tracks time order, followed by 80 bits of randomness (16
// characters) for uniqueness within the same millisecond. Hand-rolled rather than a new `ulid`
// dependency — ~25 lines, fully testable, and this repo prefers no dependency over a small one.

import type { Clock } from '@repo/platform/services/clock';
import type { RandomService } from '@repo/platform/services/random';

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TIME_BYTES = 6; // 48 bits
const RANDOM_BYTES = 10; // 80 bits

function bytesToCrockfordBase32(bytes: Uint8Array): string {
  let output = '';
  let buffer = 0;
  let bitsInBuffer = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsInBuffer += 8;
    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      output += CROCKFORD_ALPHABET[(buffer >>> bitsInBuffer) & 0x1f];
    }
  }
  if (bitsInBuffer > 0) {
    output += CROCKFORD_ALPHABET[(buffer << (5 - bitsInBuffer)) & 0x1f];
  }
  return output;
}

function timeToBytes(epochMs: number): Uint8Array {
  const maxValue = 2 ** (TIME_BYTES * 8) - 1;
  if (!Number.isInteger(epochMs) || epochMs < 0 || epochMs > maxValue) {
    throw new Error(`createSortableId: timestamp out of 48-bit range (${epochMs})`);
  }
  const bytes = new Uint8Array(TIME_BYTES);
  let remaining = epochMs;
  for (let index = TIME_BYTES - 1; index >= 0; index -= 1) {
    bytes[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  return bytes;
}

/** Sortable, ULID-shaped: lexicographic order equals creation order across different milliseconds. */
export function createSortableId(clock: Clock, random: RandomService): string {
  const epochMs = Date.parse(clock.now());
  if (!Number.isFinite(epochMs)) {
    throw new Error(`createSortableId: clock.now() ("${clock.now()}") is not a parseable timestamp`);
  }
  const timePart = bytesToCrockfordBase32(timeToBytes(epochMs));
  const randomPart = bytesToCrockfordBase32(random.bytes(RANDOM_BYTES));
  return `${timePart}${randomPart}`;
}
