// @repo/data — level 1.
// Applies pending migrations after unlock (start-roadmap.md §9's opening cycle: "... integrity
// check, schema-version check, migration application, ..."), tracked via SQLite's own
// `PRAGMA user_version` rather than a table — a header write, rolled back with the rest of the
// migration's transaction if any statement in it fails.

import { type DomainError, integrityError } from '@repo/domain/primitives/errors';
import { err, ok, type Result } from '@repo/domain/primitives/result';
import type { SqlDriver } from '@repo/platform/services/sqlDriver';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

async function readUserVersion(driver: SqlDriver): Promise<number> {
  // The function form of the pragma (SQLite 3.16+) lets the column be aliased to camelCase —
  // `PRAGMA user_version` itself returns a `user_version` column, which biome's naming
  // convention rule would flag if named as a type property.
  const result = await driver.execute('SELECT user_version AS userVersion FROM pragma_user_version()');
  const row = result.rows[0] as { readonly userVersion?: unknown } | undefined;
  const value = row?.userVersion;
  return typeof value === 'number' ? value : 0;
}

export async function runMigrations(driver: SqlDriver): Promise<Result<number, DomainError>> {
  const currentVersion = await readUserVersion(driver);
  if (currentVersion > SCHEMA_VERSION) {
    return err(
      integrityError(
        `local gateway: this workspace's schema version (${currentVersion}) is newer than this app supports (${SCHEMA_VERSION})`,
      ),
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }
    await driver.execute('BEGIN IMMEDIATE');
    try {
      for (const statement of migration.statements) {
        await driver.execute(statement);
      }
      // PRAGMA values cannot be parameterized — `migration.version` is a literal from the typed
      // MIGRATIONS const above, never user input.
      await driver.execute(`PRAGMA user_version = ${migration.version}`);
      await driver.execute('COMMIT');
    } catch (error) {
      await driver.execute('ROLLBACK').catch(() => undefined);
      return err(
        integrityError(`local gateway: migration to schema version ${migration.version} failed (${String(error)})`),
      );
    }
  }

  return ok(SCHEMA_VERSION);
}
