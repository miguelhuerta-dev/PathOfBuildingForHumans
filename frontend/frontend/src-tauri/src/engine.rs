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
use std::io::Read;
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};
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

    output_within(&mut command, CALCULATION_TIMEOUT)
}

/// A calculation takes seconds; anything far longer is stuck and is stopped
/// so it does not hold a thread (and the player's request) forever.
const CALCULATION_TIMEOUT: Duration = Duration::from_secs(120);

fn drain<R: Read + Send + 'static>(pipe: Option<R>) -> std::thread::JoinHandle<Vec<u8>> {
    std::thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut pipe) = pipe {
            let _ = pipe.read_to_end(&mut bytes);
        }
        bytes
    })
}

/// Like `Command::output`, but kills the process when it runs past `timeout`.
fn output_within(command: &mut Command, timeout: Duration) -> Result<Output, String> {
    let mut child = command
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Could not start the calculation engine: {e}"))?;

    // Both pipes are drained while waiting, so a chatty engine never blocks on a full pipe.
    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());

    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < timeout => std::thread::sleep(Duration::from_millis(20)),
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!(
                    "The calculation took longer than {} seconds and was stopped.",
                    timeout.as_secs()
                ));
            }
            Err(e) => return Err(format!("The calculation engine stopped unexpectedly: {e}")),
        }
    };
    Ok(Output {
        status,
        stdout: stdout.join().unwrap_or_default(),
        stderr: stderr.join().unwrap_or_default(),
    })
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

#[cfg(all(test, windows))]
mod tests {
    use super::*;

    #[test]
    fn stops_a_process_that_runs_too_long() {
        let started = Instant::now();
        let result = output_within(Command::new("cmd").args(["/C", "ping -n 6 127.0.0.1 >NUL"]), Duration::from_millis(300));
        assert!(result.unwrap_err().contains("was stopped"));
        assert!(started.elapsed() < Duration::from_secs(3));
    }

    #[test]
    fn returns_the_output_of_a_quick_process() {
        let output = output_within(Command::new("cmd").args(["/C", "echo hello"]), Duration::from_secs(10)).unwrap();
        assert!(String::from_utf8_lossy(&output.stdout).contains("hello"));
    }
}
