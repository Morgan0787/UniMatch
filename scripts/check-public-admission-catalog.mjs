import assert from 'node:assert/strict';
import { adaptPublicCatalog } from '../src/lib/admissions/publicCatalog.js';
import { evaluateRequirement } from '../src/lib/admissions/requirements.js';
import { FAVORITE_KEYS } from '../src/lib/admissions/favoriteKeys.js';
import { publicAdmissionCatalogRow, publicCatalogFact } from './fixtures/publicAdmissionCatalog.mjs';

const legacy = { id: 'legacy', name: 'Legacy', catalog: null };
const malformed = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000002' });
malformed.catalog.sources = {};
const historicalIelts = publicCatalogFact(null, 'historical_reference', {
  applicability: 'unconfirmed', historical: {
    value: { type: 'ielts', minimum: 6.5, sourceKey: 'official_main-2027' },
    referenceSeason: '2024', sourceIds: ['official_main-2027'], checkedAt: '2024-06-01',
  }, noticeCode: 'historical',
});
const duplicateAlias = publicAdmissionCatalogRow({
  id: '00000000-0000-4000-8000-000000000003', slug: 'another-university',
  alias: '10000000-0000-4000-8000-000000000001',
});
const aliasOwner = publicAdmissionCatalogRow({ languageFact: historicalIelts });
const input = [legacy, malformed, aliasOwner, duplicateAlias];
const before = structuredClone(input);
const collisions = adaptPublicCatalog(input);
assert.deepEqual(input, before, 'adapter must not mutate rows');
assert.equal(collisions.institutions.length, 0, 'ambiguous aliases and repeated programme IDs quarantine both institutions');
assert(collisions.issues.some(issue => issue.code === 'missing_source'), 'missing official source is diagnosed');
assert.equal(collisions.issues.filter(issue => issue.code === 'duplicate_favorite_alias').length, 2);

const current = publicAdmissionCatalogRow({ languageFact: historicalIelts });
const adapted = adaptPublicCatalog([current]);
assert.equal(adapted.institutions.length, 1);
assert.equal(adapted.options.length, 1);
const option = adapted.options[0];
assert.equal(option.region, 'Europe');
assert.equal(option.academicRequirement.type, 'grade');
assert.deepEqual(option.academicRequirement.scope, { schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', intakeYear: 2027 });
assert.equal(option.languageThreshold.type, 'unknown', 'historical threshold must never evaluate');
assert.equal(evaluateRequirement(option.languageThreshold, { exam: 'IELTS', score: 9 }).status, 'unknown');
assert.equal(option.facts.languageThreshold.historical.value.minimum, 6.5, 'historical display evidence is retained');
assert.equal(option.tuition.currency, 'EUR');
assert.equal(option.tuition.period, 'year');
assert.equal(option.tuition.feeYear, '2027');
assert.equal(option.tuition.comparisonVerified, false);
assert.equal(adapted.institutions[0].programmes[0].tuition.value.currency, 'EUR');
assert.deepEqual(adapted.institutions[0].sources['official_main-2027'], current.catalog.sources['official_main-2027']);

const costMoney = { amount: 950, currency: 'EUR', period: 'credit_hour', feeYear: '2027-2028',
  includedFees: [], excludedFees: [], label: 'Laboratory rate', };
const dateVariants = { date: null, timezone: null, entries: [
  { label: 'Early application', date: '2027-03-15', monthDay: null, time: '23:59', timezone: 'Europe/London' },
  { label: 'Annual priority reference', date: null, monthDay: '10-15', time: null, timezone: null },
] };
const extended = adaptPublicCatalog([publicAdmissionCatalogRow({
  id: '00000000-0000-4000-8000-000000000032', slug: 'extended-money',
  degreeValue: { level: 'Bachelor', award: 'BSc (Hons)' },
  tuitionValue: { amount: null, currency: 'GBP', period: null, feeYear: '2027-2028', includedFees: [], excludedFees: [], label: 'Fees vary by module' },
  deadlineValue: dateVariants,
  costReferences: [publicCatalogFact(costMoney)],
})]);
assert.equal(extended.options[0].degree, 'Bachelor');
assert.equal(extended.options[0].degreeAward, 'BSc (Hons)');
assert.equal(extended.options[0].tuition.amount, null, 'unknown totals remain unavailable to comparisons');
assert.deepEqual(extended.options[0].facts.deadline.value, dateVariants, 'month/day references retain no inferred year');
assert.deepEqual(extended.options[0].facts.costReferences[0].value, costMoney);
assert.equal(extended.options[0].facts.costReferences[0].value.period, 'credit_hour');

const legacyDegree = adaptPublicCatalog([publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000033', slug: 'legacy-degree' })]);
assert.equal(legacyDegree.options[0].degree, 'Bachelor', 'legacy degree strings remain compatible');

const stale = adaptPublicCatalog([publicAdmissionCatalogRow({ targetIntakeYear: 2028 })]);
assert.equal(stale.options[0].academicRequirement.type, 'unknown', 'current labels with stale intake scope do not gate comparisons');

const collisionTargetId = '00000000-0000-4000-8000-000000000019';
const aliasCollision = adaptPublicCatalog([
  publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000018', slug: 'alias-owner', alias: collisionTargetId }),
  publicAdmissionCatalogRow({ id: collisionTargetId, slug: 'live-id-owner', alias: '20000000-0000-4000-8000-000000000019', programmeId: 'business-ba' }),
]);
assert.equal(aliasCollision.institutions.length, 0, 'an alias colliding with any other live UUID quarantines both rows');
assert.equal(aliasCollision.issues.filter(issue => issue.code === 'favorite_alias_live_id_collision').length, 2);
const legacyIdCollision = adaptPublicCatalog([
  publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000028', slug: 'alias-of-legacy', alias: '00000000-0000-4000-8000-000000000029' }),
  { id: '00000000-0000-4000-8000-000000000029', catalog: null },
]);
assert.equal(legacyIdCollision.institutions.length, 0, 'aliases colliding with legacy live UUIDs are also quarantined');

const mediaRow = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000030', slug: 'media-university' });
mediaRow.catalog.media = {
  homepage: 'https://example.edu', programLinks: [{ programId: 'cs-bsc', url: 'https://example.edu/cs' }],
  image: {
    url: 'https://images.example.edu/campus.jpg', width: 1200, height: 800, sourcePage: 'https://example.edu/about',
    title: 'Campus', creator: 'University photographer', licence: { id: 'cc-by-4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    attribution: 'University photographer', changes: 'Cropped', rightsNotes: 'Campus view',
    localized: Object.fromEntries(['en', 'ru', 'uz'].map(language => [language, { caption: 'Campus', scope: 'Main campus' }])),
  },
};
const mediaAdapted = adaptPublicCatalog([mediaRow]);
assert.deepEqual(mediaAdapted.institutions[0].media.image.license, mediaRow.catalog.media.image.licence);
assert.equal(mediaRow.catalog.media.image.license, undefined, 'media aliasing must not mutate source rows');
assert.equal(mediaAdapted.options[0].media.image.license.id, 'cc-by-4.0');

const policyValue = { applicantCategory: 'Uzbekistan applicants', routes: [{ path: 'direct', credentials: ['academic_lyceum_diploma'], evidence: { status: 'verified', sourceKeys: ['official_main-2027'] }, academic: { kind: 'GPA', minimum: 3.5, scaleMaximum: 4 } }] };
const policyFact = publicCatalogFact(policyValue);
const scopedPolicy = adaptPublicCatalog([publicAdmissionCatalogRow({ policyFact })]);
assert.equal(scopedPolicy.options[0].academicRequirement.type, 'unknown');
assert.equal(scopedPolicy.options[0].requirementPolicy, null);
assert.deepEqual(scopedPolicy.options[0].facts.requirementPolicy.value, policyValue, 'policy remains available as display/diagnostic evidence');
assert.equal(evaluateRequirement(scopedPolicy.options[0].academicRequirement, { grade: 4, scale: '4', schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', startYear: 2027 }).status, 'unknown');

const invalidUnknown = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000031', slug: 'invalid-unknown' });
invalidUnknown.catalog.programmes[0].teachingLanguage = publicCatalogFact('English', 'unknown');
assert(adaptPublicCatalog([invalidUnknown]).issues.some(issue => issue.code === 'invalid_programme'), 'unknown facts cannot carry values');

const prototypeSource = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000034', slug: 'prototype-source' });
prototypeSource.catalog.programmes[0].academicRequirement.sourceIds = ['constructor'];
prototypeSource.catalog.programmes[0].academicRequirement.value.sourceKey = 'constructor';
assert(adaptPublicCatalog([prototypeSource]).issues.some(issue => issue.code === 'missing_source'), 'inherited object properties are not official sources');

const sourceSetMismatch = publicAdmissionCatalogRow({ id: '00000000-0000-4000-8000-000000000035', slug: 'source-set-mismatch' });
sourceSetMismatch.catalog.sources.secondary = { ...sourceSetMismatch.catalog.sources['official_main-2027'], key: 'secondary' };
sourceSetMismatch.catalog.programmes[0].academicRequirement.sourceIds = ['secondary'];
assert(adaptPublicCatalog([sourceSetMismatch]).issues.some(issue => issue.code === 'invalid_programme'), 'rule leaf sources must be cited by their Fact');

const crossRegion = adaptPublicCatalog([publicAdmissionCatalogRow({
  id: '00000000-0000-4000-8000-000000000036', slug: 'wrong-region', country: 'United States', surveyRegion: 'Europe',
})]);
assert(crossRegion.issues.some(issue => issue.code === 'invalid_catalog'), 'known country and survey region conflicts are rejected');

const frozenAliasMismatch = adaptPublicCatalog([publicAdmissionCatalogRow({
  id: '00000000-0000-4000-8000-000000000037', slug: 'unrelated-university',
  alias: FAVORITE_KEYS['gb-university-of-hertfordshire'],
})]);
assert(frozenAliasMismatch.issues.some(issue => issue.code === 'invalid_favorite_alias_mapping'), 'published aliases cannot reassign frozen saved keys');

const unconfirmedRoute = publicAdmissionCatalogRow();
unconfirmedRoute.catalog.programmes[0].route.status = 'published_unconfirmed';
unconfirmedRoute.catalog.programmes[0].route.applicability = 'unconfirmed';
const unconfirmedAdapted = adaptPublicCatalog([unconfirmedRoute]);
assert.equal(unconfirmedAdapted.options.length, 1, 'sourced programme identity remains explorable');
assert.equal(unconfirmedAdapted.options[0].entryPath, 'unknown');
assert.equal(unconfirmedAdapted.options[0].facts.route.status, 'published_unconfirmed', 'no artificial evidence upgrade');
const unknownRoute = structuredClone(unconfirmedRoute);
unknownRoute.catalog.programmes[0].route = publicCatalogFact(null, 'unknown');
assert.equal(adaptPublicCatalog([unknownRoute]).options[0].entryPath, 'unknown');
const foundationRoute = structuredClone(unconfirmedRoute);
foundationRoute.catalog.programmes[0].route.value.entryPath = 'foundation';
assert.equal(adaptPublicCatalog([foundationRoute]).options.length, 0, 'foundation is not silently relabelled as direct or unknown');

const campus = publicAdmissionCatalogRow({ country: 'United States', surveyRegion: 'USA' });
campus.catalog.programmes[0].location = publicCatalogFact({ country: 'South Korea', region: 'South Korea', campus: 'Published Korea campus' });
campus.catalog.programmes[0].publicNotes = [publicCatalogFact('A sourced native condition still needs individual assessment.', 'published_unconfirmed', { applicability: 'unconfirmed' })];
campus.catalog.programmes[0].tuition.value.feeYear = null;
const campusAdapted = adaptPublicCatalog([campus]);
assert.equal(campusAdapted.institutions[0].country, 'United States');
assert.equal(campusAdapted.options[0].country, 'South Korea');
assert.equal(campusAdapted.options[0].region, 'South Korea');
assert.equal(campusAdapted.options[0].facts.publicNotes.length, 1);
assert.equal(campusAdapted.options[0].facts.tuition.value.feeYear, null, 'no invented fee year');
campus.catalog.programmes[0].location.status = 'published_unconfirmed';
assert.equal(adaptPublicCatalog([campus]).options[0].country, 'United States', 'unconfirmed campus cannot change routing');

console.log('Public admission catalog checks passed.');
