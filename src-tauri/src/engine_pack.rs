//! The portable build carries the calculation engine inside the executable, so
//! the app is a single file. `scripts/build-portable.ps1` appends a gzipped tar
//! of the engine folder and a footer to the compiled executable:
//!
//!   [executable][engine .tar.gz][id: 16 hex chars][archive length: u64 LE]["POBHENG1"]
//!
//! The first launch unpacks it into the user's local data folder, under its id;
//! later launches reuse that folder, and folders of older engines are removed.

use flate2::read::GzDecoder;
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

const MAGIC: &[u8; 8] = b"POBHENG1";
const ID_LEN: usize = 16;
const FOOTER_LEN: usize = ID_LEN + 8 + MAGIC.len();
/// Written last, so a folder without it is an interrupted unpack.
const COMPLETE: &str = ".complete";

struct Packed {
    file: File,
    offset: u64,
    length: u64,
    id: String,
}

fn read_footer(exe: &Path) -> std::io::Result<Option<Packed>> {
    let mut file = File::open(exe)?;
    let size = file.metadata()?.len();
    if size < FOOTER_LEN as u64 {
        return Ok(None);
    }
    let mut footer = [0u8; FOOTER_LEN];
    file.seek(SeekFrom::Start(size - FOOTER_LEN as u64))?;
    file.read_exact(&mut footer)?;
    if &footer[ID_LEN + 8..] != MAGIC {
        return Ok(None);
    }
    let id = &footer[..ID_LEN];
    if !id.iter().all(u8::is_ascii_hexdigit) {
        return Ok(None);
    }
    let length = u64::from_le_bytes(footer[ID_LEN..ID_LEN + 8].try_into().expect("8-byte slice"));
    let Some(offset) = size.checked_sub(FOOTER_LEN as u64 + length) else {
        return Ok(None);
    };
    Ok(Some(Packed {
        file,
        offset,
        length,
        id: String::from_utf8_lossy(id).into_owned(),
    }))
}

fn engines_root() -> PathBuf {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("PathOfBuildingForHumans")
        .join("engine")
}

/// The engine packed in this executable, unpacked; `None` when there is none
/// (development builds and the folder layout).
pub fn unpacked() -> Result<Option<PathBuf>, String> {
    let fail = |e: std::io::Error| format!("Could not unpack the calculation engine: {e}");
    let exe = std::env::current_exe().map_err(fail)?;
    let Some(mut packed) = read_footer(&exe).map_err(fail)? else {
        return Ok(None);
    };

    let root = engines_root();
    let target = root.join(&packed.id);
    if target.join(COMPLETE).is_file() {
        return Ok(Some(target));
    }

    fs::create_dir_all(&root).map_err(fail)?;
    let staging = root.join(format!("{}.unpacking-{}", packed.id, std::process::id()));
    let _ = fs::remove_dir_all(&staging);
    packed.file.seek(SeekFrom::Start(packed.offset)).map_err(fail)?;
    let archive = Read::take(&mut packed.file, packed.length);
    tar::Archive::new(GzDecoder::new(archive))
        .unpack(&staging)
        .map_err(fail)?;
    File::create(staging.join(COMPLETE)).map_err(fail)?;

    let _ = fs::remove_dir_all(&target);
    if let Err(e) = fs::rename(&staging, &target) {
        let _ = fs::remove_dir_all(&staging);
        // Another instance may have finished the same engine first.
        if !target.join(COMPLETE).is_file() {
            return Err(fail(e));
        }
    }
    remove_older_engines(&root, &packed.id);
    Ok(Some(target))
}

/// Each update brings a new engine; the previous ones are not needed any more.
fn remove_older_engines(root: &Path, current: &str) {
    let Ok(entries) = fs::read_dir(root) else { return };
    for entry in entries.flatten() {
        let name = entry.file_name();
        if !name.to_string_lossy().starts_with(current) {
            let _ = fs::remove_dir_all(entry.path());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn finds_the_archive_after_the_executable() {
        let mut exe = tempfile::NamedTempFile::new().unwrap();
        exe.write_all(b"MZ program bytes").unwrap();
        exe.write_all(b"ARCHIVE").unwrap();
        exe.write_all(b"0123456789abcdef").unwrap();
        exe.write_all(&7u64.to_le_bytes()).unwrap();
        exe.write_all(MAGIC).unwrap();

        let packed = read_footer(exe.path()).unwrap().expect("packed engine");
        assert_eq!(
            (packed.offset, packed.length, packed.id.as_str()),
            (16, 7, "0123456789abcdef")
        );
    }

    #[test]
    fn ignores_plain_executables() {
        let mut exe = tempfile::NamedTempFile::new().unwrap();
        exe.write_all(&[0u8; 64]).unwrap();
        assert!(read_footer(exe.path()).unwrap().is_none());
    }
}
