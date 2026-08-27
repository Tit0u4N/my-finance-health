pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the my finance health desktop shell");
}
