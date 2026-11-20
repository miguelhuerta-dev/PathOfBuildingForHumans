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
//!
//! Path of Building takes seconds to load, so it is loaded once and kept
//! running (`pobh_engine.lua --serve`): a small pool of loaded engines answers
//! one request after another, and one is warmed up as the app opens.

use crate::{engine_pack, jewel_data};
use serde_json::Value;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::{Arc, Condvar, Mutex, MutexGuard};
use std::time::{Duration, Instant};

const READY: &str = "@@POBH_READY@@";
const RESULT: &str = "@@POBH_RESULT@@";
const ERROR: &str = "@@POBH_ERROR@@";

/// A calculation takes seconds; anything far longer is stuck and is stopped
/// so it does not hold a thread (and the player's request) forever.
const CALCULATION_TIMEOUT: Duration = Duration::from_secs(120);
/// Path of Building loads in a few seconds; past this the engine is broken.
const START_TIMEOUT: Duration = Duration::from_secs(60);
/// Engines kept loaded and waiting. Two cover a zone refresh arriving during a guide calculation.
const MAX_IDLE: usize = 2;
/// A long-lived engine is replaced after this many requests, so nothing builds up inside it.
const MAX_SERVED: u32 = 60;

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

/// One loaded Path of Building: each request is one JSON line on its stdin,
/// each answer one line on its stdout.
struct Worker {
    child: Child,
    stdin: ChildStdin,
    lines: Receiver<String>,
    stderr: Arc<Mutex<Vec<u8>>>,
    served: u32,
}

impl Worker {
    fn start(dir: &Path) -> Result<Worker, String> {
        let lib_ext = if cfg!(windows) { "dll" } else { "so" };
        let mut command = Command::new(luajit_path(dir));
        command
            .current_dir(dir.join("pob").join("src"))
            .arg(dir.join("pobh_engine.lua"))
            .arg("--serve")
            .env("LUA_PATH", "../runtime/lua/?.lua;../runtime/lua/?/init.lua;./?.lua")
            .env("LUA_CPATH", format!("{}/?.{lib_ext}", dir.display()))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            command.creation_flags(CREATE_NO_WINDOW);
        }
        let mut child = command.spawn().map_err(|e| format!("Could not start the calculation engine: {e}"))?;
        let stdin = child.stdin.take().ok_or("Could not talk to the calculation engine.")?;

        // Lines are read on their own thread, so waiting for an answer can time out.
        let (sender, lines) = mpsc::channel();
        if let Some(stdout) = child.stdout.take() {
            std::thread::spawn(move || {
                for line in BufReader::new(stdout).lines() {
                    let Ok(line) = line else { break };
                    if sender.send(line).is_err() {
                        break;
                    }
                }
            });
        }
        // Stderr is drained the whole time, so a chatty engine never blocks on a full pipe.
        let stderr = Arc::new(Mutex::new(Vec::new()));
        if let Some(mut pipe) = child.stderr.take() {
            let sink = Arc::clone(&stderr);
            std::thread::spawn(move || {
                let mut chunk = [0u8; 4096];
                while let Ok(n) = pipe.read(&mut chunk) {
                    if n == 0 {
                        break;
                    }
                    sink.lock().unwrap_or_else(|p| p.into_inner()).extend_from_slice(&chunk[..n]);
                }
            });
        }

        let mut worker = Worker { child, stdin, lines, stderr, served: 0 };
        let deadline = Instant::now() + START_TIMEOUT;
        loop {
            match worker.next_line(deadline) {
                Ok(line) if line.contains(READY) => return Ok(worker),
                Ok(_) => {}
                Err(e) => {
                    worker.stop();
                    return Err(e);
                }
            }
        }
    }

    fn alive(&mut self) -> bool {
        matches!(self.child.try_wait(), Ok(None))
    }

    fn stop(mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }

    fn last_error_line(&self) -> String {
        let stderr = self.stderr.lock().unwrap_or_else(|p| p.into_inner());
        String::from_utf8_lossy(&stderr)
            .lines()
            .rev()
            .find(|l| !l.trim().is_empty())
            .unwrap_or("no output")
            .to_string()
    }

    fn next_line(&mut self, deadline: Instant) -> Result<String, String> {
        let wait = deadline.saturating_duration_since(Instant::now());
        match self.lines.recv_timeout(wait) {
            Ok(line) => Ok(line),
            Err(RecvTimeoutError::Timeout) => Err(format!(
                "The calculation took longer than {} seconds and was stopped.",
                CALCULATION_TIMEOUT.as_secs()
            )),
            Err(RecvTimeoutError::Disconnected) => {
                // Give stderr a moment to arrive before reporting why the engine stopped.
                std::thread::sleep(Duration::from_millis(100));
                Err(format!("The calculation failed: {}", self.last_error_line()))
            }
        }
    }

    /// Sends one request and waits for its answer. The engine's own log lines
    /// come back too: they say which jewel tables were missing.
    fn ask(&mut self, request: &Value) -> Result<(Result<Value, String>, String), String> {
        let line = serde_json::to_string(request).map_err(|e| format!("Could not prepare the calculation: {e}"))?;
        self.stdin
            .write_all(line.as_bytes())
            .and_then(|_| self.stdin.write_all(b"\n"))
            .and_then(|_| self.stdin.flush())
            .map_err(|_| format!("The calculation failed: {}", self.last_error_line()))?;
        self.served += 1;
        let deadline = Instant::now() + CALCULATION_TIMEOUT;
        let mut log = String::new();
        loop {
            let line = self.next_line(deadline)?;
            if let Some((_, json)) = line.split_once(RESULT) {
                let value = serde_json::from_str(json).map_err(|e| format!("The engine returned unreadable data: {e}"));
                return Ok((value, log));
            }
            if let Some((_, message)) = line.split_once(ERROR) {
                return Ok((Err(format!("The calculation failed: {}", message.trim())), log));
            }
            log.push_str(&line);
            log.push('\n');
        }
    }
}

/// Engines waiting for work, and how many are still loading.
struct Pool {
    idle: Vec<Worker>,
    starting: usize,
}

static POOL: Mutex<Pool> = Mutex::new(Pool { idle: Vec::new(), starting: 0 });
static READY_SIGNAL: Condvar = Condvar::new();

fn lock_pool() -> MutexGuard<'static, Pool> {
    POOL.lock().unwrap_or_else(|p| p.into_inner())
}

/// Loads Path of Building in the background as the app opens, so the first
/// character is calculated without waiting for the engine to start.
pub fn prewarm() {
    std::thread::spawn(|| {
        let Ok(dir) = engine_dir() else { return };
        {
            let mut pool = lock_pool();
            if !pool.idle.is_empty() || pool.starting > 0 {
                return;
            }
            pool.starting += 1;
        }
        let worker = Worker::start(&dir);
        let mut pool = lock_pool();
        pool.starting -= 1;
        if let Ok(worker) = worker {
            pool.idle.push(worker);
        }
        READY_SIGNAL.notify_all();
    });
}

/// A loaded engine: a waiting one, the one still warming up, or a new one.
fn take_worker(dir: &Path) -> Result<Worker, String> {
    let mut pool = lock_pool();
    loop {
        while let Some(mut worker) = pool.idle.pop() {
            if worker.alive() {
                return Ok(worker);
            }
            worker.stop();
        }
        if pool.starting == 0 {
            break;
        }
        // The warm-up is loading an engine: waiting for it is quicker than loading another.
        pool = READY_SIGNAL.wait(pool).unwrap_or_else(|p| p.into_inner());
    }
    drop(pool);
    Worker::start(dir)
}

fn give_back(mut worker: Worker) {
    if worker.served >= MAX_SERVED || !worker.alive() {
        return worker.stop();
    }
    let mut pool = lock_pool();
    if pool.idle.len() < MAX_IDLE {
        pool.idle.push(worker);
    } else {
        drop(pool);
        worker.stop();
    }
}

/// Sends one request to a loaded engine and returns its JSON result.
pub fn run(request: &Value) -> Result<Value, String> {
    let dir = engine_dir()?;
    let mut retried = false;
    loop {
        let mut worker = take_worker(&dir)?;
        let (answer, log) = match worker.ask(request) {
            Ok(answered) => answered,
            Err(e) => {
                worker.stop();
                return Err(e);
            }
        };

        // Builds with timeless or abyss jewels need lookup tables that the portable
        // app downloads on first use. After a download a fresh engine reads them; if
        // the download fails the build is still calculated, only without those jewels.
        let missing = jewel_data::missing_tables(&log);
        if !retried && !missing.is_empty() && jewel_data::download(&dir, &missing).is_ok() {
            worker.stop();
            retried = true;
            continue;
        }
        return match answer {
            Ok(value) => {
                give_back(worker);
                Ok(value)
            }
            // A request that failed inside Path of Building may leave it half-loaded: start afresh next time.
            Err(e) => {
                worker.stop();
                Err(e)
            }
        };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Needs the engine (`scripts/setup-engine`): `cargo test engine -- --ignored`.
    #[test]
    #[ignore = "needs the calculation engine"]
    fn a_loaded_engine_answers_several_requests() {
        let dir = engine_dir().unwrap();
        let mut worker = Worker::start(&dir).unwrap();
        for _ in 0..2 {
            let (answer, _) = worker.ask(&serde_json::json!({ "kind": "nope" })).unwrap();
            assert!(answer.unwrap_err().contains("unknown request kind"));
        }
        assert!(worker.alive());
        worker.stop();
    }
}
