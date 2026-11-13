// @repo/platform — level 0.
// Self-update of the installed app. Declared by PlatformCapabilities.canUpdate, never assumed
// present. Where updates come from (a release feed, a store) is the adapter's concern.

export type AvailableUpdate = {
  /** Version that would be installed, e.g. "1.1.0". */
  readonly version: string;
  /** Release notes as published, or null when none were given. */
  readonly notes: string | null;
  /** Downloads, verifies and installs the update, then restarts the app. Rejects on failure. */
  install(): Promise<void>;
};

export type UpdaterService = {
  /** Resolves `null` when the app is up to date or the check could not run (offline, no feed
   *  yet) — a failed check is never the caller's problem, there is always a next launch. */
  check(): Promise<AvailableUpdate | null>;
};
