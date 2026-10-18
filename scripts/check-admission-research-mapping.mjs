import assert from 'node:assert/strict';
import { mapData05Institution } from './lib/mapAdmissionResearch.mjs';
import { adaptPublicCatalog } from '../src/lib/admissions/publicCatalog.js';

const source = (key, scope = 'Computer Science BSc admissions') => ({
  id: key,
  url: `https://${key}.example.edu/admissions`,
  title: `Official ${key} admissions page`,
  checkedAt: '2026-10-18',
  scope,
  researcherAudit: 'must not be copied',
});
const sources = {
  targetIntakeYear: 2027,
  checkedAt: '2026-10-18',
  sources: Object.fromEntries(['identity', 'route', 'money', 'cost', 'history', 'rules', 'deadline', 'notes'].map(key => [key, source(key)])),
};
const scope = {
  programmeId: 'sample-computer-science', route: null, studentCategory: 'international_freshman',
  schoolCountry: null, credential: null, intakeYear: 2027,
};
const fact = (value, status = 'current_verified', sourceIds = ['identity'], extra = {}) => ({
  value, status, sourceIds, scope, season: status === 'historical_reference' ? '2025/26' : null,
  applicability: status === 'current_verified' ? 'confirmed' : 'unconfirmed',
  historical: null, noticeCode: null, operationalNote: 'must not be copied', ...extra,
});
const programme = {
  id: 'sample-computer-science',
  name: fact('Computer Science BSc'),
  degree: fact({ level: 'Bachelor', award: null }),
  field: fact('computer_science'),
  route: fact('unknown', 'published_unconfirmed', ['route'], { noticeCode: 'data.currentApplicabilityUnconfirmed' }),
  routeSourceKey: 'route',
  intake: fact({ year: 2027, terms: ['spring', 'fall'], startsApproximate: ['mid_January', 'mid_August'] }),
  teachingLanguage: fact('English'),
  academicRequirement: fact(null, 'unknown', ['rules'], { nativeFacts: fact({ type: 'grade', minimum: 85, scale: '100', operator: 'at least' }, 'published_unconfirmed', ['notes']) }),
  languageRequirement: fact(null, 'unknown', ['notes'], { nativeFacts: fact({
    type: 'ielts', minimum: 6.5, sections: { listening: 6, writing: 6 }, validityYears: 2,
    referenceDate: '2026-01-15', alternatives: ['TOEFL iBT 80'],
  }, 'current_verified', ['notes']) }),
  languageThreshold: fact({ type: 'all', children: [
    { type: 'ielts', minimum: 6.5, sections: { listening: 6, writing: 6 }, validityYears: 2, referenceDate: '2026-01-15', sourceKey: 'rules' },
    { type: 'any', children: [
      { type: 'grade', minimum: 85, scale: '100', sourceKey: 'rules' },
      { type: 'ielts', minimum: 7, sourceKey: 'rules' },
    ] },
  ] }, 'current_verified', ['rules']),
  tuition: fact(null, 'historical_reference', ['history'], {
    season: '2025/26', noticeCode: 'data.historicalReference',
    historical: { value: {
      amount: 396.3, currency: 'USD', period: 'credit_hour', feeYear: '2026/27',
      includedFees: [], excludedFees: [], category: 'nonresident_undergraduate', scope: 'base_tuition',
      additionalCourseAndMandatoryFees: true, annualCreditLoad: null, comparisonVerified: true,
    }, referenceSeason: '2025/26', sourceIds: ['history'], checkedAt: '2025-06-01' },
  }),
  costReferences: [
    fact({ amount: 300, currency: 'GBP', period: 'credit_hour', feeYear: '2026/27', includedFees: ['tuition'], excludedFees: [], label: 'Per credit quote' }, 'published_unconfirmed', ['cost']),
    fact({ amount: 21000, currency: 'GBP', period: '12_months', feeYear: '2026/27', includedFees: ['tuition'], excludedFees: [], label: 'Twelve-month fee quote' }, 'published_unconfirmed', ['cost']),
    fact({ amount: null, currency: 'GBP', period: null, feeYear: null, includedFees: [], excludedFees: [], label: 'Period unconfirmed quote' }, 'published_unconfirmed', ['cost']),
  ],
  scholarships: fact(null, 'unknown', []),
  credential: fact({ qualification: 'Secondary education', uzbekEquivalence: null, nativePolicyRef: 'private-ref' }, 'published_unconfirmed', ['notes']),
  applicationFee: fact({ amount: 90, currency: 'USD', period: 'application' }, 'published_unconfirmed', ['cost']),
  preparatoryAlternatives: fact([{ route: 'Intensive English pathway', IELTSoverall: 5.5, explicitChoiceRequired: true, notFullTimeDegreeEntry: true }], 'published_unconfirmed', ['notes']),
  deadline: fact({
    date: null, timezone: 'America/Chicago', year: 2027,
    byTerm: {
      spring: { basic: '2026-09-15', standard: '2026-11-01' },
      fall: { priority: '2027-04-15' },
    },
  }, 'published_unconfirmed', ['deadline']),
  competitiveness: fact({ highlySelective: true, basis: 'Official self-description', acceptanceRate: null, operationalMeta: 'exclude' }),
  discovery: { use: 'explore', basis: 'Ordinary exploration' },
  nativePolicyRef: 'private policy reference',
  provenanceCarry: { privateAudit: 'must not be copied' },
  limitations: ['researcher-only text'],
};
const recurringProgramme = structuredClone(programme);
recurringProgramme.id = 'sample-recurring-programme';
const updateProgrammeScopes = (value, oldId, newId) => {
  if (!value || typeof value !== 'object') return;
  if (value.scope?.programmeId === oldId) value.scope.programmeId = newId;
  for (const child of Object.values(value)) updateProgrammeScopes(child, oldId, newId);
};
updateProgrammeScopes(recurringProgramme, programme.id, recurringProgramme.id);
recurringProgramme.deadline.value = {
  date: null, timezone: null,
  recurring: [{ term: 'fall', monthDay: '03-01' }, { term: 'spring', monthDay: '10-01' }],
};
const nativeProgramme = structuredClone(programme);
nativeProgramme.id = 'sample-native-facts';
updateProgrammeScopes(nativeProgramme, programme.id, nativeProgramme.id);
const nativeScope = { ...scope, programmeId: nativeProgramme.id, intakeYear: 2027 };
const nativeFact = (value, status = 'current_verified', sourceIds = ['notes']) => ({
  ...fact(value, status, sourceIds), scope: nativeScope,
});
nativeProgramme.tuition = nativeFact(null, 'historical_reference', ['history']);
nativeProgramme.tuition.historical = {
  value: {
    amount: null, currency: 'USD', period: null, feeYear: '2026/27', scope: 'tuition_and_fees_estimate',
    alternatives: [
      { amount: 20100, period: 'academic_year_9_months' },
      { amount: 24900, period: '12_months' },
    ],
    exactComputerScienceTuition: false, creditLoadMinimumPerSemester: 12,
  },
  referenceSeason: '2026/27', sourceIds: ['history'], checkedAt: '2026-10-18',
};
nativeProgramme.costReferences = [];
nativeProgramme.languageRequirement = {
  ...nativeFact(null, 'published_unconfirmed', ['identity']),
  nativeFacts: nativeFact({
    exam: 'IELTS Academic', overall: 6, validityYears: 2, oneSkillRetakeAccepted: false,
    alternatives: ['DET 105'],
  }, 'current_verified', ['notes']),
};
nativeProgramme.languageThreshold = nativeFact({
  exam: 'IELTS', overall: 5.5, sections: null,
  alternatives: [
    { exam: 'TOEFL iBT', minimum: 3.5, oldScaleMinimum: 59 },
    { exam: 'New TEPS', minimum: 202 },
  ],
  scoreProofScope: 'official score required for non-English-country applicants',
}, 'current_verified', ['notes']);
nativeProgramme.academicRequirement = {
  ...nativeFact(null, 'unknown', ['identity']),
  nativeFacts: nativeFact({ type: 'grade', minimum: 85, scale: '100' }, 'published_unconfirmed', ['notes']),
};
nativeProgramme.scholarships = nativeFact({
  name: 'Sample scholarship', firstSemesterOnly: true, languageScoreAndDocumentsDependent: true,
  guaranteedAmount: null, maySubtractFromBase: false,
});
nativeProgramme.credential = nativeFact({
  documents: ['certificate_original_or_certified_copy', 'see_credential', 'may_be_requested'],
});
const institution = { institutionId: 'sample-university', programmes: [programme, recurringProgramme, nativeProgramme] };
const identity = {
  id: '00000000-0000-4000-8000-000000000001', name: 'Sample University', country: 'United Kingdom',
  city: 'London', region: 'England', website: 'https://example.edu', surveyRegion: 'UK', legacyFavoriteKeys: [],
};
const before = structuredClone(institution);
const mapped = mapData05Institution(institution, sources, identity);
assert(mapped.row, JSON.stringify(mapped.issues));
assert.deepEqual(institution, before, 'mapper must not mutate research data');

const row = mapped.row;
const p = row.catalog.programmes[0];
const recurring = row.catalog.programmes[1];
const native = row.catalog.programmes[2];
assert.equal(p.degree.value.award, null, 'unknown qualification award remains explicitly null');
assert.equal(p.route.status, 'published_unconfirmed');
assert.equal(p.route.value.entryPath, 'unknown');
assert.deepEqual(p.competitiveness.value, { category: 'extremely_selective', basis: 'Official self-description' });
assert.match(p.intake.value.text, /starts approximately Mid January, Mid August/);
assert.equal(p.academicRequirement.value, null, 'native conditions remain display-only');
assert.equal(p.languageRequirement.value, null, 'native language rules do not become evaluator rules');
assert(p.publicNotes.some(note => /IELTS overall minimum 6.5/.test(note.value)));
assert(p.publicNotes.some(note => /valid for 2 years as of 2026-01-15/.test(note.value)));
assert(p.publicNotes.some(note => /alternatives: TOEFL iBT 80/.test(note.value)));
assert(p.publicNotes.some(note => /Credential information: Qualification: Secondary education/.test(note.value)));
assert(p.publicNotes.some(note => /Application fee quote: Amount: 90; Currency: USD; Period: application/.test(note.value)));
assert(p.publicNotes.some(note => /Preparatory alternative: Route: Intensive English pathway/.test(note.value)));
assert(p.publicNotes.every(note => !note.value.includes('nativePolicyRef')));
assert.equal(p.languageThreshold.value.type, 'all');
assert.equal(p.languageThreshold.value.children[0].validityYears, 2);
assert.equal(p.languageThreshold.value.children[0].referenceDate, '2026-01-15');
assert.deepEqual(p.languageThreshold.value.children[0].sections, { listening: 6, writing: 6 });
assert.equal(p.languageThreshold.value.children[1].type, 'any');
assert.equal(p.tuition.value, null, 'historical amount is never current tuition');
assert.equal(p.tuition.historical.value.amount, 396.3);
assert.equal(p.tuition.historical.value.currency, 'USD');
assert.equal(p.tuition.historical.value.period, 'credit_hour');
assert.equal(p.tuition.historical.value.feeYear, '2026/27');
assert.equal(p.tuition.historical.value.label, 'Nonresident undergraduate base tuition; course and mandatory fees are additional.');
assert.equal(p.tuition.historical.value.annualCreditLoad, undefined, 'unknown credit load never becomes an annual estimate');
assert.equal(p.tuition.noticeCode, 'historical');
assert.equal(p.costReferences[0].value.period, 'credit_hour');
assert.equal(p.costReferences[1].value.period, '12_months');
assert.equal(p.costReferences[2].value.period, null);
assert.equal(p.costReferences[2].value.amount, null);
assert.equal(p.costReferences[2].value.feeYear, null);
assert.equal(p.deadline.value?.entries?.length, 3, JSON.stringify({ deadline: p.deadline, issues: mapped.issues }));
assert.deepEqual(p.deadline.value.entries.map(entry => entry.date), [
  '2026-09-15', '2026-11-01', '2027-04-15',
]);
assert.deepEqual(recurring.deadline.value.entries.map(entry => [entry.label, entry.date, entry.monthDay]), [
  ['fall', null, '03-01'], ['spring', null, '10-01'],
], 'recurring month/day values stay yearless');
assert.equal(native.tuition.status, 'unknown', 'an estimated total with alternatives does not become main tuition');
assert.equal(native.tuition.value, null);
assert.equal(native.costReferences.length, 2);
assert.equal(native.costReferences[0].status, 'historical_reference');
assert.equal(native.costReferences[0].historical.value.amount, 20100);
assert.equal(native.costReferences[0].historical.value.currency, 'USD');
assert.equal(native.costReferences[0].historical.value.period, 'academic_year_9_months');
assert.equal(native.costReferences[0].historical.value.feeYear, '2026/27');
assert.deepEqual(native.costReferences[0].historical.value.includedFees, ['Tuition', 'Fees']);
assert.match(native.costReferences[0].historical.value.label, /minimum 12 credits per semester; not exact Computer Science tuition/);
assert.equal(native.costReferences[1].historical.value.amount, 24900);
assert.equal(native.costReferences[1].historical.value.period, '12_months');
assert.equal(native.languageThreshold.status, 'unknown');
assert.equal(native.languageThreshold.applicability, 'unconfirmed');
assert.equal(native.languageThreshold.value, null);
assert.equal(native.languageThreshold.sourceIds[0], 'notes');
assert(native.publicNotes.some(note => note.value.includes('Language threshold: Exam: IELTS; Overall: 5.5')));
assert(native.publicNotes.some(note => note.value.includes('Old Scale Minimum: 59') && note.value.includes('New TEPS')));
assert(native.publicNotes.some(note => note.value.includes('Score Proof Scope: official score required for non-English-country applicants')));
assert.equal(native.languageRequirement.status, 'unknown');
assert.equal(native.languageRequirement.applicability, 'unconfirmed');
assert.deepEqual(native.languageRequirement.sourceIds, ['notes'], 'nativeFact sources take precedence over wrapper citations');
assert(native.publicNotes.some(note => note.value.includes('Language requirement: Exam: IELTS Academic; Overall: 6')));
assert(native.publicNotes.some(note => note.value.includes('Scholarship conditions: Name: Sample scholarship')));
assert(native.publicNotes.some(note => note.value.includes('First Semester Only: Yes')));
assert(native.publicNotes.some(note => note.value.includes('Guaranteed amount not stated')));
assert(native.publicNotes.some(note => note.value.includes('Certificate Original Or Certified Copy')));
assert(native.publicNotes.some(note => note.value.includes('Needs confirmation; see credential information')));
assert(native.publicNotes.some(note => note.value.includes('May Be Requested')));
assert(!JSON.stringify(row).includes('must not be copied'));
assert(!JSON.stringify(row).includes('nativePolicyRef'));
assert.equal(row.catalog.sources.identity.researcherAudit, undefined);

const adapted = adaptPublicCatalog([row]);
assert.equal(adapted.issues.length, 0, JSON.stringify(adapted.issues));
assert.equal(adapted.institutions.length, 1);
assert.equal(adapted.institutions[0].programmes[0].degree.value.award, null);
assert.equal(adapted.institutions[0].programmes[0].tuition.value, null);
assert.equal(adapted.institutions[0].programmes[0].tuition.historical.value.amount, 396.3);
assert.equal(adapted.institutions[0].programmes[0].tuition.historical.value.label,
  'Nonresident undergraduate base tuition; course and mandatory fees are additional.');
assert.equal(adapted.institutions[0].programmes[0].costReferences[0].value.period, 'credit_hour');
assert.equal(adapted.institutions[0].programmes[0].costReferences[2].value.period, null);
assert.deepEqual(adapted.institutions[0].programmes[1].deadline.value.entries[0], recurring.deadline.value.entries[0]);
assert.equal(adapted.institutions[0].programmes[2].tuition.status, 'unknown');
assert.equal(adapted.institutions[0].programmes[2].costReferences.length, 2);
assert.equal(adapted.institutions[0].programmes[2].costReferences[0].historical.value.amount, 20100);
assert.equal(adapted.institutions[0].programmes[2].languageThreshold.status, 'unknown');
assert.equal(adapted.institutions[0].programmes[2].languageThreshold.applicability, 'unconfirmed');
assert(adapted.institutions[0].programmes[2].publicNotes.some(note => note.value.includes('Exam: New TEPS; Minimum: 202')));

const second = mapData05Institution(institution, sources, identity);
assert.equal(row.catalog.revision, second.row.catalog.revision, 'revision hash is stable');
const mapSources = mapData05Institution(institution, { ...sources, sources: new Map(Object.entries(sources.sources)) }, identity);
assert.equal(row.catalog.revision, mapSources.row.catalog.revision, 'Map-backed source dictionaries preserve the same public output');
const incomplete = mapData05Institution(institution, { sources: sources.sources, checkedAt: sources.checkedAt }, identity);
assert.equal(incomplete.row, null, 'missing target year must fail closed');
assert(incomplete.issues.some(issue => issue.code === 'missing_target_intake_year'));

const historicalNotesInput = structuredClone(institution);
const historicalNote = value => fact(null, 'historical_reference', ['history'], {
  historical: { value, referenceSeason: '2026/27', sourceIds: ['history'], checkedAt: '2026-10-18' },
});
historicalNotesInput.programmes[0].academicRequirement.nativeFacts = historicalNote({ minimumPercent: 60 });
historicalNotesInput.programmes[0].languageRequirement.nativeFacts = historicalNote({ exam: 'IELTS Academic', overall: 5.5, validityYears: 2 });
historicalNotesInput.programmes[0].scholarships = historicalNote({ name: 'Conditional scholarship', ifAwarded: true, guaranteed: false, maySubtractFromBase: false });
historicalNotesInput.programmes[0].deadline = fact({ timezone: 'Asia/Seoul', round: { opens: '2026-10-22', closes: '2026-11-13', time: '17:00' }, originals: { from: '2026-12-23', to: '2027-01-05', time: '16:00' } });
const historicalNotes = mapData05Institution(historicalNotesInput, sources, identity).row.catalog.programmes[0].publicNotes;
assert(historicalNotes.some(note => note.historical?.value.includes('Minimum Percent: 60')));
assert(historicalNotes.some(note => note.historical?.value.includes('Overall: 5.5') && note.historical.value.includes('Validity Years: 2')), 'different historical notes cannot be deduplicated by their shared null current value');
assert(historicalNotes.some(note => note.historical?.value.includes('Conditional scholarship') && note.historical.value.includes('Guaranteed: No') && note.historical.value.includes('May Subtract From Base: No')));
const mappedDates = mapData05Institution(historicalNotesInput, sources, identity).row.catalog.programmes[0].deadline.value.entries;
assert.deepEqual(mappedDates.map(entry=>[entry.date,entry.time]), [['2026-10-22',null],['2026-11-13','17:00'],['2026-12-23',null],['2027-01-05','16:00']], 'closing cutoffs never become invented opening times');

console.log('DATA-05 research mapper checks passed');
