# Helpers shared by the Windows development scripts.

function Get-VisualStudioPath {
  <# Installation path of the newest Visual Studio with the C++ workload. #>
  $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio/Installer/vswhere.exe"
  if (-not (Test-Path $vswhere)) { throw "Visual Studio is not installed (vswhere.exe not found)." }
  $path = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  if (-not $path) { throw "No Visual Studio with the 'Desktop development with C++' workload was found." }
  return $path
}

function Import-MsvcEnvironment {
  <# Loads the x64 MSVC environment (cl.exe, link.exe, SDK paths) into this session if missing. #>
  if (Get-Command cl.exe -ErrorAction SilentlyContinue) { return }
  $vs = Get-VisualStudioPath
  $vcvars = Join-Path $vs "VC/Auxiliary/Build/vcvars64.bat"
  Write-Host "MSVC environment from $vs"
  cmd /c "`"$vcvars`" >nul && set" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') { Set-Item -Path "env:$($Matches[1])" -Value $Matches[2] }
  }
  if (-not (Get-Command cl.exe -ErrorAction SilentlyContinue)) { throw "cl.exe is still unavailable after loading $vcvars." }
}

function Invoke-Native {
  <# Runs a native command and throws when it exits with a non-zero code.
     Progress that tools such as git write to stderr must not abort the script, which
     Windows PowerShell 5.1 does under ErrorActionPreference=Stop, so only the exit code counts.
     The block runs in the caller's session state, so the preference is relaxed there. #>
  [CmdletBinding()]
  param([Parameter(Mandatory)][scriptblock]$Command)
  $callerState = $PSCmdlet.SessionState.PSVariable
  $previous = $callerState.GetValue("ErrorActionPreference")
  $callerState.Set("ErrorActionPreference", "Continue")
  try { & $Command } finally { $callerState.Set("ErrorActionPreference", $previous) }
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Command" }
}

Export-ModuleMember -Function Get-VisualStudioPath, Import-MsvcEnvironment, Invoke-Native
