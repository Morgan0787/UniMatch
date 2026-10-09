# UniMatch · Light Atlas

Original procedural animation for Home: 7,214 glowing particles unfold from a
sphere into a four-layer open atlas and five learning pathways, then return to
the identical sphere. Shared orthographic camera, emissive materials, lighting
and geometry throughout. No text in frames; no MDX models or art assets used.

## Files

- `unimatch-light-atlas.blend`: editable Blender 4.3.2 scene with shape keys,
  geometry-node particle instances, keyed weights and named timeline markers.
- `source/create_scene.py`: deterministic scene construction and render pipeline.
- `source/package_frames.py`: RGBA WebP conversion, MP4/GIF and manifest generation.
- `previews/preview.mp4`: complete five-second preview, 24 fps.
- `previews/preview.gif` and `previews/preview-contact-sheet.jpg`: visual previews.
- `previews/keys/`: six initial key renders inspected before the full render.
- `previews/draft-preview.mp4`: initial 24-frame low-resolution motion preview.
- `previews/browser/`: desktop/mobile screenshots and `results.json` evidence.
- `../../../public/media/unimatch-hero/`: deployed frame assets (relative from
  repository root: `public/media/unimatch-hero/`).

## Reproduce from the repository root

```sh
blender -b -t 6 --python assets/hero/unimatch/source/create_scene.py -- --mode keys
blender -b -t 6 --python assets/hero/unimatch/source/create_scene.py -- --mode preview
python3 assets/hero/unimatch/source/package_frames.py --draft
blender -b -t 6 --python assets/hero/unimatch/source/create_scene.py -- --mode full
python3 assets/hero/unimatch/source/package_frames.py
```

Requires existing Blender, Pillow with WebP and FFmpeg. Denoising is disabled
because this Blender build lacks OpenImageDenoise. Rendering uses CPU Cycles,
12 samples, transparent film and optical glow with soft alpha.
Raw full-resolution PNGs and Blender backup files are reproducible intermediates
and ignored by Git; final WebP files, scene, source and previews remain in the project.

## Web assets and loading

120 timeline frames, five seconds at 24 fps, two RGBA WebP variants:

| Variant | Dimensions | Files | Total bytes | Largest frame |
| --- | --- | --- | --- | --- |
| Desktop | 960×960 | 120 | 10,016,266 | 96,330 |
| Mobile | 560×560 | 120 | 6,866,924 | 65,894 |

Both collections total 16,883,190 bytes (16.88 MB); poster adds 93,758 bytes.
The exact first and last renders match. All nontrivial alpha pixels fit inside
the 960px canvas at x=159..840, y=149..734. Object has padding for responsive placement.
The browser chooses one resolution at mount, loads an immediate poster and nearby
frames only, makes at most three concurrent fetches and retains at most 12 decoded
bitmaps (~44.2 MB desktop / ~15.1 MB mobile). On unmount, abort fetches and close bitmaps.
Timeouts retry twice with bounded backoff; failed frames retain the poster/last image.

## Integration

`src/components/home/UniMatchHero.jsx` and scoped CSS replace only Home's first
section. Existing translated headline, CTA routes and all following sections remain.
The pin sits below the existing 64px navigation. Section height minus pin height
is 3.5 viewport heights. Scroll maps directly to frames 0..119 in either direction.
Reduced-motion mode removes the extended pin and presents frame zero. Skip link
advances to the existing stats section and moves keyboard focus.

## Verification

Focused ESLint, production build and TypeScript passed. Browser QA at 1280×720
and 390×844 covers first frame, atlas, pathways, last frame, reverse scroll,
return to start and release into the existing following section. Alpha bounds
checked in the actual browser canvas; no object cropping or horizontal overflow.
Additional scenarios: reduced motion, 450ms delayed frames, timeout recovery
after a 9s delayed first request without scrolling, and missing-frame poster fallback.
All 240 WebP files decoded with correct dimensions in Chromium; scroll link stays
clear of the existing feedback button. Final build includes all final media assets.

Preview uses dummy environment values and does not access production Supabase.
No backend, data, auth configuration or other pages were changed. MDX HTML was
available for reference inspection; browser navigation to MDX failed certificate
verification in this environment. Its art assets were not downloaded.

To rerun with the already-installed toolkit:

```sh
VITE_SUPABASE_URL=https://unimatch-preview.invalid VITE_SUPABASE_ANON_KEY=local-preview-anon npm run dev -- --host 0.0.0.0 --port 5173
node assets/hero/unimatch/source/verify_browser.mjs
```

The QA script defaults to `/workspace/3d-toolkit/node_modules/playwright/index.mjs`
and `/usr/bin/chromium`. Override `UNIMATCH_PLAYWRIGHT_MODULE`, `UNIMATCH_CHROMIUM`
and `UNIMATCH_PREVIEW_URL` in other environments. No extra project packages added.
