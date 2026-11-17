//! Art read from the player's own Path of Exile installation.
//!
//! The app never ships or downloads GGG's art: icons are taken from the game
//! the player already has, decoded to PNG and cached on this computer only.
//! Without the game installed, the app falls back to its own drawings.

mod bundles;
mod dds;
mod install;

pub use install::candidates as game_folders;

use base64::Engine as _;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Where passive skill icons live in the game's files.
const PASSIVE_ICONS: &str = "art/2dart/skillicons/passives/";

/// Icon keys come from the app's Atlas data, e.g. "AtlasTrees/ThreadNode1".
fn is_valid_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 120
        && !key.contains("..")
        && key.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '/')
}

/// Cache folder of one game version: a new patch gets fresh icons.
fn version_dir(cache: &Path, index: &Path) -> Option<PathBuf> {
    let meta = fs::metadata(index).ok()?;
    let modified = meta.modified().ok()?.duration_since(std::time::UNIX_EPOCH).ok()?.as_secs();
    Some(cache.join(format!("{:x}-{modified:x}", meta.len())))
}

fn remove_other_versions(root: &Path, current: &Path) {
    let Ok(entries) = fs::read_dir(root) else { return };
    for entry in entries.flatten() {
        if entry.path() != current {
            let _ = fs::remove_dir_all(entry.path());
        }
    }
}

fn data_url(png: &[u8]) -> String {
    format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(png))
}

/// Passive skill icons by key, as PNG data URLs. Keys the game does not have
/// are left out.
pub fn passive_icons(
    keys: &[String],
    client_log: Option<&Path>,
    cache_dir: Option<PathBuf>,
) -> Result<BTreeMap<String, String>, String> {
    let keys: Vec<&String> = keys.iter().filter(|key| is_valid_key(key)).collect();
    let storage = install::find(client_log).ok_or(
        "Path of Exile was not found on this computer. Choose its Client.txt in the dashboard to point to it.",
    )?;
    let bundles_dir = match storage {
        install::Storage::Bundles(dir) => dir,
        install::Storage::Ggpk => {
            return Err("Icons can be read from the Steam or Epic version of Path of Exile; \
                        the standalone client is not supported yet."
                .into())
        }
    };

    let cache = cache_dir
        .map(|dir| dir.join("game-icons"))
        .and_then(|root| Some((version_dir(&root, &bundles_dir.join("_.index.bin"))?, root)));
    let cached_png = |key: &str| cache.as_ref().map(|(dir, _)| dir.join(format!("{}.png", key.replace('/', "_"))));

    let mut icons = BTreeMap::new();
    let mut missing = Vec::new();
    for key in keys {
        match cached_png(key).and_then(|path| fs::read(path).ok()) {
            Some(png) => {
                icons.insert(key.clone(), data_url(&png));
            }
            None => missing.push(key),
        }
    }
    if missing.is_empty() {
        return Ok(icons);
    }

    let paths: Vec<String> = missing.iter().map(|key| format!("{PASSIVE_ICONS}{}.dds", key.to_lowercase())).collect();
    let mut files = bundles::read_files(&bundles_dir, &paths)?;
    if let Some((dir, root)) = &cache {
        let _ = fs::create_dir_all(dir);
        remove_other_versions(root, dir);
    }
    for (key, path) in missing.into_iter().zip(paths) {
        let Some(texture) = files.remove(&path) else { continue };
        // One unreadable texture should not hide every other icon.
        let Ok(png) = dds::decode(&texture).and_then(|(w, h, rgba)| dds::to_png(w, h, &rgba)) else {
            continue;
        };
        if let Some(path) = cached_png(key) {
            let _ = fs::write(path, &png);
        }
        icons.insert(key.clone(), data_url(&png));
    }
    Ok(icons)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_icon_keys() {
        assert!(is_valid_key("AtlasTrees/ThreadNode1"));
        assert!(!is_valid_key("../../secret"));
        assert!(!is_valid_key("C:\\Windows\\x"));
        assert!(!is_valid_key(""));
    }

    /// Reads every Atlas icon the app uses from the installed game. Needs Path
    /// of Exile (Steam or Epic): `cargo test game_files -- --ignored --nocapture`.
    #[test]
    #[ignore = "needs Path of Exile installed"]
    fn reads_every_atlas_icon_from_the_installed_game() {
        let tree = Path::new(env!("CARGO_MANIFEST_DIR")).join("../src/data/atlas/atlasTree.json");
        let tree: serde_json::Value = serde_json::from_slice(&fs::read(tree).unwrap()).unwrap();
        let mut keys: Vec<String> = tree["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|node| node["icon"].as_str().map(String::from))
            .collect();
        keys.sort();
        keys.dedup();
        keys.push("AtlasTrees/NotThere".into());

        let cache = tempfile::tempdir().unwrap();
        let started = std::time::Instant::now();
        let icons = passive_icons(&keys, None, Some(cache.path().to_path_buf())).unwrap();
        println!("{} of {} icons read in {:?}", icons.len(), keys.len(), started.elapsed());
        let started = std::time::Instant::now();
        let cached = passive_icons(&keys, None, Some(cache.path().to_path_buf())).unwrap();
        println!("from the cache in {:?}", started.elapsed());

        assert_eq!(icons.len(), keys.len() - 1, "every real icon is found and decoded");
        assert!(!icons.contains_key("AtlasTrees/NotThere"));
        assert_eq!(icons, cached);
        assert!(icons.values().all(|url| url.starts_with("data:image/png;base64,")));
    }
}
