// @repo/platform — level 0.
// Absent on web, declared by PlatformCapabilities.canWriteFile. Limited to primitives — read,
// write, delete, list, resolve a path, open a picker (start-roadmap.md §8). Naming, logical
// tree, serialization, atomic writing, cleanup, and quotas are the core's job, not the
// adapter's (principle 4: adapters are silent).

export type FilePickerOptions = {
  /** Filter hint for the native dialog/picker, e.g. file extensions. Advisory only. */
  readonly extensions?: readonly string[];
};

export type FileSystemService = {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listDirectory(path: string): Promise<readonly string[]>;
  resolvePath(...segments: readonly string[]): string;
  /** Opens the native file picker; resolves the chosen path, or null if the user cancelled. */
  pickFile(options?: FilePickerOptions): Promise<string | null>;
};
