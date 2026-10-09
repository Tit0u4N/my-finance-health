import { describe, expect, it } from 'vitest';
import { MIN_PASSPHRASE_LENGTH, validateNewPassphrase } from './newPassphrase';

describe('validateNewPassphrase', () => {
  it('rejects a passphrase shorter than the minimum, before comparing it to its confirmation', () => {
    expect(validateNewPassphrase('short', 'different')).toBe(
      `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`,
    );
  });

  it('rejects a confirmation that differs', () => {
    expect(validateNewPassphrase('long enough', 'long enougH')).toBe('Passphrases do not match.');
  });

  it('accepts a long enough passphrase that matches its confirmation', () => {
    expect(validateNewPassphrase('long enough', 'long enough')).toBeUndefined();
  });
});
