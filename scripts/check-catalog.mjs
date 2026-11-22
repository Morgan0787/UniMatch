import assert from 'node:assert/strict';
import { selectCatalogResults, selectCatalogSearchResults, getCatalogueProgrammeLocation, getCatalogPage } from '../src/lib/catalogResults.js';
import { loadUniversityCatalog } from '../src/lib/catalogRepository.js';
import { readCatalogState, readStoredCatalogFilters, serializeCatalogFilters, writeCatalogState } from '../src/lib/catalogState.js';
import { toUsd } from '../src/lib/tuitionCurrency.js';
import { withPublicProgrammeFacts } from '../src/lib/admissions/universityCatalog.js';
import { universityPageUrl } from '../src/lib/universityNavigation.js';
import { publicAdmissionCatalogRow, publicCatalogFact, publicCatalogSource } from './fixtures/publicAdmissionCatalog.mjs';

const filters = { gpa: null, ielts: null, budget: null, region: '', country: '', languages: [], degree: '', scholarshipsOnly: false };
const rows = Array.from({ length: 53 }, (_, i) => ({
  id: `university-${i}`, name: `University ${i}`, country: i % 2 ? 'Germany' : 'United States',
  city: 'City', region: i % 2 ? 'Europe' : 'North America', tuition_min: null,
  min_gpa: i < 48 ? 2 + i / 100 : null,
}));
const original = structuredClone(rows);
const results = selectCatalogResults(rows, filters, '');
const pages = [1, 2, 3].map(page => getCatalogPage(results, page));
assert.deepEqual(pages.map(page => page.rows.length), [24, 24, 5]);
assert.deepEqual(pages.flatMap(page => page.rows.map(row => row.id)), results.map(row => row.id));
assert.equal(new Set(pages.flatMap(page => page.rows.map(row => row.id))).size, rows.length);
assert.equal(getCatalogPage(results, 99).page, 3);
assert.equal(getCatalogPage(results, 0).page, 1);
assert.deepEqual(getCatalogPage([], 1), { page: 1, pages: 1, rows: [], start: 0, end: 0 });
assert.deepEqual(selectCatalogResults(rows, filters, ''), results, 'opening UI must not reshuffle results');
const searched = selectCatalogResults(rows, filters, 'University 52');
assert.equal(searched[0].id, 'university-52', 'search must include records beyond the first page');
assert.equal(searched[0].min_gpa, null, 'missing GPA must remain unknown');
const german = selectCatalogResults(rows, { ...filters, country: 'Germany' }, '');
assert.equal(german.length, 26);
assert.ok(german.every(row => row.country === 'Germany'));
const unknownIndex = german.findIndex(row => row.min_gpa === null);
assert.ok(german.slice(unknownIndex).every(row => row.min_gpa === null), 'unknown GPA follows published cutoffs');
assert.equal(results.length, rows.length, 'unknown tuition must not become an invented over-budget price');
assert.deepEqual(rows, original, 'selection must not mutate API records');
const canonicalOnly = {
  id: 'canonical-only', name: 'Canonical University', country: 'Germany', city: null,
  tuition_min: null, language: null, degree_levels: null,
  admissionCatalog: { status: 'valid', programmes: [{ facts: {
    name: { status: 'current_verified', applicability: 'confirmed', value: 'Computer Science' },
    field: { status: 'current_verified', applicability: 'confirmed', value: 'Data Science' },
    teachingLanguage: { status: 'current_verified', applicability: 'confirmed', value: 'English' },
    degree: { status: 'current_verified', applicability: 'confirmed', value: { level: 'bachelor', award: 'Bachelor of Science' } },
  } }] },
};
assert.equal(selectCatalogResults([canonicalOnly], filters, 'Data Science').length, 1, 'search includes canonical subject fields');
assert.equal(selectCatalogResults([canonicalOnly], { ...filters, languages: ['English'] }, '').length, 1, 'language filter reads canonical programme facts');
assert.equal(selectCatalogResults([canonicalOnly], { ...filters, degree: 'Bachelor' }, '').length, 1, 'degree filter reads the verified canonical degree level');
assert.equal(selectCatalogResults([canonicalOnly], { ...filters, budget: 0 }, '').length, 1, 'unknown tuition is preserved under a budget filter');
const historicalLanguage = { ...canonicalOnly, admissionCatalog: { status: 'valid', programmes: [{ facts: {
  teachingLanguage: { status: 'historical_reference', historical: { value: 'English' } },
  degree: { status: 'historical_reference', historical: { value: { level: 'bachelor', award: 'Bachelor of Science' } } },
} }] } };
assert.equal(selectCatalogResults([historicalLanguage], { ...filters, languages: ['English'] }, '').length, 0, 'historical language cannot affirm a language filter');
assert.equal(selectCatalogResults([historicalLanguage], { ...filters, degree: 'Bachelor' }, '').length, 0, 'historical degree cannot affirm a degree filter');
const invalidCatalog = { ...canonicalOnly, admissionCatalog: { status: 'invalid', programmes: canonicalOnly.admissionCatalog.programmes } };
assert.equal(selectCatalogResults([invalidCatalog], { ...filters, languages: ['English'] }, '').length, 0, 'invalid canonical catalog cannot affirm a language filter');
assert.equal(selectCatalogResults([invalidCatalog], { ...filters, degree: 'Bachelor' }, '').length, 0, 'invalid canonical catalog cannot affirm a degree filter');

const budgetFilters = { ...filters, budget: 4000, languages: ['English'], degree: 'Bachelor' };
const annualFee = { amount: 4000, currency: 'USD', period: 'year', feeYear: '2027/28', includedFees: [], excludedFees: [] };
const budgetUniversity = ({ tuition = publicCatalogFact(annualFee), targetIntakeYear = 2027 } = {}) => {
  const row = publicAdmissionCatalogRow({ targetIntakeYear });
  row.catalog.programmes[0].tuition = tuition;
  return withPublicProgrammeFacts({ ...row, tuition_min: 1, admission_requirements: { unimatch_catalog_v1: row.catalog } });
};
const budgetStatus = (row, activeFilters = budgetFilters, query = 'Computer Science', currentYear = 2026) =>
  selectCatalogSearchResults([row], activeFilters, query, currentYear)[0]?.budget;
assert.deepEqual(budgetStatus(budgetUniversity()), { group: 'within', reason: null }, 'the annual USD maximum is inclusive');
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, amount: 4001 }) })), undefined, 'confirmed tuition above the limit is excluded');
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, period: '12_months' }) })).group, 'within');
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, amount: 0 }) }), { ...budgetFilters, budget: 0 }).group, 'within');
const euroUniversity = budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, currency: 'EUR' }) });
const euroLimitUsd = Number(toUsd(4000, 'EUR').toFixed(2));
assert.equal(budgetStatus(euroUniversity, { ...budgetFilters, budget: euroLimitUsd }).group, 'within');
assert.equal(budgetStatus(euroUniversity, { ...budgetFilters, budget: euroLimitUsd - 0.01 }), undefined);
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, currency: 'KRW', amount: 4000 }) })).group, 'within');
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, currency: 'UZS' }) })).reason, 'unavailableExchangeRate');
assert.equal(budgetStatus(budgetUniversity({ tuition: publicCatalogFact({ ...annualFee, period: 'semester' }) })).reason, 'nonAnnualTuition');

const historicalFee = publicCatalogFact(null, 'historical_reference', { applicability: 'unconfirmed', historical: {
  value: { ...annualFee, feeYear: '2025/26' }, referenceSeason: '2025/26', checkedAt: '2026-10-01', sourceIds: [publicCatalogSource.key],
} });
for (const tuition of [
  publicCatalogFact(null, 'unknown'), historicalFee,
  publicCatalogFact(annualFee, 'estimate'), publicCatalogFact(annualFee, 'published_unconfirmed'),
  publicCatalogFact(annualFee, 'current_verified', { applicability: 'not_applicable' }),
  publicCatalogFact({ ...annualFee, feeYear: '2026/27' }), publicCatalogFact({ ...annualFee, feeYear: '2027/31' }),
  publicCatalogFact({ ...annualFee, feeYear: null }),
  publicCatalogFact(annualFee, 'current_verified', { scope: { ...publicCatalogFact(annualFee).scope, studentCategory: 'domestic' } }),
]) {
  assert.deepEqual(budgetStatus(budgetUniversity({ tuition })), { group: 'unknown', reason: 'unconfirmedTuition' });
}
assert.equal(budgetStatus(budgetUniversity({ targetIntakeYear: 2028 })).group, 'unknown', 'tuition from an older intake cannot qualify');
assert.equal(budgetStatus(budgetUniversity(), budgetFilters, 'Computer Science', 2028).group, 'unknown', 'an outdated catalogue intake cannot qualify');
assert.equal(budgetStatus({ ...budgetUniversity(), admissionCatalog: undefined, tuition_min: 1 }, { ...filters, budget: 4000 }, '').group, 'unknown', 'legacy price cannot determine programme budget group');

const multiProgramme = publicAdmissionCatalogRow({ country: 'United States', surveyRegion: 'USA' });
const firstProgramme = multiProgramme.catalog.programmes[0];
firstProgramme.tuition.value.amount = 1000;
const korea = structuredClone(firstProgramme);
korea.id = 'robotics-korea';
korea.name.value = 'Robotics (SUNY Korea)';
korea.degree.value = 'Master';
korea.teachingLanguage.value = 'Korean';
korea.tuition.value.amount = 6000;
korea.location = publicCatalogFact({ country: 'South Korea', region: 'South Korea', campus: 'SUNY Korea' });
for (const fact of Object.values(korea)) if (fact?.scope) fact.scope.programmeId = korea.id;
multiProgramme.catalog.programmes.push(korea);
const programmeRows = [withPublicProgrammeFacts({ ...multiProgramme, admission_requirements: { unimatch_catalog_v1: multiProgramme.catalog } })];
assert.deepEqual(selectCatalogSearchResults(programmeRows, { ...filters, budget: 4000 }, 'Robotics', 2026), [], 'a different affordable programme cannot make the searched programme affordable');
const multiResult = selectCatalogSearchResults(programmeRows, { ...filters, budget: toUsd(6000, 'EUR') }, 'Robotics', 2026)[0];
assert.equal(multiResult.programme.id, korea.id);
assert.equal(multiResult.university.country, 'United States');
assert.deepEqual(getCatalogueProgrammeLocation(multiResult.programme), { country: 'South Korea', region: 'South Korea', campus: 'SUNY Korea' });
assert.equal(getCatalogueProgrammeLocation({ location: { ...korea.location, applicability: 'unconfirmed' } }), null);
assert.deepEqual(selectCatalogSearchResults(programmeRows, { ...budgetFilters, degree: 'Master' }, '', 2026), [], 'language and degree from separate programmes cannot form a budget result');
assert.deepEqual(selectCatalogSearchResults(rows, filters, '').map(result => result.university), results, 'no-budget browsing retains university order and records');

const alternateView = writeCatalogState(new URLSearchParams('q=Robotics&budgetView=unknown&page=3'), { filters: budgetFilters });
assert.equal(readCatalogState(new URLSearchParams('budgetView=unknown&page=3')).page, 1);
assert.equal(alternateView.has('budgetView'), false);
assert.equal(readCatalogState(alternateView).query, 'Robotics');
assert.equal(JSON.parse(alternateView.get('filters')).budgetCurrency, 'USD');
assert.equal(readCatalogState(alternateView).filters.budget, 4000);
const oldLink = new URLSearchParams({ filters: JSON.stringify({ budget: 4000 }) });
assert.equal(readCatalogState(oldLink).filters.budget, euroLimitUsd);
assert.equal(readCatalogState(writeCatalogState(oldLink, { query: 'Computer Science' })).filters.budget, euroLimitUsd);
assert.equal(readStoredCatalogFilters({ budget: 4000 }).budget, euroLimitUsd);
assert.equal(readStoredCatalogFilters(JSON.parse(serializeCatalogFilters(readStoredCatalogFilters({ budget: 4000 })))).budget, euroLimitUsd);
const zeroLimit = writeCatalogState(alternateView, { filters: { ...budgetFilters, budget: 0 } });
assert.equal(readCatalogState(zeroLimit).filters.budget, 0);
const clearedLimit = writeCatalogState(alternateView, { filters: { ...budgetFilters, budget: null } });
assert.equal(readCatalogState(clearedLimit).filters.budget, null);
assert.deepEqual(readCatalogState(clearedLimit).filters.languages, ['English']);
const detailParams = new URL(universityPageUrl(multiResult.university.id, `/Search?${alternateView}`, multiResult.programme.id), 'https://example.test').searchParams;
assert.equal(detailParams.get('programme'), korea.id);
assert.equal(detailParams.get('from'), `/Search?${alternateView}`);

const catalogRows = Array.from({ length: 2063 }, (_, id) => ({ id }));
function mockCatalog(total, { count = total, failAt = -1 } = {}) {
  let active = 0;
  let peak = 0;
  const offsets = [];
  const client = { from: () => ({ select: (_fields, options) => ({ order: () => ({
    async range(start, end) {
      offsets.push(start);
      peak = Math.max(peak, ++active);
      await new Promise(resolve => setTimeout(resolve, start === 500 ? 5 : 0));
      active--;
      return { data: catalogRows.slice(start, Math.min(end + 1, total)), error: start === failAt ? new Error('page failed') : null, count: options ? count : null };
    },
  }) }) }) };
  return { client, offsets, peak: () => peak };
}

const concurrent = mockCatalog(2063);
assert.deepEqual(await loadUniversityCatalog(concurrent.client, 'universities'), catalogRows);
assert.equal(concurrent.peak(), 4);
const unknownTotal = mockCatalog(1000, { count: null });
assert.deepEqual(await loadUniversityCatalog(unknownTotal.client, 'universities'), catalogRows.slice(0, 1000));
assert.deepEqual(unknownTotal.offsets, [0, 500, 1000]);
const growing = mockCatalog(2063, { count: 1000 });
assert.deepEqual(await loadUniversityCatalog(growing.client, 'universities'), catalogRows);
await assert.rejects(loadUniversityCatalog(mockCatalog(2063, { failAt: 1000 }).client, 'universities'), /page failed/);
console.log('Catalog checks passed: pagination, stable browse, annual tuition filter, programme campus and detail links, and URL state.');
