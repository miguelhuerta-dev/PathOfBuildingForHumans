# Builds the portable Windows app as one executable with the calculation engine
# packed inside it (see src-tauri/src/engine_pack.rs for the layout).
#
# Timeless and abyss jewel tables (~170 MB) are left out: the app downloads the
# one a build needs the first time it is used (src-tauri/src/jewel_data.rs).
#
# Usage: ./scripts/build-portable.ps1 [-OutFile <path>] [-SkipBuild]
# Needs the engine from ./scripts/setup-engine.ps1.

[CmdletBinding()]
param(
  [string]$OutFile = "portable/PathOfBuildingForHumans.exe",
  # Pack an executable already built by `npx tauri build`.
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Import-Module (Join-Path $PSScriptRoot "VisualStudio.psm1") -Force

$root = Split-Path $PSScriptRoot -Parent
$engine = Join-Path $root "src-tauri/engine"
$exe = Join-Path $root "src-tauri/target/release/path-of-building-for-humans.exe"
if (-not [IO.Path]::IsPathRooted($OutFile)) { $OutFile = Join-Path $root $OutFile }
$OutFile = [IO.Path]::GetFullPath($OutFile)

$entries = "pobh_engine.lua", "engine.lock.json", "luajit.exe", "lua51.dll", "lua-utf8.dll", "pob"
foreach ($entry in $entries) {
  if (-not (Test-Path (Join-Path $engine $entry))) {
    throw "The engine is not ready ($entry is missing). Run ./scripts/setup-engine.ps1 first."
  }
}

if (-not $SkipBuild) {
  Push-Location $root
  try { Invoke-Native { npx tauri build } } finally { Pop-Location }
}
if (-not (Test-Path $exe)) { throw "$exe was not found. Build the app first." }

$work = Join-Path ([IO.Path]::GetTempPath()) "pobh-portable-$PID"
New-Item -ItemType Directory -Force -Path $work | Out-Null
try {
  # Windows' own bsdtar, not the GNU tar some shells put first on PATH.
  $tar = Join-Path $env:SystemRoot "System32\tar.exe"
  $archive = Join-Path $work "engine.tar.gz"
  $excludes = "pob/src/Data/TimelessJewelData/*.zip*", "pob/src/Data/TimelessJewelData/*.bin"
  $tarArgs = @("-czf", $archive) + ($excludes | ForEach-Object { "--exclude=$_" }) + @("-C", $engine) + $entries
  Invoke-Native { & $tar @tarArgs }

  $length = (Get-Item $archive).Length
  $id = (Get-FileHash $archive -Algorithm SHA256).Hash.Substring(0, 16).ToLowerInvariant()
  $footer = [byte[]]([Text.Encoding]::ASCII.GetBytes($id) + [BitConverter]::GetBytes([uint64]$length) + [Text.Encoding]::ASCII.GetBytes("POBHENG1"))

  New-Item -ItemType Directory -Force -Path (Split-Path $OutFile -Parent) | Out-Null
  $out = [IO.File]::Create($OutFile)
  try {
    foreach ($part in $exe, $archive) {
      $in = [IO.File]::OpenRead($part)
      try { $in.CopyTo($out) } finally { $in.Dispose() }
    }
    $out.Write($footer, 0, $footer.Length)
  } finally {
    $out.Dispose()
  }
} finally {
  Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
}

$size = [math]::Round((Get-Item $OutFile).Length / 1MB, 1)
Write-Host "Portable app: $OutFile ($size MB, engine $id)"
