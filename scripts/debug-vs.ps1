<#
.SYNOPSIS
  Builds the desktop app in debug mode and opens it in Visual Studio's debugger.

.DESCRIPTION
  1. Starts the Vite dev server (http://localhost:5173) in its own window if it is not running.
  2. Builds src-tauri with cargo (debug profile, with PDB symbols).
  3. Opens Visual Studio with the executable loaded: press F5 to run it under the native
     debugger. Breakpoints in src-tauri/src/*.rs work once the file is opened in VS.

  The debug build loads the UI from the Vite server (hot reload) and finds the engine in
  src-tauri/engine (prepare it first with scripts/setup-engine.ps1).
  To debug TypeScript instead, use the app's DevTools (right-click > Inspect) or switch the
  VS project's Debugger Type to "JavaScript (WebView2)".

.PARAMETER NoVisualStudio
  Build only and run the app without opening Visual Studio.
#>
[CmdletBinding()]
param([switch]$NoVisualStudio)
$ErrorActionPreference = "Stop"
Import-Module (Join-Path $PSScriptRoot "VisualStudio.psm1") -Force

$root = Split-Path -Parent $PSScriptRoot
$tauri = Join-Path $root "src-tauri"
$exe = Join-Path $tauri "target/debug/path-of-building-for-humans.exe"
$devPort = 5173

if (-not (Test-Path (Join-Path $tauri "engine/luajit.exe"))) {
  Write-Warning "The calculation engine is missing. Run scripts/setup-engine.ps1 first."
}

$listening = Get-NetTCPConnection -LocalPort $devPort -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
  Write-Host "Starting Vite on port $devPort (close its window to stop it)"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory $root
}

Write-Host "Building src-tauri (debug)"
Invoke-Native { cargo build --manifest-path (Join-Path $tauri "Cargo.toml") }

if ($NoVisualStudio) {
  & $exe
  return
}

$devenv = Join-Path (Get-VisualStudioPath) "Common7/IDE/devenv.exe"
Write-Host "Opening Visual Studio: press F5 to start debugging"
Start-Process -FilePath $devenv -ArgumentList "/DebugExe", "`"$exe`""
