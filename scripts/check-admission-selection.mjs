import assert from 'node:assert/strict';
import { selectPreliminaryResults } from '../src/lib/admissions/selectResults.js';

const answers = { field: 'computer_science', regions: ['UK'], grade: '', scale: '', exam: '', score: '' };
const makeRow = (id, overrides = {}) => {
  const { option = {}, ...rowOverrides } = overrides;
  return {
    option: {
      id,
      institutionId: id,
      university: `Synthetic University ${id}`,
      region: 'UK',
      field: 'computer_science',
      entryPath: 'direct',
      ...option,
    },
    requirementStatus: 'unknown',
    budgetStatus: 'unknown',
    languageStatus: 'unknown',
    academicStatus: 'unknown',
    topEvidence: false,
    preferenceMatches: null,
    reasons: [],
    ...rowOverrides,
  };
};

const oxford = makeRow('oxford-program', { option: { institutionId: 'oxford', university: 'University of Oxford' } });
const cambridge = makeRow('cambridge-program', { option: { institutionId: 'university-of-cambridge', university: 'University of Cambridge' } });
const brookes = makeRow('brookes-program', { option: { institutionId: 'oxford-brookes', university: 'Oxford Brookes University' } });
const evidenceRequired = makeRow('evidence-required', { option: { institutionId: 'ordinary-id', fallbackPolicy: 'requires_academic_evidence' } });
const noComparableGrade = selectPreliminaryResults([oxford, cambridge, brookes, evidenceRequired], answers);
assert.deepEqual(noComparableGrade.results.map(({ option }) => option.id), ['brookes-program']);
assert.equal(noComparableGrade.totalInstitutions, 1, 'general fallback suppression must precede institution counts');

const gradeProvided = { ...answers, grade: '4', scale: '5' };
const gradeButUnknownAcademic = selectPreliminaryResults([oxford, cambridge], gradeProvided);
assert.equal(gradeButUnknownAcademic.totalInstitutions, 0, 'grade alone does not satisfy academic evidence policy');
const allowedFallbacks = selectPreliminaryResults([
  { ...oxford, academicStatus: 'met' },
  { ...cambridge, academicStatus: 'met' },
], gradeProvided);
assert.equal(allowedFallbacks.totalInstitutions, 2, 'fallback suppression applies only when comparable grade evidence is absent');

const duplicateRows = [
  makeRow('same-weak', { option: { institutionId: 'shared' }, preferenceMatches: 9 }),
  makeRow('same-proven', { option: { institutionId: 'shared' }, topEvidence: true, requirementStatus: 'unknown', preferenceMatches: 1 }),
  ...Array.from({ length: 6 }, (_, index) => makeRow(`institution-${index}`)),
];
const deduplicated = selectPreliminaryResults(duplicateRows, answers);
assert.equal(deduplicated.results.length, 5);
assert.equal(deduplicated.totalInstitutions, 7);
assert.equal(deduplicated.results.filter(({ option }) => option.institutionId === 'shared').length, 1);
assert.ok(deduplicated.results.some(({ option }) => option.id === 'same-proven'), 'dedupe prefers proven top evidence over a higher preference count');
assert.equal(new Set(deduplicated.results.map(({ option }) => option.institutionId)).size, deduplicated.results.length);
const cleanDedup = selectPreliminaryResults([
  makeRow('a-unmet', { option: { institutionId: 'same-school' }, requirementStatus: 'unmet' }),
  makeRow('z-clean', { option: { institutionId: 'same-school' } }),
], answers);
assert.deepEqual(cleanDedup.results.map(({ option }) => option.id), ['z-clean'], 'dedupe must prefer a clean/unknown row over unmet');

const topAnswers = { field: 'computer_science', regions: ['Europe'], grade: '4', scale: '5', exam: 'IELTS', score: '6.5', budget: '20000', currency: 'EUR' };
const topRows = Array.from({ length: 4 }, (_, index) => makeRow(`top-${index}`, {
  option: { institutionId: `top-inst-${index}`, region: 'Europe' },
  requirementStatus: 'met',
  budgetStatus: 'met',
  languageStatus: 'met',
  academicStatus: 'met',
  topEvidence: true,
  preferenceMatches: 4 - index,
}));
const ranked = selectPreliminaryResults(topRows, topAnswers);
assert.equal(ranked.mode, 'ranked');
assert.equal(ranked.topCount, 3);
assert.deepEqual(ranked.results.map(({ isTop }) => isTop), [true, true, true, false]);

const noGradeTopRows = selectPreliminaryResults(topRows, { ...topAnswers, grade: '', scale: '' });
assert.equal(noGradeTopRows.mode, 'explore');
assert.equal(noGradeTopRows.topCount, 0);
assert.ok(noGradeTopRows.results.every(({ isTop }) => !isTop));

const unmetRows = [
  makeRow('unmet-requirement', { option: { region: 'Europe' }, requirementStatus: 'unmet', topEvidence: true }),
  makeRow('unmet-language', { option: { region: 'Europe' }, languageStatus: 'unmet', topEvidence: true }),
  makeRow('unmet-academic', { option: { region: 'Europe' }, academicStatus: 'unmet', topEvidence: true }),
  makeRow('unmet-budget', { option: { region: 'Europe' }, budgetStatus: 'unmet', topEvidence: true }),
  makeRow('requires-clarification', { option: { region: 'Europe' }, requiresClarification: true, topEvidence: true }),
];
const unmetSelection = selectPreliminaryResults(unmetRows, topAnswers);
assert.equal(unmetSelection.results.length, 0);
assert.equal(unmetSelection.alternatives.length, 5);
assert.equal(unmetSelection.topCount, 0);
assert.ok(unmetSelection.alternatives.every(({ isTop }) => !isTop));

const strictRows = [
  makeRow('correct'),
  makeRow('wrong-region', { option: { region: 'Europe' } }),
  makeRow('wrong-direction', { option: { field: 'software_engineering' } }),
  makeRow('foundation', { option: { entryPath: 'foundation' } }),
];
const strict = selectPreliminaryResults(strictRows, answers);
assert.deepEqual(strict.results.map(({ option }) => option.id), ['correct']);
assert.equal(strict.totalInstitutions, 1, 'filtering must not relax preferences to fill the limit');
const fieldsArray = selectPreliminaryResults([
  makeRow('multi-field', { option: { field: undefined, fields: ['computer_science', 'software_engineering'] } }),
], answers);
assert.equal(fieldsArray.results.length, 1, 'field arrays are matched without rewriting the row');
const oneMainFiveAlternatives = selectPreliminaryResults([
  makeRow('one-main'),
  ...Array.from({ length: 5 }, (_, index) => makeRow(`alternative-${index}`, { requirementStatus: 'unmet' })),
], answers);
assert.equal(oneMainFiveAlternatives.results.length, 1);
assert.equal(oneMainFiveAlternatives.alternatives.length, 4, 'alternatives use only remaining slots after main results');

const regionalRows = [
  ...Array.from({ length: 5 }, (_, index) => makeRow(`uk-${index}`, { option: { institutionId: `uk-inst-${index}`, region: 'UK' }, preferenceMatches: 7 })),
  makeRow('europe-z', { option: { institutionId: 'europe-inst', region: 'Europe' }, preferenceMatches: 7 }),
  makeRow('uk-higher-score', { option: { institutionId: 'uk-higher-inst', region: 'UK' }, preferenceMatches: 8 }),
];
const regionalAnswers = { ...answers, regions: ['UK', 'Europe'] };
const regionalForward = selectPreliminaryResults(regionalRows, regionalAnswers);
const regionalReverse = selectPreliminaryResults([...regionalRows].reverse(), regionalAnswers);
assert.deepEqual(regionalForward.results.map(({ option }) => option.id), regionalReverse.results.map(({ option }) => option.id));
assert.equal(regionalForward.results[0].option.id, 'uk-higher-score', 'regional diversity cannot demote a higher preference score');
assert.ok(regionalForward.results.some(({ option }) => option.region === 'Europe'), 'equal preference scores interleave selected regions before the cap');

const ambitiousRows = [
  makeRow('ambitious-policy', { option: { discoveryPolicy: 'ambitious_only' } }),
  makeRow('extremely-selective', { option: { competitiveness: { category: 'extremely_selective' } } }),
];
const ambitiousProfiles = [
  answers,
  { ...answers, exam: 'IELTS', score: '5.5' },
  { ...answers, grade: '4', scale: '5', exam: 'IELTS', score: '6.5' },
];
for (const profile of ambitiousProfiles) {
  const selection = selectPreliminaryResults(ambitiousRows, profile);
  assert.equal(selection.results.length, 0, 'ambitious/selective entries are omitted from ordinary result rows');
  assert.equal(selection.alternatives.length, 0, 'ambitious/selective entries are not presented as ordinary alternatives');
  assert.equal(selection.totalInstitutions, 0);
}

const inputBefore = structuredClone(topRows);
const forward = selectPreliminaryResults(topRows, topAnswers);
const reversed = selectPreliminaryResults([...topRows].reverse(), topAnswers);
assert.deepEqual(topRows, inputBefore, 'selection must preserve input rows');
assert.notEqual(forward.results[0], topRows[0], 'returned rows must be cloned');
assert.deepEqual(forward.results.map(({ option, isTop }) => [option.id, isTop]), reversed.results.map(({ option, isTop }) => [option.id, isTop]));
assert.equal(selectPreliminaryResults(topRows, topAnswers, 2).results.length, 2);
assert.equal(selectPreliminaryResults(topRows, topAnswers, 2).alternatives.length, 0);
assert.equal(selectPreliminaryResults(topRows, topAnswers, 50).results.length, 4, 'the public result set remains capped at five overall');

assert.deepEqual(selectPreliminaryResults(null, answers), { results: [], alternatives: [], topCount: 0, mode: 'explore', totalInstitutions: 0 });
assert.deepEqual(selectPreliminaryResults([], answers), { results: [], alternatives: [], topCount: 0, mode: 'explore', totalInstitutions: 0 });

console.log('Admission selection checks passed: strict filters, fallback suppression, dedupe, top evidence, alternatives, stable order, cloning, and empty coverage.');
