mod fs_scope;
mod sql;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(sql::SqlState::default())
        .invoke_handler(tauri::generate_handler![
            sql::sql_unlock,
            sql::sql_execute,
            sql::sql_close,
            fs_scope::allow_workspace_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the my finance health desktop shell");
}
