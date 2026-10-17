import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// The DOM contract is bound to the designer's FINAL artifact after an explicit
// readiness signal. No guessed selector can silently turn a missing step green.
const root = path.resolve('docs/business-turks-2026/ux-05');
const output = path.resolve('output/ux05-qa');
const url = 'http://127.0.0.1:5183/';
const report = { testedSha: process.env.GITHUB_SHA || null, startedAt: new Date().toISOString(), prototypeSha256: null, checks: [], screenshots: [], focus: [], errors: [], externalRequests: [], visualReview: 'pending' };
let browser;
const contexts = new Set();
await mkdir(output, { recursive: true });

async function visible(page, selector, label) {
  assert.equal(typeof selector, 'string', `${label}: final DOM selector missing`);
  const locator = page.locator(selector).filter({ visible: true });
  assert.equal(await locator.count(), 1, `${label}: expected exactly one visible target for ${selector}`);
  return locator;
}

async function stage(page, selector, label) {
  await page.locator(selector).waitFor({ state: 'visible' });
  assert.equal(await page.locator(selector).filter({ visible: true }).count(), 1, label);
}

async function geometry(page, label) {
  const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(result.scrollWidth <= result.width, `${label}: horizontal overflow ${JSON.stringify(result)}`);
  report.checks.push({ label, ...result });
}

async function screenshot(page, name, fullPage = true) {
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage, animations: 'disabled' });
  report.screenshots.push(`${name}.png`);
}

async function setup(page, actions = []) {
  for (const action of actions) {
    const target = await visible(page, action.selector, 'setup');
    if (action.type === 'select') await target.selectOption(action.value);
    else if (action.type === 'fill') await target.fill(action.value);
    else if (action.type === 'check') await target.check();
    else if (action.type === 'click') await target.click();
    else throw new Error(`Unsupported explicit setup action ${action.type}`);
  }
}

async function scenario(width, height, reduced, contract) {
  const prefix = `${reduced ? 'reduced' : 'normal'}-${width}`;
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
  contexts.add(context);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  await context.route(/^https?:\/\//, async route => {
    const request = route.request();
    if (new URL(request.url()).origin === new URL(url).origin) { await route.continue(); return; }
    // Only explicitly reviewed public font resources may be fetched; no APIs,
    // trackers, account data or remote app service is part of this prototype QA.
    const host = new URL(request.url()).hostname;
    if ((contract.publicFontHosts || []).includes(host) && ['GET', 'HEAD'].includes(request.method())) { await route.continue(); return; }
    report.externalRequests.push({ url: request.url(), method: request.method() });
    await route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(15_000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`HTTP${response.status()}: ${response.url()}`); });
  try {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await stage(page, contract.steps[0], 'First render / step1');
    await geometry(page, `${prefix}-step1`);
    await screenshot(page, `${prefix}-step1`);
    await screenshot(page, `${prefix}-step1-viewport`, false);
    await setup(page, contract.step1Setup);
    const next = await visible(page, contract.next, 'step1 next');
    let keyboardReachedNext = false;
    for (let tab = 0; tab < 50; tab++) {
      await page.keyboard.press('Tab');
      if (await next.evaluate(element => element === document.activeElement)) { keyboardReachedNext = true; break; }
    }
    assert.ok(keyboardReachedNext, 'Next button must be reachable by Tab');
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return { tag: element.tagName, text: element.textContent.trim(), outline: css.outline, boxShadow: css.boxShadow, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportHeight: innerHeight, focused: element.matches(':focus') };
    });
    assert.ok(focus.focused && focus.left >= 0 && focus.right <= width && focus.top >= 0 && focus.bottom <= focus.viewportHeight, 'Keyboard target must be focused and visible');
    report.focus.push({ prefix, ...focus });
    await screenshot(page, `${prefix}-keyboard-focus`, false);
    await page.keyboard.press('Enter');
    await stage(page, contract.steps[1], 'Keyboard advance / step2');
    await geometry(page, `${prefix}-step2`);
    await screenshot(page, `${prefix}-step2`);
    await (await visible(page, contract.back, 'step2 back')).click();
    await stage(page, contract.steps[0], 'Back restores step1');
    assert.ok(await page.locator('input[name="field"][value="Computer Science"]').isChecked(), 'Back must preserve selected subject');
    await (await visible(page, contract.next, 'step1 next again')).click();
    await stage(page, contract.steps[1], 'Return to step2');
    await (await visible(page, contract.skip, 'Skip unknown language')).click();
    await stage(page, contract.steps[2], 'Skip reaches step3');
    await geometry(page, `${prefix}-step3`);
    await screenshot(page, `${prefix}-step3`);
    await (await visible(page, contract.back, 'step3 back')).click();
    await stage(page, contract.steps[1], 'Back to language');
    await page.locator('[name="exam"]').selectOption('IELTS Academic');
    await page.locator('[name="score"]').fill('5.5');
    await page.locator('[name="exam"]').selectOption('Ещё не сдавал(а)');
    assert.equal(await page.locator('[name="score"]').inputValue(), '', 'Changing exam must discard previous result');
    assert.ok(await page.locator('#score-field').isHidden(), 'Not yet taken must not show a score input');
    await setup(page, contract.ieltsPreparation);
    await stage(page, contract.ieltsPreparationState, 'IELTS preparation state');
    await screenshot(page, `${prefix}-ielts-preparation`);
    await (await visible(page, contract.next, 'language next')).click();
    await stage(page, contract.steps[2], 'Preparation reaches step3');
    await setup(page, contract.step3Setup);
    await (await visible(page, contract.resultsButton, 'results button')).click();
    await stage(page, contract.results, 'Results rendered');
    assert.ok(await page.locator(contract.resultCards).count() > 0, 'Results must contain visible programme cards');
    await geometry(page, `${prefix}-results`);
    await screenshot(page, `${prefix}-results`);
    await screenshot(page, `${prefix}-results-viewport`, false);
    await (await visible(page, contract.detailsButton, 'first card details')).click();
    await stage(page, contract.detailsPanel, 'Details open');
    await screenshot(page, `${prefix}-details`);
    if (contract.detailsClose) await (await visible(page, contract.detailsClose, 'close details')).click();
    await (await visible(page, contract.edit, 'Edit answers')).click();
    await stage(page, contract.steps[0], 'Edit returns to step1');
    assert.ok(await page.locator('input[name="field"][value="Computer Science"]').isChecked(), 'Edit must preserve selected subject');
    await geometry(page, `${prefix}-edit`);
    if (reduced) {
      assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
      const motion = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running' && (animation.effect?.getComputedTiming().activeDuration || 0) > 200).map(animation => ({ name: animation.animationName || animation.constructor.name, duration: animation.effect?.getComputedTiming().activeDuration })));
      report.checks.push({ label: 'reduced-motion', activeLongAnimations: motion });
      assert.deepEqual(motion, [], 'Reduced motion should not leave long-running animations');
    }
    for (const state of ['incomplete', 'ielts', 'few', 'empty']) {
      await page.goto(`${url}?view=results&state=${state}`);
      await stage(page, contract.results, `QA ${state} renders`);
      await geometry(page, `${prefix}-${state}`);
      const cards = page.locator('.program');
      assert.equal(await cards.count(), state === 'empty' ? 0 : state === 'few' ? 1 : 3);
      assert.equal(await page.locator('.status.attention').count(), state === 'ielts' ? 2 : 0);
      if (state === 'ielts') {
        assert.equal(await page.locator('.program-list').first().locator('.program').count(), 1, 'IELTS5.5 only one ordinary example');
        assert.equal(await page.locator('.program-list').nth(1).locator('.program').count(), 2, 'Known IELTS shortfalls separate');
      }
      await screenshot(page, `${prefix}-state-${state}`);
    }
    await page.goto(`${url}?view=results&state=incomplete`);
    await page.locator('details:has(#refine-form) > summary').click();
    await page.locator('[name="schoolCountry"]').fill('Узбекистан');
    await page.locator('#refine-form button[type="submit"]').click();
    await page.locator('#refine-status').filter({ hasText: 'Реальный подбор не пересчитан' }).waitFor();
    report.checks.push({ label: `${prefix}-states`, states: ['incomplete', 'ielts', 'few', 'empty'], refinement: 'prototype only' });
    report.checks.push({ label: prefix, flow: 'first render,3steps,keyboard,next,back,skip,IELTS preparation,results,details,edit', passed: true });
    await context.tracing.stop();
  } catch (error) {
    await screenshot(page, `${prefix}-FAILURE`).catch(() => {});
    await context.tracing.stop({ path: path.join(output, `${prefix}-failure.zip`) }).catch(() => {});
    throw error;
  } finally { await context.close(); contexts.delete(context); }
}

let timeout;
try {
  const html = await readFile(path.join(root, 'index.html'));
  report.prototypeSha256 = createHash('sha256').update(html).digest('hex');
  const contract = JSON.parse(await readFile('scripts/ci/ux-prototype-contract.json', 'utf8'));
  assert.equal(contract.prototypeSha256, report.prototypeSha256, 'DOM contract must match approved final prototype bytes');
  report.prototypeFiles = {};
  for (const file of ['index.html', 'styles.css', 'app.js', 'data.js']) {
    report.prototypeFiles[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
    assert.equal(report.prototypeFiles[file], contract.prototypeFiles[file], `Approved prototype hash mismatch: ${file}`);
  }
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* runner readiness */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Runner static server did not start');
  browser = await chromium.launch({ headless: true });
  await Promise.race([
    (async () => { for (const [width, height, reduced] of [[1440, 1000, false], [390, 844, false], [320, 844, false], [390, 844, true]]) await scenario(width, height, reduced, contract); })(),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('UX QA exceeded180seconds')), 180_000); }),
  ]);
  assert.deepEqual(report.errors, [], 'Page or asset errors');
  assert.deepEqual(report.externalRequests, [], 'Unexpected external request');
  report.assertionStatus = 'passed';
} catch (error) {
  report.assertionStatus = 'failed'; report.errors.push(error.stack || String(error)); process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  for (const context of contexts) await context.close().catch(() => {});
  await browser?.close();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
