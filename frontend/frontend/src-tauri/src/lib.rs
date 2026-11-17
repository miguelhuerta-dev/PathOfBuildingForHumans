mod client_log;
mod engine;
mod engine_pack;
mod game_files;
mod guide;
mod item_icons;
mod jewel_data;
mod poe_api;

use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::sync::Mutex;
use tauri::{Manager, State};

/// Last character and guide loaded, so a refresh can recompute the comparison.
#[derive(Default)]
struct Session {
    character: Mutex<Option<Value>>,
    guide_xml: Mutex<Option<String>>,
    stage: Mutex<Option<u32>>,
    watcher: client_log::Watcher,
}

async fn run_engine(request: Value) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || engine::run(&request))
        .await
        .map_err(|e| format!("The calculation was interrupted: {e}"))?
}

/// Adds official icons to guide items and upgrades when a guide is involved.
async fn with_item_icons(app: &tauri::AppHandle, mut result: Value) -> Value {
    if result.get("guide").is_some() {
        let index = item_icons::index(app.path().app_cache_dir().ok()).await;
        item_icons::decorate(&mut result, &index);
    }
    result
}

#[tauri::command]
async fn list_characters(account: String, realm: Option<String>) -> Result<Value, String> {
    poe_api::list_characters(account.trim(), realm.as_deref().unwrap_or("pc")).await
}

/// Downloads the character, calculates it with Path of Building and, when a
/// guide is loaded, compares both.
#[tauri::command]
async fn load_character(
    app: tauri::AppHandle,
    session: State<'_, Session>,
    account: String,
    character: String,
    realm: Option<String>,
) -> Result<Value, String> {
    let raw = poe_api::fetch_character(account.trim(), character.trim(), realm.as_deref().unwrap_or("pc")).await?;
    *session.character.lock().unwrap() = Some(raw.clone());

    let guide_xml = session.guide_xml.lock().unwrap().clone();
    let stage = *session.stage.lock().unwrap();
    match guide_xml {
        Some(xml) => {
            let result = run_engine(json!({ "kind": "compare", "character": raw, "xml": xml, "stage": stage })).await?;
            Ok(with_item_icons(&app, result).await)
        }
        None => {
            let character = run_engine(json!({ "kind": "character", "character": raw })).await?;
            Ok(json!({ "character": character }))
        }
    }
}

/// Calculates the loaded guide, compared with the loaded character if any.
async fn evaluate_guide(app: &tauri::AppHandle, session: &Session) -> Result<Value, String> {
    let xml = session
        .guide_xml
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Load a guide first.".to_string())?;
    let stage = *session.stage.lock().unwrap();
    let character = session.character.lock().unwrap().clone();
    let result = match character {
        Some(raw) => run_engine(json!({ "kind": "compare", "character": raw, "xml": xml, "stage": stage })).await?,
        None => json!({ "guide": run_engine(json!({ "kind": "build", "xml": xml, "stage": stage })).await? }),
    };
    Ok(with_item_icons(app, result).await)
}

/// Loads a guide from a PoB code or pobb.in / pastebin link.
/// The stage is chosen from the character's level unless the player picks one.
#[tauri::command]
async fn load_guide(app: tauri::AppHandle, session: State<'_, Session>, input: String) -> Result<Value, String> {
    let xml = guide::resolve(&input).await?;
    *session.guide_xml.lock().unwrap() = Some(xml);
    *session.stage.lock().unwrap() = None;
    evaluate_guide(&app, &session).await
}

/// Compares against another stage of the loaded guide (None = by level).
#[tauri::command]
async fn select_guide_stage(
    app: tauri::AppHandle,
    session: State<'_, Session>,
    stage: Option<u32>,
) -> Result<Value, String> {
    *session.stage.lock().unwrap() = stage;
    evaluate_guide(&app, &session).await
}

#[tauri::command]
fn clear_guide(session: State<'_, Session>) {
    *session.guide_xml.lock().unwrap() = None;
    *session.stage.lock().unwrap() = None;
}

#[tauri::command]
fn detect_client_log() -> Option<String> {
    client_log::detect().map(|p| p.display().to_string())
}

#[tauri::command]
fn watch_client_log(app: tauri::AppHandle, session: State<'_, Session>, path: String) -> Result<(), String> {
    session.watcher.start(app, std::path::PathBuf::from(path))
}

#[tauri::command]
fn stop_watching_client_log(session: State<'_, Session>) {
    session.watcher.stop();
}

/// Passive skill icons read from the player's installed game (see `game_files`).
#[tauri::command]
async fn passive_icons(
    app: tauri::AppHandle,
    keys: Vec<String>,
    client_log: Option<String>,
) -> Result<BTreeMap<String, String>, String> {
    let cache = app.path().app_cache_dir().ok();
    tauri::async_runtime::spawn_blocking(move || {
        game_files::passive_icons(&keys, client_log.as_deref().map(std::path::Path::new), cache)
    })
    .await
    .map_err(|e| format!("Reading the game's icons was interrupted: {e}"))?
}

/// Windows 11: rounded corners and a bronze 1px window border.
/// Ignored silently on Windows 10, which does not support these attributes.
#[cfg(windows)]
fn style_window_border(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::{COLORREF, HWND};
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMWA_BORDER_COLOR, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_ROUND,
    };

    let Ok(hwnd) = window.hwnd() else { return };
    let hwnd = HWND(hwnd.0 as _);

    // COLORREF is 0x00BBGGRR. Bronze #A8864B.
    let bronze = COLORREF(0x004B86A8);
    let corner = DWMWCP_ROUND;

    unsafe {
        let _ = DwmSetWindowAttribute(
            hwnd,
            DWMWA_WINDOW_CORNER_PREFERENCE,
            &corner as *const _ as *const _,
            std::mem::size_of_val(&corner) as u32,
        );
        let _ = DwmSetWindowAttribute(
            hwnd,
            DWMWA_BORDER_COLOR,
            &bronze as *const _ as *const _,
            std::mem::size_of_val(&bronze) as u32,
        );
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Session::default())
        .invoke_handler(tauri::generate_handler![
            list_characters,
            load_character,
            load_guide,
            select_guide_stage,
            clear_guide,
            detect_client_log,
            watch_client_log,
            stop_watching_client_log,
            passive_icons,
        ])
        .setup(|app| {
            // The portable app unpacks its engine on first launch; start now so
            // the first calculation does not wait for it.
            std::thread::spawn(|| {
                let _ = engine::engine_dir();
            });
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                style_window_border(&window);
            }
            #[cfg(not(windows))]
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Path of Building for Humans");
}
