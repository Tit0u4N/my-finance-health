// @repo/app-core — level 2.
// The rule a new workspace's passphrase must satisfy, shared by every bootstrap UI so desktop and
// mobile can never disagree on it. `checkNewPassphrase` is the pure rule; `describePassphraseFeedback`
// turns it into live, translated field messages. The form's submit button stays disabled while the
// rule fails, so the explanation must be visible *as the user types*, never only on submit.

import type { useTranslation } from '../i18n/useTranslation';

export const MIN_PASSPHRASE_LENGTH = 8;

export type PassphraseCheck = {
  /** A passphrase has been typed but it is under the minimum length. */
  readonly isTooShort: boolean;
  /** A confirmation has been typed and it differs from the passphrase. */
  readonly isMismatch: boolean;
  /** Long enough and confirmed: the workspace can be created. */
  readonly isValid: boolean;
  /** A confirmation has been typed and equals a long-enough passphrase. */
  readonly isConfirmed: boolean;
};

export function checkNewPassphrase(secret: string, confirmation: string): PassphraseCheck {
  const isLongEnough = secret.length >= MIN_PASSPHRASE_LENGTH;
  const isEqual = secret === confirmation;
  return {
    isTooShort: secret.length > 0 && !isLongEnough,
    isMismatch: confirmation.length > 0 && !isEqual,
    isValid: isLongEnough && isEqual,
    isConfirmed: confirmation.length > 0 && isLongEnough && isEqual,
  };
}

export type PassphraseFeedback = {
  readonly canSubmit: boolean;
  /** Shown under the passphrase field; only once the user has started confirming, so the first
   * keystrokes are not met with an error. */
  readonly secretError: string | undefined;
  /** Shown under the confirmation field as soon as it is non-empty and differs. */
  readonly confirmError: string | undefined;
  /** Positive note under the confirmation field when both fields agree. */
  readonly confirmSuccess: string | undefined;
};

type Translate = ReturnType<typeof useTranslation>['t'];

export function describePassphraseFeedback(secret: string, confirmation: string, t: Translate): PassphraseFeedback {
  const check = checkNewPassphrase(secret, confirmation);
  return {
    canSubmit: check.isValid,
    secretError:
      check.isTooShort && confirmation.length > 0
        ? t('bootstrap:passphrase.tooShort', { min: MIN_PASSPHRASE_LENGTH })
        : undefined,
    confirmError: check.isMismatch ? t('bootstrap:passphrase.mismatch') : undefined,
    confirmSuccess: check.isConfirmed ? t('bootstrap:passphrase.match') : undefined,
  };
}
