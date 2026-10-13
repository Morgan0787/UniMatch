[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('codex', 'opencode', 'status')]
    [string]$Mode
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$profileRoot = Join-Path $projectRoot 'docs/agents/profiles'
$targets = @(
    @{ Relative = 'docs/agents/WORKFLOW.md'; Template = 'WORKFLOW.md' },
    @{ Relative = '.codex/config.toml'; Template = 'config.toml' }
)

function Get-ProfileMatch([string]$Path, [string]$Template) {
    if (!(Test-Path -LiteralPath $Path -PathType Leaf)) { return 'missing' }
    $currentHash = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
    foreach ($profileName in @('codex', 'opencode')) {
        $source = Join-Path (Join-Path $profileRoot $profileName) $Template
        if ($currentHash -eq (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash) {
            return $profileName
        }
    }
    return 'custom'
}

$statePath = Join-Path $projectRoot '.codex/workflow-state.json'
$lastState = if (Test-Path -LiteralPath $statePath) {
    Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
} else { $null }
$matches = @()
foreach ($target in $targets) {
    $path = Join-Path $projectRoot $target.Relative
    $match = Get-ProfileMatch $path $target.Template
    if ($match -eq 'custom' -and $null -ne $lastState) {
        $savedHash = $lastState.hashes.PSObject.Properties[$target.Relative].Value
        if ($savedHash -eq (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash) {
            $match = $lastState.mode
        }
    }
    $matches += $match
}
if ($Mode -eq 'status') {
    for ($i = 0; $i -lt $targets.Count; $i++) {
        Write-Output ($targets[$i].Relative + ': ' + $matches[$i])
    }
    return
}

# Validate both destinations before making either change. Preserve manual edits.
if ($matches -contains 'custom') {
    throw 'An active file has manual edits. Save those edits into its profile template before switching; no files were changed.'
}
$copies = @()
foreach ($target in $targets) {
    $destination = Join-Path $projectRoot $target.Relative
    $source = Join-Path (Join-Path $profileRoot $Mode) $target.Template
    if (!(Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing profile: $source" }
    $previous = if (Test-Path -LiteralPath $destination) { [IO.File]::ReadAllBytes($destination) } else { $null }
    $copies += @{ Destination = $destination; Bytes = [IO.File]::ReadAllBytes($source); Previous = $previous }
}
$hashes = @{}
foreach ($target in $targets) {
    $source = Join-Path (Join-Path $profileRoot $Mode) $target.Template
    $hashes[$target.Relative] = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
}
$stateBytes = [Text.UTF8Encoding]::new($false).GetBytes((@{ mode = $Mode; hashes = $hashes } | ConvertTo-Json -Depth 3) + [Environment]::NewLine)
$oldState = if (Test-Path -LiteralPath $statePath) { [IO.File]::ReadAllBytes($statePath) } else { $null }
$copies += @{ Destination = $statePath; Bytes = $stateBytes; Previous = $oldState }
if ($PSCmdlet.ShouldProcess($projectRoot, "Select $Mode workflow and project Codex configuration")) {
    $written = @()
    try {
        foreach ($copy in $copies) {
            $parent = Split-Path -Parent $copy.Destination
            [IO.Directory]::CreateDirectory($parent) | Out-Null
            $written += $copy
            [IO.File]::WriteAllBytes($copy.Destination, $copy.Bytes)
        }
    } catch {
        foreach ($copy in $written) {
            if ($null -ne $copy.Previous) {
                [IO.File]::WriteAllBytes($copy.Destination, $copy.Previous)
            } elseif (Test-Path -LiteralPath $copy.Destination) {
                Remove-Item -LiteralPath $copy.Destination
            }
        }
        throw
    }
    Write-Output "Selected $Mode. Start a new project chat/session so instructions and model defaults reload."
}
