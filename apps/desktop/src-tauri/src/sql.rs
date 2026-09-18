// The SQLCipher module: the only place in this crate that touches database crypto material.
// Exposes exactly the command surface the platform contract expects
// (packages/platform/src/services/sqlDriver.ts): unlock / execute / close. The derived key never
// crosses back into JS — only the connection handle, kept in `SqlState`, ever sees it.
//
// Argon2id here mirrors packages/data/src/local/crypto/keys.ts's `deriveJournalKey` (same
// algorithm, different salt) so the two keys are derived identically in spirit but never equal.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use rusqlite::functions::FunctionFlags;
use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

/// Owns the single open connection for this process. One workspace open at a time: switching
/// workspaces means the JS side calls `close()` before the next `unlock()`.
pub type SqlState = Arc<Mutex<Option<Connection>>>;

/// No column in this schema legitimately exceeds this range (packages/platform's SqlDriver
/// contract) — enforced on the way in and on the way out, never silently rounded through JSON.
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;

#[derive(Debug, thiserror::Error)]
pub enum SqlError {
    #[error("wrong passphrase")]
    WrongSecret,
    #[error("database integrity check failed: {0}")]
    Integrity(String),
    #[error("no database is open")]
    NotOpen,
    #[error("integer {0} exceeds the safe range")]
    IntegerOutOfRange(i64),
    #[error("key derivation failed: {0}")]
    KeyDerivation(String),
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error("{0}")]
    Other(String),
}

// Tauri commands require their error type to be `Serialize` so it can cross back to JS.
impl serde::Serialize for SqlError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Mirrors `SqlKeyDerivation` (packages/platform/src/services/sqlDriver.ts) field for field.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyDerivation {
    /// Base64, 16 bytes.
    pub salt: String,
    pub memory_ki_b: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

/// Mirrors `SqlQueryResult` (packages/platform/src/services/sqlDriver.ts).
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlQueryResult {
    pub rows: Vec<serde_json::Map<String, serde_json::Value>>,
    pub rows_affected: usize,
}

fn derive_key(secret: &str, derivation: &KeyDerivation) -> Result<[u8; 32], SqlError> {
    let salt = BASE64
        .decode(&derivation.salt)
        .map_err(|error| SqlError::KeyDerivation(error.to_string()))?;
    let params = argon2::Params::new(derivation.memory_ki_b, derivation.iterations, derivation.parallelism, Some(32))
        .map_err(|error| SqlError::KeyDerivation(error.to_string()))?;
    let argon2 = argon2::Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(secret.as_bytes(), &salt, &mut key)
        .map_err(|error| SqlError::KeyDerivation(error.to_string()))?;
    Ok(key)
}

fn json_to_sql(value: &serde_json::Value) -> Result<SqlValue, SqlError> {
    match value {
        serde_json::Value::Null => Ok(SqlValue::Null),
        serde_json::Value::Bool(flag) => Ok(SqlValue::Integer(i64::from(*flag))),
        serde_json::Value::Number(number) => {
            if let Some(integer) = number.as_i64() {
                if integer.unsigned_abs() > MAX_SAFE_INTEGER.unsigned_abs() {
                    return Err(SqlError::IntegerOutOfRange(integer));
                }
                Ok(SqlValue::Integer(integer))
            } else if let Some(float) = number.as_f64() {
                Ok(SqlValue::Real(float))
            } else {
                Err(SqlError::Other("unsupported number parameter".to_string()))
            }
        }
        serde_json::Value::String(text) => Ok(SqlValue::Text(text.clone())),
        serde_json::Value::Object(fields) => match fields.get("b64") {
            Some(serde_json::Value::String(encoded)) => BASE64
                .decode(encoded)
                .map(SqlValue::Blob)
                .map_err(|error| SqlError::Other(error.to_string())),
            _ => Err(SqlError::Other("unsupported object parameter".to_string())),
        },
        serde_json::Value::Array(_) => Err(SqlError::Other("array parameters are not supported".to_string())),
    }
}

fn sql_to_json(value: ValueRef<'_>) -> Result<serde_json::Value, SqlError> {
    match value {
        ValueRef::Null => Ok(serde_json::Value::Null),
        ValueRef::Integer(integer) => {
            if integer.unsigned_abs() > MAX_SAFE_INTEGER.unsigned_abs() {
                return Err(SqlError::IntegerOutOfRange(integer));
            }
            Ok(serde_json::Value::Number(integer.into()))
        }
        ValueRef::Real(float) => serde_json::Number::from_f64(float)
            .map(serde_json::Value::Number)
            .ok_or_else(|| SqlError::Other("non-finite real value".to_string())),
        ValueRef::Text(bytes) => Ok(serde_json::Value::String(String::from_utf8_lossy(bytes).into_owned())),
        ValueRef::Blob(bytes) => {
            let mut object = serde_json::Map::new();
            object.insert("b64".to_string(), serde_json::Value::String(BASE64.encode(bytes)));
            Ok(serde_json::Value::Object(object))
        }
    }
}

fn register_mfh_lower(conn: &Connection) -> Result<(), SqlError> {
    conn.create_scalar_function(
        "mfh_lower",
        1,
        FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC | FunctionFlags::SQLITE_INNOCUOUS,
        |ctx| match ctx.get_raw(0) {
            ValueRef::Null => Ok(None),
            value => {
                let text = value
                    .as_str()
                    .map_err(|error| rusqlite::Error::UserFunctionError(Box::new(error)))?;
                // Unicode simple-lowercase mapping — agrees with JS `String.prototype.toLowerCase`;
                // SQLite's built-in `lower()` is ASCII-only (packages/platform's SqlDriver contract).
                Ok(Some(text.to_lowercase()))
            }
        },
    )?;
    Ok(())
}

fn unlock_blocking(state: &SqlState, database_path: &str, secret: &str, derivation: &KeyDerivation) -> Result<(), SqlError> {
    let key = derive_key(secret, derivation)?;
    let hex_key: String = key.iter().map(|byte| format!("{byte:02x}")).collect();

    let conn = Connection::open(database_path)?;
    // Raw-key mode: no salt is stored inside the encrypted file itself (dbSalt is the Argon2
    // salt, kept externally in .mfhmeta) — SQLCipher keeps its own random page salt in the file
    // header regardless. `PRAGMA key` must be the very first statement on the connection.
    conn.execute_batch(&format!("PRAGMA key = \"x'{hex_key}'\";"))?;

    // Wrong-key probe: an incorrect key makes SQLCipher unable to read the schema at all.
    conn.query_row("SELECT count(*) FROM sqlite_schema", [], |_row| Ok(()))
        .map_err(|_error| SqlError::WrongSecret)?;

    // Never WAL: the database must be a single file at rest in a possibly-synced folder
    // (start-roadmap.md §9). DELETE mode's `-journal` sidecar exists only inside a transaction.
    conn.execute_batch("PRAGMA journal_mode = DELETE; PRAGMA busy_timeout = 5000;")?;

    let integrity_errors: Vec<String> = {
        let mut stmt = conn.prepare("PRAGMA cipher_integrity_check")?;
        let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
        rows.collect::<Result<Vec<_>, _>>()?
    };
    if !integrity_errors.is_empty() {
        return Err(SqlError::Integrity(integrity_errors.join("; ")));
    }

    register_mfh_lower(&conn)?;

    let mut guard = state.lock().expect("sql connection mutex poisoned");
    if let Some(previous) = guard.take() {
        let _ = previous.close();
    }
    *guard = Some(conn);
    Ok(())
}

fn execute_blocking(state: &SqlState, sql: &str, params: &[serde_json::Value]) -> Result<SqlQueryResult, SqlError> {
    let guard = state.lock().expect("sql connection mutex poisoned");
    let conn = guard.as_ref().ok_or(SqlError::NotOpen)?;

    let sql_params = params.iter().map(json_to_sql).collect::<Result<Vec<_>, _>>()?;
    let mut stmt = conn.prepare(sql)?;

    if stmt.column_count() == 0 {
        let rows_affected = stmt.execute(rusqlite::params_from_iter(sql_params.iter()))?;
        return Ok(SqlQueryResult { rows: Vec::new(), rows_affected });
    }

    let column_names: Vec<String> = stmt.column_names().iter().map(|name| (*name).to_string()).collect();
    let mut rows = stmt.query(rusqlite::params_from_iter(sql_params.iter()))?;
    let mut result_rows = Vec::new();
    while let Some(row) = rows.next()? {
        let mut object = serde_json::Map::new();
        for (index, name) in column_names.iter().enumerate() {
            object.insert(name.clone(), sql_to_json(row.get_ref(index)?)?);
        }
        result_rows.push(object);
    }
    Ok(SqlQueryResult { rows: result_rows, rows_affected: 0 })
}

fn close_blocking(state: &SqlState) -> Result<(), SqlError> {
    let mut guard = state.lock().expect("sql connection mutex poisoned");
    if let Some(conn) = guard.take() {
        conn.close().map_err(|(_conn, error)| SqlError::Sqlite(error))?;
    }
    Ok(())
}

async fn run_blocking<T, F>(job: F) -> Result<T, SqlError>
where
    F: FnOnce() -> Result<T, SqlError> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(job)
        .await
        .map_err(|error| SqlError::Other(error.to_string()))?
}

#[tauri::command]
pub async fn sql_unlock(
    state: tauri::State<'_, SqlState>,
    database_path: String,
    secret: String,
    derivation: KeyDerivation,
) -> Result<(), SqlError> {
    let conn_state = state.inner().clone();
    run_blocking(move || unlock_blocking(&conn_state, &database_path, &secret, &derivation)).await
}

#[tauri::command]
pub async fn sql_execute(
    state: tauri::State<'_, SqlState>,
    sql: String,
    params: Option<Vec<serde_json::Value>>,
) -> Result<SqlQueryResult, SqlError> {
    let conn_state = state.inner().clone();
    run_blocking(move || execute_blocking(&conn_state, &sql, &params.unwrap_or_default())).await
}

#[tauri::command]
pub async fn sql_close(state: tauri::State<'_, SqlState>) -> Result<(), SqlError> {
    let conn_state = state.inner().clone();
    run_blocking(move || close_blocking(&conn_state)).await
}

#[cfg(test)]
mod tests {
    use super::*;

    // Minimal but valid Argon2id cost params (m_cost must be >= 8 * parallelism) — fast tests,
    // not a production KDF policy (that lives in packages/data's DEFAULT_KDF).
    fn test_derivation() -> KeyDerivation {
        KeyDerivation { salt: BASE64.encode([1u8; 16]), memory_ki_b: 8, iterations: 1, parallelism: 1 }
    }

    fn open_state(path: &str, secret: &str) -> SqlState {
        let state: SqlState = Arc::new(Mutex::new(None));
        unlock_blocking(&state, path, secret, &test_derivation()).expect("unlock should succeed");
        state
    }

    /// `PRAGMA cipher_integrity_check` needs an actual page file — `:memory:` has none and
    /// `unlock_blocking` fails with "database file is undefined" — so every test that unlocks a
    /// real connection uses a scratch file, cleaned up on the way out (`TempDbPath::drop`).
    struct TempDbPath(std::path::PathBuf);

    impl TempDbPath {
        fn new(label: &str) -> Self {
            let path = std::env::temp_dir().join(format!(
                "mfh-test-{label}-{}-{:?}.mfhdb",
                std::process::id(),
                std::thread::current().id()
            ));
            let _ = std::fs::remove_file(&path);
            Self(path)
        }

        fn as_str(&self) -> &str {
            self.0.to_str().expect("temp path should be valid UTF-8")
        }
    }

    impl Drop for TempDbPath {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.0);
        }
    }

    #[test]
    fn integer_guard_rejects_values_outside_plus_minus_two_pow_53() {
        assert!(matches!(
            json_to_sql(&serde_json::json!(MAX_SAFE_INTEGER + 1)),
            Err(SqlError::IntegerOutOfRange(_))
        ));
        assert!(matches!(
            json_to_sql(&serde_json::json!(-(MAX_SAFE_INTEGER) - 1)),
            Err(SqlError::IntegerOutOfRange(_))
        ));
        assert!(json_to_sql(&serde_json::json!(MAX_SAFE_INTEGER)).is_ok());
        assert!(json_to_sql(&serde_json::json!(-MAX_SAFE_INTEGER)).is_ok());
    }

    #[test]
    fn mfh_lower_matches_unicode_case_folding_on_accented_text() {
        let path = TempDbPath::new("mfh-lower");
        let state = open_state(path.as_str(), "secret");
        execute_blocking(&state, "CREATE TABLE t (name TEXT)", &[]).unwrap();
        execute_blocking(&state, "INSERT INTO t (name) VALUES (?)", &[serde_json::json!("Café Central")]).unwrap();

        let result = execute_blocking(
            &state,
            "SELECT * FROM t WHERE instr(mfh_lower(name), mfh_lower(?)) > 0",
            &[serde_json::json!("CAFÉ")],
        )
        .unwrap();

        assert_eq!(result.rows.len(), 1);
    }

    #[test]
    fn round_trips_a_blob_parameter() {
        let path = TempDbPath::new("blob-roundtrip");
        let state = open_state(path.as_str(), "secret");
        execute_blocking(&state, "CREATE TABLE t (data BLOB)", &[]).unwrap();
        let bytes = [1u8, 2, 3, 255];
        let encoded = BASE64.encode(bytes);
        execute_blocking(&state, "INSERT INTO t (data) VALUES (?)", &[serde_json::json!({ "b64": encoded })]).unwrap();

        let result = execute_blocking(&state, "SELECT * FROM t", &[]).unwrap();

        assert_eq!(result.rows[0].get("data"), Some(&serde_json::json!({ "b64": BASE64.encode(bytes) })));
    }

    #[test]
    fn execute_reports_not_open_before_unlock() {
        let state: SqlState = Arc::new(Mutex::new(None));
        let result = execute_blocking(&state, "SELECT 1", &[]);
        assert!(matches!(result, Err(SqlError::NotOpen)));
    }

    #[test]
    fn wrong_passphrase_is_detected_on_reopen() {
        let path = TempDbPath::new("wrong-secret");

        let state = open_state(path.as_str(), "correct-secret");
        execute_blocking(&state, "CREATE TABLE t (id TEXT)", &[]).unwrap();
        close_blocking(&state).unwrap();

        let reopened: SqlState = Arc::new(Mutex::new(None));
        let result = unlock_blocking(&reopened, path.as_str(), "wrong-secret", &test_derivation());

        assert!(matches!(result, Err(SqlError::WrongSecret)));
    }

    #[test]
    fn data_survives_close_and_reopen_with_the_same_passphrase() {
        let path = TempDbPath::new("persist");

        let state = open_state(path.as_str(), "correct-secret");
        execute_blocking(&state, "CREATE TABLE t (id TEXT)", &[]).unwrap();
        execute_blocking(&state, "INSERT INTO t (id) VALUES ('a')", &[]).unwrap();
        close_blocking(&state).unwrap();

        let reopened = open_state(path.as_str(), "correct-secret");
        let result = execute_blocking(&reopened, "SELECT * FROM t", &[]).unwrap();

        assert_eq!(result.rows.len(), 1);
    }
}
