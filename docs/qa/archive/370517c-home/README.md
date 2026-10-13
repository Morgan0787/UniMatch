# Historical Home visual QA — commit 370517c

All 19 PNG screenshots were added in commit `370517c` (`live server`). They
preserve earlier desktop/mobile Home, globe-motion and scroll-animation checks.
Names and bytes are unchanged; `manifest.json` records their former
`output/playwright/` paths and individual SHA-256 hashes.

They are retained historical evidence and possible comparison baselines, not
proof of the current page. No repository runtime, generator or baseline-loader
consumer was found for the old paths; external/manual consumers were not verified.
No screenshot was discarded or treated as a duplicate.

Current Blender hero previews and browser evidence remain in
[assets/hero/unimatch](../../../../assets/hero/unimatch/README.md#files).
[output/playwright](../../../../output/playwright/README.md) remains the location
for future temporary QA output.

## Restore

From the UniMatch root, use the [checked restoration commands](../../../archive/source/2026-10-13/README.md#restore)
with `$manifestPath = 'docs/qa/archive/370517c-home/manifest.json'`. They require
all original paths to be absent and verify archive hashes before moving files.
Review the active README pointers after restoring screenshots; do not overwrite
unrelated working-tree changes. Restoration was not executed.
