import { readFile, writeFile } from 'node:fs/promises';

const snapshotPath = new URL('../src/lib/tuitionExchangeRates.json', import.meta.url);
const current = JSON.parse(await readFile(snapshotPath, 'utf8'));
const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`ECB reference rates returned HTTP ${response.status}`);
const xml = await response.text();
const date = /<Cube time=['"](\d{4}-\d{2}-\d{2})['"]>/.exec(xml)?.[1];
const rates = Array.from(xml.matchAll(/<Cube currency=['"]([A-Z]{3})['"] rate=['"]([0-9.]+)['"]\s*\/>/g), ([, currency, rate]) => [currency, Number(rate)]);
if (!date || date < current.date || !rates.some(([currency]) => currency === 'USD')
  || rates.some(([, rate]) => !Number.isFinite(rate) || rate <= 0)) {
  throw new Error('ECB did not supply a valid reference rate snapshot');
}
const perEuro = Object.fromEntries([...rates, ['EUR', 1]].sort(([a], [b]) => a.localeCompare(b)));
await writeFile(snapshotPath, `${JSON.stringify({ date, perEuro }, null, 2)}\n`);
console.log(`Recorded ECB reference rates for ${date}.`);
