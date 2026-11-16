//! Official item icons for items that do not come from the character
//! (guide items), looked up by name in poe.ninja's public item data.
//!
//! Only `https://web.poecdn.com/` URLs are kept: the icons are shown from
//! GGG's image server and never downloaded into the app. The name → URL index
//! is cached on disk for a week, so poe.ninja is contacted rarely.

use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::Duration;

const OVERVIEW: &str = "https://poe.ninja/poe1/api/economy/stash/current/item/overview";
const TYPES: [&str; 6] = ["BaseType", "UniqueWeapon", "UniqueArmour", "UniqueAccessory", "UniqueFlask", "UniqueJewel"];
const CACHE_FILE: &str = "item-icons.json";
const CACHE_TTL: Duration = Duration::from_secs(7 * 24 * 60 * 60);
const ICON_PREFIX: &str = "https://web.poecdn.com/";

type Index = HashMap<String, String>;

fn read_cache(path: &Path) -> Option<Index> {
    let age = std::fs::metadata(path).ok()?.modified().ok()?.elapsed().ok()?;
    if age > CACHE_TTL {
        return None;
    }
    serde_json::from_slice(&std::fs::read(path).ok()?).ok()
}

async fn download() -> Result<Index, String> {
    let client = reqwest::Client::builder()
        .user_agent(crate::poe_api::user_agent())
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let mut index = Index::new();
    for kind in TYPES {
        let body: Value = client
            .get(OVERVIEW)
            .query(&[("league", "Standard"), ("type", kind)])
            .send()
            .await
            .and_then(|r| r.error_for_status())
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;
        for line in body.get("lines").and_then(Value::as_array).into_iter().flatten() {
            let (Some(name), Some(icon)) = (line.get("name").and_then(Value::as_str), line.get("icon").and_then(Value::as_str))
            else {
                continue;
            };
            if icon.starts_with(ICON_PREFIX) {
                index.entry(name.to_string()).or_insert_with(|| icon.to_string());
            }
        }
    }
    Ok(index)
}

/// Loads the index from the cache, refreshing it when stale. Never fails:
/// without network the app simply shows its own icon.
pub async fn index(cache_dir: Option<PathBuf>) -> Index {
    let cache = cache_dir.map(|dir| dir.join(CACHE_FILE));
    if let Some(found) = cache.as_deref().and_then(read_cache) {
        return found;
    }
    match download().await {
        Ok(fresh) => {
            if let Some(path) = &cache {
                if let Some(parent) = path.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                let _ = std::fs::write(path, serde_json::to_vec(&fresh).unwrap_or_default());
            }
            fresh
        }
        // Fall back to an expired cache rather than nothing.
        Err(_) => cache
            .as_deref()
            .and_then(|p| std::fs::read(p).ok())
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default(),
    }
}

/// Uniques are matched by name; everything else by its base type.
fn icon_for(item: &Value, index: &Index) -> Option<String> {
    let name = item.get("name").and_then(Value::as_str);
    let base = item.get("base").and_then(Value::as_str);
    let unique = item
        .get("rarity")
        .and_then(Value::as_str)
        .is_some_and(|r| r.eq_ignore_ascii_case("unique"));
    let lookup = |key: Option<&str>| key.and_then(|k| index.get(k)).cloned();
    if unique {
        lookup(name).or_else(|| lookup(base))
    } else {
        lookup(base).or_else(|| lookup(name))
    }
}

fn decorate_item(item: &mut Value, index: &Index) {
    if item.get("icon").is_some() {
        return;
    }
    if let Some(icon) = icon_for(item, index) {
        item["icon"] = Value::String(icon);
    }
}

/// Adds icons to the guide's items and to the recommended upgrades.
pub fn decorate(result: &mut Value, index: &Index) {
    if index.is_empty() {
        return;
    }
    if let Some(items) = result.pointer_mut("/guide/items").and_then(Value::as_array_mut) {
        items.iter_mut().for_each(|item| decorate_item(item, index));
    }
    if let Some(upgrades) = result.get_mut("upgrades").and_then(Value::as_array_mut) {
        for upgrade in upgrades {
            if let Some(item) = upgrade.get_mut("item") {
                decorate_item(item, index);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn matches_uniques_by_name_and_rares_by_base() {
        let mut index = Index::new();
        index.insert("Vile Staff".into(), "https://web.poecdn.com/staff.png".into());
        index.insert("Headhunter".into(), "https://web.poecdn.com/hh.png".into());
        let mut result = json!({
            "upgrades": [
                { "item": { "name": "Doom Bite", "base": "Vile Staff", "rarity": "RARE" } },
                { "item": { "name": "Headhunter", "base": "Leather Belt", "rarity": "UNIQUE" } },
                { "item": { "name": "Unknown", "base": "Nothing", "rarity": "RARE" } }
            ]
        });
        decorate(&mut result, &index);
        assert_eq!(result["upgrades"][0]["item"]["icon"], "https://web.poecdn.com/staff.png");
        assert_eq!(result["upgrades"][1]["item"]["icon"], "https://web.poecdn.com/hh.png");
        assert!(result["upgrades"][2]["item"].get("icon").is_none());
    }
}
