// @repo/data — level 1.
// The `.mfhmeta` descriptor: cleartext canonical JSON written once at workspace creation,
// holding the two independent Argon2id derivation specs (start-roadmap.md §9's key-policy
// responsibility, held by the core: "generation at first opening, length, rotation, unlock
// conditions"). Judgment call, flagged: `dbSalt` here is the Argon2id salt fed to the platform's
// SqlDriver.unlock (see sqlDriver.ts's SqlKeyDerivation) — not a SQLCipher-internal salt.
// SQLCipher keeps its own page salt inside the encrypted file's header regardless; this file
// exists because a surviving `.mfhdb` with a lost `.mfhmeta` has no way to re-derive the
// Argon2id key from the passphrase alone. Salts are public by design, so storing them in the
// clear leaks nothing. Written via a write-temp-then-rename swap so a crash mid-write never
// leaves a half-written descriptor (start-roadmap.md §8 assigns atomic writing to the core, not
// the adapter).

import type { FileSystemService } from '@repo/platform/services/fileSystem';
import { z } from 'zod';
import { canonicalJsonStringify } from './crypto/canonicalJson';

const kdfSpecSchema = z.object({
  memoryKiB: z.number().int().positive(),
  iterations: z.number().int().positive(),
  parallelism: z.number().int().positive(),
});

export const WORKSPACE_META_SUITE = 'argon2id-xchacha20poly1305-sha256-v1' as const;

const workspaceMetaSchema = z.object({
  v: z.literal(1),
  workspaceId: z.string(),
  createdAt: z.string(),
  /** Base64. Fed to the platform's SqlDriver as SqlKeyDerivation.salt — derived and applied in Rust, never in the core. */
  dbSalt: z.string(),
  /** Base64. Fed to deriveJournalKey — this salt never leaves the core. */
  journalSalt: z.string(),
  /** Shared Argon2id cost parameters for both derivations — only the salt differs between them. */
  kdf: kdfSpecSchema,
  suite: z.literal(WORKSPACE_META_SUITE),
});

export type WorkspaceMeta = z.infer<typeof workspaceMetaSchema>;

const TEMP_SUFFIX = '.tmp';

export async function writeWorkspaceMeta(
  fileSystem: FileSystemService,
  path: string,
  meta: WorkspaceMeta,
): Promise<void> {
  const tempPath = `${path}${TEMP_SUFFIX}`;
  await fileSystem.writeFile(tempPath, new TextEncoder().encode(canonicalJsonStringify(meta)));
  await fileSystem.rename(tempPath, path);
}

/** Returns `null` when the descriptor is absent or fails validation — the caller decides whether that is fatal or a rebuild case. */
export async function readWorkspaceMeta(fileSystem: FileSystemService, path: string): Promise<WorkspaceMeta | null> {
  const info = await fileSystem.fileInfo(path);
  if (!info) {
    return null;
  }
  const bytes = await fileSystem.readFile(path);
  const parsed = workspaceMetaSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
  return parsed.success ? parsed.data : null;
}
