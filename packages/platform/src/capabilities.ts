// @repo/platform — level 0.
// What a host can do, never what it is named (start-roadmap.md §2, principle 1). Shared code
// branches on these flags; it never asks "am I on desktop?". A missing optional service is a
// capability set to false, never an exception at call time (start-roadmap.md §8).

/** One row per service in start-roadmap.md §8's table. */
export type PlatformCapabilities = {
  /** File system reads/writes are available (desktop, mobile sandbox). */
  readonly canWriteFile: boolean;
  /** A native "choose a file" dialog/picker exists. */
  readonly canPickFile: boolean;
  /** A previously designated file location can be reopened without re-prompting (subject to OS authorization). */
  readonly canResumeLocation: boolean;
  /** An OS-level secret vault (keyring / secure-store) is available. */
  readonly hasSecretVault: boolean;
  /** An encrypted local SQL driver (SQLCipher) is available. */
  readonly hasEncryptedSqlDriver: boolean;
  /** The app can function with no network connection. */
  readonly worksOffline: boolean;
  /** Window chrome (minimize/maximize/close, custom title bar) can be controlled. */
  readonly canControlWindow: boolean;
  /** The app can check for and apply an update. */
  readonly canUpdate: boolean;
};
