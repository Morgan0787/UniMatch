# Retained inactive source — 2026-10-13

These byte-preserved files are recovery/history material, not active application
sources. `manifest.json` records original paths, archive paths and SHA-256 hashes.

- `src/globals.css`: no runtime, dynamic, config or build-script consumer was
  found. `src/main.jsx` loads `src/index.css`; Tailwind independently generates
  the active `line-clamp-2` and `break-words` utilities. Its old overflow rule was
  not loaded.
- `src/components/utils/countryImages.jsx`: no consumer of its exported image
  selector was found; the active `UniversityCover` uses gradients. Excluding the
  file from Tailwind scanning produced byte-identical CSS.

External/manual consumers were not verified. Historical endpoint-retirement
claims were not independently rechecked. Keep archived bytes unchanged; old
plans intentionally retain their original paths as historical records.

## Restore

Run from the UniMatch repository root. The commands refuse occupied original
paths and validate all archive hashes before moving any file. To restore QA
screenshots instead, set `$manifestPath` to
`docs/qa/archive/370517c-home/manifest.json` before running the remaining commands.

```powershell
$manifestPath = 'docs/archive/source/2026-10-13/manifest.json'
$repoRoot = (Resolve-Path -LiteralPath '.').Path
$entries = @(Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)
foreach ($entry in $entries) {
    $original = [IO.Path]::GetFullPath((Join-Path $repoRoot $entry.originalPath))
    $archive = (Resolve-Path -LiteralPath $entry.archivePath).Path
    foreach ($target in @($original, $archive)) {
        if (!$target.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Restore path escapes repository'
        }
        $cursor = $target
        while ($cursor.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
            if ((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                throw "Restore path contains a reparse point: $cursor"
            }
            if ($cursor -eq $repoRoot) { break }
            $cursor = Split-Path $cursor -Parent
        }
    }
    if (Test-Path -LiteralPath $original) { throw "Original path occupied: $original" }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $entry.sha256) {
        throw "Archive hash mismatch: $archive"
    }
}
foreach ($entry in $entries) {
    $original = Join-Path $repoRoot $entry.originalPath
    $archive = Join-Path $repoRoot $entry.archivePath
    if (Test-Path -LiteralPath $original) { throw "Original path became occupied: $original" }
    New-Item -ItemType Directory -Path (Split-Path $original -Parent) -Force | Out-Null
    Move-Item -LiteralPath $archive -Destination $original
    if ((Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash -ne $entry.sha256) {
        throw "Restored hash mismatch: $original"
    }
}
```

Review active documentation links after restoration and rerun no-emit typecheck,
isolated production build and matching assertions. Restoration was not executed.
