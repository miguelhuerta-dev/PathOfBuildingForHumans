//! The commands the app's pages call, and the session they share: the last
//! character and guide loaded, so a refresh can recompute the comparison.

use crate::{client_log, engine, game_files, guide, item_icons, poe_api};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::sync::Mutex;
use tauri::{Manager, State};

/// A guide and the stage compared against it (None = chosen by the character's level).
/// Kept together so a calculation never sees a guide with another guide's stage.
#[derive(Clone)]
struct LoadedGuide {
    xml: String,
    stage: Option<u32>,
}

/// Last character and guide loaded, so a refresh can recompute the comparison.
#[derive(Default)]
pub struct Session {
    character: Mutex<Option<Value>>,
    guide: Mutex<Option<LoadedGuide>>,
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
pub async fn list_characters(account: String, realm: Option<String>) -> Result<Value, String> {
    poe_api::list_characters(account.trim(), realm.as_deref().unwrap_or("pc")).await
}

/// Downloads the character, calculates it with Path of Building and, when a
/// guide is loaded, compares both.
#[tauri::command]
pub async fn load_character(
    app: tauri::AppHandle,
    session: State<'_, Session>,
    account: String,
    character: String,
    realm: Option<String>,
) -> Result<Value, String> {
    let raw = poe_api::fetch_character(account.trim(), character.trim(), realm.as_deref().unwrap_or("pc")).await?;
    *session.character.lock().unwrap() = Some(raw.clone());

    let guide = session.guide.lock().unwrap().clone();
    match guide {
        Some(LoadedGuide { xml, stage }) => {
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
    let LoadedGuide { xml, stage } = session
        .guide
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Load a guide first.".to_string())?;
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
pub async fn load_guide(app: tauri::AppHandle, session: State<'_, Session>, input: String) -> Result<Value, String> {
    let xml = guide::resolve(&input).await?;
    *session.guide.lock().unwrap() = Some(LoadedGuide { xml, stage: None });
    evaluate_guide(&app, &session).await
}

/// Compares against another stage of the loaded guide (None = by level).
#[tauri::command]
pub async fn select_guide_stage(
    app: tauri::AppHandle,
    session: State<'_, Session>,
    stage: Option<u32>,
) -> Result<Value, String> {
    match session.guide.lock().unwrap().as_mut() {
        Some(guide) => guide.stage = stage,
        None => return Err("Load a guide first.".into()),
    }
    evaluate_guide(&app, &session).await
}

#[tauri::command]
pub fn clear_guide(session: State<'_, Session>) {
    *session.guide.lock().unwrap() = None;
}

#[tauri::command]
pub fn detect_client_log() -> Option<String> {
    client_log::detect().map(|p| p.display().to_string())
}

#[tauri::command]
pub fn watch_client_log(app: tauri::AppHandle, session: State<'_, Session>, path: String) -> Result<(), String> {
    session.watcher.start(app, std::path::PathBuf::from(path))
}

#[tauri::command]
pub fn stop_watching_client_log(session: State<'_, Session>) {
    session.watcher.stop();
}

/// Passive skill icons read from the player's installed game (see `game_files`).
#[tauri::command]
pub async fn passive_icons(
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
