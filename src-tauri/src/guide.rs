//! Path of Building build codes and share links (pobb.in, pastebin).

use base64::Engine as _;
use flate2::read::ZlibDecoder;
use std::io::Read;

/// Turns a PoB export code into the build XML.
/// Codes are URL-safe base64 of zlib-compressed XML.
pub fn decode_code(code: &str) -> Result<String, String> {
    let cleaned: String = code
        .trim()
        .chars()
        .filter(|c| !c.is_whitespace())
        .map(|c| match c {
            '-' => '+',
            '_' => '/',
            other => other,
        })
        .collect();
    let trimmed = cleaned.trim_end_matches('=');
    let bytes = base64::engine::general_purpose::STANDARD_NO_PAD
        .decode(trimmed)
        .map_err(|_| "This does not look like a Path of Building code.".to_string())?;

    let mut xml = String::new();
    ZlibDecoder::new(&bytes[..])
        .read_to_string(&mut xml)
        .map_err(|_| "The Path of Building code is damaged or incomplete.".to_string())?;

    if !xml.contains("<PathOfBuilding") {
        return Err("The code decoded, but it is not a Path of Building build.".into());
    }
    Ok(xml)
}

/// For share links, the address that returns the raw code. The same sites
/// Path of Building imports from (its `BuildSiteTools.lua`), with or without
/// "https://", and ignoring anything after "?" or "#".
pub fn raw_url(input: &str) -> Option<String> {
    let input = input.trim();
    let without_scheme = input
        .strip_prefix("https://")
        .or_else(|| input.strip_prefix("http://"))
        .unwrap_or(input);
    let link = without_scheme.split(['?', '#']).next()?.trim_end_matches('/');
    let (host, path) = link.split_once('/')?;
    let parts: Vec<&str> = path.split('/').filter(|part| !part.is_empty()).collect();
    let valid = |id: &&str| !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_');
    let after = |marker: &str| {
        parts
            .iter()
            .position(|part| *part == marker)
            .and_then(|at| parts.get(at + 1))
            .copied()
            .filter(valid)
    };
    let first = parts.first().copied().filter(valid);
    match host.trim_start_matches("www.") {
        "pobb.in" => {
            let id = if first == Some("pob") { parts.get(1).copied().filter(valid)? } else { first? };
            Some(format!("https://pobb.in/{id}/raw"))
        }
        "pastebin.com" => {
            let id = if first == Some("raw") { parts.get(1).copied().filter(valid)? } else { first? };
            Some(format!("https://pastebin.com/raw/{id}"))
        }
        "pastebinp.com" => Some(format!("https://pastebinp.com/raw/{}", first?)),
        "maxroll.gg" => after("pob").map(|id| format!("https://maxroll.gg/poe/api/pob/{id}")),
        "pob.codes" => after("b").map(|id| format!("https://api.pob.codes/{id}/raw")),
        "poe.ninja" => after("pob").map(|id| format!("https://poe.ninja/poe1/pob/raw/{id}")),
        "rentry.co" => Some(format!("https://rentry.co/paste/{}/raw", first?)),
        "poedb.tw" => after("pob").map(|id| format!("https://poedb.tw/pob/{id}/raw")),
        _ => None,
    }
}

/// True when the input is a link (to any site), not a code.
fn looks_like_link(input: &str) -> bool {
    let input = input.trim();
    input.starts_with("http://")
        || input.starts_with("https://")
        || input.split('/').next().is_some_and(|host| host.contains('.') && !host.contains(char::is_whitespace) && input.contains('/'))
}

/// Where a share link's code is kept, so a guide opened before needs no download.
/// pobb.in and pastebin pastes never change, so the copy never goes stale.
fn cached_code_path(cache_dir: &std::path::Path, url: &str) -> std::path::PathBuf {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    url.hash(&mut hasher);
    cache_dir.join("guides").join(format!("{:016x}.txt", hasher.finish()))
}

/// Accepts a code or a share link and returns the build XML. Codes behind share
/// links are kept in `cache_dir`, when given.
pub async fn resolve(input: &str, cache_dir: Option<&std::path::Path>) -> Result<String, String> {
    let code = if let Some(url) = raw_url(input) {
        let cached = cache_dir.map(|dir| cached_code_path(dir, &url));
        match cached.as_deref().and_then(|path| std::fs::read_to_string(path).ok()) {
            Some(code) if decode_code(&code).is_ok() => code,
            _ => {
                let code = crate::http::client()
                    .get(&url)
                    .send()
                    .await
                    .map_err(|e| format!("Could not download the guide: {e}"))?
                    .error_for_status()
                    .map_err(|e| format!("The guide link did not work: {e}"))?
                    .text()
                    .await
                    .map_err(|e| format!("Could not read the guide: {e}"))?;
                if let Some(path) = cached.as_deref().filter(|_| decode_code(&code).is_ok()) {
                    if let Some(parent) = path.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    let _ = std::fs::write(path, &code);
                }
                code
            }
        }
    } else if looks_like_link(input) {
        return Err(
            "That site is not supported. Use a Path of Building code, or a link from pobb.in, Maxroll, poe.ninja, pastebin, pob.codes, rentry or poedb."
                .into(),
        );
    } else {
        input.to_string()
    };
    decode_code(&code)
}

#[cfg(test)]
mod tests {
    use super::*;
    use flate2::{write::ZlibEncoder, Compression};
    use std::io::Write;

    fn encode(xml: &str) -> String {
        let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
        encoder.write_all(xml.as_bytes()).unwrap();
        base64::engine::general_purpose::URL_SAFE.encode(encoder.finish().unwrap())
    }

    #[test]
    fn decodes_a_pob_code() {
        let xml = r#"<?xml version="1.0"?><PathOfBuilding><Build level="95"/></PathOfBuilding>"#;
        assert_eq!(decode_code(&encode(xml)).unwrap(), xml);
    }

    #[test]
    fn rejects_garbage() {
        assert!(decode_code("not a code at all!").is_err());
    }

    #[test]
    fn maps_share_links() {
        assert_eq!(
            raw_url("https://pobb.in/AbC123").as_deref(),
            Some("https://pobb.in/AbC123/raw")
        );
        assert_eq!(
            raw_url("https://pastebin.com/xyz").as_deref(),
            Some("https://pastebin.com/raw/xyz")
        );
        assert_eq!(
            raw_url("https://pastebin.com/raw/xyz").as_deref(),
            Some("https://pastebin.com/raw/xyz")
        );
        assert_eq!(raw_url("eNrtWl"), None);
    }

    #[test]
    fn maps_the_sites_path_of_building_imports_from() {
        let cases = [
            ("pastebin.com/xyz", "https://pastebin.com/raw/xyz"),
            ("https://pastebin.com/xyz?ref=guide#top", "https://pastebin.com/raw/xyz"),
            ("https://maxroll.gg/poe/pob/abc12de3", "https://maxroll.gg/poe/api/pob/abc12de3"),
            ("maxroll.gg/poe/pob/abc12de3/", "https://maxroll.gg/poe/api/pob/abc12de3"),
            ("https://pobb.in/pob/AbC123", "https://pobb.in/AbC123/raw"),
            ("https://poe.ninja/pob/a1b2", "https://poe.ninja/poe1/pob/raw/a1b2"),
            ("https://poe.ninja/poe1/pob/a1b2", "https://poe.ninja/poe1/pob/raw/a1b2"),
            ("https://pob.codes/b/Q9w", "https://api.pob.codes/Q9w/raw"),
            ("https://rentry.co/mybuild", "https://rentry.co/paste/mybuild/raw"),
            ("https://poedb.tw/pob/x7", "https://poedb.tw/pob/x7/raw"),
        ];
        for (input, expected) in cases {
            assert_eq!(raw_url(input).as_deref(), Some(expected), "{input}");
        }
        assert_eq!(raw_url("https://example.com/build"), None);
        assert!(looks_like_link("example.com/build"));
        assert!(!looks_like_link("eNrtWl2T2jgW"));
    }

    #[test]
    fn decodes_a_real_guide_code() {
        // A long Maxroll guide code: it must decode, padding and URL-safe characters included.
        let Ok(code) = std::fs::read_to_string(std::env::var("POBH_TEST_CODE").unwrap_or_default()) else { return };
        assert!(decode_code(&code).unwrap().contains("<PathOfBuilding"));
    }
}
