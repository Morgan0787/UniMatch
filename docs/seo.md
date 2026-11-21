# UniMatch organic discovery

Vite emits the canonical HTML and sitemap from the same set of routes. Public URLs include `/`, `/Search`, `/AdmissionsSurvey`, `/ru/Search`, `/uz/Search`, eligible `/universities/<institutionId>` profiles, and reviewed discovery pages. The catalog has translated HTML and reciprocal `hreflang` on all three URLs. `/Search` is the English and `x-default` URL; `/en/Search` redirects there. The old language switch remains available on the rest of the app. Publish additional localized URLs only when the main content is translated.

## Production and Search Console verification

- Production release [`9d97ba0`](https://github.com/Morgan0787/UniMatch/commit/9d97ba0e328147ace5341c724aa3fbb734a2da41) served 114 canonical URLs, including 102 university profiles. All 114 returned HTTP 200 without `noindex` on `getunimatch.app`. The missing profile check returned HTTP 404. Tested Vercel aliases redirected to the public domain or required Vercel Authentication and returned `X-Robots-Tag: noindex`.
- On 2026-11-12, Search Console successfully processed the resubmitted `sitemap.xml` and reported 114 discovered URLs. Google had indexed the homepage and selected it as its canonical. Google accepted indexing requests for `/Search`, `/ru/Search`, `/uz/Search`, `/universities` and `/universities/oc90-032`. Follow actual indexing in the [Pages report](https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fgetunimatch.app%2F).
- On 2026-11-21 the live sitemap listed 111 URLs, including 99 university profiles. All 111 GET requests returned HTTP 200 with an H1, a matching canonical and no `noindex` in the HTML or HTTP headers. The supplied [mobile PageSpeed report](https://pagespeed.web.dev/analysis/https-getunimatch-app/8zcr394dak?form_factor=mobile) measured LCP at 4.96 s and identified the hero description as the LCP element. These measurements describe production before the 2026-11-22 local release fixes.
- On 2026-11-22 local production-feed builds emitted 113 canonical URLs (101 university profiles after allowing valid `web.archive.org` programme/source URLs in `scripts/seo-catalog.mjs`, plus 12 static/directory/guide URLs; expanding to 116 URLs / 104 profiles after applying `scripts/supabase-seo-sources-patch.sql` to un-quarantine three Polish institutions). Redirect rules (`308`) for `/en`, `/search`, `/ru`, `/ru/search`, `/uz`, `/uz/search`, `/admissions-survey`, and `/admissionssurvey`, along with static asset `Cache-Control` headers (`max-age=31536000, immutable` on `/assets/` and `/reference/`), were added in `vercel.json`.

## Public route loading

Home, the three catalog languages and the admissions survey display their generated HTML while the browser restores the session and loads the interactive route. Home shares its English heading and introduction between both versions. Its links to published directories remain available after React starts. The 3D scene loads inside the hero, and the first catalog request starts when the visitor scrolls or focuses the discovery section or its link. The saved-profile and administration routes retain their existing access rules.

## Build and test

Use the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` settings. For a local build with actual published catalog data:

```powershell
$env:SEO_FETCH_PUBLIC_CATALOG = '1'
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

In a second terminal:

```powershell
$env:SEO_CHECK_ORIGIN = 'http://127.0.0.1:4173'
npm run check:seo
```

Without `SEO_FETCH_PUBLIC_CATALOG=1`, a local build emits the base app pages and independently sourced guides. Vercel Preview and Production builds read the anonymous feed by default. The build fails if its configuration is missing, its read fails or its response is incomplete. A Preview build can opt out with `SEO_FETCH_PUBLIC_CATALOG=0`. The existing feed is bounded to 200 records. Raise that limit only with a reviewed pagination contract. The loader accepts a publishable or legacy `anon` key. The deployed JavaScript continues to use the application's existing public Supabase configuration.

If the Vercel project disables system environment variables for builds, set `SEO_FETCH_PUBLIC_CATALOG=1` in the environment where you want to build catalog pages.

## Publish and verify a Preview

1. In Vercel, open `uni_match` and confirm it uses the `Morgan0787/UniMatch` repository. Confirm `seo/vercel-preview` targets Preview and that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are available in Preview. Keep the existing deployment protection enabled.
2. After approval to push, run `git push -u origin seo/vercel-preview`. In **Deployments**, select the **Preview** deployment for that branch. Wait for **Ready**, check the Git commit SHA, and copy the deployment's unique URL.
3. Test the deployment URL. For a protected Preview, sign in to Vercel and use the browser's **DevTools → Network**. Select each document request and inspect **Headers** and **Response**. An authenticated Vercel CLI session with preview access can also run `vercel curl "$preview/universities/oc90-032" -- -sS -i`. For a Preview accessible to curl, use:

   ```powershell
   $preview = 'https://<unique-preview-host>.vercel.app'
   curl.exe -sS -D - -o NUL "$preview/universities/oc90-032"
   curl.exe -sS -D - -o NUL "$preview/universities/missing-profile"
   curl.exe -sS -D - -o NUL "$preview/sitemap.xml"
   curl.exe -fsS "$preview/universities/oc90-032"
   curl.exe -fsS "$preview/sitemap.xml"
   ```

4. Expect `200` and `X-Robots-Tag: noindex` for the existing profile, `404` for the missing one, and `200` for the sitemap. In the original profile response, confirm the `<h1>`, programme names, official source links, and exactly one canonical pointing to `https://getunimatch.app/universities/oc90-032`. The sitemap should list the same production canonical and omit the missing profile and Preview host. If the catalog has changed, pick an existing profile URL from the sitemap and request its path on the Preview host.
5. Open the profile in the authenticated browser and expand the interactive university details. Confirm the content still renders with JavaScript active. Check that `/ru/Search` and `/uz/Search` each return `200` and use their own production canonicals.

[Vercel Git integration](https://vercel.com/docs/git/vercel-for-github) · [Vercel environments](https://vercel.com/docs/deployments/environments) · [Vercel protected requests](https://vercel.com/docs/cli/curl)

## Publishing rules

- The public route uses the catalog's durable `institutionId` slug and retains the university UUID internally. Do not reassign published slugs. Titles, headings, institutional overviews, programme facts and official source links are projected from the validated publication data. Each profile needs at least one sourced programme with confirmed name and degree. Profiles project confirmed teaching language and intake plus published/historical tuition, deadlines, academic requirements and language requirements (preserving `unconfirmed` / `historical` / `unknown` caveat notices verbatim, normalizing concatenated intake dates and filtering internal reviewer prefixes such as `Accepted field source:` / `Manager-accepted` via `src/lib/admissions/sourcePresentation.js`). Official links identify the programmes they support. Profile pages do **not** emit duplicate `noindex` `/University?id=<uuid>` links; interactive programme details expand inline on the canonical profile route.
- To remove a profile, follow the approved catalog publication process and rebuild. A successful build drops its HTML and sitemap entry, so its clean URL reaches Vercel's HTTP 404. A deployed static build retains its old snapshot until the next successful deployment.
- `/University?id=<uuid>` stays available for saved links and universities outside the SEO feed, and that interactive route plus account/admin shells remain `noindex, follow`. Parameterized Search URLs point at their language's canonical catalog; the sitemap lists only clean URLs. Legacy/lowercase paths (`/en`, `/en/Search`, `/search`, `/ru`, `/ru/search`, `/uz`, `/uz/search`, `/admissions-survey`, `/admissionssurvey`, `/Home`) return permanent `308` redirects to their canonical targets. On Vercel, noncanonical hosts receive `X-Robots-Tag: noindex`.
- Country pages need reviewed copy and at least three eligible profiles. The Poland computer science page uses a small list of specifically reviewed institutions and requires at least two matching bachelor’s programmes with a verified field. There is no automatic country/subject matrix.
- Edit [seo-editorial.mjs](../scripts/seo-editorial.mjs) to create a guide. Start with `state: 'draft'`, a stable slug, language, headline, intro, `datePublished`/`dateModified` ISO dates, and sections. Add official source links with the date each was checked. Set `state: 'published'` only after reviewing the complete text (`Article` schema emits `datePublished` and `dateModified` when supplied). Use a shared `translationKey` for equivalent, independently reviewed translations; only published variants participate in `hreflang`. Use one record per language within a translation group.
- The sitemap omits `lastmod`: a crawl date, build time or programme source check date is not a reliable page modification date.

## After an approved deployment

1. On the exact production host, open `/sitemap.xml`, one emitted profile and the three catalog URLs. Confirm status 200, one self-referencing canonical and useful text in the initial response. Check that a missing profile returns 404 and that a preview/staging host sends `X-Robots-Tag: noindex`.
2. In the existing [Search Console property](https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fgetunimatch.app%2F), check the status and last read date for `https://getunimatch.app/sitemap.xml`. Submit it if it is missing from the report. The existing verification tag is preserved.
3. In **URL Inspection**, test a profile and each catalog language. Use the live test to check fetch status and inspect the Google-selected canonical after processing. A sitemap entry does not confirm indexing.
4. Check **Page indexing** for unexpected soft 404s, duplicates and crawled-but-not-indexed pages. In **Performance → Search results**, filter by page path and compare clicks, impressions and queries over consistent periods. Use **Core Web Vitals** when field data becomes available.

## Code map

- `scripts/seo-plugin.mjs` emits HTML and sitemap; `scripts/seo-catalog.mjs` projects the anonymous feed; `scripts/seo-pages.mjs` and `scripts/seo-editorial.mjs` define publishable pages. `scripts/check-seo.mjs` verifies artifacts, eligibility, metadata and HTTP routing. `public/sitemap.xml` is replaced by build output; `public/robots.txt` is preserved.
- `src/lib/seo.js`, `RouteSeo.jsx`, `discoveryContent.js` (styled via `src/index.css` Liquid Warm Pearl Glass tokens), `publicUniversityPage.js` and `src/discovery.d.ts` share metadata, HTML content and the profile's React enhancement. Interactive `<details>` expansion on `src/App.jsx` renders only on university profile routes (`Boolean(publicPage.universityId)`), not directory/country/guide pages.
- `src/App.jsx`, `src/Layout.jsx`, `src/lib/i18n/index.jsx`, `src/pages/Search.jsx`, `src/pages/University.jsx` and `vercel.json` wire up the new routes. Catalog entry links, navigation tracking, feedback path normalization and auth/UUID return paths recognize the localized catalog.

References: [Google sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [Schema.org university type](https://schema.org/CollegeOrUniversity), [Vercel routing](https://vercel.com/docs/project-configuration/vercel-json).
