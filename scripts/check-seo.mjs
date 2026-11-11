import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSeo, PRIVATE_PATHS, PUBLIC_PATHS, SITE_URL } from '../src/lib/seo.js';
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
for (const required of ['index.html', 'Search.html', 'AdmissionsSurvey.html', 'ru/Search.html', 'uz/Search.html', '404.html', 'seo/private.html']) {
  assert.ok(builtPages.includes(required), `Missing built HTML page: ${required}`);
}
assert.ok(builtPages.some(file => file.startsWith('guides/')),
  'Build should emit the currently available static guide page');

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
  assert.ok(types.includes('Organization'), `${file}: schema needs Organization`);

  if (route.startsWith('/universities/')) assert.ok(types.includes('CollegeOrUniversity'), `${file}: profile schema missing`);
  if (route.includes('/guides/')) assert.ok(types.includes('Article'), `${file}: guide schema missing`);
  if (route.startsWith('/countries/') || route.startsWith('/universities/') || route.startsWith('/guides/') || route.startsWith('/study/')) {
    assert.ok(types.includes('BreadcrumbList'), `${file}: discovery page schema needs breadcrumbs`);
  }
  {
    const body = html.split('<body>')[1]?.replace(/<script\b[\s\S]*?<\/script>/gi, '') || '';
    singleMatch(body, /<h1\b[^>]*>\s*[^<]+<\/h1>/i, `${file}: meaningful initial heading`);
    assert.ok(body.includes('<p'), `${file}: introductory content must exist without JavaScript`);
    if (route.startsWith('/universities/')) {
      assert.ok(body.includes('Programmes in the UniMatch catalog') && body.includes('Official sources'));
      assert.match(body, /href="\/University\?id=[a-f0-9-]{36}"/i, `${file}: legacy interactive details link missing`);
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
for (const page of translated) assert.deepEqual(page.alternates, {
  en: '/guides/guide-en', ru: '/ru/guides/guide-ru', 'x-default': '/guides/guide-en',
});
const renamed = structuredClone(published);
renamed.name = 'Renamed University';
assert.equal(project([renamed]).find(page => page.universityId).path, '/universities/sample-university');
assert.ok(!project([draft, incomplete]).some(page => page.universityId), 'Removed/unpublished profiles must disappear from the next build');
assert.ok(!JSON.stringify(before).includes('12000'), 'Private or nonprojected catalog fields must never be serialized');
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
  const profileRoute = [...emittedPublic].map(url => new URL(url).pathname).find(route => route.startsWith('/universities/'));
  for (const route of ['/', '/Search', '/ru/Search', '/uz/Search', '/sitemap.xml', '/robots.txt', profileRoute].filter(Boolean)) {
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
  for (const route of ['/Search/', '/Search.html', '/en/Search']) {
    const response = await request(route);
    assert.equal(response.status, 308, route);
    assert.equal(response.headers.get('location'), '/Search', route);
    await response.body?.cancel();
  }
}

console.log(`SEO checks passed: ${emittedPublic.size} indexable pages, publication fixtures, sitemap, metadata, schema, locales, private shell and routing.`);
