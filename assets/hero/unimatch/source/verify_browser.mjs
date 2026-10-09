import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reuse the already-installed browser tooling; no extra project dependencies.
const { chromium } = await import(process.env.UNIMATCH_PLAYWRIGHT_MODULE || '/workspace/3d-toolkit/node_modules/playwright/index.mjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'previews/browser');
await fs.mkdir(evidence, { recursive: true });
const url = process.env.UNIMATCH_PREVIEW_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.UNIMATCH_CHROMIUM || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];

async function newContext(viewport, options = {}) {
    const context = await browser.newContext({ viewport, ...options });
    await context.addInitScript(() => localStorage.setItem('hasSeenOnboarding', 'true'));
    // Preview is deliberately disconnected from real data and auth.
    await context.route('**/unimatch-preview.invalid/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    return context;
}

try {
    // Inspect interaction only; no MDX assets are saved or incorporated.
    try {
        const reference = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await reference.goto('https://mdx.so/', { waitUntil: 'domcontentloaded', timeout: 20000 });
        const observed = await reference.evaluate(() => ({ title: document.title, canvasCount: document.querySelectorAll('canvas').length,
            scrollHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight,
            pinnedElements: [...document.querySelectorAll('*')].filter(el => ['sticky', 'fixed'].includes(getComputedStyle(el).position)).length }));
        await reference.mouse.wheel(0, 1000);
        results.push({ reference: 'mdx.so, interaction inspection only', observed });
        await reference.close();
    } catch (error) { results.push({ reference: 'mdx.so', limit: error.message }); }

    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
        const context = await newContext(viewport);
        const page = await context.newPage();
        const errors = [];
        const requests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => { if (/\/media\/unimatch-hero\/(frames|mobile)\//.test(req.url())) requests.push(req.url()); });
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => document.querySelector('.um-hero')?.getAttribute('data-frame') === '0');
        const label = `${viewport.width}x${viewport.height}`;
        const geometry = await page.evaluate(() => {
            const hero = document.querySelector('.um-hero');
            const pin = hero.querySelector('.um-hero__pin');
            const art = hero.querySelector('.um-hero__art').getBoundingClientRect();
            return { travel: hero.getBoundingClientRect().height - pin.clientHeight,
                     art: { x: art.x, y: art.y, width: art.width, height: art.height }, pinHeight: pin.clientHeight, innerHeight,
                     heading: document.querySelector('h1').textContent, width: document.documentElement.scrollWidth };
        });
        assert.equal(geometry.width, viewport.width, 'No horizontal overflow');
        assert.ok(Math.abs(geometry.travel / viewport.height - 3.5) < .03, '3.5 viewport scroll travel');
        assert.deepEqual(await page.locator('.um-hero__actions a').evaluateAll(els => els.map(el => el.getAttribute('href'))), ['/Search', '/Profile']);
        assert.ok(requests.length < 20, 'Initial load stays bounded');
        assert.ok(await page.locator('.um-hero__scroll').evaluate(el => el.getBoundingClientRect().right < innerWidth - 78), 'Scroll link stays clear of feedback button');
        await page.screenshot({ path: path.join(evidence, `${label}-start.png`) });

        for (const [state, progress] of [['atlas', 47 / 119], ['routes', 72 / 119], ['end', 1], ['reverse', 47 / 119], ['returned', 0]]) {
            await page.evaluate(y => window.scrollTo(0, y), geometry.travel * progress);
            const target = Math.round(progress * 119);
            await page.waitForFunction(index => Number(document.querySelector('.um-hero').getAttribute('data-frame')) === index, target, { timeout: 15000 });
            const stateGeometry = await page.evaluate(() => {
                const hero = document.querySelector('.um-hero');
                const canvas = hero.querySelector('canvas');
                const rect = canvas.getBoundingClientRect();
                const ctx = canvas.getContext('2d');
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
                for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                    if (pixels[(y * canvas.width + x) * 4 + 3] > 8) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
                }
                return { frame: Number(hero.dataset.frame), cached: Number(hero.dataset.cachedFrames), pinTop: hero.querySelector('.um-hero__pin').getBoundingClientRect().top,
                    object: { left: rect.left + minX / canvas.width * rect.width, right: rect.left + maxX / canvas.width * rect.width,
                              top: rect.top + minY / canvas.height * rect.height, bottom: rect.top + maxY / canvas.height * rect.height },
                    canvasSize: canvas.width };
            });
            assert.ok(stateGeometry.cached <= 12, 'Bounded cache');
            assert.ok(Math.abs(stateGeometry.pinTop - 64) < 2, 'Hero stays pinned below nav');
            assert.ok(stateGeometry.object.left > 0 && stateGeometry.object.right < viewport.width, 'Object fits horizontally');
            assert.ok(stateGeometry.object.top >= 64 && stateGeometry.object.bottom < viewport.height, 'Object fits vertically');
            results.push({ viewport: label, state, ...stateGeometry });
            await page.screenshot({ path: path.join(evidence, `${label}-${state}.png`) });
        }

        await page.mouse.wheel(0, geometry.travel + 300);
        await page.waitForFunction(() => document.querySelector('#unimatch-after-hero').getBoundingClientRect().top < innerHeight - 50);
        await page.screenshot({ path: path.join(evidence, `${label}-next-section.png`) });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('.um-hero__scroll').click();
        assert.equal(await page.evaluate(() => document.activeElement.id), 'unimatch-after-hero', 'Skip moves keyboard focus');
        assert.deepEqual(errors, [], 'No uncaught browser errors');
        const folder = viewport.width < 768 ? '/mobile/' : '/frames/';
        assert.ok(requests.every(req => req.includes(folder)), 'Uses correct frame resolution');
        results.push({ viewport: label, geometry, requestCount: requests.length, errors });
        await context.close();
    }

    const reduced = await newContext({ width: 390, height: 844 }, { reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage();
    const reducedRequests = [];
    reducedPage.on('request', req => { if (/frame-\d+\.webp/.test(req.url())) reducedRequests.push(req.url()); });
    await reducedPage.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await reducedPage.locator('.um-hero__pin').evaluate(el => getComputedStyle(el).position), 'relative');
    assert.ok(await reducedPage.locator('.um-hero').evaluate(el => el.clientHeight < innerHeight * 1.5));
    assert.ok(reducedRequests.length <= 1);
    await reducedPage.screenshot({ path: path.join(evidence, '390x844-reduced-motion.png') });
    results.push({ reducedMotion: 'PASS', requests: reducedRequests.length });
    await reduced.close();

    const slow = await newContext({ width: 390, height: 844 });
    await slow.route('**/media/unimatch-hero/mobile/**', async route => { await new Promise(resolve => setTimeout(resolve, 450)); await route.continue(); });
    const slowPage = await slow.newPage();
    await slowPage.goto(url, { waitUntil: 'domcontentloaded' });
    await slowPage.locator('.um-hero__primary').waitFor({ state: 'visible' });
    await slowPage.mouse.wheel(0, 1800);
    await slowPage.waitForFunction(() => window.scrollY > 0);
    await slowPage.waitForFunction(() => {
        const hero = document.querySelector('.um-hero');
        return hero.dataset.frame === hero.dataset.targetFrame;
    }, undefined, { timeout: 15000 });
    await slowPage.screenshot({ path: path.join(evidence, '390x844-slow-loading.png') });
    results.push({ slowLoading: 'PASS' });
    await slow.close();

    const timeoutContext = await newContext({ width: 390, height: 844 });
    let firstAttempt = true;
    await timeoutContext.route('**/media/unimatch-hero/mobile/frame-0001.webp', async route => {
        if (firstAttempt) {
            firstAttempt = false;
            await new Promise(resolve => setTimeout(resolve, 9000));
        }
        await route.continue().catch(() => {});
    });
    const timeoutPage = await timeoutContext.newPage();
    await timeoutPage.goto(url, { waitUntil: 'domcontentloaded' });
    await timeoutPage.waitForFunction(() => document.querySelector('.um-hero')?.getAttribute('data-frame') === '0', undefined, { timeout: 18000 });
    assert.equal(await timeoutPage.evaluate(() => window.scrollY), 0);
    results.push({ timeoutRecovery: 'PASS without scrolling, first frame delayed beyond 8s' });
    await timeoutContext.close();

    const failure = await newContext({ width: 390, height: 844 });
    await failure.route('**/media/unimatch-hero/mobile/**', route => route.fulfill({ status: 404, body: '' }));
    const failurePage = await failure.newPage();
    await failurePage.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await failurePage.locator('.um-hero__poster').evaluate(el => el.complete && el.naturalWidth > 0), true);
    assert.equal(await failurePage.locator('.um-hero__poster').evaluate(el => getComputedStyle(el).visibility), 'visible');
    await failurePage.locator('.um-hero__scroll').click();
    await failurePage.screenshot({ path: path.join(evidence, '390x844-failure-fallback.png') });
    results.push({ missingFrames: 'PASS: poster and skip work' });
    await failure.close();

    const decode = await newContext({ width: 1280, height: 720 });
    const decodePage = await decode.newPage();
    await decodePage.goto(url, { waitUntil: 'domcontentloaded' });
    const decoded = await decodePage.evaluate(async () => {
        let count = 0;
        for (const [folder, size] of [['frames', 960], ['mobile', 560]]) {
            for (let i = 1; i <= 120; i++) {
                const response = await fetch(`/media/unimatch-hero/${folder}/frame-${String(i).padStart(4, '0')}.webp`);
                if (!response.ok) throw new Error('Missing WebP');
                const bitmap = await createImageBitmap(await response.blob());
                if (bitmap.width !== size || bitmap.height !== size) throw new Error('Wrong WebP dimensions');
                bitmap.close();
                count++;
            }
        }
        return count;
    });
    assert.equal(decoded, 240);
    results.push({ allWebPFramesDecoded: decoded });
    await decode.close();
    console.log('BROWSER_QA_PASS');
} finally {
    await fs.writeFile(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2) + '\n');
    await browser.close();
}
