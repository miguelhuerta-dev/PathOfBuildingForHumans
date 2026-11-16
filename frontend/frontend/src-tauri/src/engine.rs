//! Runs the Path of Building engine (LuaJIT + PoB Community scripts).
//!
//! Expected layout of the engine folder:
//!   engine/
//!     luajit(.exe), lua51.dll, lua-utf8.dll|.so
//!     pobh_engine.lua
//!     pob/src/...           Path of Building Community `src`
//!     pob/runtime/lua/...   its pure-Lua libraries
//!
//! The folder is looked up, in order: `POBH_ENGINE_DIR`, `engine/` next to the
//! executable, then `src-tauri/engine` in development builds.

use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::Command;

const MARKER: &str = "@@POBH_RESULT@@";

pub fn engine_dir() -> Result<PathBuf, String> {
    let mut candidates = Vec::new();
    if let Ok(dir) = std::env::var("POBH_ENGINE_DIR") {
        candidates.push(PathBuf::from(dir));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.join("engine"));
        }
    }
    if cfg!(debug_assertions) {
        candidates.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("engine"));
    }
    candidates
        .into_iter()
        .find(|dir| dir.join("pobh_engine.lua").is_file() && dir.join("pob").join("src").is_dir())
        .ok_or_else(|| {
            "The calculation engine was not found. Keep the 'engine' folder next to the app.".to_string()
        })
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
    let pob_src = dir.join("pob").join("src");

    let mut request_file = tempfile::Builder::new()
        .prefix("pobh-request-")
        .suffix(".json")
        .tempfile()
        .map_err(|e| format!("Could not prepare the calculation: {e}"))?;
    serde_json::to_writer(&mut request_file, request)
        .map_err(|e| format!("Could not prepare the calculation: {e}"))?;

    let lib_ext = if cfg!(windows) { "dll" } else { "so" };
    let mut command = Command::new(luajit_path(&dir));
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

    let output = command
        .output()
        .map_err(|e| format!("Could not start the calculation engine: {e}"))?;
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
