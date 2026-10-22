import assert from 'node:assert/strict';
import { selectCatalogResults, getCatalogPage } from '../src/lib/catalogResults.js';

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
console.log('Catalog checks passed: complete pagination, stable order, canonical programme search/filters, and unknown-data preservation.');
