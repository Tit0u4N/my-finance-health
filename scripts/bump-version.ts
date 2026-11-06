// Sets the app version everywhere it is declared, so a release tag and the shipped bundles agree.
// Usage: bun run release:version <major.minor.patch>   (see CONTRIBUTING.md § Releases)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SEMVER = /^\d+\.\d+\.\d+$/;

interface VersionedFile {
  readonly path: string;
  /** Matches the version declaration; the version itself is the second capture group. */
  readonly pattern: RegExp;
}

const FILES: readonly VersionedFile[] = [
  { path: 'apps/web/package.json', pattern: /^( {2}"version": ")([^"]+)(")/m },
  { path: 'apps/desktop/package.json', pattern: /^( {2}"version": ")([^"]+)(")/m },
  { path: 'apps/mobile/package.json', pattern: /^( {2}"version": ")([^"]+)(")/m },
  { path: 'apps/mobile/app.json', pattern: /^( {4}"version": ")([^"]+)(")/m },
  { path: 'apps/desktop/src-tauri/tauri.conf.json', pattern: /^( {2}"version": ")([^"]+)(")/m },
  { path: 'apps/desktop/src-tauri/Cargo.toml', pattern: /^(version = ")([^"]+)(")/m },
  {
    path: 'apps/desktop/src-tauri/Cargo.lock',
    pattern: /^(name = "my-finance-health-desktop"\nversion = ")([^"]+)(")/m,
  },
];

const version = process.argv[2];
if (version === undefined || !SEMVER.test(version)) {
  console.error('Usage: bun run release:version <major.minor.patch>, e.g. 1.2.0');
  process.exit(1);
}

const root = join(import.meta.dir, '..');
for (const file of FILES) {
  const path = join(root, file.path);
  const content = readFileSync(path, 'utf8');
  const match = file.pattern.exec(content);
  if (match === null) {
    console.error(`No version declaration found in ${file.path}`);
    process.exit(1);
  }
  writeFileSync(path, content.replace(file.pattern, `$1${version}$3`));
  console.log(`${file.path}: ${match[2]} -> ${version}`);
}
