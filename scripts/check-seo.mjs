import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSeo, PRIVATE_PATHS, PUBLIC_PATHS, SITE_URL } from '../src/lib/seo.js';
import { formatUsd, toUsd } from '../src/lib/tuitionCurrency.js';
import { adaptPublicCatalog } from '../src/lib/admissions/publicCatalog.js';
import { safePublicLoginReturn } from '../src/lib/loginReturn.js';
import { universityReturnPath } from '../src/lib/universityNavigation.js';
import { buildDiscoveryPages } from './seo-pages.mjs';
import { loadSeoInstitutions, projectSeoInstitutions } from './seo-catalog.mjs';
import { publicAdmissionCatalogRow } from './fixtures/publicAdmissionCatalog.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, '..', 'dist');
const read = relativePath => readFile(path.join(root, '..', relativePath), 'utf8');
const config = JSON.parse(await read('vercel.json'));
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
const socialImage = await readFile(path.join(dist, 'og-unimatch.png'));
assert.equal(socialImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(socialImage.readUInt32BE(16), 1200);
assert.equal(socialImage.readUInt32BE(20), 630);

async function htmlFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory()
      ? htmlFiles(path.join(directory, entry.name), relative)
      : entry.isFile() && entry.name.endsWith('.html') ? [relative] : [];
  }));
  return nested.flat().sort();
}

function routeForFile(file) {
  if (file === 'index.html') return '/';
  if (file === '404.html' || file === 'seo/private.html') return null;
  return `/${file.slice(0, -'.html'.length)}`;
}

function singleMatch(html, expression, label) {
  const matches = [...html.matchAll(new RegExp(expression.source, expression.flags + (expression.global ? '' : 'g')))];
  assert.equal(matches.length, 1, `${label}: expected exactly one match, got ${matches.length}`);
  return matches[0];
}

function getMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return singleMatch(html, new RegExp(`<meta\\s+name="${escaped}"\\s+content="([^"]*)"\\s*\\/?\\s*>`, 'i'), `meta ${name}`)[1];
}

const builtPages = await htmlFiles(dist);
const publicEntryRoutes = new Set([...PUBLIC_PATHS, '/ru/Search', '/uz/Search']);
for (const required of ['index.html', 'Search.html', 'AdmissionsSurvey.html', 'ru/Search.html', 'uz/Search.html', '404.html', 'seo/private.html']) {
  assert.ok(builtPages.includes(required), `Missing built HTML page: ${required}`);
}
assert.ok(builtPages.some(file => file.startsWith('guides/')),
  'Build should emit the currently available static guide page');
assert.ok(builtPages.some(file => file.startsWith('ru/guides/')) && builtPages.some(file => file.startsWith('uz/guides/')),
  'Build should emit localized Russian and Uzbek guide pages');

const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(sitemapLocations).size, sitemapLocations.length, 'Sitemap locations must be unique');
assert.ok(sitemapLocations.includes(`${SITE_URL}/Search`));
assert.ok(sitemapLocations.includes(`${SITE_URL}/ru/Search`));
assert.ok(sitemapLocations.includes(`${SITE_URL}/uz/Search`));
assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
assert.ok(!robots.includes('Disallow:'), 'Crawlers must be able to read noindex');
assert.ok(!builtPages.includes('sitemap.xml'), 'Sitemap is generated as an XML artifact, not an HTML source page');

const emittedPublic = new Set();
const titles = new Set();
const descriptions = new Set();
for (const file of builtPages) {
  const html = await readFile(path.join(dist, file), 'utf8');
  const route = routeForFile(file);
  const bodyMarkup = html.split('<body>')[1]?.replace(/<script\b[\s\S]*?<\/script>/gi, '') || '';
  if (publicEntryRoutes.has(route)) {
    const entryStart = bodyMarkup.indexOf('<div id="public-entry">');
    const rootStart = bodyMarkup.indexOf('<div id="root"></div>');
    assert.ok(entryStart >= 0 && rootStart > entryStart, `${file}: meaningful public entry must precede the empty app root`);
    const fallback = bodyMarkup.slice(entryStart, rootStart);
    assert.ok(fallback.includes('class="entry-shell'), `${file}: public entry must use the visual pre-hydration shell`);
    assert.ok(!fallback.includes('discovery-embedded'), `${file}: old generic discovery-embedded box must not return`);
    assert.match(fallback, /<h1\b[^>]*>\s*[^<]+<\/h1>/i, `${file}: public entry must contain a heading`);
    assert.match(fallback, /<p\b[^>]*>\s*[^<]+<\/p>/i, `${file}: public entry must contain introductory copy`);
  } else {
    assert.ok(!bodyMarkup.includes('<div id="public-entry">'), `${file}: standalone page must not include the public app placeholder`);
  }
  const title = singleMatch(html, /<title>(.*?)<\/title>/s, file)[1];
  assert.ok(title.trim(), `${file}: title must not be empty`);
  assert.ok(html.includes('google-site-verification'), file);
  assert.ok(html.includes(`content="${SITE_URL}/og-unimatch.png"`), file);
  assert.ok(html.includes('name="twitter:image"'), file);
  assert.ok(!html.includes('uniiversities.vercel.app'), file);

  if (!route) {
    assert.equal(getMeta(html, 'robots'), 'noindex, follow', file);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 0, `${file}: noindex shell must not have a canonical`);
    continue;
  }

  emittedPublic.add(`${SITE_URL}${route}`);
  assert.ok(!titles.has(title), `${file}: duplicate title ${title}`);
  titles.add(title);
  const description = getMeta(html, 'description');
  assert.ok(description.trim() && !descriptions.has(description), `${file}: missing or duplicate description`);
  descriptions.add(description);
  const canonical = singleMatch(html, /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/i, `${file} canonical`)[1];
  assert.equal(canonical, `${SITE_URL}${route}`, `${file}: canonical must match its clean URL`);
  assert.equal(getMeta(html, 'robots'), 'index, follow', file);
  const schemaTag = singleMatch(html, /<script\s+id="route-schema"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i, `${file} route schema`);
  const schema = JSON.parse(schemaTag[1]);
  assert.equal(schema['@context'], 'https://schema.org', file);
  assert.ok(Array.isArray(schema['@graph']), `${file}: schema must use @graph`);
  const types = schema['@graph'].flatMap(entity => Array.isArray(entity['@type']) ? entity['@type'] : [entity['@type']]);
  assert.ok(types.includes('WebSite'), `${file}: schema needs WebSite`);
  const websiteNode = schema['@graph'].find(entity => entity['@type'] === 'WebSite');
  assert.equal(websiteNode?.potentialAction?.['@type'], 'SearchAction', `${file}: WebSite schema needs SearchAction`);
  assert.ok(types.includes('Organization'), `${file}: schema needs Organization`);

  if (route.startsWith('/universities/')) {
    assert.ok(types.includes('CollegeOrUniversity'), `${file}: profile schema missing`);
    assert.ok(types.includes('Course'), `${file}: profile schema needs Course`);
    assert.ok(types.includes('FAQPage'), `${file}: profile schema needs FAQPage`);
  }
  if (route.includes('/guides/')) assert.ok(types.includes('Article'), `${file}: guide schema missing`);
  if (route.startsWith('/countries/') || route.startsWith('/universities/') || route.includes('/guides/') || route.startsWith('/study/')) {
    assert.ok(types.includes('BreadcrumbList'), `${file}: discovery page schema needs breadcrumbs`);
  }
  {
    const body = bodyMarkup;
    singleMatch(body, /<h1\b[^>]*>\s*[^<]+<\/h1>/i, `${file}: meaningful initial heading`);
    assert.ok(body.includes('<p'), `${file}: introductory content must exist without JavaScript`);
    if (route.startsWith('/universities/')) {
      assert.ok(body.includes('Programmes in the UniMatch catalog') && body.includes('Official sources'));
      assert.ok(!/href="\/University\?id=/i.test(body), `${file}: profile pages must not link to duplicate noindex UUID URLs`);
      const visibleText = body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
      assert.ok(!/Accepted(?:\s+bachelor)?\s+field\s+source:|Manager-accepted|!W_HU_MENU|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)20\d{2}\b/i.test(visibleText),
        `${file}: leaked internal source labels or intake typos must not appear in public text`);
    }
    for (const [, href] of body.matchAll(/<a\b[^>]*\bhref="(\/[^"?]*)"/gi)) {
      assert.ok(sitemapLocations.includes(SITE_URL + href), `${file}: internal discovery link not emitted: ${href}`);
    }
  }

  if (route === '/Search' || route === '/ru/Search' || route === '/uz/Search') {
    assert.ok(html.includes(`<html lang="${route === '/Search' ? 'en' : route.split('/')[1]}">`), file);
    for (const [lang, pathName] of Object.entries({ en: '/Search', ru: '/ru/Search', uz: '/uz/Search', 'x-default': '/Search' })) {
      const alternate = [...html.matchAll(/<link\b([^>]*\brel="alternate"[^>]*)>/gi)]
        .some(([, attributes]) => new RegExp(`\\bhreflang="${lang}"`).test(attributes)
          && attributes.includes(`href="${SITE_URL}${pathName}"`));
      assert.ok(alternate, `${file}: missing ${lang} alternate`);
    }
  }
}
assert.deepEqual([...sitemapLocations].sort(), [...emittedPublic].sort(), 'Sitemap must list every indexable built page exactly once');

for (const route of ['/', '/Search', '/AdmissionsSurvey', '/ru/Search', '/uz/Search']) {
  const seo = getSeo(route);
  assert.equal(seo.canonical, `${SITE_URL}${route}`);
  assert.equal(seo.robots, 'index, follow');
  assert.ok(seo.title && seo.description);
}
assert.equal(getSeo('/Search', 'unsupported').title, getSeo('/Search').title);
assert.equal(getSeo('/Home').canonical, `${SITE_URL}/`);
assert.equal(getSeo('/search/').canonical, `${SITE_URL}/Search`);
for (const pathName of PRIVATE_PATHS) {
  assert.equal(getSeo(pathName).robots, 'noindex, follow');
  assert.equal(getSeo(pathName).canonical, null);
}
assert.equal(getSeo('/does-not-exist').robots, 'noindex, follow');
const pageConfig = await read('src/pages.config.js');
const pageNames = [...pageConfig.matchAll(/^\s+"(\w+)":/gm)].map(match => `/${match[1]}`);
assert.deepEqual(pageNames.sort(), [...PUBLIC_PATHS.filter(route => route !== '/'), ...PRIVATE_PATHS, '/Home'].sort(),
  'New app routes require an explicit SEO/routing decision');

assert.equal(config.cleanUrls, true, 'Static HTML routes should use clean URLs');
assert.equal(config.trailingSlash, false);
assert.ok(config.redirects.some(rule => rule.source === '/en/Search' && rule.destination === '/Search' && rule.permanent === true),
  'English search path should redirect permanently to the canonical search route');
assert.ok(config.redirects.some(rule => rule.source === '/ru' && rule.destination === '/ru/Search' && rule.permanent === true),
  'Shorthand Russian path should redirect permanently to the canonical Search route');
assert.ok(config.headers.some(rule => rule.source === '/assets/(.*)' && rule.headers?.some(h => h.key === 'Cache-Control' && /immutable/.test(h.value))),
  'Fingerprinted build assets must send immutable Cache-Control');
assert.ok(config.rewrites.some(rule => rule.destination === '/seo/private'), 'Private routes should resolve to the noindex shell');
const privateRewrite = config.rewrites.find(rule => rule.destination === '/seo/private');
assert.ok(privateRewrite && privateRewrite.source.includes('University') && PRIVATE_PATHS.every(route => privateRewrite.source.includes(route.slice(1))),
  'The Vercel private rewrite should list the known private routes');
assert.ok(!config.rewrites.some(rule => rule.source === '/:path*'), 'A broad path rewrite would turn unknown URLs into the private shell');
assert.ok(!config.rewrites.some(rule => rule.source === '/(.*)'), 'Unknown URLs must reach the platform 404');
for (const host of ['uniiversities.vercel.app', 'www.getunimatch.app']) {
  const redirect = config.redirects.find(rule => rule.has?.some(condition => condition.type === 'host' && new RegExp(`^${condition.value}$`).test(host)));
  assert.equal(redirect?.destination, `${SITE_URL}/:path*`);
  assert.equal(redirect?.permanent, true);
  assert.ok(!new RegExp(`^${redirect.has[0].value}$`).test('unimatch-preview.vercel.app'));
}
const noindexHostRules = config.headers.filter(rule => rule.headers?.some(header => header.key.toLowerCase() === 'x-robots-tag' && /noindex/i.test(header.value)));
assert.ok(noindexHostRules.length, 'Noncanonical deployment hosts should send X-Robots-Tag: noindex');
for (const hostRule of noindexHostRules) {
  const condition = hostRule.missing?.find(entry => entry.type === 'host');
  assert.ok(condition, 'X-Robots-Tag rule should exclude the production host');
  const host = new RegExp(`^${condition.value}$`);
  assert.ok(host.test('getunimatch.app'));
  assert.ok(!host.test('staging.getunimatch.app'));
  assert.ok(!host.test('unimatch-preview.vercel.app'));
}

const published = publicAdmissionCatalogRow();
const draft = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000002', slug: 'draft', alias: '10000000-0000-4000-8000-000000000002', programmeId: 'draft-cs' });
draft.catalog.state = 'draft';
const incomplete = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000003', slug: 'empty', alias: '10000000-0000-4000-8000-000000000003' });
incomplete.catalog.programmes = [];
const duplicateName = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000004', slug: 'other-institution', alias: '10000000-0000-4000-8000-000000000004', programmeId: 'other-cs' });
const rows = [published, draft, incomplete, duplicateName];
const project = records => buildDiscoveryPages(projectSeoInstitutions(adaptPublicCatalog(records)), [{ state: 'draft', slug: 'never-index' }]).pages;
const before = project(rows);
assert.deepEqual(before.filter(page => page.universityId).map(page => page.path).sort(),
  ['/universities/other-institution', '/universities/sample-university']);
assert.equal(new Set(before.filter(page => page.universityId).map(page => page.title)).size, 2);
assert.equal(new Set(before.filter(page => page.universityId).map(page => page.description)).size, 2);
for (const page of before.filter(page => page.universityId)) {
  assert.ok(page.actions.some(link => link.href === '/Search'));
  assert.ok(page.actions.some(link => link.href === '/AdmissionsSurvey'));
}
const sampleProfile = before.find(page => page.path === '/universities/sample-university');
const programmeSection = sampleProfile.sections.find(section => section.heading === 'Programmes in the UniMatch catalog');
const sourceSection = sampleProfile.sections.find(section => section.heading === 'Official sources');
assert.match(sampleProfile.description, /taught in English/);
assert.match(sampleProfile.description, /Autumn 2027/);
assert.match(programmeSection.items[0], /Teaching language: English/);
assert.match(programmeSection.items[0], /Intake: Autumn 2027/);
assert.ok(programmeSection.items[0].includes(`Tuition: ${formatUsd(toUsd(12000, 'EUR'))} / year (2027)`));
assert.doesNotMatch(programmeSection.items[0], /Approx\.|12,000 EUR|ECB/);
assert.match(programmeSection.items[0], /2027-05-01 \(Europe\/London\)/);
assert.match(programmeSection.items[0], /minimum 3 on the original 4-point scale/);
assert.ok(!programmeSection.items[0].includes('Capital'), 'Institution city must not be presented as programme campus');
assert.match(sourceSection.links[0].detail, /BSc Computer Science \(teaching language, intake, tuition, deadline, academic requirement\)/,
  'Official source links must identify the programme and associated facts');
assert.equal(new Set(sourceSection.links.map(link => link.href)).size, sourceSection.links.length,
  'Official source URLs must be de-duplicated');

const staleVerified = publicAdmissionCatalogRow({
  id: '00000000-0000-4000-8000-000000000005', slug: 'stale-verified', alias: '10000000-0000-4000-8000-000000000005',
});
const staleFacts = staleVerified.catalog.programmes[0];
staleFacts.intake.value = { year: 2024, text: 'Autumn 2024' };
staleFacts.intake.scope.intakeYear = 2024;
staleFacts.teachingLanguage.scope.intakeYear = 2024;
const staleProjection = projectSeoInstitutions(adaptPublicCatalog([staleVerified]));
assert.equal(staleProjection[0].programmes[0].intake, null, 'Stale intake facts must not be projected');
assert.equal(staleProjection[0].programmes[0].teachingLanguage, null, 'Stale teaching language must not be projected');

const unmatchedSourceProjection = adaptPublicCatalog([publicAdmissionCatalogRow()]);
unmatchedSourceProjection.institutions[0].programmes[0].facts.teachingLanguage.sourceIds = ['missing-source'];
assert.equal(projectSeoInstitutions(unmatchedSourceProjection)[0].programmes[0].teachingLanguage, null,
  'Teaching language must be omitted when its source cannot be resolved');

const narrowScopeProjection = adaptPublicCatalog([publicAdmissionCatalogRow()]);
narrowScopeProjection.institutions[0].programmes[0].facts.teachingLanguage.scope.studentCategory = 'international_freshman';
assert.equal(projectSeoInstitutions(narrowScopeProjection)[0].programmes[0].teachingLanguage, null,
  'Applicant-specific teaching language must not be presented as general programme information');
assert.ok(!before.some(page => page.path.includes('never-index')));
const editorial = [
  { state: 'published', language: 'en', slug: 'guide-en', heading: 'English guide', intro: 'Intro', translationKey: 'guide' },
  { state: 'published', language: 'ru', slug: 'guide-ru', heading: 'Русский гайд', intro: 'Введение', translationKey: 'guide' },
  { state: 'draft', language: 'uz', slug: 'guide-uz', heading: 'Oʻzbekcha qoʻllanma', intro: 'Kirish', translationKey: 'guide' },
].map(entry => ({
  ...entry, sections: [{ heading: entry.heading, paragraphs: [entry.intro], links: [
    { href: 'https://example.edu/admissions', label: 'Fixture source', detail: 'Checked 2026-10-01' },
  ] }],
}));
const translated = buildDiscoveryPages([], editorial).pages.filter(page => page.path.includes('/guides/'));
assert.equal(translated.length, 2);
assert.deepEqual(translated.map(page => page.actions.find(link => link.href === '/AdmissionsSurvey')?.label),
  ['Find my match', 'Подобрать университеты']);
for (const page of translated) assert.deepEqual(page.alternates, {
  en: '/guides/guide-en', ru: '/ru/guides/guide-ru', 'x-default': '/guides/guide-en',
});
const renamed = structuredClone(published);
renamed.name = 'Renamed University';
assert.equal(project([renamed]).find(page => page.universityId).path, '/universities/sample-university');
assert.ok(!project([draft, incomplete]).some(page => page.universityId), 'Removed/unpublished profiles must disappear from the next build');
const serialized = JSON.stringify(before);
assert.ok(!serialized.includes('legacyFavoriteKeys') && !serialized.includes('"revision"'), 'Private or internal catalog metadata must never be serialized');
const leakedPrefix = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000009', slug: 'clean-source', alias: '10000000-0000-4000-8000-000000000009' });
leakedPrefix.catalog.sources['official_main-2027'].title = 'Accepted bachelor field source: Sample University';
leakedPrefix.catalog.programmes[0].intake.value = { year: 2027, text: 'September2027' };
const cleanedProfile = project([leakedPrefix]).find(page => page.universityId);
assert.ok(!cleanedProfile.sections.find(s => s.heading === 'Official sources').links[0].label.includes('Accepted bachelor field source'),
  'Internal source prefixes must be cleaned before output');
assert.match(cleanedProfile.description, /September 2027/, 'Concatenated intake dates must be separated cleanly');
assert.equal(safePublicLoginReturn('/universities/sample-university'), '/universities/sample-university');
assert.equal(safePublicLoginReturn('/uz/Search?q=cs'), '/uz/Search?q=cs');
assert.equal(universityReturnPath('/ru/Search?q=cs'), '/ru/Search?q=cs');
assert.equal(safePublicLoginReturn('//external.example/universities/sample'), '/');
await assert.rejects(loadSeoInstitutions({
  VERCEL_ENV: 'production', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_secret_test_value',
}), /catalog_configuration_invalid/);
await assert.rejects(loadSeoInstitutions({ VERCEL_ENV: 'preview' }), /catalog_configuration_invalid/);
assert.deepEqual(await loadSeoInstitutions({ VERCEL_ENV: 'preview', SEO_FETCH_PUBLIC_CATALOG: '0' }), []);

if (process.env.SEO_CHECK_ORIGIN) {
  const origin = new URL(process.env.SEO_CHECK_ORIGIN);
  const request = (route, options = {}) => fetch(new URL(route, origin), { redirect: 'manual', signal: AbortSignal.timeout(10_000), ...options });
  const paths = [...emittedPublic].map(url => new URL(url).pathname);
  const profileRoute = paths.find(route => route.startsWith('/universities/'));
  const countryRoute = paths.find(route => route.startsWith('/countries/'));
  const studyRoute = paths.find(route => route.startsWith('/study/'));
  const ruGuideRoute = paths.find(route => route.startsWith('/ru/guides/'));
  const uzGuideRoute = paths.find(route => route.startsWith('/uz/guides/'));
  for (const route of ['/', '/Search', '/ru/Search', '/uz/Search', '/sitemap.xml', '/robots.txt', profileRoute, countryRoute, studyRoute, ruGuideRoute, uzGuideRoute].filter(Boolean)) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
    if (route === profileRoute) assert.match(await response.text(), /Programmes in the UniMatch catalog/);
    else await response.body?.cancel();
  }
  for (const route of ['/universities/missing-profile', '/universities/invalid%20slug', '/countries/missing-country', '/uz/guides/unpublished', '/missing-page']) {
    const response = await request(route);
    assert.equal(response.status, 404, route);
    assert.match(await response.text(), /noindex, follow/);
  }
  for (const route of ['/University?id=00000000-0000-4000-8000-000000000001', ...PRIVATE_PATHS.filter(path => path !== '/University')]) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /noindex, follow/);
  }
  for (const [route, destination] of [
    ['/Search/', '/Search'],
    ['/Search.html', '/Search'],
    ['/en/Search', '/Search'],
    ['/search', '/Search'],
    ['/en', '/'],
    ['/ru', '/ru/Search'],
    ['/ru/search', '/ru/Search'],
    ['/uz', '/uz/Search'],
    ['/uz/search', '/uz/Search'],
    ['/admissions-survey', '/AdmissionsSurvey'],
  ]) {
    const response = await request(route);
    assert.equal(response.status, 308, route);
    assert.equal(response.headers.get('location'), destination, route);
    await response.body?.cancel();
  }
}

console.log(`SEO checks passed: ${emittedPublic.size} indexable pages, publication fixtures, sitemap, metadata, schema, locales, private shell and routing.`);
