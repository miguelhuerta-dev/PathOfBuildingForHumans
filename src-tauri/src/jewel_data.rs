//! Timeless and abyss jewel lookup tables are about 170 MB, most of Path of
//! Building's size, yet only builds with one of those jewels read them. The
//! portable app ships without them; when the engine reports a missing table,
//! it is downloaded once from the pinned Path of Building release.

use serde_json::Value;
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;

/// Printed by Path of Building's jewel data loader when a table is missing.
const MISSING: &str = "Failed to load jewel data: ";

/// Names of the jewel tables the engine could not find in its output.
pub fn missing_tables(stdout: &str) -> Vec<String> {
    let mut names: Vec<String> = stdout
        .lines()
        .filter_map(|line| line.split_once(MISSING).map(|(_, name)| name.trim().to_string()))
        .filter(|name| !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric()))
        .collect();
    names.sort();
    names.dedup();
    names
}

/// Raw file base URL of the Path of Building version in `engine.lock.json`.
fn source_url(engine_dir: &Path) -> Result<String, String> {
    let lock: Value = fs::read_to_string(engine_dir.join("engine.lock.json"))
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .ok_or("The engine version file is missing.")?;
    let pob = &lock["pathOfBuilding"];
    let (Some(repository), Some(tag)) = (pob["repository"].as_str(), pob["tag"].as_str()) else {
        return Err("The engine version file is incomplete.".into());
    };
    let raw = repository.replace("https://github.com/", "https://raw.githubusercontent.com/");
    Ok(format!("{raw}/{tag}/src/Data/TimelessJewelData"))
}

/// `Ok(None)` when the file does not exist in the release.
fn get(client: &reqwest::blocking::Client, url: &str) -> Result<Option<Vec<u8>>, String> {
    let fail = |e: reqwest::Error| format!("Could not download jewel data: {e}");
    // Each part is up to 5 MB; a slow connection gets more than the default limit.
    let response = client.get(url).timeout(Duration::from_secs(120)).send().map_err(fail)?;
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    let response = response.error_for_status().map_err(fail)?;
    Ok(Some(response.bytes().map_err(fail)?.to_vec()))
}

/// Downloads the given tables next to the engine's other jewel data.
///
/// A table that failed once is not retried until the app restarts, so an
/// offline player does not wait for the network on every calculation.
pub fn download(engine_dir: &Path, names: &[String]) -> Result<(), String> {
    static FAILED: Mutex<BTreeSet<String>> = Mutex::new(BTreeSet::new());
    let mut failed = FAILED.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if let Some(name) = names.iter().find(|name| failed.contains(*name)) {
        return Err(format!("Jewel data {name} could not be downloaded earlier."));
    }
    let result = download_tables(engine_dir, names);
    if result.is_err() {
        failed.extend(names.iter().cloned());
    }
    result
}

fn download_tables(engine_dir: &Path, names: &[String]) -> Result<(), String> {
    let base = source_url(engine_dir)?;
    let target = engine_dir
        .join("pob")
        .join("src")
        .join("Data")
        .join("TimelessJewelData");
    let client = crate::http::blocking_client();

    for name in names {
        // Another calculation may have fetched it while this one waited.
        if target.join(format!("{name}.zip")).is_file() || target.join(format!("{name}.zip.part0")).is_file() {
            continue;
        }
        // A table is either one .zip or numbered .zip.partN files.
        let mut files = Vec::new();
        if let Some(bytes) = get(client, &format!("{base}/{name}.zip"))? {
            files.push((format!("{name}.zip"), bytes));
        } else {
            while let Some(bytes) = get(client, &format!("{base}/{name}.zip.part{}", files.len()))? {
                files.push((format!("{name}.zip.part{}", files.len()), bytes));
            }
        }
        if files.is_empty() {
            return Err(format!("Path of Building has no jewel data named {name}."));
        }

        // The loader reads parts from part0 until one is missing, so part0 is
        // written last: an interrupted download never looks complete.
        for (file, bytes) in files.iter().rev() {
            let partial = target.join(format!("{file}.download"));
            fs::write(&partial, bytes)
                .and_then(|()| fs::rename(&partial, target.join(file)))
                .map_err(|e| format!("Could not save jewel data: {e}"))?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_missing_tables_once() {
        let out = "Loading\nFailed to load jewel data: GloriousVanity\nx\nFailed to load jewel data: GloriousVanity\nFailed to load jewel data: ../evil\n";
        assert_eq!(missing_tables(out), vec!["GloriousVanity".to_string()]);
    }

    /// Downloads a single-file table and a split one. Needs network access:
    /// `cargo test -- --ignored`.
    #[test]
    #[ignore]
    fn downloads_tables_from_the_pinned_release() {
        let engine = tempfile::tempdir().unwrap();
        let lock = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("engine")
            .join("engine.lock.json");
        fs::copy(lock, engine.path().join("engine.lock.json")).unwrap();
        let target = engine.path().join("pob/src/Data/TimelessJewelData");
        fs::create_dir_all(&target).unwrap();

        download(engine.path(), &["LethalPride".into(), "AbyssKurgal".into()]).unwrap();
        assert!(target.join("LethalPride.zip").is_file());
        assert!(target.join("AbyssKurgal.zip.part0").is_file());
        assert!(target.join("AbyssKurgal.zip.part4").is_file());
    }
}
