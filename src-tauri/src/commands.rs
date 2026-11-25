//! The commands the app's pages call, and the session they share: the last
//! character and guide loaded, so a refresh can recompute the comparison.

use crate::{client_log, engine, game_files, guide, item_icons, poe_api, prices};
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

/// The Act 2 bandit choices as Path of Building names them ("None" = killed all three).
const BANDITS: [&str; 4] = ["None", "Oak", "Kraityn", "Alira"];

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
    bandit: Option<String>,
) -> Result<Value, String> {
    let mut raw = poe_api::fetch_character(account.trim(), character.trim(), realm.as_deref().unwrap_or("pc")).await?;
    // Public profiles leave the bandit out; the player picks it in the app.
    if let (Some(bandit), Some(fields)) = (bandit.filter(|b| BANDITS.contains(&b.as_str())), raw.as_object_mut()) {
        fields.insert("bandit".into(), json!(bandit));
    }
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
        None => {
            // The guide's own tree comes with it; it sits beside the guide like a comparison's.
            let mut guide = run_engine(json!({ "kind": "build", "xml": xml, "stage": stage })).await?;
            let passives = guide.as_object_mut().and_then(|fields| fields.remove("passives"));
            json!({ "guide": guide, "passives": passives })
        }
    };
    Ok(with_item_icons(app, result).await)
}

/// Loads a guide from a PoB code or pobb.in / pastebin link.
/// The stage is chosen from the character's level unless the player picks one.
#[tauri::command]
pub async fn load_guide(app: tauri::AppHandle, session: State<'_, Session>, input: String) -> Result<Value, String> {
    let xml = guide::resolve(&input, app.path().app_cache_dir().ok().as_deref()).await?;
    *session.guide.lock().unwrap() = Some(LoadedGuide { xml, stage: None });
    evaluate_guide(&app, &session).await
}

/// Opens a guide without calculating it: on start the last guide is prepared
/// first, so loading the last character calculates both in one go.
#[tauri::command]
pub async fn prepare_guide(app: tauri::AppHandle, session: State<'_, Session>, input: String) -> Result<(), String> {
    let xml = guide::resolve(&input, app.path().app_cache_dir().ok().as_deref()).await?;
    *session.guide.lock().unwrap() = Some(LoadedGuide { xml, stage: None });
    Ok(())
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

/// Opens an item in the Forge: its base, the tier of each modifier, its free
/// affixes and what else can roll on it; for a unique, its league and source.
/// With `slot` (the character's own item), what each modifier would add to the character.
#[tauri::command]
pub async fn forge_item(session: State<'_, Session>, raw: String, slot: Option<String>) -> Result<Value, String> {
    if raw.trim().is_empty() || raw.len() > 20_000 {
        return Err("This item can not be opened in the Forge.".into());
    }
    // For the character's own items, with the character: each modifier is measured on it.
    let character = slot.as_ref().and_then(|_| session.character.lock().unwrap().clone());
    run_engine(json!({ "kind": "forge", "raw": raw, "slot": slot, "character": character })).await
}

/// What a unique sells for in a league, from poe.ninja (cheapest listing first).
#[tauri::command]
pub async fn unique_price(name: String, league: String) -> Result<Vec<prices::Price>, String> {
    let league = if league.trim().is_empty() { "Standard".to_string() } else { league };
    prices::unique_price(name.trim(), league.trim()).await
}

/// The character's best next passives: notables and keystones a few points
/// away, each tried on the character with its path and ranked by gain per point.
#[tauri::command]
pub async fn best_passives(session: State<'_, Session>) -> Result<Value, String> {
    let character = session
        .character
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Connect a character first.".to_string())?;
    run_engine(json!({ "kind": "best_passives", "character": character, "limit": 10 })).await
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

/// Item art by base name, read from the player's installed game (see `game_files`).
#[tauri::command]
pub async fn item_art(
    app: tauri::AppHandle,
    bases: Vec<String>,
    client_log: Option<String>,
) -> Result<BTreeMap<String, String>, String> {
    let cache = app.path().app_cache_dir().ok();
    tauri::async_runtime::spawn_blocking(move || {
        game_files::item_art(&bases, client_log.as_deref().map(std::path::Path::new), cache)
    })
    .await
    .map_err(|e| format!("Reading the game's item art was interrupted: {e}"))?
}

/// The character's class or ascendancy picture, read from the player's installed game (see `game_files`).
#[tauri::command]
pub async fn class_art(
    app: tauri::AppHandle,
    name: String,
    client_log: Option<String>,
) -> Result<Option<String>, String> {
    let cache = app.path().app_cache_dir().ok();
    tauri::async_runtime::spawn_blocking(move || {
        game_files::class_art(&name, client_log.as_deref().map(std::path::Path::new), cache)
    })
    .await
    .map_err(|e| format!("Reading the game's class art was interrupted: {e}"))?
}

/// The author's GitHub profile, linked from the footer.
const PROFILE_URL: &str = "https://github.com/miguelhuerta-dev";

/// Opens an address the app built itself in the system browser.
fn open_in_browser(url: &str) -> Result<(), String> {
    let mut command = if cfg!(windows) {
        let mut command = std::process::Command::new("rundll32");
        command.args(["url.dll,FileProtocolHandler", url]);
        command
    } else if cfg!(target_os = "macos") {
        let mut command = std::process::Command::new("open");
        command.arg(url);
        command
    } else {
        let mut command = std::process::Command::new("xdg-open");
        command.arg(url);
        command
    };
    command
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Could not open the browser: {e}"))
}

/// Opens the author's GitHub profile in the system browser. Only this fixed
/// address can be opened, so the page cannot use it to launch anything else.
#[tauri::command]
pub fn open_profile() -> Result<(), String> {
    open_in_browser(PROFILE_URL)
}

/// Where Path of Exile players make their characters public.
const PRIVACY_URL: &str = "https://www.pathofexile.com/my-account/privacy";

/// Opens pathofexile.com's privacy settings, for the tutorial's public profile
/// step. Like the profile link, only this fixed address can be opened.
#[tauri::command]
pub fn open_privacy_settings() -> Result<(), String> {
    open_in_browser(PRIVACY_URL)
}
