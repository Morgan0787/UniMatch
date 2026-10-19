import assert from 'node:assert/strict';
import { adaptPublicCatalog } from '../src/lib/admissions/publicCatalog.js';
import { emptyAnswers, evaluateAnswers } from '../src/lib/admissions/evaluate.js';
import { publicAdmissionCatalogRow, publicCatalogFact, publicCatalogSource } from './fixtures/publicAdmissionCatalog.mjs';

const answers = { ...emptyAnswers(), field: 'computer_science', regions: ['Europe'], exam: 'IELTS', score: '5.5', startYear: '2027' };
const rule = { type: 'ielts', minimum: 6, sections: { writing: 5.5 }, sourceKey: publicCatalogSource.key };
const row = publicAdmissionCatalogRow({ languageFact: publicCatalogFact(rule) });
row.catalog.programmes[0].languageThreshold.scope.studentCategory = 'international_freshman';
const run = (input = row, overrides = {}) => {
  const catalog = adaptPublicCatalog([input]);
  assert.deepEqual(catalog.issues, []);
  return evaluateAnswers({ ...answers, ...overrides }, catalog.options);
};
const codes = result => [...result.results, ...result.alternatives].flatMap(r => r.reasons.map(reason => reason.code));
const original = structuredClone(row);
const below = run();
assert.equal(below.alternatives.length, 1, '5.5 must retain the scoped published 6.0 shortfall');
assert(codes(below).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
assert.equal(below.alternatives[0].languageStatus, 'unknown');
assert.equal(below.alternatives[0].requirementStatus, 'unknown', 'a reference shortfall is not a current admission rejection');
assert.equal(below.topCount, 0);
const reached = run(row, { score: '6.0' });
assert(codes(reached).includes('LANGUAGE_THRESHOLD_REACHED'));
assert(codes(reached).includes('LANGUAGE_SECTIONS_UNKNOWN'));
assert.equal(reached.alternatives.length, 0, 'missing sections alone must not empty normal explore');
assert.equal(reached.results[0].languageStatus, 'unknown');
assert.equal(reached.topCount, 0);
for (const exam of ['', 'not_taken', 'TOEFL']) {
  const result = run(row, { exam });
  assert(!codes(result).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
  assert(!codes(result).includes('LANGUAGE_THRESHOLD_REACHED'));
}
for (const overrides of [{ score: '' }, { startYear: '2028' }]) {
  assert(!codes(run(row, overrides)).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'), 'missing score or wrong intake cannot create a shortfall');
}
for (const patch of [
  { studentCategory: 'domestic' }, { route: 'foundation' }, { route: 'half_time' },
  { credential: 'another_diploma' }, { schoolCountry: 'another_country' }, { intakeYear: 2026 },
]) {
  const scoped = structuredClone(row);
  Object.assign(scoped.catalog.programmes[0].languageThreshold.scope, patch);
  assert(!codes(run(scoped)).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'), `incompatible scope: ${JSON.stringify(patch)}`);
}
const confirmedScope = structuredClone(row);
confirmedScope.catalog.programmes[0].languageThreshold.scope.credential = 'school_certificate';
assert(codes(run(confirmedScope, { credential: 'school_certificate' })).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
const conflict = structuredClone(row);
conflict.catalog.programmes[0].languageThreshold.value.scope = { credential: 'different_certificate' };
assert(!codes(run(conflict, { credential: 'school_certificate' })).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
const alternatives = structuredClone(row);
alternatives.catalog.programmes[0].languageThreshold.value = { type: 'any', complete: true, children: [rule, { ...rule, minimum: 5 }] };
assert(!codes(run(alternatives)).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'), 'OR routes must not collapse to one required minimum');
const acceptedAlternative = structuredClone(row);
acceptedAlternative.catalog.programmes[0].languageRequirement = publicCatalogFact({
  type: 'any', complete: true, children: [{ ...rule, sections: null }, { ...rule, minimum: 5, sections: null }],
});
assert.equal(run(acceptedAlternative).results[0].languageStatus, 'met');
assert.equal(run(acceptedAlternative).alternatives.length, 0, 'a reference cannot reject an independently satisfied language alternative');
const otherProgramme = structuredClone(row);
otherProgramme.catalog.programmes[0].languageThreshold.value.scope = { programmeId: 'another-programme' };
assert(!codes(run(otherProgramme)).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
const foundation = structuredClone(row);
foundation.catalog.programmes[0].route.value.entryPath = 'foundation';
assert.equal(run(foundation).results.length + run(foundation).alternatives.length, 0, 'foundation must not replace direct degree entry');
const unconfirmed = structuredClone(row);
Object.assign(unconfirmed.catalog.programmes[0].languageThreshold, { status: 'published_unconfirmed', applicability: 'unconfirmed' });
unconfirmed.catalog.programmes[0].languageThreshold.scope.intakeYear = null;
const uncertainResult = run(unconfirmed);
assert(codes(uncertainResult).includes('LANGUAGE_REFERENCE_UNCONFIRMED'));
assert.equal(uncertainResult.alternatives[0].languageStatus, 'unknown');
const historical = structuredClone(row);
Object.assign(historical.catalog.programmes[0].languageThreshold, {
  value: null, status: 'historical_reference', applicability: 'unconfirmed', noticeCode: 'historical',
  historical: { value: rule, referenceSeason: '2026', checkedAt: '2026-10-01', sourceIds: [publicCatalogSource.key] },
});
historical.catalog.programmes[0].languageThreshold.scope.intakeYear = 2026;
const historyResult = run(historical);
assert(codes(historyResult).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
assert(codes(historyResult).includes('LANGUAGE_REFERENCE_HISTORICAL'));
assert.equal(historyResult.alternatives[0].languageStatus, 'unknown');
assert.equal(historyResult.alternatives[0].requirementStatus, 'unknown');
for (const status of ['estimate', 'unknown']) {
  const unsupported = structuredClone(row);
  Object.assign(unsupported.catalog.programmes[0].languageThreshold, { value: status === 'unknown' ? null : rule, status });
  assert(!codes(run(unsupported)).includes('LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
}
const missingSource = structuredClone(row);
missingSource.catalog.programmes[0].languageThreshold.sourceIds = [];
assert.equal(adaptPublicCatalog([missingSource]).options.length, 0);
assert.deepEqual(row, original, 'comparison must not mutate public evidence');
console.log('PASS published IELTS reference: shortfall, sections, no exam, scope, status/history and immutable evidence');
