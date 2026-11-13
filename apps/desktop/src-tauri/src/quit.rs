// Clean shutdown for the occupancy lock (audit P6). The lock file is released from JS, and a
// window-close handler alone is not reached by ⌘Q, the Dock menu or an OS shutdown — those end the
// process through `RunEvent::ExitRequested`. While a workspace is open the JS side registers
// itself here; an exit request is then held back, JS is asked to release the lock and close the
// database, and it calls `quit_app` when done. A watchdog exits anyway after a few seconds so a
// stuck session can never keep the app from quitting (the lock's staleness timeout is the
// fallback, as before).

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, RunEvent, State};

/// Event the JS session hook listens to.
pub const QUIT_REQUESTED_EVENT: &str = "mfh://quit-requested";
const QUIT_WATCHDOG: Duration = Duration::from_secs(3);

#[derive(Default)]
pub struct QuitState {
    session_open: AtomicBool,
    quitting: AtomicBool,
}

#[tauri::command]
pub fn set_session_open(state: State<'_, QuitState>, open: bool) {
    state.session_open.store(open, Ordering::SeqCst);
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

pub fn handle_run_event(app: &AppHandle, event: &RunEvent) {
    let RunEvent::ExitRequested { api, code, .. } = event else {
        return;
    };
    // `code` is set when the app itself asked to exit (`quit_app`, the watchdog): let it through.
    if code.is_some() {
        return;
    }
    let state = app.state::<QuitState>();
    if !state.session_open.load(Ordering::SeqCst) || state.quitting.swap(true, Ordering::SeqCst) {
        return;
    }
    api.prevent_exit();
    let _ = app.emit(QUIT_REQUESTED_EVENT, ());
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(QUIT_WATCHDOG);
        handle.exit(0);
    });
}
