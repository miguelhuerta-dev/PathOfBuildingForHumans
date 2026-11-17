//! Runs the Path of Building engine (LuaJIT + PoB Community scripts).
//!
//! Expected layout of the engine folder:
//!   engine/
//!     luajit(.exe), lua51.dll, lua-utf8.dll|.so
//!     pobh_engine.lua, engine.lock.json
//!     pob/src/...           Path of Building Community `src`
//!     pob/runtime/lua/...   its pure-Lua libraries
//!
//! The folder is looked up, in order: `POBH_ENGINE_DIR`, `engine/` next to the
//! executable, the engine packed inside the executable (see `engine_pack`),
//! then `src-tauri/engine` in development builds.

use crate::{engine_pack, jewel_data};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::sync::Mutex;

const MARKER: &str = "@@POBH_RESULT@@";

fn is_engine(dir: &Path) -> bool {
    dir.join("pobh_engine.lua").is_file() && dir.join("pob").join("src").is_dir()
}

fn find_engine_dir() -> Result<PathBuf, String> {
    let mut candidates = Vec::new();
    if let Ok(dir) = std::env::var("POBH_ENGINE_DIR") {
        candidates.push(PathBuf::from(dir));
    }
    if let Some(parent) = std::env::current_exe().ok().as_deref().and_then(Path::parent) {
        candidates.push(parent.join("engine"));
    }
    if let Some(found) = candidates.into_iter().find(|dir| is_engine(dir)) {
        return Ok(found);
    }
    if let Some(dir) = engine_pack::unpacked()? {
        if is_engine(&dir) {
            return Ok(dir);
        }
    }
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("engine");
    if cfg!(debug_assertions) && is_engine(&dev) {
        return Ok(dev);
    }
    Err("The calculation engine was not found. Keep the 'engine' folder next to the app.".to_string())
}

/// The engine folder, looked up (and unpacked) once, the first time it is needed.
pub fn engine_dir() -> Result<PathBuf, String> {
    static FOUND: Mutex<Option<PathBuf>> = Mutex::new(None);
    let mut found = FOUND.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    // Checked again in case the folder was removed while the app was open.
    if let Some(dir) = found.as_ref().filter(|dir| is_engine(dir)) {
        return Ok(dir.clone());
    }
    let dir = find_engine_dir()?;
    *found = Some(dir.clone());
    Ok(dir)
}

fn luajit_path(dir: &Path) -> PathBuf {
    let name = if cfg!(windows) { "luajit.exe" } else { "luajit" };
    let bundled = dir.join(name);
    if bundled.is_file() {
        bundled
    } else {
        PathBuf::from(name)
    }
}

/// Sends one request to the engine and returns its JSON result.
pub fn run(request: &Value) -> Result<Value, String> {
    let dir = engine_dir()?;
    let mut output = run_once(&dir, request)?;

    // Builds with timeless or abyss jewels need lookup tables that the portable
    // app downloads on first use. If that fails the build is still calculated,
    // only without those jewels' effects.
    let missing = jewel_data::missing_tables(&String::from_utf8_lossy(&output.stdout));
    if !missing.is_empty() && jewel_data::download(&dir, &missing).is_ok() {
        output = run_once(&dir, request)?;
    }
    parse_output(&output)
}

fn run_once(dir: &Path, request: &Value) -> Result<Output, String> {
    let pob_src = dir.join("pob").join("src");

    let mut request_file = tempfile::Builder::new()
        .prefix("pobh-request-")
        .suffix(".json")
        .tempfile()
        .map_err(|e| format!("Could not prepare the calculation: {e}"))?;
    serde_json::to_writer(&mut request_file, request)
        .map_err(|e| format!("Could not prepare the calculation: {e}"))?;

    let lib_ext = if cfg!(windows) { "dll" } else { "so" };
    let mut command = Command::new(luajit_path(dir));
    command
        .current_dir(&pob_src)
        .arg(dir.join("pobh_engine.lua"))
        .arg(request_file.path())
        .env("LUA_PATH", "../runtime/lua/?.lua;../runtime/lua/?/init.lua;./?.lua")
        .env("LUA_CPATH", format!("{}/?.{lib_ext}", dir.display()));

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command
        .output()
        .map_err(|e| format!("Could not start the calculation engine: {e}"))
}

fn parse_output(output: &Output) -> Result<Value, String> {
    let stdout = String::from_utf8_lossy(&output.stdout);
    match stdout.lines().find_map(|line| line.split_once(MARKER).map(|(_, json)| json)) {
        Some(json) => serde_json::from_str(json).map_err(|e| format!("The engine returned unreadable data: {e}")),
        None => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let detail = stderr.lines().chain(stdout.lines()).rev().find(|l| !l.trim().is_empty()).unwrap_or("no output");
            Err(format!("The calculation failed: {detail}"))
        }
    }
}
