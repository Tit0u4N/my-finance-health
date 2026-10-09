// The real engine isn't reachable from Node (no SQLCipher build of expo-sqlite), so these pin the
// *sequence* the driver drives — the contract that makes a workspace file portable between
// desktop (sql.rs) and mobile — and the marshalling rules. The Argon2id vector below is the
// reference one from the Argon2 distribution (password "password", salt "somesalt", m=65536,
// t=2, p=1), so the derivation is checked against an independent implementation.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeBase64 } from './base64';

type FakeStatement = {
  executeAsync: ReturnType<typeof vi.fn>;
  getColumnNamesAsync: ReturnType<typeof vi.fn>;
  finalizeAsync: ReturnType<typeof vi.fn>;
};

const calls: string[] = [];
const execAsync = vi.fn();
const getFirstAsync = vi.fn();
const getAllAsync = vi.fn();
const closeAsync = vi.fn();
const prepareAsync = vi.fn();
const openDatabaseAsync = vi.fn();

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: unknown[]) => openDatabaseAsync(...args),
}));

vi.mock('expo-file-system', () => ({
  Paths: { document: 'file:///documents/' },
  File: class {
    readonly name: string;
    readonly parentDirectory: { uri: string };
    constructor(base: string, path: string) {
      const full = `${base}${path}`;
      this.name = full.slice(full.lastIndexOf('/') + 1);
      this.parentDirectory = { uri: `${full.slice(0, full.lastIndexOf('/'))}/` };
    }
  },
}));

const { createExpoSqlDriver } = await import('./sqlDriver');

const REFERENCE_SALT = 'c29tZXNhbHQ='; // "somesalt"
const REFERENCE_KEY_BASE64 = 'CTFhFdXPJO1aFaMaO6Mm5c8y7cJHAph8ArZWb2GRPPc';
const DERIVATION = { salt: REFERENCE_SALT, memoryKiB: 65_536, iterations: 2, parallelism: 1 };

function referenceKeyHex(): string {
  const padded = `${REFERENCE_KEY_BASE64}=`;
  return Array.from(decodeBase64(padded), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function statement(columns: string[], rows: unknown[], changes: number): FakeStatement {
  return {
    executeAsync: vi.fn().mockResolvedValue({ changes, getAllAsync: () => Promise.resolve(rows) }),
    getColumnNamesAsync: vi.fn().mockResolvedValue(columns),
    finalizeAsync: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  calls.length = 0;
  vi.resetAllMocks();
  execAsync.mockImplementation((sql: string) => {
    calls.push(sql);
    return Promise.resolve();
  });
  getFirstAsync.mockImplementation((sql: string) => {
    calls.push(sql);
    return Promise.resolve({ 'count(*)': 0 });
  });
  getAllAsync.mockImplementation((sql: string) => {
    calls.push(sql);
    return Promise.resolve([]);
  });
  closeAsync.mockResolvedValue(undefined);
  openDatabaseAsync.mockResolvedValue({ execAsync, getFirstAsync, getAllAsync, closeAsync, prepareAsync });
});

describe('createExpoSqlDriver.unlock', () => {
  it('opens the file next to its sandbox folder, then follows the desktop sequence exactly', async () => {
    const driver = createExpoSqlDriver();

    await driver.unlock('MyFinanceHealth/workspaces/abc/Home.mfhdb', 'password', DERIVATION);

    expect(openDatabaseAsync).toHaveBeenCalledWith(
      'Home.mfhdb',
      undefined,
      '/documents/MyFinanceHealth/workspaces/abc',
    );
    expect(calls).toEqual([
      `PRAGMA key = "x'${referenceKeyHex()}'";`,
      'SELECT count(*) FROM sqlite_schema',
      'PRAGMA journal_mode = DELETE; PRAGMA busy_timeout = 5000;',
      'PRAGMA cipher_integrity_check',
    ]);
  });

  it('closes the connection and reports a wrong passphrase when the probe read fails', async () => {
    getFirstAsync.mockRejectedValue(new Error('file is not a database'));
    const driver = createExpoSqlDriver();

    await expect(driver.unlock('a/Home.mfhdb', 'nope', DERIVATION)).rejects.toThrow(/wrong passphrase/);
    expect(closeAsync).toHaveBeenCalledTimes(1);
  });

  it('closes the connection and rejects when the integrity check returns rows', async () => {
    getAllAsync.mockResolvedValue([{ cipher_integrity_check: 'page 3' }]);
    const driver = createExpoSqlDriver();

    await expect(driver.unlock('a/Home.mfhdb', 'password', DERIVATION)).rejects.toThrow(/damaged/);
    expect(closeAsync).toHaveBeenCalledTimes(1);
  });

  it('closes the previous connection before unlocking another database', async () => {
    const driver = createExpoSqlDriver();
    await driver.unlock('a/One.mfhdb', 'password', DERIVATION);

    await driver.unlock('a/Two.mfhdb', 'password', DERIVATION);

    expect(closeAsync).toHaveBeenCalledTimes(1);
    expect(openDatabaseAsync).toHaveBeenCalledTimes(2);
  });
});

describe('createExpoSqlDriver.execute', () => {
  async function unlocked() {
    const driver = createExpoSqlDriver();
    await driver.unlock('a/Home.mfhdb', 'password', DERIVATION);
    return driver;
  }

  it('rejects before any database is unlocked', async () => {
    await expect(createExpoSqlDriver().execute('SELECT 1')).rejects.toThrow(/no database is unlocked/);
  });

  it('returns rows for a statement with result columns, and rowsAffected 0', async () => {
    const select = statement(['id'], [{ id: 'a' }], 0);
    prepareAsync.mockResolvedValue(select);
    const driver = await unlocked();

    expect(await driver.execute('SELECT id FROM t WHERE id = ?', ['a'])).toEqual({
      rows: [{ id: 'a' }],
      rowsAffected: 0,
    });
    expect(select.finalizeAsync).toHaveBeenCalledTimes(1);
  });

  it('returns no rows and the change count for a statement without result columns', async () => {
    prepareAsync.mockResolvedValue(statement([], [], 3));
    const driver = await unlocked();

    expect(await driver.execute('DELETE FROM t')).toEqual({ rows: [], rowsAffected: 3 });
  });

  it('binds booleans as 0/1, blobs as bytes and leaves other values alone', async () => {
    const insert = statement([], [], 1);
    prepareAsync.mockResolvedValue(insert);
    const driver = await unlocked();

    await driver.execute('INSERT INTO t VALUES (?, ?, ?, ?, ?)', [true, false, null, 'x', { b64: 'AQID' }]);

    expect(insert.executeAsync).toHaveBeenCalledWith([1, 0, null, 'x', new Uint8Array([1, 2, 3])]);
  });

  it('rejects an integer outside ±2^53 on the way in', async () => {
    prepareAsync.mockResolvedValue(statement([], [], 0));
    const driver = await unlocked();

    await expect(driver.execute('INSERT INTO t VALUES (?)', [2 ** 53 + 2])).rejects.toThrow(/±2\^53/);
  });

  it('rejects an integer outside ±2^53 on the way out', async () => {
    prepareAsync.mockResolvedValue(statement(['n'], [{ n: 2 ** 60 }], 0));
    const driver = await unlocked();

    await expect(driver.execute('SELECT n FROM t')).rejects.toThrow(/±2\^53/);
  });

  it('returns blobs as { b64 } and finalizes the statement even when execution fails', async () => {
    prepareAsync.mockResolvedValue(statement(['b'], [{ b: new Uint8Array([1, 2, 3]) }], 0));
    const driver = await unlocked();
    expect(await driver.execute('SELECT b FROM t')).toEqual({ rows: [{ b: { b64: 'AQID' } }], rowsAffected: 0 });

    const failing = statement(['x'], [], 0);
    failing.executeAsync.mockRejectedValue(new Error('boom'));
    prepareAsync.mockResolvedValue(failing);
    await expect(driver.execute('SELECT x')).rejects.toThrow('boom');
    expect(failing.finalizeAsync).toHaveBeenCalledTimes(1);
  });
});
