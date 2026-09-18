// Runtime fs scope grants for user-picked workspace locations. tauri-plugin-fs's static
// capabilities file can only grant paths known at build time; a workspace file the user picks at
// runtime (anywhere on disk) needs its directory added to the scope explicitly. This grant is
// per-process and NOT persisted across restarts — the JS adapter re-issues it on every launch.

use crate::sql::SqlError;
use tauri_plugin_fs::FsExt;

#[tauri::command]
pub fn allow_workspace_directory(app: tauri::AppHandle, path: String) -> Result<(), SqlError> {
    app.fs_scope()
        .allow_directory(&path, false)
        .map_err(|error| SqlError::Other(error.to_string()))
}
