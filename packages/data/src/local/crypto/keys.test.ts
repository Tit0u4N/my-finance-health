import { describe, expect, it } from 'vitest';
import { deriveJournalKey, JOURNAL_KEY_LENGTH } from './keys';

const FAST_SPEC = { salt: new Uint8Array(16).fill(3), memoryKiB: 8, iterations: 1, parallelism: 1 };

describe('deriveJournalKey', () => {
  it('derives a 32-byte key deterministically from the same secret and spec', () => {
    const first = deriveJournalKey('correct horse battery staple', FAST_SPEC);
    const second = deriveJournalKey('correct horse battery staple', FAST_SPEC);
    expect(first).toHaveLength(JOURNAL_KEY_LENGTH);
    expect(first).toEqual(second);
  });

  it('derives a different key for a different secret', () => {
    const a = deriveJournalKey('secret-a', FAST_SPEC);
    const b = deriveJournalKey('secret-b', FAST_SPEC);
    expect(a).not.toEqual(b);
  });

  it('derives a different key for a different salt', () => {
    const a = deriveJournalKey('same-secret', FAST_SPEC);
    const b = deriveJournalKey('same-secret', { ...FAST_SPEC, salt: new Uint8Array(16).fill(9) });
    expect(a).not.toEqual(b);
  });
});
