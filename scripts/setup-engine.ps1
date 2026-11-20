<#
.SYNOPSIS
  Prepares src-tauri/engine for development and packaging on Windows:
    - Path of Building Community at the pinned tag, without its images
    - LuaJIT at the pinned commit (luajit.exe + lua51.dll)
    - the lua-utf8 C module (lua-utf8.dll)
  Windows counterpart of setup-engine.sh; also used by .github/workflows/desktop.yml.

.PARAMETER PobSource
  Reuse a local Path of Building clone instead of downloading it.

.PARAMETER WorkDir
  Where sources are cloned. Kept after the run when given (CI reads PoB's test builds
  from it); a temporary folder that is removed afterwards otherwise.

.NOTES
  Needs git and the MSVC C++ tools. When cl.exe is not on PATH the script loads the
  x64 environment of the newest Visual Studio with the C++ workload.
#>
[CmdletBinding()]
param(
  [string]$PobSource = $env:POB_SOURCE,
  [string]$WorkDir
)
$ErrorActionPreference = "Stop"
Import-Module (Join-Path $PSScriptRoot "VisualStudio.psm1") -Force

$root = Split-Path -Parent $PSScriptRoot
$engine = Join-Path $root "src-tauri/engine"
$lock = Get-Content -Raw (Join-Path $engine "engine.lock.json") | ConvertFrom-Json

$ownsWorkDir = -not $WorkDir
if ($ownsWorkDir) { $WorkDir = Join-Path ([IO.Path]::GetTempPath()) "pobh-engine-$([guid]::NewGuid().ToString('N'))" }
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

try {
  Import-MsvcEnvironment

  Write-Host "Path of Building $($lock.pathOfBuilding.tag)"
  if ($PobSource) {
    $pob = $PobSource
  } else {
    $pob = Join-Path $WorkDir "pob"
    $env:GIT_LFS_SKIP_SMUDGE = "1"
    Invoke-Native { git -c advice.detachedHead=false clone -q --depth 1 --branch $lock.pathOfBuilding.tag $lock.pathOfBuilding.repository $pob }
  }

  $pobOut = Join-Path $engine "pob"
  if (Test-Path $pobOut) { Remove-Item -Recurse -Force $pobOut }
  New-Item -ItemType Directory -Force -Path (Join-Path $pobOut "runtime") | Out-Null
  # The headless engine never draws, so tree and item images are left out (~430 MB).
  robocopy (Join-Path $pob "src") (Join-Path $pobOut "src") /E /XF *.png *.jpg *.webp /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
  Copy-Item -Recurse (Join-Path $pob "runtime/lua") (Join-Path $pobOut "runtime/lua")
  Copy-Item (Join-Path $pob "LICENSE.md") (Join-Path $pobOut "LICENSE.md")

  Write-Host "LuaJIT $($lock.luajit.commit)"
  $luajit = Join-Path $WorkDir "luajit"
  Invoke-Native { git -c advice.detachedHead=false clone -q $lock.luajit.repository $luajit }
  Invoke-Native { git -c advice.detachedHead=false -C $luajit checkout -q $lock.luajit.commit }
  Push-Location (Join-Path $luajit "src")
  try {
    # msvcbuild.bat runs the tools it builds (minilua, buildvm) from the current folder,
    # which fails silently when NoDefaultCurrentDirectoryInExePath is set; clear it for the build.
    Invoke-Native { cmd /c "set NoDefaultCurrentDirectoryInExePath=&& .\msvcbuild.bat >nul" }
    Copy-Item luajit.exe, lua51.dll $engine
  } finally { Pop-Location }

  Write-Host "lua-utf8 $($lock.luautf8.tag)"
  $luautf8 = Join-Path $WorkDir "luautf8"
  Invoke-Native { git -c advice.detachedHead=false clone -q --depth 1 --branch $lock.luautf8.tag $lock.luautf8.repository $luautf8 }
  $obj = Join-Path $WorkDir "lutf8lib.obj"
  # LUA_BUILD_AS_DLL makes LUALIB_API a dllexport, so LuaJIT can find luaopen_utf8.
  Invoke-Native {
    cl /nologo /O2 /LD /DLUA_BUILD_AS_DLL /I (Join-Path $luajit "src") (Join-Path $luautf8 "lutf8lib.c") `
      (Join-Path $luajit "src/lua51.lib") "/Fo:$obj" "/Fe:$(Join-Path $engine 'lua-utf8.dll')"
  }
  # cl leaves the import library and export file next to the DLL; the engine only needs the DLL.
  Remove-Item -ErrorAction SilentlyContinue (Join-Path $engine "lua-utf8.lib"), (Join-Path $engine "lua-utf8.exp")

  $size = (Get-ChildItem -Recurse -File $engine | Measure-Object Length -Sum).Sum / 1MB
  Write-Host ("Engine ready in {0} ({1:N0} MB)" -f $engine, $size)
} finally {
  if ($ownsWorkDir) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $WorkDir }
}
