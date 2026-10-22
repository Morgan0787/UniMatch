import assert from 'node:assert/strict';
import { emptyAnswers, evaluateAnswers, validateAnswers } from '../src/lib/admissions/evaluate.js';
import { admissionCopy } from '../src/components/admissions/copy.js';

// Deliberately synthetic fixtures; none belongs to the production catalogue.
const source = { key: 'synthetic-rule', title: 'Synthetic requirement fixture', url: 'https://example.test/rules', checkedAt: '2026-10-17', scope: 'Synthetic only' };
const rule = (type, extra = {}) => ({ type, verified: true, applicable: true, sourceKey: source.key, ...extra });
const candidate = (institutionId, extra = {}) => ({
  id: `${institutionId}-it`, institutionId, university: `Synthetic ${institutionId}`, name: 'Synthetic IT programme',
  country: 'United Kingdom', region: 'UK', field: 'it', fields: ['it'], entryPath: 'direct', language: 'English',
  academicRequirement: rule('grade', { minimum: 3, scale: '4' }),
  languageRequirement: rule('ielts', { minimum: 6 }), languageThreshold: rule('ielts', { minimum: 6 }),
  sources: [source], routeSourceKey: source.key, eligibilityComplete: false,
  tuition: { amount: 14000, currency: 'GBP', period: 'year', scope: 'tuition', comparisonVerified: true, source: source.key },
  competitiveness: { category: 'unknown', basis: 'Synthetic test has no admissions outcome data.' },
  ...extra,
});
const enough = { ...emptyAnswers(), field: 'it', regions: ['UK'], grade: '3.5', scale: '4', exam: 'IELTS', score: '6.5', budget: '20000', currency: 'GBP' };
assert.ok(validateAnswers({ ...enough, schoolCountry: {} }).schoolCountry);
assert.ok(validateAnswers({ ...enough, credential: 'x'.repeat(201) }).credential);
for (const copy of Object.values(admissionCopy)) {
  for (const code of ['ACADEMIC_REFERENCE_BELOW', 'ACADEMIC_REFERENCE_REACHED', 'ACADEMIC_REFERENCE_UNCONFIRMED', 'ACADEMIC_REFERENCE_HISTORICAL']) assert.ok(copy.reasons[code]);
}
assert.deepEqual(validateAnswers({ ...enough, listening: '7.5', reading: '6', writing: '', speaking: '6.5' }), {});
assert.equal(validateAnswers({ ...enough, listening: '6.25' }).listening, 'listening_invalid');
assert.equal(validateAnswers({ ...enough, listening: '6.5', exam: 'TOEFL' }).listening, 'listening_invalid');
const catalogue = Array.from({ length: 6 }, (_, index) => candidate(`fixture-${index}`));
let result = evaluateAnswers(enough, catalogue);
assert.equal(result.results.length, 5);
assert.equal(new Set(result.results.map(row => row.option.institutionId)).size, 5);
assert.equal(result.topCount, 3);
assert.equal(result.mode, 'ranked');
assert.ok(result.results.every(row => row.outcome === 'unknown'), 'top means known-criteria match, never an admission decision');
assert.deepEqual(result, evaluateAnswers(enough, [...catalogue].reverse()), 'input ordering cannot change a stable result');
assert.equal(evaluateAnswers({ ...enough, score: '5.5' }, catalogue).results.length, 0);
assert.equal(evaluateAnswers({ ...enough, score: '5.5' }, catalogue).alternatives.length, 5);
assert.ok(evaluateAnswers({ ...enough, score: '5.5' }, catalogue).alternatives.every(row => row.languageStatus === 'unmet' && !row.isTop));
result = evaluateAnswers({ ...emptyAnswers(), regions: ['UK'] }, catalogue);
assert.equal(result.results.length, 5);
assert.equal(result.mode, 'explore');
assert.equal(result.topCount, 0);
assert.ok(result.results.every(row => row.academicStatus === 'unknown' && row.budgetStatus === 'unknown'));
assert.equal(evaluateAnswers({ ...enough, scale: '' }, catalogue).topCount, 0);
assert.equal(evaluateAnswers({ ...enough, currency: '' }, catalogue).results[0].budgetStatus, 'unknown');
assert.equal(evaluateAnswers({ ...enough, currency: '' }, catalogue).topCount, 0, 'unknown currency cannot justify a complete preference top');
assert.equal(evaluateAnswers({ ...enough, budget: '' }, catalogue).mode, 'explore', 'missing budget remains exploratory');
assert.equal(evaluateAnswers({ ...enough, currency: 'UZS' }, catalogue).results[0].budgetStatus, 'unknown');
assert.equal(evaluateAnswers({ ...enough, regions: ['Canada'] }, catalogue).results.length, 0);
assert.equal(evaluateAnswers({ ...enough, field: 'business' }, catalogue).results.length, 0);
assert.equal(evaluateAnswers(enough, catalogue.slice(0, 2)).results.length, 2, 'partial coverage is not padded');
assert.equal(evaluateAnswers(enough, []).emptyReason, 'coverage');

const alternativesUnknown = rule('any', { complete: false, children: [rule('ielts', { minimum: 6 }), rule('unknown')] });
result = evaluateAnswers({ ...enough, score: '5.5' }, [candidate('waiver', { languageRequirement: alternativesUnknown })]);
assert.equal(result.alternatives[0].requirementStatus, 'unknown', 'unknown waiver is not a mandatory refusal');
assert.equal(result.alternatives[0].requiresClarification, true);
assert.equal(result.topCount, 0);

const ambitious = candidate('another-selective-institution', { discoveryPolicy: 'ambitious_only', competitiveness: { category: 'extremely_selective', basis: 'Synthetic curated test policy; not a claim about a real university.' } });
assert.equal(evaluateAnswers(enough, [ambitious]).results.length, 0, 'strong minima do not make a selective programme ordinary fallback');
assert.equal(evaluateAnswers({ ...emptyAnswers(), regions: ['UK'] }, [ambitious]).results.length, 0);

for (const copy of Object.values(admissionCopy)) {
  for (const answers of [enough, { ...enough, score: '5.5' }, { ...emptyAnswers(), regions: ['UK'] }]) {
    const evaluation = evaluateAnswers(answers, catalogue);
    for (const row of [...evaluation.results, ...evaluation.alternatives]) {
      for (const reason of row.reasons) assert.ok(copy.reasons[reason.code], `Missing translated reason ${reason.code}`);
    }
  }
}
console.log('Synthetic admission engine checks passed: five distinct institutions, top three on known evidence, no-data exploration, unmet/unknown separation, strict filters, partial catalogue, and general selective-policy handling.');
