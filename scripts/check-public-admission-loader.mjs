import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadPublicCatalog, PUBLIC_CATALOG_SELECT } from '../src/lib/admissions/catalog.js';
import { publicAdmissionCatalogRow as publicCatalogRow } from './fixtures/publicAdmissionCatalog.mjs';
import { withPublicProgrammeFacts } from '../src/lib/admissions/universityCatalog.js';
import { evaluateAnswers, emptyAnswers } from '../src/lib/admissions/evaluate.js';
import { canonicalFavoriteIds, addAdmissionFavorite, removeAdmissionFavorite } from '../src/lib/admissions/favorites.js';

function client(response) {
  const calls = [];
  const request = Object.fromEntries(['select', 'eq', 'order', 'range', 'abortSignal'].map(method => [method, (...args) => { calls.push([method, ...args]); return request; }]));
  request.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject);
  return { calls, from: name => { calls.push(['from', name]); return request; } };
}
const row = publicCatalogRow();
const valid = client({ data: [row], error: null, count: 1 });
const loaded = await loadPublicCatalog(valid);
assert.equal(loaded.options.length, 1);
assert.match(loaded.version, /^db-v1:[a-f0-9]{64}$/, 'save intent version must fit its existing bounded envelope');
assert.equal(valid.calls.find(call => call[0] === 'select')[1], PUBLIC_CATALOG_SELECT);
assert.ok(!PUBLIC_CATALOG_SELECT.includes('*') && !PUBLIC_CATALOG_SELECT.includes('profiles'));
assert.deepEqual(valid.calls.find(call => call[0] === 'eq'), ['eq', 'admission_requirements->unimatch_catalog_v1->>state', 'published']);
assert.equal((await loadPublicCatalog(client({ data: [], count: 0, error: null }))).options.length, 0);
for (const response of [{data:[row],count:201,error:null}, {data:[row],count:2,error:null}, {data:null,count:0,error:null}, {data:[],count:0,error:{message:'private database detail'}}]) {
  await assert.rejects(() => loadPublicCatalog(client(response)), /^Error: catalog_(incomplete|read_failed)$/);
}
assert.equal(evaluateAnswers(emptyAnswers()).results.length, 0, 'no implicit static catalogue');

const legacy = { id: row.id, name: row.name, country: row.country, tuition_min: 9999 };
assert.equal(withPublicProgrammeFacts(legacy), legacy, 'untouched legacy rows are not silently enriched');
const rich = withPublicProgrammeFacts({ ...row, tuition_min: 9999, min_gpa: 4, required_ielts: 9, admission_requirements: { english_test: 'legacy', unimatch_catalog_v1: row.catalog } });
assert.equal(rich.admissionCatalog.status, 'valid');
for (const key of ['tuition_min','tuition_max','min_gpa','required_ielts','living_cost_estimate']) assert.equal(rich[key], null, `${key} is not a universal programme requirement`);
assert.equal(rich.admission_requirements.english_test, 'legacy');
const typedDegree = structuredClone(row);
typedDegree.catalog.programmes[0].degree.value = { level: 'Bachelor', award: 'BSc' };
assert.deepEqual(withPublicProgrammeFacts({ ...typedDegree, admission_requirements: { unimatch_catalog_v1: typedDegree.catalog } }).degree_levels, ['Bachelor'], 'university filters receive level strings, never degree objects');
assert.equal(withPublicProgrammeFacts({ ...typedDegree, city: '', region: '', website: '', admission_requirements: { unimatch_catalog_v1: typedDegree.catalog } }).admissionCatalog.status, 'valid', 'legacy entity normalization of nullable text must not quarantine a valid namespace');
const invalid = withPublicProgrammeFacts({ ...legacy, admission_requirements: { unimatch_catalog_v1: {state:'published'} } });
assert.equal(invalid.admissionCatalog.status, 'invalid');
assert.equal(invalid.tuition_min, null, 'invalid namespace cannot fall back to a convincing legacy price');

const identities = loaded.institutions;
const alias = identities[0].legacyFavoriteKeys[0];
const unrelated = '77777777-7777-4777-8777-777777777777';
assert.deepEqual(canonicalFavoriteIds([row.id, alias], identities), [row.catalog.institutionId]);
assert.deepEqual(addAdmissionFavorite([unrelated], row.catalog.institutionId, identities), [unrelated, row.id]);
assert.deepEqual(addAdmissionFavorite([alias, unrelated], row.catalog.institutionId, identities), [alias, unrelated], 'existing alias is already saved; no rewrite');
assert.deepEqual(removeAdmissionFavorite([row.id, alias, unrelated], row.catalog.institutionId, identities), [unrelated]);
assert.throws(() => addAdmissionFavorite([], 'unpublished', identities));

for (const file of ['src/lib/admissions/catalog.js','src/lib/admissions/presentation.js','src/lib/admissions/evaluate.js','src/pages/Profile.jsx','src/pages/AdmissionsSurvey.jsx','src/components/admissions/copy.js','src/components/admissions/useAdmissionFavorites.js']) {
  assert.ok(!/import[^;\n]*docs\/|import[^;\n]*photoCopy|\bOPTIONS\b/.test(await readFile(file,'utf8')), `${file}: runtime research fallback is forbidden`);
}
console.log('Public catalogue loader, namespace projection and favorite identity checks passed.');
