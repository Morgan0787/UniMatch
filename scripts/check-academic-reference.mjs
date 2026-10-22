import assert from 'node:assert/strict';
import { comparePublishedAcademic, publishedAcademicReference } from '../src/lib/admissions/academicReference.js';

const sources = {
  official: { key: 'official', url: 'https://example.edu/admissions' },
  other: { key: 'other', url: 'https://example.edu/other' },
};
const scope = {
  programmeId: 'cs-bsc', route: 'direct', studentCategory: 'international_freshman',
  schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', intakeYear: 2027,
};
const grade = (minimum = 4, scale = '5', extra = {}) => ({ type: 'grade', minimum, scale, sourceKey: 'official', ...extra });
const fact = (value, extra = {}) => ({
  value, status: 'published_unconfirmed', applicability: 'unconfirmed', scope: { ...scope },
  sourceIds: ['official'], season: '2027', historical: null, ...extra,
});
const answers = { grade: '3.5', scale: '5', schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', startYear: '2027' };
const get = (value, factExtra) => publishedAcademicReference(fact(value, factExtra), sources, 2027);

const mandatoryWithUnknown = get({
  type: 'all', complete: false, children: [grade(), { type: 'unknown', sourceKey: 'official' }],
});
assert.ok(mandatoryWithUnknown, 'a sourced mandatory grade remains comparable beside an unknown sibling');
assert.deepEqual(comparePublishedAcademic(mandatoryWithUnknown, answers), [{
  below: true, sourceKey: 'official', status: 'published_unconfirmed', minimum: 4, scale: '5', season: '2027',
}]);

const inheritedScope = get({
  type: 'all', scope: { schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma',
    intakeYear: 2027, route: 'direct', studentCategory: 'international_freshman', programmeId: 'cs-bsc' },
  children: [grade()],
}, { scope: { ...scope, schoolCountry: null, credential: null, intakeYear: null,
  route: null, studentCategory: null } });
assert.equal(inheritedScope.conditions[0].scope.schoolCountry, 'Uzbekistan', 'group country scope reaches its grade child');
assert.equal(inheritedScope.conditions[0].scope.credential, 'academic_lyceum_diploma', 'group credential scope reaches its grade child');
assert.deepEqual(comparePublishedAcademic(inheritedScope, { ...answers, schoolCountry: 'Canada' }), [],
  'a comparison must match inherited country scope');
assert.equal(get({ type: 'all', scope: { schoolCountry: 'Canada' }, children: [grade()] }), null,
  'conflicting parent and fact scopes reject the group');
assert.equal(get({ type: 'all', scope: { route: 'foundation' }, children: [grade()] }), null,
  'an unsupported parent route rejects the group');

const inheritedAnyScope = get({
  type: 'any', complete: true,
  scope: { schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', intakeYear: 2027 },
  children: [grade(4, '5'), grade(3, '4')],
});
assert.equal(inheritedAnyScope.conditions.length, 2, 'a complete scale alternative inherits its group scope');
assert.equal(inheritedAnyScope.conditions[1].scope.intakeYear, 2027);
assert.equal(get({
  type: 'any', complete: true,
  children: [grade(4, '5'), grade(3, '4', { scope: { intakeYear: 2026 } })],
}), null, 'scale alternatives with different intake scope are not equivalent representations');

assert.equal(get({
  type: 'any', complete: true, children: [grade(), { type: 'unknown', sourceKey: 'official' }],
}), null, 'an OR with an unknown alternative cannot establish a grade reference');
assert.equal(get({ type: 'any', complete: false, children: [grade(), grade(3, '4')] }), null,
  'an incomplete OR is not a closed set of scale representations');

const scales = get({ type: 'any', complete: true, children: [grade(4, '5'), grade(3, '4')] });
assert.deepEqual(comparePublishedAcademic(scales, answers).map(({ below, scale }) => ({ below, scale })), [
  { below: true, scale: '5' },
], 'only the submitted original scale is compared');
assert.deepEqual(comparePublishedAcademic(scales, { ...answers, scale: '4', grade: '3' }).map(({ below, scale }) => ({ below, scale })), [
  { below: false, scale: '4' },
]);
assert.equal(get({ type: 'any', complete: true, children: [grade(4, '5'), grade(3, '5')] }), null,
  'an alternative cannot contain duplicate representations of one scale');

const historicalFact = fact(grade(4, '5'), {
  value: null, status: 'historical_reference', applicability: 'unconfirmed',
  scope: { ...scope, intakeYear: 2026 }, season: null,
  historical: { value: grade(4, '5'), referenceSeason: '2026/27', checkedAt: '2026-10-01', sourceIds: ['official'] },
});
const historical = publishedAcademicReference(historicalFact, sources, 2027);
assert.equal(historical.season, '2026/27');
assert.deepEqual(comparePublishedAcademic(historical, { ...answers, startYear: '2028' }).map(item => item.status), ['historical_reference'],
  'historical comparisons retain their season label across intake years');

assert.deepEqual(comparePublishedAcademic(mandatoryWithUnknown, { ...answers, credential: '' }), [],
  'a scoped credential requires an explicit matching answer');
assert.deepEqual(comparePublishedAcademic(mandatoryWithUnknown, { ...answers, startYear: '2028' }), [],
  'a non-historical intake mismatch is unknown');
assert.deepEqual(comparePublishedAcademic(mandatoryWithUnknown, { ...answers, scale: '100' }), [],
  'scores are never converted between scales');
assert.equal(publishedAcademicReference(fact(grade(), { sourceIds: ['missing'] }), sources, 2027), null,
  'every linked source id must exist');
assert.equal(publishedAcademicReference(fact(grade(4, '5', { sourceKey: 'other' })), sources, 2027), null,
  'a rule source must be linked from its fact');
assert.equal(get(grade(6, '5')), null, 'minimum must fit its native scale');
assert.equal(get(grade(4, '5', { scope: { ...scope, route: 'foundation' } })), null,
  'foundation route rules are outside direct-entry reference comparison');

console.log('PASS academic references: mandatory grades, conservative OR handling, native scales, scope, seasons and sources');
