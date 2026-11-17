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

/// For share links, the address that returns the raw code.
pub fn raw_url(input: &str) -> Option<String> {
    let input = input.trim().trim_end_matches('/');
    let rest = input
        .strip_prefix("https://")
        .or_else(|| input.strip_prefix("http://"))?;
    let (host, path) = rest.split_once('/')?;
    let id = path.split('/').next()?.trim();
    if id.is_empty() {
        return None;
    }
    match host.trim_start_matches("www.") {
        "pobb.in" => Some(format!("https://pobb.in/{id}/raw")),
        "pastebin.com" => {
            let id = if id == "raw" { path.split('/').nth(1)? } else { id };
            Some(format!("https://pastebin.com/raw/{id}"))
        }
        _ => None,
    }
}

/// Accepts a code or a share link and returns the build XML.
pub async fn resolve(input: &str) -> Result<String, String> {
    let code = if let Some(url) = raw_url(input) {
        crate::http::client()
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Could not download the guide: {e}"))?
            .error_for_status()
            .map_err(|e| format!("The guide link did not work: {e}"))?
            .text()
            .await
            .map_err(|e| format!("Could not read the guide: {e}"))?
    } else if input.trim_start().starts_with("http") {
        return Err("Only pobb.in and pastebin links are supported. You can also paste the code directly.".into());
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
}
