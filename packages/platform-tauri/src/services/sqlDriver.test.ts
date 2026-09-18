// @repo/platform-tauri — level 1.
// Verifies the invoke() call shape only — the actual SQLCipher behavior lives in Rust
// (apps/desktop/src-tauri/src/sql.rs) and is covered by `cargo test` there.

import { describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => invoke(...args) }));

const { createTauriSqlDriver } = await import('./sqlDriver');

describe('createTauriSqlDriver', () => {
  it('unlock invokes sql_unlock with databasePath, secret and derivation', async () => {
    invoke.mockResolvedValueOnce(undefined);
    const driver = createTauriSqlDriver();
    const derivation = { salt: 'c2FsdA==', memoryKiB: 65536, iterations: 3, parallelism: 1 };

    await driver.unlock('/workspace/w.mfhdb', 's3cret', derivation);

    expect(invoke).toHaveBeenCalledWith('sql_unlock', {
      databasePath: '/workspace/w.mfhdb',
      secret: 's3cret',
      derivation,
    });
  });

  it('execute invokes sql_execute with sql and params and returns its result', async () => {
    const result = { rows: [{ id: '1' }], rowsAffected: 0 };
    invoke.mockResolvedValueOnce(result);
    const driver = createTauriSqlDriver();

    const returned = await driver.execute('SELECT * FROM account WHERE id = ?', ['1']);

    expect(invoke).toHaveBeenCalledWith('sql_execute', { sql: 'SELECT * FROM account WHERE id = ?', params: ['1'] });
    expect(returned).toBe(result);
  });

  it('close invokes sql_close with no arguments', async () => {
    invoke.mockResolvedValueOnce(undefined);
    const driver = createTauriSqlDriver();

    await driver.close();

    expect(invoke).toHaveBeenCalledWith('sql_close');
  });
});
