mod fs_scope;
mod quit;
mod sql;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_biometry::init())
        .manage(sql::SqlState::default())
        .manage(quit::QuitState::default())
        .invoke_handler(tauri::generate_handler![
            sql::sql_unlock,
            sql::sql_execute,
            sql::sql_close,
            fs_scope::allow_workspace_directory,
            quit::set_session_open,
            quit::quit_app,
        ])
        .build(tauri::generate_context!())
        .expect("error while building the my finance health desktop shell")
        .run(|app, event| quit::handle_run_event(app, &event));
}
