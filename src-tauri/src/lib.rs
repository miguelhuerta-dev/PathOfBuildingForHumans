mod client_log;
mod commands;
mod engine;
mod engine_pack;
mod game_files;
mod guide;
mod http;
mod item_icons;
mod jewel_data;
mod poe_api;
#[cfg(windows)]
mod window;

#[cfg(windows)]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(commands::Session::default())
        .invoke_handler(tauri::generate_handler![
            commands::list_characters,
            commands::load_character,
            commands::load_guide,
            commands::prepare_guide,
            commands::forge_item,
            commands::select_guide_stage,
            commands::clear_guide,
            commands::detect_client_log,
            commands::watch_client_log,
            commands::stop_watching_client_log,
            commands::passive_icons,
            commands::item_art,
            commands::open_profile,
        ])
        .setup(|app| {
            // Unpack (on first launch) and load Path of Building now, so the first
            // calculation does not wait for it.
            engine::prewarm();
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                window::style_window_border(&window);
            }
            #[cfg(not(windows))]
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Path of Building for Humans");
}
