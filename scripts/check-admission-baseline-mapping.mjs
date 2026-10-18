import assert from 'node:assert/strict';
import { mapData03Institution } from './lib/mapAdmissionBaseline.mjs';
import { adaptPublicCatalog } from '../src/lib/admissions/publicCatalog.js';

const source = (key, scope) => ({ key, url: `https://example.edu/${key}`, title: `Official ${key}`, checkedAt: '2026-10-17', scope });
const data = {
  task: 'DATA-03', schemaVersion: '1.0.0', checkedAt: '2026-10-17',
  institutions: [{ id: 'us-synthetic', programmeDeliveryCountries: ['United States', 'South Korea'] }],
  sources: {
    program: source('program', 'BSc identity, degree, 2027 intake and fee schedule.'),
    route: source('route', 'Uzbekistan routes with subject and credential limits.'),
    english: source('english', 'IELTS threshold with band minima.'),
    oldfee: source('oldfee', 'Published 2026 fee, historical for the 2027 intake.'),
    estimate: source('estimate', 'General tuition and fees estimate, not programme tuition.'),
    'native-code': source('native-code', 'Official credential route and required subject conditions.'),
  },
  requirementPolicies: {
    uzbek: {
      applicantCategory: 'Uzbekistan-issued qualification; international first-year',
      evidence: { status: 'verified', sourceKeys: ['native-code'], scope: 'Country route only; course exceptions remain.', checkedAt: '2026-10-17' },
      routes: [{ path: 'direct', credentials: ['academic_lyceum_diploma'], academic: { operator: 'all', rules: [
        { operator: 'any', rules: [{ kind: 'country_average', minimum: 4, scaleMaximum: 5 }, { kind: 'country_average', minimum: 75, scaleMaximum: 100 }] },
        { kind: 'required_subjects', mathYears: 4, laboratoryScienceYears: 3 },
        { kind: 'ranking', alternatives: ['SAT1210', 'ACT24', 'ClassTop25%'] },
      ] }, language: { type: 'ielts', minimum: 6.5, sections: { listening: 5.5, writing: 5.5 } } }],
    },
  },
  programmes: [{
    id: 'us-synthetic-cs', institutionId: 'us-synthetic', name: 'Computer Science BS (SUNY Korea)', field: 'computer_science', degree: 'BS', level: 'Bachelor',
    region: 'South Korea', country: 'South Korea', entryPath: 'unknown', intakeYear: 2027, intakeText: 'Fall 2027', language: 'English',
    requirementPolicyId: 'uzbek', routeSourceKey: 'route',
    languageThreshold: { type: 'ielts', minimum: 6.5, sections: { listening: 5.5, reading: 5.5, writing: 5.5, speaking: 5.5 }, sourceKey: 'english' },
    academicRequirement: { type: 'all', sourceKey: 'route', complete: false, children: [
      { type: 'grade', minimum: 4, scale: '5', sourceKey: 'route', scope: { schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', intakeYear: 2027 } },
      { type: 'any', children: [{ type: 'ielts', minimum: 24, sourceKey: 'route' }, { type: 'grade', minimum: 1200, scale: '100', sourceKey: 'route' }] },
    ] },
    languageRequirement: { type: 'all', sourceKey: 'english', complete: false, children: [{ type: 'ielts', minimum: 6.5, sections: { listening: 5.5 }, sourceKey: 'english' }] },
    tuition: { amount: 24000, currency: 'USD', period: 'year', feeYear: '2026/27', includedFees: ['tuition'], excludedFees: ['housing'], scope: 'tuition', source: 'oldfee', status: 'verified' },
    evidence: {
      identity: { status: 'verified', sourceKeys: ['program'], scope: 'Official programme identity; nonseasonal.', checkedAt: '2026-10-17' },
      field: { status: 'verified', sourceKeys: ['program'], scope: 'Programme field.', checkedAt: '2026-10-17' },
      language: { status: 'inferred', sourceKeys: ['program'], scope: 'English-medium inferred from context.', checkedAt: '2026-10-17' },
      entryPath: { status: 'partial', sourceKeys: ['route'], scope: 'Individual route unconfirmed.', checkedAt: '2026-10-17' },
      intake: { status: 'verified', sourceKeys: ['program'], scope: '2027 intake.', checkedAt: '2026-10-17' },
      tuition: { status: 'verified', sourceKeys: ['oldfee'], scope: 'Fee schedule for 2026/27.', checkedAt: '2026-10-17' },
      requirements: { status: 'verified', sourceKeys: ['route', 'english'], scope: 'Scoped native requirements.', checkedAt: '2026-10-17' },
    },
    discovery: { use: 'conditional_exploration_only', basis: 'For exploration; individual route remains unresolved.' },
  }, {
    id: 'us-synthetic-biz', institutionId: 'us-synthetic', name: 'Business', field: 'business', degree: 'BA', level: 'Bachelor', region: 'USA', country: 'United States',
    entryPath: 'foundation', intakeYear: null, intakeText: 'Recurring; year not confirmed', language: 'English', routeSourceKey: 'route', requirementPolicyId: 'uzbek',
    tuition: { amount: 30000, currency: 'USD', period: 'academic_year_9_months', feeYear: null, includedFees: ['tuition'], excludedFees: ['housing'], scope: 'tuition_and_fees_estimate', source: 'estimate', status: 'estimate' },
    evidence: { identity: { status: 'verified', sourceKeys: ['program'], scope: 'Official programme identity.', checkedAt: '2026-10-17' }, field: { status: 'verified', sourceKeys: ['program'], scope: 'Field.', checkedAt: '2026-10-17' }, language: { status: 'verified', sourceKeys: ['program'], scope: 'English medium.', checkedAt: '2026-10-17' }, entryPath: { status: 'partial', sourceKeys: ['route'], scope: 'Foundation path remains distinct.', checkedAt: '2026-10-17' }, intake: { status: 'partial', sourceKeys: ['program'], scope: 'Recurring; year not confirmed.', checkedAt: '2026-10-17' }, tuition: { status: 'inferred', sourceKeys: ['estimate'], scope: 'General estimate; programme amount unconfirmed.', checkedAt: '2026-10-17' } },
    discovery: { use: 'unreviewed', basis: 'Not reviewed.' },
  }],
};
const identity = {
  id: '00000000-0000-4000-8000-000000000001', name: 'SUNY Example', country: 'United States', city: null, region: null,
  website: 'https://example.edu', legacyFavoriteKeys: ['00000000-0000-4000-8000-000000000002'],
  surveyRegion: 'USA', revision: 'a'.repeat(64), reviewedAt: '2026-10-18T00:00:00Z', targetIntakeYear: 2027,
};

const before = structuredClone(data);
data.programmes[0].publishedCostReferences = [{ amount: 33547, currency: 'USD', period: 'academic_year_9_months', feeYear: '2026/27', scope: 'tuition_and_fees', source: 'oldfee', notes: ['Most majors category; programme rate unconfirmed'] }];
before.programmes[0].publishedCostReferences = structuredClone(data.programmes[0].publishedCostReferences);
const result = mapData03Institution(data, 'us-synthetic', identity);
assert.deepEqual(data, before, 'mapper must not mutate source package');
assert.ok(result.row, 'valid synthetic package should map');
assert.deepEqual(result.row.catalog.programmes.map(row => row.id), ['us-synthetic-cs', 'us-synthetic-biz']);
const [cs, business] = result.row.catalog.programmes;
assert(cs.costReferences.some(fact=>fact.status==='historical_reference' && fact.historical.value.amount===33547 && fact.historical.value.period==='academic_year_9_months' && fact.historical.value.includedFees.includes('Fees') && fact.historical.value.label.includes('Most majors')));
assert.equal(cs.name.status, 'current_verified');
assert.equal(cs.teachingLanguage.status, 'published_unconfirmed');
assert.equal(cs.route.value.entryPath, 'unknown');
assert.equal(cs.languageThreshold.value.sections.listening, 5.5);
assert.equal(cs.academicRequirement.value.children[0].scale, '5');
assert.equal(cs.academicRequirement.value.children[1].type, 'any');
assert.equal(cs.academicRequirement.value.children[0].scope.intakeYear, 2027);
assert.equal(cs.tuition.status, 'historical_reference');
assert.equal(cs.tuition.value, null);
assert.equal(cs.tuition.historical.value.feeYear, '2026/27');
assert.deepEqual(cs.location.value, { country: 'South Korea', region: 'South Korea', campus: null });
assert.equal(cs.location.sourceIds[0], 'program');
assert.equal(cs.intake.value.year, 2027);
assert.equal(cs.requirementPolicy, null, 'native policies must not be evaluated as normalized rules');
assert.equal(cs.academicRequirement.value.children[0].scale, '5');
assert.equal(cs.academicRequirement.value.children[1].type, 'any');
assert.equal(cs.academicRequirement.status, 'published_unconfirmed');
assert.equal(cs.academicRequirement.applicability, 'unconfirmed');
assert.equal(cs.publicNotes.length, 1);
assert.equal(cs.publicNotes[0].status, 'published_unconfirmed', 'programme year alone must not date the native route policy');
assert.equal(cs.publicNotes[0].applicability, 'unconfirmed');
assert.equal(cs.publicNotes[0].scope.intakeYear, null);
assert.match(cs.publicNotes[0].value, /Any of/);
assert.match(cs.publicNotes[0].value, /Required Subjects/);
assert.match(cs.publicNotes[0].value, /Scale Maximum: 5/);
assert.match(cs.publicNotes[0].value, /Ielts condition/i);
assert.ok(!cs.publicNotes[0].value.includes('native-code'), 'source IDs belong in citations, not rendered policy prose');
assert.ok(cs.publicNotes[0].sourceIds.includes('native-code'), 'policy note retains its source citation');
assert.equal(cs.discovery.use, 'explore');
assert.equal(business.route.value.entryPath, 'foundation');
assert.equal(business.intake.value.year, null, 'unknown year must remain unknown');
assert.equal(business.costReferences[0].value.feeYear, null, 'feeYear null must remain null');
assert.equal(business.tuition.value, null, 'general tuition-and-fees estimates are display-only references');
assert.equal(result.row.catalog.sources.route.scope, 'Uzbekistan routes with subject and credential limits.');
const adapted = adaptPublicCatalog([result.row]);
for (const programme of result.row.catalog.programmes) {
  const candidate = structuredClone(result.row);
  candidate.catalog.programmes = [programme];
  const check = adaptPublicCatalog([candidate]);
  assert.equal(check.institutions.length, 1, `public validator should accept ${programme.id}: ${JSON.stringify(check.issues)}`);
}
assert.equal(adapted.institutions.length, 1, `public validator should accept mapped row: ${JSON.stringify(adapted.issues)}`);

const longScopeData = structuredClone(data);
longScopeData.sources.route.scope = 'x'.repeat(301);
const tooLong = mapData03Institution(longScopeData, 'us-synthetic', identity);
assert.ok(tooLong.issues.some(item => item.code === 'source_scope_exceeds_300_characters'));
assert.ok(!Object.hasOwn(tooLong.row.catalog.sources, 'route'));

console.log('Admission baseline mapping synthetic checks passed.');
