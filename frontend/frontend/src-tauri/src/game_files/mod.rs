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
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

/// Where passive skill icons live in the game's files.
const PASSIVE_ICONS: &str = "art/2dart/skillicons/passives/";

/// Largest side kept: icons are never shown bigger than this on the maps.
const ICON_SIZE: u32 = 96;

/// Names of icons the game does not have, so they are not searched again.
const NOT_IN_GAME: &str = "not-in-game.txt";

/// Icon keys come from the app's tree data, e.g. "AtlasTrees/ThreadNode1" or
/// "MasteryPassiveIcons/PassiveMasteryMineActive" (a few contain spaces).
fn is_valid_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 120
        && !key.contains("..")
        && !key.starts_with('/')
        && key
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '/' | ' ' | '-'))
}

/// Cache file of an icon; "~" cannot appear in a key, so names never collide.
fn file_name(key: &str) -> String {
    format!("{}.png", key.replace('/', "~"))
}

/// Cache folder of one game version: a new patch gets fresh icons.
fn version_dir(cache: &Path, index: &Path) -> Option<PathBuf> {
    let meta = fs::metadata(index).ok()?;
    let modified = meta
        .modified()
        .ok()?
        .duration_since(std::time::UNIX_EPOCH)
        .ok()?
        .as_secs();
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
    format!(
        "data:image/png;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(png)
    )
}

/// Passive skill icons by key. Each value is the path of the cached PNG (shown
/// through the asset protocol) or, when nothing can be cached, a PNG data URL.
/// Keys the game does not have are left out.
pub fn passive_icons(
    keys: &[String],
    client_log: Option<&Path>,
    cache_dir: Option<PathBuf>,
) -> Result<BTreeMap<String, String>, String> {
    let storage = install::find(client_log).ok_or(
        "Path of Exile was not found on this computer. Choose its Client.txt in the dashboard to point to it.",
    )?;
    let bundles_dir = match storage {
        install::Storage::Bundles(dir) => dir,
        install::Storage::Ggpk => {
            return Err("Icons can be read from the Steam or Epic version of Path of Exile;                         the standalone client is not supported yet."
                .into())
        }
    };

    let cache = cache_dir
        .map(|dir| dir.join("game-icons"))
        .and_then(|root| Some((version_dir(&root, &bundles_dir.join("_.index.bin"))?, root)));
    let not_in_game: BTreeSet<String> = cache
        .as_ref()
        .and_then(|(dir, _)| fs::read_to_string(dir.join(NOT_IN_GAME)).ok())
        .map(|text| text.lines().map(String::from).collect())
        .unwrap_or_default();

    let mut icons = BTreeMap::new();
    let mut missing = Vec::new();
    for key in keys
        .iter()
        .filter(|key| is_valid_key(key) && !not_in_game.contains(*key))
    {
        let cached = cache
            .as_ref()
            .map(|(dir, _)| dir.join(file_name(key)))
            .filter(|path| path.is_file());
        match cached {
            Some(path) => {
                icons.insert(key.clone(), path.display().to_string());
            }
            None => missing.push(key),
        }
    }
    if missing.is_empty() {
        return Ok(icons);
    }

    let paths: Vec<String> = missing
        .iter()
        .map(|key| format!("{PASSIVE_ICONS}{}.dds", key.to_lowercase()))
        .collect();
    let mut files = bundles::read_files(&bundles_dir, &paths)?;
    let cache_dir = cache.as_ref().and_then(|(dir, root)| {
        fs::create_dir_all(dir).ok()?;
        remove_other_versions(root, dir);
        Some(dir)
    });

    let mut absent = not_in_game;
    for (key, path) in missing.into_iter().zip(paths) {
        let Some(texture) = files.remove(&path) else {
            absent.insert(key.clone());
            continue;
        };
        // One unreadable texture should not hide every other icon.
        let Ok(png) = dds::decode(&texture)
            .map(|(w, h, rgba)| dds::shrink(w, h, rgba, ICON_SIZE))
            .and_then(|(w, h, rgba)| dds::to_png(w, h, &rgba))
        else {
            continue;
        };
        let saved = cache_dir
            .map(|dir| dir.join(file_name(key)))
            .filter(|path| fs::write(path, &png).is_ok());
        let value = match saved {
            Some(path) => path.display().to_string(),
            None => data_url(&png),
        };
        icons.insert(key.clone(), value);
    }
    if let Some(dir) = cache_dir {
        let _ = fs::write(
            dir.join(NOT_IN_GAME),
            absent.into_iter().collect::<Vec<_>>().join(
                "
",
            ),
        );
    }
    Ok(icons)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_icon_keys() {
        assert!(is_valid_key("AtlasTrees/ThreadNode1"));
        assert!(is_valid_key("Righteous Decree"));
        assert!(!is_valid_key("/etc/passwd"));
        assert!(!is_valid_key("../../secret"));
        assert!(!is_valid_key("C:\\Windows\\x"));
        assert!(!is_valid_key(""));
    }

    /// Every icon a tree's data names, as the app asks for them.
    fn icon_keys_of(tree_file: &str) -> Vec<String> {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../src/data")
            .join(tree_file);
        let tree: serde_json::Value = serde_json::from_slice(&fs::read(path).unwrap()).unwrap();
        let mut keys: Vec<String> = tree["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .flat_map(|node| [&node["icon"], &node["activeIcon"]])
            .filter_map(|icon| icon.as_str().map(String::from))
            .collect();
        keys.sort();
        keys.dedup();
        keys
    }

    fn reads_every_icon(tree_file: &str) {
        let mut keys = icon_keys_of(tree_file);
        keys.push("NotThere/AtAll".into());

        let cache = tempfile::tempdir().unwrap();
        let started = std::time::Instant::now();
        let icons = passive_icons(&keys, None, Some(cache.path().to_path_buf())).unwrap();
        let size: u64 = icons
            .values()
            .filter_map(|path| fs::metadata(path).ok())
            .map(|meta| meta.len())
            .sum();
        println!(
            "{tree_file}: {} of {} icons ({} KB) in {:?}",
            icons.len(),
            keys.len(),
            size / 1024,
            started.elapsed()
        );
        let started = std::time::Instant::now();
        let cached = passive_icons(&keys, None, Some(cache.path().to_path_buf())).unwrap();
        println!("{tree_file}: from the cache in {:?}", started.elapsed());

        let missing: Vec<&String> = keys.iter().filter(|key| !icons.contains_key(*key)).collect();
        assert_eq!(missing, vec!["NotThere/AtAll"], "every real icon is found and decoded");
        assert_eq!(icons, cached);
        assert!(
            icons.values().all(|path| Path::new(path).is_file()),
            "icons are served from the cache"
        );
    }

    /// Reads every icon the app uses from the installed game. Needs Path of
    /// Exile (Steam or Epic): `cargo test --release game_files -- --ignored --nocapture`.
    #[test]
    #[ignore = "needs Path of Exile installed"]
    fn reads_every_atlas_icon_from_the_installed_game() {
        reads_every_icon("atlas/atlasTree.json");
    }

    #[test]
    #[ignore = "needs Path of Exile installed"]
    fn reads_every_passive_icon_from_the_installed_game() {
        reads_every_icon("passives/passiveTree.json");
    }
}
