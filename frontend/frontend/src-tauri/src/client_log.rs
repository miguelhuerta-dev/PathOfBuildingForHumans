//! Watches the game's `Client.txt` log to notice when the player changes zone.
//! Every "You have entered ..." line triggers an event so the dashboard can
//! refresh the character.

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// The log of the installed game, in any Steam library or the usual folders.
pub fn detect() -> Option<PathBuf> {
    crate::game_files::game_folders()
        .into_iter()
        .map(|game| game.join("logs").join("Client.txt"))
        .find(|path| path.is_file())
}

/// Extracts the area name from a log line, if the line is a zone change.
pub fn zone_from_line(line: &str) -> Option<&str> {
    let marker = "] : You have entered ";
    let start = line.find(marker)? + marker.len();
    Some(line[start..].trim().trim_end_matches('.'))
}

/// Each call to `start` bumps the generation; older watcher threads see the
/// change and stop. That makes restarting with a new path safe.
#[derive(Default, Clone)]
pub struct Watcher {
    generation: Arc<AtomicU64>,
}

impl Watcher {
    pub fn stop(&self) {
        self.generation.fetch_add(1, Ordering::SeqCst);
    }

    pub fn start(&self, app: AppHandle, path: PathBuf) -> Result<(), String> {
        if !path.is_file() {
            return Err(format!("Client.txt not found at {}", path.display()));
        }
        let my_generation = self.generation.fetch_add(1, Ordering::SeqCst) + 1;
        let generation = self.generation.clone();

        std::thread::spawn(move || {
            let mut offset = file_len(&path);
            let mut pending = String::new();
            while generation.load(Ordering::SeqCst) == my_generation {
                std::thread::sleep(Duration::from_millis(1000));
                let len = file_len(&path);
                if len < offset {
                    offset = 0; // log was rotated or cleared
                }
                if len == offset {
                    continue;
                }
                if let Ok(chunk) = read_from(&path, offset) {
                    offset += chunk.len() as u64;
                    pending.push_str(&String::from_utf8_lossy(&chunk));
                    while let Some(end) = pending.find('\n') {
                        let line: String = pending.drain(..=end).collect();
                        if let Some(zone) = zone_from_line(&line) {
                            let _ = app.emit("zone-entered", zone.to_string());
                        }
                    }
                }
            }
        });
        Ok(())
    }
}

fn file_len(path: &Path) -> u64 {
    std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

fn read_from(path: &Path, offset: u64) -> std::io::Result<Vec<u8>> {
    let mut file = File::open(path)?;
    file.seek(SeekFrom::Start(offset))?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;
    Ok(buf)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_zone_changes() {
        let line = "2026/11/16 10:00:01 123456 cff9459 [INFO Client 1234] : You have entered Lioneye's Watch.";
        assert_eq!(zone_from_line(line), Some("Lioneye's Watch"));
        assert_eq!(zone_from_line("2026/11/16 10:00:01 [INFO] : Connecting to instance server"), None);
    }
}
