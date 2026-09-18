// @repo/data — level 1.

import { describe, expect, it } from 'vitest';
import { ENTITY_NAMES } from '../../gateway/entityName';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

describe('MIGRATIONS', () => {
  it('the v1 migration creates one table per entity plus the state table', () => {
    const v1 = MIGRATIONS.find((migration) => migration.version === 1);
    expect(v1).toBeDefined();

    for (const entity of ENTITY_NAMES) {
      expect(v1?.statements.some((statement) => statement.includes(`CREATE TABLE "${entity}"`))).toBe(true);
    }
    expect(v1?.statements.some((statement) => statement.includes('CREATE TABLE "mfh_state"'))).toBe(true);
  });

  it('exposes a schema version matching the highest migration', () => {
    const highest = Math.max(...MIGRATIONS.map((migration) => migration.version));
    expect(SCHEMA_VERSION).toBe(highest);
  });
});
