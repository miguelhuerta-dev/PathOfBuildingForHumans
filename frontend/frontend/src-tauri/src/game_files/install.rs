//! Finds the player's Path of Exile installation: Steam libraries on any drive,
//! the standalone client's usual folders, or the folder of the `Client.txt`
//! the player chose in the app.

use std::path::{Path, PathBuf};

/// How the game stores its files.
pub enum Storage {
    /// Steam and Epic: loose `Bundles2/*.bundle.bin` files.
    Bundles(PathBuf),
    /// Standalone client: everything inside `Content.ggpk`.
    Ggpk,
}

const FOLDER: &str = "Path of Exile";

/// Folders where the game may be installed, most likely first.
pub fn candidates() -> Vec<PathBuf> {
    let mut list = Vec::new();
    for library in steam_libraries() {
        list.push(library.join("steamapps").join("common").join(FOLDER));
    }
    for root in ["C:\\Program Files (x86)", "C:\\Program Files"] {
        list.push(Path::new(root).join("Grinding Gear Games").join(FOLDER));
        list.push(Path::new(root).join("Epic Games").join("PathOfExile"));
    }
    list.push(PathBuf::from("C:\\Games").join(FOLDER));
    list.dedup();
    list
}

/// The game folder holding a `Client.txt` (`<game>/logs/Client.txt`).
fn from_client_log(client_log: &Path) -> Option<PathBuf> {
    Some(client_log.parent()?.parent()?.to_path_buf())
}

fn storage_of(game: &Path) -> Option<Storage> {
    let bundles = game.join("Bundles2");
    if bundles.join("_.index.bin").is_file() {
        return Some(Storage::Bundles(bundles));
    }
    game.join("Content.ggpk").is_file().then_some(Storage::Ggpk)
}

/// The installed game's file storage, preferring the folder of the chosen `Client.txt`.
pub fn find(client_log: Option<&Path>) -> Option<Storage> {
    client_log
        .and_then(from_client_log)
        .into_iter()
        .chain(candidates())
        .find_map(|game| storage_of(&game))
}

fn steam_libraries() -> Vec<PathBuf> {
    let mut steam_roots = Vec::new();
    #[cfg(windows)]
    if let Some(path) = steam_path_from_registry() {
        steam_roots.push(path);
    }
    steam_roots.push(PathBuf::from("C:\\Program Files (x86)\\Steam"));

    let mut libraries = Vec::new();
    for root in steam_roots {
        if let Ok(text) = std::fs::read_to_string(root.join("steamapps").join("libraryfolders.vdf")) {
            libraries.extend(library_paths(&text));
        }
        libraries.push(root);
    }
    libraries.dedup();
    libraries
}

/// The `"path"` entries of Steam's `libraryfolders.vdf`.
fn library_paths(vdf: &str) -> Vec<PathBuf> {
    vdf.lines()
        .filter_map(|line| {
            let mut quoted = line.split('"').skip(1).step_by(2);
            (quoted.next()? == "path").then(|| quoted.next())?
        })
        .map(|path| PathBuf::from(path.replace("\\\\", "\\")))
        .collect()
}

#[cfg(windows)]
fn steam_path_from_registry() -> Option<PathBuf> {
    use windows::core::w;
    use windows::Win32::Foundation::ERROR_SUCCESS;
    use windows::Win32::System::Registry::{RegGetValueW, HKEY_CURRENT_USER, RRF_RT_REG_SZ};

    let mut buffer = [0u16; 1024];
    let mut size = u32::try_from(std::mem::size_of_val(&buffer)).ok()?;
    // SAFETY: the buffer and its size in bytes describe valid, writable memory.
    let status = unsafe {
        RegGetValueW(
            HKEY_CURRENT_USER,
            w!("Software\\Valve\\Steam"),
            w!("SteamPath"),
            RRF_RT_REG_SZ,
            None,
            Some(buffer.as_mut_ptr().cast()),
            Some(&mut size),
        )
    };
    if status != ERROR_SUCCESS {
        return None;
    }
    let chars = (size as usize / 2).saturating_sub(1);
    Some(PathBuf::from(String::from_utf16_lossy(&buffer[..chars])))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_steam_library_folders() {
        let vdf = r#""libraryfolders"
{
	"0"
	{
		"path"		"C:\\Program Files (x86)\\Steam"
		"apps" { "238960"		"1" }
	}
	"1"
	{
		"path"		"D:\\SteamLibrary"
	}
}"#;
        assert_eq!(
            library_paths(vdf),
            vec![PathBuf::from("C:\\Program Files (x86)\\Steam"), PathBuf::from("D:\\SteamLibrary")]
        );
    }
}
