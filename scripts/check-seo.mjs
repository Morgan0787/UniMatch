import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getSeo, PUBLIC_PATHS, PRIVATE_PATHS, SITE_URL } from '../src/lib/seo.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const config = JSON.parse(await read('vercel.json'));
const sitemap = await read('dist/sitemap.xml');
const robots = await read('dist/robots.txt');
const socialImage = await readFile(new URL('../dist/og-unimatch.png', import.meta.url));
assert.equal(socialImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(socialImage.readUInt32BE(16), 1200);
assert.equal(socialImage.readUInt32BE(20), 630);
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(locations, PUBLIC_PATHS.map(path => `${SITE_URL}${path}`));
assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
assert.ok(!robots.includes('Disallow:'), 'Crawlers must be able to read noindex');

const titles = new Set();
for (const path of PUBLIC_PATHS) {
  const file = path === '/' ? 'dist/index.html' : `dist/seo${path}.html`;
  const html = await read(file);
  const seo = getSeo(path);
  assert.equal((html.match(/<title>/g) || []).length, 1, file);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
  assert.ok(html.includes(`href="${SITE_URL}${path}"`), file);
  assert.ok(html.includes('<meta name="robots" content="index, follow"'), file);
  assert.ok(html.includes('google-site-verification'), file);
  assert.ok(html.includes(`content="${SITE_URL}/og-unimatch.png"`), file);
  assert.ok(html.includes('name="twitter:image"'), file);
  assert.ok(!html.includes('uniiversities.vercel.app'), file);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.url, `${SITE_URL}/`);
  titles.add(seo.title);
  if (path !== '/') assert.ok(config.rewrites.some(rule => rule.source === path && rule.destination === `/seo${path}.html`));
  for (const language of ['en', 'ru', 'uz']) {
    const translated = getSeo(path, language);
    assert.equal(translated.canonical, seo.canonical);
    assert.ok(translated.title && translated.description);
  }
}
assert.equal(titles.size, PUBLIC_PATHS.length, 'Public pages need distinct titles');
for (const file of ['dist/seo/private.html', 'dist/404.html']) {
  const html = await read(file);
  assert.ok(html.includes('content="noindex, follow"'), file);
  assert.ok(!html.includes('rel="canonical"'), file);
}
const privateRule = config.rewrites.find(rule => rule.destination === '/seo/private.html');
for (const path of PRIVATE_PATHS) {
  assert.ok(privateRule.source.includes(path.slice(1)), `Missing direct navigation route: ${path}`);
  assert.equal(getSeo(path).robots, 'noindex, follow');
  assert.equal(getSeo(path).canonical, null);
}
assert.equal(getSeo('/does-not-exist').robots, 'noindex, follow');
assert.equal(getSeo('/Home').canonical, `${SITE_URL}/`);
assert.equal(getSeo('/search/').canonical, `${SITE_URL}/Search`);
assert.equal(getSeo('/Search', 'unsupported').title, getSeo('/Search').title);
assert.ok(!config.rewrites.some(rule => rule.source === '/(.*)'), 'Unknown URLs must reach the platform 404');
for (const host of ['uniiversities.vercel.app', 'www.getunimatch.app']) {
  const redirect = config.redirects.find(rule => rule.has?.some(condition => condition.type === 'host' && new RegExp(`^${condition.value}$`).test(host)));
  assert.equal(redirect?.destination, `${SITE_URL}/:path*`);
  assert.equal(redirect?.permanent, true);
  assert.ok(!new RegExp(`^${redirect.has[0].value}$`).test('unimatch-preview.vercel.app'));
}
const pageConfig = await read('src/pages.config.js');
const pageNames = [...pageConfig.matchAll(/^\s+"(\w+)":/gm)].map(match => `/${match[1]}`);
assert.deepEqual(pageNames.sort(), [...PUBLIC_PATHS.filter(path => path !== '/'), ...PRIVATE_PATHS, '/Home'].sort(), 'New pages require an explicit SEO/routing decision');
console.log('SEO checks passed: built metadata, sitemap, noindex, locales, route coverage and host redirects.');
