import { describe, expect, it } from 'vitest';
import { checkNewPassphrase, describePassphraseFeedback } from './newPassphrase';

const t = ((key: string) => key) as never;

describe('checkNewPassphrase', () => {
  it('flags a typed passphrase under the minimum, but not an empty one', () => {
    expect(checkNewPassphrase('short', '').isTooShort).toBe(true);
    expect(checkNewPassphrase('', '').isTooShort).toBe(false);
  });

  it('flags a mismatch as soon as the confirmation is non-empty and differs', () => {
    expect(checkNewPassphrase('long enough', 'long').isMismatch).toBe(true);
    expect(checkNewPassphrase('long enough', '').isMismatch).toBe(false);
    expect(checkNewPassphrase('long enough', 'long enough').isMismatch).toBe(false);
  });

  it('is valid only when long enough and confirmed', () => {
    expect(checkNewPassphrase('long enough', 'long enough')).toMatchObject({ isValid: true, isConfirmed: true });
    expect(checkNewPassphrase('long enough', 'long enougH').isValid).toBe(false);
    expect(checkNewPassphrase('short', 'short')).toMatchObject({ isValid: false, isConfirmed: false });
  });
});

describe('describePassphraseFeedback', () => {
  it('explains a mismatch under the confirmation while the submit stays disabled', () => {
    expect(describePassphraseFeedback('long enough', 'nope', t)).toEqual({
      canSubmit: false,
      secretError: undefined,
      confirmError: 'bootstrap:passphrase.mismatch',
      confirmSuccess: undefined,
    });
  });

  it('reports a too-short passphrase once confirmation has started', () => {
    expect(describePassphraseFeedback('short', 'short', t).secretError).toBe('bootstrap:passphrase.tooShort');
    expect(describePassphraseFeedback('short', '', t).secretError).toBeUndefined();
  });

  it('confirms a matching pair', () => {
    expect(describePassphraseFeedback('long enough', 'long enough', t)).toMatchObject({
      canSubmit: true,
      confirmSuccess: 'bootstrap:passphrase.match',
    });
  });
});
