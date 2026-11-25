//! Art read from the player's own Path of Exile installation.
//!
//! The app never ships or downloads GGG's art: icons are taken from the game
//! the player already has, decoded to PNG and cached on this computer only.
//! Without the game installed, the app falls back to its own drawings.

mod bundles;
mod dat;
mod dds;
mod install;
mod item_art;

pub use install::candidates as game_folders;

use base64::Engine as _;
use std::collections::{BTreeMap, BTreeSet, HashMap};
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

/// The game's `Bundles2` folder.
fn game_bundles(client_log: Option<&Path>) -> Result<PathBuf, String> {
    let storage = install::find(client_log).ok_or(
        "Path of Exile was not found on this computer. Choose its Client.txt in the dashboard to point to it.",
    )?;
    match storage {
        install::Storage::Bundles(dir) => Ok(dir),
        install::Storage::Ggpk => Err("Icons can be read from the Steam or Epic version of Path of Exile; \
             the standalone client is not supported yet."
            .into()),
    }
}

/// The cache folder of the installed game version and the root holding every version.
fn version_cache(cache_dir: Option<PathBuf>, bundles_dir: &Path) -> Option<(PathBuf, PathBuf)> {
    let root = cache_dir?.join("game-icons");
    Some((version_dir(&root, &bundles_dir.join("_.index.bin"))?, root))
}

/// Creates the version's cache folder (and `sub` in it), dropping older versions.
fn open_cache(cache: Option<&(PathBuf, PathBuf)>, sub: &str) -> Option<PathBuf> {
    let (dir, root) = cache?;
    let target = dir.join(sub);
    fs::create_dir_all(&target).ok()?;
    remove_other_versions(root, dir);
    Some(target)
}

/// Saves a PNG in the cache, or returns it as a data URL when it cannot be saved.
fn store_png(dir: Option<&Path>, name: &str, png: &[u8]) -> String {
    let saved = dir
        .map(|dir| dir.join(name))
        .filter(|path| fs::write(path, png).is_ok());
    match saved {
        Some(path) => path.display().to_string(),
        None => data_url(png),
    }
}

/// A texture from the game as a PNG no larger than `size` on its longest side.
fn texture_png(texture: &[u8], size: u32) -> Result<Vec<u8>, String> {
    dds::decode(texture)
        .map(|(w, h, rgba)| dds::shrink(w, h, rgba, size))
        .and_then(|(w, h, rgba)| dds::to_png(w, h, &rgba))
}

/// Passive skill icons by key. Each value is the path of the cached PNG (shown
/// through the asset protocol) or, when nothing can be cached, a PNG data URL.
/// Keys the game does not have are left out.
pub fn passive_icons(
    keys: &[String],
    client_log: Option<&Path>,
    cache_dir: Option<PathBuf>,
) -> Result<BTreeMap<String, String>, String> {
    let bundles_dir = game_bundles(client_log)?;
    let cache = version_cache(cache_dir, &bundles_dir);
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
    let cache_dir = open_cache(cache.as_ref(), "");

    let mut absent = not_in_game;
    for (key, path) in missing.into_iter().zip(paths) {
        let Some(texture) = files.remove(&path) else {
            absent.insert(key.clone());
            continue;
        };
        // One unreadable texture should not hide every other icon.
        let Ok(png) = texture_png(&texture, ICON_SIZE) else {
            continue;
        };
        icons.insert(key.clone(), store_png(cache_dir.as_deref(), &file_name(key), &png));
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

/// Largest side kept for item art: the biggest items (2×4) are about 190 px tall in the game.
const ITEM_ART_SIZE: u32 = 192;
/// Cache folder of item art, inside the game version's folder. Numbered: a new
/// way of drawing the art must not reuse older pictures.
const ITEM_ART_DIR: &str = "item-art-2";
/// Base name → art path, built once per game version from its data tables.
const ITEM_ART_INDEX: &str = "index.json";

/// Item base names as Path of Building gives them ("Divine Life Flask", "Maelström Staff").
fn is_valid_base(base: &str) -> bool {
    !base.is_empty()
        && base.chars().count() <= 80
        && base
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, ' ' | '\'' | '-' | ',' | '.'))
}

/// Cache file of a piece of item art: its path under `Art/2DItems/`, flattened.
fn art_file_name(art: &str) -> Option<String> {
    let lower = art.to_lowercase();
    let rest = lower.strip_prefix(item_art::ART_PREFIX)?.strip_suffix(".dds")?;
    let safe = !rest.is_empty()
        && !rest.contains("..")
        && rest
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '/' | '-' | ' '));
    safe.then(|| format!("{}.png", rest.replace('/', "~")))
}

/// The base name → art path index, from the cache or the game's data tables.
fn art_index(bundles_dir: &Path, cache: Option<&Path>) -> Result<HashMap<String, String>, String> {
    let cached = cache
        .and_then(|dir| fs::read(dir.join(ITEM_ART_INDEX)).ok())
        .and_then(|bytes| serde_json::from_slice(&bytes).ok());
    if let Some(index) = cached {
        return Ok(index);
    }
    let paths: Vec<String> = item_art::BASE_ITEM_TYPES
        .iter()
        .chain(&item_art::ITEM_VISUAL_IDENTITY)
        .map(|path| path.to_string())
        .collect();
    let files = bundles::read_files(bundles_dir, &paths)?;
    let table = |names: [&str; 2]| names.iter().find_map(|name| files.get(*name));
    let (Some(bases), Some(visuals)) = (table(item_art::BASE_ITEM_TYPES), table(item_art::ITEM_VISUAL_IDENTITY)) else {
        return Err("The game's item data was not found; item art is unavailable.".into());
    };
    let index = item_art::art_by_base(bases, visuals)?;
    if let Some(dir) = cache {
        let _ = fs::write(dir.join(ITEM_ART_INDEX), serde_json::to_vec(&index).unwrap_or_default());
    }
    Ok(index)
}

/// Draws `top` over `bottom` (RGBA pixels of the same size).
fn blend(bottom: &mut [u8], top: &[u8]) {
    for (b, t) in bottom.as_chunks_mut::<4>().0.iter_mut().zip(top.as_chunks::<4>().0) {
        let ta = f32::from(t[3]) / 255.0;
        let ba = f32::from(b[3]) / 255.0;
        let out = ta + ba * (1.0 - ta);
        if out <= 0.0 {
            continue;
        }
        for c in 0..3 {
            let v = (f32::from(t[c]) * ta + f32::from(b[c]) * ba * (1.0 - ta)) / out;
            b[c] = v.round() as u8;
        }
        b[3] = (out * 255.0).round() as u8;
    }
}

/// A piece of item art as a PNG; flasks are put together from their layers.
fn item_png(path: &str, texture: &[u8]) -> Result<Vec<u8>, String> {
    let (width, height, rgba) = dds::decode(texture)?;
    let is_flask = path.to_lowercase().starts_with("art/2ditems/flasks/");
    let (width, height, rgba) = match is_flask.then(|| compose_flask(width, height, &rgba, liquid_colour(path))).flatten() {
        Some(flask) => flask,
        None => (width, height, rgba),
    };
    let (width, height, rgba) = dds::shrink(width, height, rgba, ITEM_ART_SIZE);
    dds::to_png(width, height, &rgba)
}

/// Utility flasks share one green liquid that the game colours as it draws it.
/// Each one is given the colour of the stone it is named after; life, mana and
/// hybrid flasks (and Jade, which is green) keep the colour of their texture.
fn liquid_colour(path: &str) -> Option<[f32; 3]> {
    let stem = path.rsplit('/').next()?.to_lowercase();
    let rgb: [u8; 3] = match stem.trim_end_matches(".dds") {
        "granite" => [150, 128, 104],
        "sprint" => [196, 214, 226],
        "silver" => [206, 210, 222],
        "amethyst" => [158, 82, 214],
        "phaseflask01" => [232, 232, 240],
        "aquamarine" => [96, 214, 222],
        "stone" => [118, 116, 112],
        "bismuth" => [212, 120, 214],
        "antistunflask" => [222, 72, 84],
        "diamond" => [236, 240, 255],
        "goldflask" => [236, 190, 72],
        "wardflask01" => [168, 150, 136],
        "ruby" => [226, 42, 52],
        "sapphire" => [52, 96, 232],
        "stibnite" => [92, 96, 110],
        "gold" => [232, 214, 70],
        "topaz" => [238, 196, 54],
        _ => return None,
    };
    Some(rgb.map(f32::from))
}

/// Flask art is three pictures side by side: the glass, its metal frame and
/// the liquid. The game draws the liquid inside the glass, then the frame.
fn compose_flask(width: u32, height: u32, rgba: &[u8], tint: Option<[f32; 3]>) -> Option<(u32, u32, Vec<u8>)> {
    // Each layer is a 1×2 flask (78×156 px), with a little padding after the last.
    let frame = height / 2;
    if frame == 0 || frame * 3 > width || frame * 4 <= width {
        return None;
    }
    let layer = |index: u32| -> Vec<u8> {
        rgba.chunks_exact(width as usize * 4)
            .flat_map(|row| &row[(index * frame * 4) as usize..((index + 1) * frame * 4) as usize])
            .copied()
            .collect()
    };
    let (glass, metal, mut liquid) = (layer(0), layer(1), layer(2));
    // The liquid fills the glass (and only the glass); the metal goes on top.
    for (l, g) in liquid.as_chunks_mut::<4>().0.iter_mut().zip(glass.as_chunks::<4>().0) {
        l[3] = l[3].min(g[3]);
        // The shared liquid is green; its brightness is kept and the colour replaced.
        if let Some(tint) = tint {
            let light = (0.3 * f32::from(l[0]) + 0.59 * f32::from(l[1]) + 0.11 * f32::from(l[2])) / 96.0;
            for (channel, colour) in l[..3].iter_mut().zip(tint) {
                *channel = (colour * light).clamp(0.0, 255.0) as u8;
            }
        }
    }
    let mut out = glass;
    blend(&mut out, &liquid);
    blend(&mut out, &metal);
    Some((frame, height, out))
}

/// Item art by base name, for items without an official icon (magic flasks,
/// guide items). Values are cached PNG paths (shown through the asset
/// protocol) or PNG data URLs; bases the game has no art for are left out.
pub fn item_art(
    bases: &[String],
    client_log: Option<&Path>,
    cache_dir: Option<PathBuf>,
) -> Result<BTreeMap<String, String>, String> {
    let bundles_dir = game_bundles(client_log)?;
    let cache = version_cache(cache_dir, &bundles_dir);
    let dir = open_cache(cache.as_ref(), ITEM_ART_DIR);
    let index = art_index(&bundles_dir, dir.as_deref())?;

    let mut art = BTreeMap::new();
    let mut missing = Vec::new();
    for base in bases.iter().filter(|base| is_valid_base(base)) {
        let Some((path, file)) = index.get(base).and_then(|path| Some((path, art_file_name(path)?))) else {
            continue;
        };
        match dir.as_ref().map(|dir| dir.join(&file)).filter(|path| path.is_file()) {
            Some(cached) => {
                art.insert(base.clone(), cached.display().to_string());
            }
            None => missing.push((base, path.clone(), file)),
        }
    }
    if missing.is_empty() {
        return Ok(art);
    }

    let paths: Vec<String> = missing.iter().map(|(_, path, _)| path.clone()).collect();
    let files = bundles::read_files(&bundles_dir, &paths)?;
    for (base, path, file) in missing {
        // Several bases can share one picture; an unreadable one hides only itself.
        let Some(Ok(png)) = files.get(&path).map(|texture| item_png(&path, texture)) else {
            continue;
        };
        art.insert(base.clone(), store_png(dir.as_deref(), &file, &png));
    }
    Ok(art)
}

/// Largest side kept for class art: it is shown about 112 px wide, twice that on sharp screens.
const CLASS_ART_SIZE: u32 = 256;
/// Cache folder of ascendancy art, inside the game version's folder.
const CLASS_ART_DIR: &str = "class-art";
/// Where the ascendancy pictures of the passive tree live.
const CLASS_ART_ROOT: &str = "art/textures/interface/2d/2dart/uiimages/ingame/classes/";

/// The game's folder for an ascendancy, by the name public profiles give it.
/// A fixed table: only these pictures can ever be read.
fn class_art_folder(ascendancy: &str) -> Option<&'static str> {
    Some(match ascendancy.trim().to_lowercase().as_str() {
        "juggernaut" => "str/juggernaut",
        "berserker" => "str/berserker",
        "chieftain" => "str/chieftain",
        "deadeye" => "dex/deadeye",
        "pathfinder" => "dex/pathfinder",
        // The Warden took the Raider's place in 3.25; the game kept the old folder.
        "warden" | "raider" => "dex/raider",
        "occultist" => "int/occultist",
        "elementalist" => "int/elementalist",
        "necromancer" => "int/necromancer",
        "slayer" => "strdex/slayer",
        "gladiator" => "strdex/gladiator",
        "champion" => "strdex/champion",
        "inquisitor" => "strint/inquisitor",
        "hierophant" => "strint/hierophant",
        "guardian" => "strint/guardian",
        "assassin" => "dexint/assassin",
        "trickster" => "dexint/trickster",
        "saboteur" => "dexint/saboteur",
        "ascendant" => "strdexint/ascendant",
        _ => return None,
    })
}

/// The game's folder for a base class: its start on the passive tree.
fn base_class_folder(class: &str) -> Option<&'static str> {
    Some(match class.trim().to_lowercase().as_str() {
        "marauder" => "str",
        "ranger" => "dex",
        "witch" => "int",
        "duelist" => "strdex",
        "templar" => "strint",
        "shadow" => "dexint",
        "scion" => "strdexint",
        _ => return None,
    })
}

/// The class start emblem has claws and ornaments around a disc; only the
/// disc (the class's face between the three attribute gems) is kept, as a
/// square around its centre: (centre x, centre y, half side) as parts of the width.
const BASE_CLASS_DISC: (f32, f32, f32) = (0.498, 0.47, 0.32);

/// A square cut out of RGBA pixels, clamped to the picture.
fn crop_square(width: u32, height: u32, rgba: &[u8], (cx, cy, half): (f32, f32, f32)) -> (u32, u32, Vec<u8>) {
    let w = width as f32;
    let side = ((2.0 * half * w).round() as u32).clamp(1, width.min(height));
    let left = ((cx * w - half * w).round().max(0.0) as u32).min(width - side);
    let top = ((cy * w - half * w).round().max(0.0) as u32).min(height - side);
    let mut out = Vec::with_capacity((side * side * 4) as usize);
    for row in top..top + side {
        let start = ((row * width + left) * 4) as usize;
        out.extend_from_slice(&rgba[start..start + (side * 4) as usize]);
    }
    (side, side, out)
}

/// The class picture of a character, read from the player's game: its
/// ascendancy's round picture from the passive tree once it has one, otherwise
/// its base class's emblem. `None` for names the game has no picture for.
pub fn class_art(
    name: &str,
    client_log: Option<&Path>,
    cache_dir: Option<PathBuf>,
) -> Result<Option<String>, String> {
    let (path, file, disc) = if let Some(folder) = class_art_folder(name) {
        (
            format!("{CLASS_ART_ROOT}{folder}/passiveskillscreenbackground.dds"),
            format!("{}.png", folder.replace('/', "~")),
            None,
        )
    } else if let Some(folder) = base_class_folder(name) {
        (
            format!("{CLASS_ART_ROOT}{folder}/passiveskillscreenstartnodebackground.dds"),
            format!("class~{folder}.png"),
            Some(BASE_CLASS_DISC),
        )
    } else {
        return Ok(None);
    };
    let bundles_dir = game_bundles(client_log)?;
    let cache = version_cache(cache_dir, &bundles_dir);
    let dir = open_cache(cache.as_ref(), CLASS_ART_DIR);
    if let Some(cached) = dir.as_ref().map(|dir| dir.join(&file)).filter(|path| path.is_file()) {
        return Ok(Some(cached.display().to_string()));
    }

    let files = bundles::read_files(&bundles_dir, std::slice::from_ref(&path))?;
    let Some(texture) = files.get(&path) else {
        return Ok(None);
    };
    let (width, height, rgba) = dds::decode(texture)?;
    let (width, height, rgba) = match disc {
        Some(disc) => crop_square(width, height, &rgba, disc),
        None => (width, height, rgba),
    };
    let (width, height, rgba) = dds::shrink(width, height, rgba, CLASS_ART_SIZE);
    let png = dds::to_png(width, height, &rgba)?;
    Ok(Some(store_png(dir.as_deref(), &file, &png)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn knows_every_ascendancy_folder() {
        assert_eq!(class_art_folder("Juggernaut"), Some("str/juggernaut"));
        assert_eq!(class_art_folder(" hierophant "), Some("strint/hierophant"));
        assert_eq!(class_art_folder("Warden"), Some("dex/raider"));
        assert_eq!(class_art_folder("None"), None);
        assert_eq!(class_art_folder("Witch"), None, "base classes have no ascendancy picture");
        assert_eq!(class_art_folder("../../x"), None);
        assert_eq!(base_class_folder("Witch"), Some("int"));
        assert_eq!(base_class_folder("Scion"), Some("strdexint"));
        assert_eq!(base_class_folder("Hierophant"), None);
    }

    #[test]
    fn crops_the_class_disc() {
        // 4×2 pixels, each pixel's red value is its index.
        let rgba: Vec<u8> = (0..8u8).flat_map(|i| [i, 0, 0, 255]).collect();
        let (w, h, out) = crop_square(4, 2, &rgba, (0.5, 0.25, 0.25));
        assert_eq!((w, h), (2, 2));
        assert_eq!(out.chunks(4).map(|p| p[0]).collect::<Vec<_>>(), [1, 2, 5, 6]);
        // A square larger than the picture is clamped to it.
        let (w, h, _) = crop_square(4, 2, &rgba, (0.5, 0.5, 2.0));
        assert_eq!((w, h), (2, 2));
    }

    /// Every ascendancy picture, read from the installed game:
    /// `cargo test --release game_files -- --ignored --nocapture`.
    #[test]
    #[ignore = "needs Path of Exile installed"]
    fn reads_every_ascendancy_picture_from_the_installed_game() {
        let names = [
            "Juggernaut", "Berserker", "Chieftain", "Deadeye", "Pathfinder", "Warden", "Occultist",
            "Elementalist", "Necromancer", "Slayer", "Gladiator", "Champion", "Inquisitor", "Hierophant",
            "Guardian", "Assassin", "Trickster", "Saboteur", "Ascendant", "Marauder", "Ranger", "Witch",
            "Duelist", "Templar", "Shadow", "Scion",
        ];
        let cache = tempfile::tempdir().unwrap();
        for name in names {
            let art = class_art(name, None, Some(cache.path().to_path_buf())).unwrap();
            let path = art.unwrap_or_else(|| panic!("{name} has a picture"));
            assert!(fs::read(&path).unwrap().starts_with(b"\x89PNG"), "{name} is a PNG");
            assert_eq!(class_art(name, None, Some(cache.path().to_path_buf())).unwrap(), Some(path), "{name} cached");
        }
    }

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

    #[test]
    fn accepts_only_item_base_names() {
        assert!(is_valid_base("Divine Life Flask"));
        assert!(is_valid_base("Maelström Staff"));
        assert!(is_valid_base("Two-Toned Boots"));
        assert!(!is_valid_base("../x"));
        assert!(!is_valid_base("Art/2DItems/x"));
        assert!(!is_valid_base(""));
    }

    #[test]
    fn puts_flasks_together_from_their_layers() {
        // 3 layers of 1×2 pixels: glass (top pixel only), metal (none), red liquid.
        let px = |r, g, b, a| [r, g, b, a];
        let rows = [
            [px(255, 255, 255, 0), px(0, 0, 0, 0), px(255, 0, 0, 255)],
            [px(0, 0, 0, 0), px(0, 0, 0, 0), px(255, 0, 0, 255)],
        ];
        let rgba: Vec<u8> = rows.iter().flatten().flatten().copied().collect();
        let (w, h, out) = compose_flask(3, 2, &rgba, None).unwrap();
        assert_eq!((w, h), (1, 2));
        // The liquid shows only inside the glass: here the glass is clear, so nothing shows.
        assert_eq!(out[3], 0);
        assert_eq!(out[7], 0);
        assert!(compose_flask(4, 2, &[0; 32], None).is_none(), "not three layers");
        assert!(compose_flask(3, 6, &[0; 72], None).is_none(), "a single upright flask");
    }

    #[test]
    fn names_item_art_cache_files() {
        assert_eq!(
            art_file_name("Art/2DItems/Flasks/DivineLifeFlask.dds").as_deref(),
            Some("flasks~divinelifeflask.png")
        );
        assert_eq!(art_file_name("Art/Textures/Other.dds"), None);
        assert_eq!(art_file_name("Art/2DItems/../../x.dds"), None);
        assert_eq!(art_file_name("Art/2DItems/Flasks/a.png"), None);
    }

    /// Item art for magic flasks and armour bases, read from the installed game:
    /// `cargo test --release game_files -- --ignored --nocapture`.
    #[test]
    #[ignore = "needs Path of Exile installed"]
    fn reads_item_art_from_the_installed_game() {
        let bases: Vec<String> = [
            "Divine Life Flask",
            "Quicksilver Flask",
            "Granite Flask",
            "Vaal Regalia",
            "Titanium Spirit Shield",
            "Two-Toned Boots",
            "Sorcerer Gloves",
            "Hubris Circlet",
            "Not An Item",
        ]
        .map(String::from)
        .into();

        let cache = tempfile::tempdir().unwrap();
        let started = std::time::Instant::now();
        let art = item_art(&bases, None, Some(cache.path().to_path_buf())).unwrap();
        println!("{} pictures in {:?}", art.len(), started.elapsed());
        let started = std::time::Instant::now();
        let cached = item_art(&bases, None, Some(cache.path().to_path_buf())).unwrap();
        println!("from the cache in {:?}", started.elapsed());

        let missing: Vec<&String> = bases.iter().filter(|base| !art.contains_key(*base)).collect();
        assert_eq!(missing, vec!["Not An Item"], "every real base has art");
        assert_eq!(art, cached);
        assert!(art["Divine Life Flask"].contains("flasks~"));
        for path in art.values() {
            let png = fs::read(path).unwrap();
            assert!(png.starts_with(b"\x89PNG"), "{path} is a PNG");
        }
    }
}
