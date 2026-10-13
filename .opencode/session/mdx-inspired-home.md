# MDX-inspired homepage checkpoint

## Completed
- Updated `src/components/home/UniMatchHero.jsx` and `.css` to make the hero resemble the MDX reference: warm cream/copper lighting, centered particle sequence, fixed copy, lower-left headline/actions, lower-right supporting copy, and scroll progress labels.
- Added the large typographic transition section in `src/pages/Home.jsx` after the hero.
- Preserved the Blender frame sequence and added an explicit opt-in for users whose OS requests reduced motion.

## Verified
- `npm run typecheck` — passed.
- `npm run build` — passed after running with permission to read the Vite config; only stale Browserslist data warning.
- `git diff --check` — passed (line-ending warning only).
- Local browser preview at 390x844: 3D frame changes on scroll and copy remains fixed. Desktop preview returned to the hero.

## Remaining
- No commit, push, PR, or deployment performed. Review the local branch `codex/mdx-inspired-home` before publishing.
- `output/` is existing untracked Playwright output; left untouched.
