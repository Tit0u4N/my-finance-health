// @repo/platform — level 0.
// Absent on web, declared by PlatformCapabilities.canWriteFile. Limited to primitives — read,
// write, append, delete, list, stat, rename, resolve a path, open a picker (start-roadmap.md §8).
// Naming, logical tree, serialization, atomic writing, cleanup, and quotas are the core's job,
// not the adapter's (principle 4: adapters are silent). Declaring `canWriteFile` means
// implementing the full service — there is no finer-grained capability for a host that writes
// but cannot append, stat or rename, and inventing one would put a branch in the core for a host
// that does not exist.

export type FilePickerOptions = {
  /** Filter hint for the native dialog/picker, e.g. file extensions. Advisory only. */
  readonly extensions?: readonly string[];
};

export type SaveLocationOptions = FilePickerOptions & {
  /** Pre-filled file name in the native save dialog. Advisory only. */
  readonly suggestedName?: string;
};

export type FileInfo = {
  readonly sizeBytes: number;
  readonly modifiedAt: string;
};

export type FileSystemService = {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  /** Appends without rewriting the file — the operations journal's constant-cost append (start-roadmap.md §9). */
  appendFile(path: string, data: Uint8Array): Promise<void>;
  /** Truncates the file to `length` bytes — discards a partially-written final journal entry. */
  truncateFile(path: string, length: number): Promise<void>;
  deleteFile(path: string): Promise<void>;
  /** Resolves to `null` when the path does not exist. */
  fileInfo(path: string): Promise<FileInfo | null>;
  /** The atomicity primitive: the core implements write-temp-then-swap on top of this (start-roadmap.md §8 assigns "atomic writing" to the core). */
  rename(from: string, to: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  /** Absolute paths, one per entry, non-recursive. */
  listDirectory(path: string): Promise<readonly string[]>;
  resolvePath(...segments: readonly string[]): string;
  /** A directory the app owns, outside any synced folder — start-roadmap.md §9's rolling-backup location. */
  appDataDirectory(): Promise<string>;
  /**
   * A directory the system itself keeps in sync across the user's devices and that the app may
   * open files in place inside (iCloud Drive's app folder on iOS), or null when the host has none
   * or it is unavailable right now (no account signed in, entitlement missing, sync turned off).
   * Workspaces created there fall under start-roadmap.md §9's synced-folder safeguards.
   */
  syncedDirectory(): Promise<string | null>;
  /** Opens the native file picker; resolves the chosen path, or null if the user cancelled. */
  pickFile(options?: FilePickerOptions): Promise<string | null>;
  /** Opens the native folder picker; resolves the chosen directory, or null if the user cancelled. Mobile's export/import target (start-roadmap.md §9, "Mobile case"). */
  pickDirectory(): Promise<string | null>;
  /** `pickFile`'s counterpart for designating a file that does not exist yet — creating a local workspace. */
  pickSaveLocation(options?: SaveLocationOptions): Promise<string | null>;
};
