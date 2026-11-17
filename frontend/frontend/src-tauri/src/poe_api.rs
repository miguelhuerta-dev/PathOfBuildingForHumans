//! Public character profiles from pathofexile.com.
//!
//! Uses the same public endpoints Path of Building uses for "import from
//! account". They only work for profiles whose characters tab is public.
//! The official OAuth API will replace this once GGG approves the app.

use serde_json::{json, Map, Value};

const BASE: &str = "https://www.pathofexile.com/character-window";

/// Percent-encodes a query value (account names contain `#`, character names may contain spaces).
pub fn encode(value: &str) -> String {
    let mut out = String::new();
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(byte as char),
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

async fn get_json(url: &str) -> Result<Value, String> {
    let response = crate::http::client()
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Could not reach pathofexile.com: {e}"))?;

    let status = response.status();
    if status.as_u16() == 403 {
        return Err(
            "This profile is private. In your pathofexile.com privacy settings, make the Characters tab public.".into(),
        );
    }
    if status.as_u16() == 404 {
        return Err("Account or character not found. Check the account name, including the #1234 at the end.".into());
    }
    if status.as_u16() == 429 {
        return Err("pathofexile.com is rate limiting requests. Wait a minute and try again.".into());
    }
    if !status.is_success() {
        return Err(format!("pathofexile.com answered with error {status}."));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Could not read the response: {e}"))?;
    if body.trim() == "false" {
        return Err("This profile is private or the character does not exist.".into());
    }
    serde_json::from_str(&body).map_err(|e| format!("Unexpected response from pathofexile.com: {e}"))
}

/// Lists an account's characters: name, league, class, level.
pub async fn list_characters(account: &str, realm: &str) -> Result<Value, String> {
    let url = format!(
        "{BASE}/get-characters?accountName={}&realm={}",
        encode(account),
        encode(realm)
    );
    get_json(&url).await
}

/// Downloads a character's gear and passive tree and merges them into the
/// shape Path of Building's importer expects (the OAuth API character shape).
pub async fn fetch_character(account: &str, character: &str, realm: &str) -> Result<Value, String> {
    let items_url = format!(
        "{BASE}/get-items?accountName={}&character={}&realm={}",
        encode(account),
        encode(character),
        encode(realm)
    );
    let passives_url = format!(
        "{BASE}/get-passive-skills?accountName={}&character={}&realm={}",
        encode(account),
        encode(character),
        encode(realm)
    );

    let items = get_json(&items_url).await?;
    let passives = get_json(&passives_url).await?;
    Ok(merge_character(items, passives))
}

/// Builds `{ name, league, class, level, equipment, guardian, passives, jewels }`.
pub fn merge_character(items: Value, passives: Value) -> Value {
    let mut merged: Map<String, Value> = items
        .get("character")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();

    merged.insert(
        "equipment".into(),
        items.get("items").cloned().unwrap_or_else(|| json!([])),
    );
    if let Some(guardian) = items.get("guardian") {
        merged.insert("guardian".into(), guardian.clone());
    }
    merged.insert(
        "jewels".into(),
        passives.get("items").cloned().unwrap_or_else(|| json!([])),
    );
    merged.insert("passives".into(), passives);
    Value::Object(merged)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_account_discriminator() {
        assert_eq!(encode("Exile#1234"), "Exile%231234");
        assert_eq!(encode("My Char"), "My%20Char");
    }

    #[test]
    fn merges_into_importer_shape() {
        let items = json!({ "character": { "name": "Spark", "league": "Standard", "class": "Inquisitor", "level": 95 }, "items": [1] });
        let passives = json!({ "hashes": [10, 20], "items": [2] });
        let merged = merge_character(items, passives);
        assert_eq!(merged["name"], "Spark");
        assert_eq!(merged["equipment"], json!([1]));
        assert_eq!(merged["jewels"], json!([2]));
        assert_eq!(merged["passives"]["hashes"], json!([10, 20]));
    }
}
