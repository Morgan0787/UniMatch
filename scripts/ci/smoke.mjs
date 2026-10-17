import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.CI_PREVIEW_URL ?? 'http://127.0.0.1:5182';
const reportDirectory = path.resolve('output/ci');
const timeoutMs = 180_000;
const evidence = {
  checkedAt: new Date().toISOString(),
  testedSha: process.env.GITHUB_SHA ?? null,
  baseUrl,
  checks: [],
  viewports: [],
  errors: [],
  blockedRequests: [],
};
const contexts = [];
let browser;
let reportWritten = false;

fs.mkdirSync(reportDirectory, { recursive: true });

function isLoopback(url) {
  try {
    const parsed = new URL(url);
    return ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isFontRequest(request) {
  if (request.resourceType() === 'font') return true;
  try {
    return /\.(?:woff2?|ttf|otf|eot)(?:$|[?#])/i.test(new URL(request.url()).pathname);
  } catch {
    return false;
  }
}

async function createContext(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  contexts.push(context);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  await context.addInitScript(() => localStorage.setItem('uniAdmitLanguage', 'ru'));
  await context.route(/^https?:\/\//, async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.includes(':55439')) {
      evidence.blockedRequests.push({ url, reason: 'forbidden backend endpoint' });
      await route.abort();
      return;
    }
    if (isLoopback(url)) {
      await route.continue();
      return;
    }
    const font = isFontRequest(request);
    if (!font) evidence.blockedRequests.push({ url, reason: 'external non-font request' });
    await route.abort();
  });
  return context;
}

function watchPage(page) {
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(20_000);
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  return page;
}

async function startSurvey(page) {
  await page.goto(`${baseUrl}/AdmissionsSurvey`);
  await page.getByRole('heading', { name: 'Что хотите изучать?', exact: true }).waitFor();
  await page.getByRole('checkbox', { name: 'Великобритания', exact: true }).check();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Пока не знаю — пропустить', exact: true }).click();
  await page.getByRole('button', { name: 'Пока не знаю — пропустить', exact: true }).click();
  await page.getByRole('heading', { name: 'Начало выбора, а не обещание поступления.', exact: true }).waitFor();
}

async function captureFailureArtifacts() {
  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index];
    try {
      const pages = context.pages();
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        await pages[pageIndex].screenshot({
          path: path.join(reportDirectory, `failure-${index}-${pageIndex}.png`),
          fullPage: true,
          timeout: 8_000,
        });
      }
    } catch (error) {
      evidence.errors.push(`Failure screenshot: ${error.message}`);
    }
    try {
      await context.tracing.stop({ path: path.join(reportDirectory, `failure-${index}.zip`) });
    } catch (error) {
      evidence.errors.push(`Failure trace: ${error.message}`);
    }
  }
}

async function writeReport() {
  fs.writeFileSync(path.join(reportDirectory, 'smoke.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  reportWritten = true;
}

async function run() {
  assert.ok(isLoopback(baseUrl), 'CI preview must be loopback');
  // The runner starts preview in the background; wait for readiness, not a
  // guessed sleep. Never reuse a development or live deployment endpoint.
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/AdmissionsSurvey`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Preview may still be starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Built preview did not become ready');
  browser = await chromium.launch({ headless: true });
  const desktopContext = await createContext({ width: 1280, height: 900 });
  const page = watchPage(await desktopContext.newPage());
  await startSurvey(page);
  const institutionIds = await page.locator('.admission-candidate').evaluateAll((cards) => cards.map((card) => card.dataset.institution));
  assert.equal(institutionIds.length, 4, `Expected four UK candidates, got ${JSON.stringify(institutionIds)}`);
  assert.equal(new Set(institutionIds).size, institutionIds.length, 'Candidate institutions must be distinct');
  assert.equal(await page.locator('[data-top=true]').count(), 0, 'Unknown profile must not produce top matches');
  assert.deepEqual([...institutionIds].sort(), [
    'gb-university-of-hertfordshire', 'gb-nottingham-trent-university',
    'gb-university-of-portsmouth', 'gb-university-of-west-of-england',
  ].sort(), 'Only ordinary researched UK institutions may appear');
  await page.screenshot({ path: path.join(reportDirectory, 'desktop-uk-unknown.png'), fullPage: true });
  evidence.checks.push('UK without GPA or budget: four distinct options, no top match, foundation, or Oxbridge');

  await page.getByRole('button', { name: 'Изменить ответы', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByLabel('Языковой экзамен', { exact: true }).selectOption('IELTS');
  await page.getByLabel('Ваш балл', { exact: true }).fill('5.5');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Показать варианты', exact: true }).click();
  assert.equal(await page.locator('[data-top=true]').count(), 0, 'IELTS 5.5 must not produce top matches');
  assert.equal(await page.locator('.admission-candidates > article').count(), 0, 'IELTS 5.5 must produce no main matches');
  assert.equal(await page.locator('.admission-alternatives article').count(), 4, 'IELTS 5.5 must produce four alternatives');
  await page.screenshot({ path: path.join(reportDirectory, 'desktop-ielts55.png'), fullPage: true });
  evidence.checks.push('IELTS 5.5: zero main matches and four alternatives');

  await page.reload();
  await page.getByText('Временные ответы восстановлены в этой вкладке.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Изменить ответы', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  assert.equal(await page.getByLabel('Ваш балл', { exact: true }).inputValue(), '5.5');
  evidence.checks.push('Draft survives editing the result and reloading the same tab');
  await page.goto(`${baseUrl}/Profile`);
  await page.waitForURL('**/Login?**');
  await page.goto(`${baseUrl}/Recommendations`);
  await page.waitForURL('**/Login?**');
  evidence.checks.push('Profile and Recommendations remain protected by login');

  for (const width of [390, 320]) {
    const context = await createContext({ width, height: 844 });
    const mobilePage = watchPage(await context.newPage());
    await startSurvey(mobilePage);
    const geometry = await mobilePage.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cards: [...document.querySelectorAll('.admission-candidate')].map((card) => {
        const bounds = card.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right };
      }),
    }));
    assert.equal(geometry.width, geometry.scrollWidth, `Horizontal overflow at ${width}px`);
    assert.ok(geometry.cards.every((card) => card.left >= 0 && card.right <= width), `Card outside viewport at ${width}px`);
    evidence.viewports.push(geometry);
    await mobilePage.screenshot({ path: path.join(reportDirectory, `mobile-${width}-uk.png`), fullPage: true });
    await context.tracing.stop();
    await context.close();
    contexts.splice(contexts.indexOf(context), 1);
  }
  evidence.checks.push('Mobile layout has no horizontal overflow at 390px or 320px');
  assert.deepEqual(evidence.errors, [], 'Browser page errors detected');
  assert.deepEqual(evidence.blockedRequests, [], 'Forbidden backend or external non-font request detected');
  evidence.checks.push('No backend or external non-font request attempted');
}

let watchdog;

try {
  await Promise.race([
    run(),
    new Promise((_, reject) => {
      watchdog = setTimeout(() => reject(new Error(`Smoke exceeded ${timeoutMs}ms limit`)), timeoutMs);
    }),
  ]);
} catch (error) {
  evidence.errors.push(error.stack ?? String(error));
  await captureFailureArtifacts();
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  for (const context of contexts) {
    try {
      await context.close();
    } catch (error) {
      evidence.errors.push(`Context close: ${error.message}`);
    }
  }
  try {
    await browser?.close();
  } catch (error) {
    evidence.errors.push(`Browser close: ${error.message}`);
  }
  if (!reportWritten) await writeReport();
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.exitCode === 1) process.exit(1);
