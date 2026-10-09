// @repo/app-core — level 2.
// The rule a new workspace's passphrase must satisfy, shared by every bootstrap UI so desktop and
// mobile can never disagree on it. English copy only, like the rest of the bootstrap flow (no i18n
// namespace yet — see describeBootstrapError.ts).

export const MIN_PASSPHRASE_LENGTH = 8;

/** The reason `secret`/`confirmation` cannot create a workspace, or undefined when they can. */
export function validateNewPassphrase(secret: string, confirmation: string): string | undefined {
  if (secret.length < MIN_PASSPHRASE_LENGTH) {
    return `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`;
  }
  if (secret !== confirmation) {
    return 'Passphrases do not match.';
  }
  return undefined;
}
