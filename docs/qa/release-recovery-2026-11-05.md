# Release 18 and SEO recovery — 2026-11-05

## Cause

Production SEO commit e1bf863 was based on a3b042d (old main), which did not contain Release 18 commit 1ec35b3. Both custom and legacy domains pointed to that same deployment; DNS was correct. Metadata checks did not detect the missing catalog/photo/admissions UI.

## Recovery

This merge retains the Release 18 tree and reapplies the SEO layer from e1bf863: verification, canonical domain, route metadata, social assets and redirects. AdmissionsSurvey is included in the sitemap; University detail remains accessible with noindex because its identity is query-driven. Release 18 security headers are retained. No database or AI changes.

The merge includes both release histories so main can advance without losing either branch. Future release checks must compare the candidate ancestry and rendered Search with the last accepted production release.

## Verification

Local production build, SEO metadata/route checks, typecheck and catalog checks passed. Initial sandbox esbuild access failure was resolved by an unrestricted build; typecheck required linking existing dependencies into this worktree for the configured GSAP type paths. Preview and production browser checks are pending. Google uses the same canonical URLs; no index removals are required.
