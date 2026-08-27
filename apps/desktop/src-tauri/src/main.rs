// Prevents an extra console window from opening alongside the app on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    my_finance_health_desktop_lib::run()
}
