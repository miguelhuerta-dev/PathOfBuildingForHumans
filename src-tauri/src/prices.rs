//! Market prices of unique items in a league, from poe.ninja's public data
//! (the same item overview used for icons). Each league's prices are kept in
//! memory for an hour, so poe.ninja is asked at most once an hour per league.

use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

const OVERVIEW: &str = "https://poe.ninja/poe1/api/economy/stash/current/item/overview";
const UNIQUE_TYPES: [&str; 5] = ["UniqueWeapon", "UniqueArmour", "UniqueAccessory", "UniqueFlask", "UniqueJewel"];
const FRESH_FOR: Duration = Duration::from_secs(60 * 60);

/// One listing of a unique on poe.ninja: a variant or a number of links can price it differently.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Price {
    pub chaos: f64,
    pub divine: Option<f64>,
    pub listings: Option<u64>,
    pub variant: Option<String>,
    pub links: Option<u64>,
}

type LeaguePrices = HashMap<String, Vec<Price>>;

static CACHE: Mutex<Option<HashMap<String, (Instant, LeaguePrices)>>> = Mutex::new(None);

fn price_of(line: &Value) -> Option<(String, Price)> {
    let name = line.get("name")?.as_str()?.to_string();
    let chaos = line.get("chaosValue")?.as_f64()?;
    Some((
        name,
        Price {
            chaos,
            divine: line.get("divineValue").and_then(Value::as_f64),
            listings: line.get("listingCount").and_then(Value::as_u64),
            variant: line.get("variant").and_then(Value::as_str).map(str::to_string),
            links: line.get("links").and_then(Value::as_u64),
        },
    ))
}

async fn download(league: &str) -> Result<LeaguePrices, String> {
    let mut prices = LeaguePrices::new();
    for kind in UNIQUE_TYPES {
        let body: Value = crate::http::client()
            .get(OVERVIEW)
            .query(&[("league", league), ("type", kind)])
            .timeout(Duration::from_secs(30))
            .send()
            .await
            .and_then(|r| r.error_for_status())
            .map_err(|e| format!("poe.ninja did not answer: {e}"))?
            .json()
            .await
            .map_err(|e| format!("poe.ninja sent unreadable prices: {e}"))?;
        for line in body.get("lines").and_then(Value::as_array).into_iter().flatten() {
            if let Some((name, price)) = price_of(line) {
                prices.entry(name).or_default().push(price);
            }
        }
    }
    Ok(prices)
}

/// The prices of a unique in a league, cheapest listing first (empty when poe.ninja has none).
pub async fn unique_price(name: &str, league: &str) -> Result<Vec<Price>, String> {
    let cached = CACHE
        .lock()
        .unwrap_or_else(|p| p.into_inner())
        .as_ref()
        .and_then(|leagues| leagues.get(league))
        .filter(|(at, _)| at.elapsed() < FRESH_FOR)
        .map(|(_, prices)| prices.get(name).cloned().unwrap_or_default());
    let mut found = match cached {
        Some(found) => found,
        None => {
            let prices = download(league).await?;
            let found = prices.get(name).cloned().unwrap_or_default();
            CACHE
                .lock()
                .unwrap_or_else(|p| p.into_inner())
                .get_or_insert_with(HashMap::new)
                .insert(league.to_string(), (Instant::now(), prices));
            found
        }
    };
    found.sort_by(|a, b| a.chaos.total_cmp(&b.chaos));
    Ok(found)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn reads_a_poe_ninja_line() {
        let line = json!({ "name": "Goldrim", "chaosValue": 1.5, "divineValue": 0.01, "listingCount": 340, "links": null });
        let (name, price) = price_of(&line).unwrap();
        assert_eq!(name, "Goldrim");
        assert_eq!(price.chaos, 1.5);
        assert_eq!(price.listings, Some(340));
        assert!(price_of(&json!({ "name": "No price" })).is_none());
    }
}
