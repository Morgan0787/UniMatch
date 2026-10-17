import assert from 'node:assert/strict';
import { OPTIONS, CATALOG_ISSUES } from '../src/lib/admissions/catalog.js';
import { emptyAnswers, evaluateAnswers, validateAnswers } from '../src/lib/admissions/evaluate.js';
import { admissionCopy } from '../src/components/admissions/copy.js';

assert.ok(OPTIONS.length >= 2, 'retain the original researched candidates');
assert.deepEqual(CATALOG_ISSUES, [], 'research package must adapt without silent drops');
assert.equal(new Set(OPTIONS.map(option => option.id)).size, OPTIONS.length);
for (const option of OPTIONS) {
  assert.ok(option.institutionId && option.university && option.name && option.fields.length);
  assert.ok(['direct', 'unknown', 'foundation'].includes(option.entryPath));
  const keys = new Set(option.sources.map(source => source.key));
  assert.equal(keys.size, option.sources.length);
  assert.ok(keys.has(option.routeSourceKey));
  for (const source of option.sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(!/example\.(test|com)|synthetic/i.test(url.hostname), 'synthetic fixtures must not enter the real catalogue');
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(source.scope && source.title);
  }
  const inspect = rule => {
    if (!rule) return;
    if (rule.verified === true && ['grade', 'ielts'].includes(rule.type)) assert.ok(keys.has(rule.sourceKey), option.id + ': numerical comparison needs a source');
    for (const child of rule.children || []) inspect(child);
  };
  [option.academicRequirement, option.languageRequirement, option.languageThreshold].forEach(inspect);
}
const blank = emptyAnswers();
const scoped = { ...emptyAnswers(), schoolCountry: 'Uzbekistan', credential: 'Professional College Diploma', grade: '80', scale: '100' };
const uwe = OPTIONS.find(option => option.id === 'gb-uwe-computer-science');
assert.equal(evaluateAnswers(scoped, [uwe]).results.length, 0, 'known original-scale academic shortfall must affect fallback');
assert.ok(evaluateAnswers(scoped, [uwe]).alternatives[0].reasons.some(reason => reason.code === 'GRADE_THRESHOLD_BELOW'));
assert.equal(evaluateAnswers({ ...scoped, grade: '90' }, [uwe]).results[0].academicStatus, 'unknown', 'country minimum does not establish all subject/credential conditions');
assert.equal(evaluateAnswers({ ...scoped, credential: 'Unknown school certificate' }, [uwe]).results[0].academicStatus, 'unknown', 'a generic foundation offer is not proof this credential requires foundation');
const asu = OPTIONS.find(option => option.id === 'asu-tempe-computer-science');
const wrongCredential = evaluateAnswers({ ...scoped, grade: '2', scale: '5' }, [asu]);
assert.ok(!wrongCredential.results[0].reasons.some(reason => reason.code === 'GRADE_THRESHOLD_BELOW'), 'do not drop a credential scope while adapting native policy');
const uk = evaluateAnswers({ ...emptyAnswers(), regions: ['UK'] });
assert.equal(uk.results.length, 4, 'DATA-03 has four ordinary UK institutions; foundation is not a fifth');
assert.equal(uk.topCount, 0);
assert.equal(evaluateAnswers({ ...emptyAnswers(), regions: ['UK'], exam: 'IELTS', score: '5.5' }).results.length, 0);
assert.equal(OPTIONS.find(option => option.id === 'hu-pecs-business-administration').tuition.period, 'semester', 'never annualise the published semester fee');
const before = structuredClone(blank);
const broad = evaluateAnswers(blank);
assert.deepEqual(blank, before);
assert.equal(broad.mode, 'explore');
assert.equal(broad.topCount, 0);
const visible = [...broad.results, ...broad.alternatives];
assert.ok(visible.length <= 5);
assert.equal(new Set(visible.map(row => row.option.institutionId)).size, visible.length);
assert.ok(visible.every(row => row.outcome === 'unknown'));
assert.ok(visible.every(row => row.option.entryPath !== 'foundation'), 'no hidden foundation replacement');
assert.ok(broad.results.every(row => row.requirementStatus !== 'unmet' && row.languageStatus !== 'unmet' && row.academicStatus !== 'unmet' && row.budgetStatus !== 'unmet' && !row.requiresClarification));
assert.deepEqual(broad, evaluateAnswers(blank, [...OPTIONS].reverse()));
for (const region of ['UK', 'Europe', 'USA', 'South Korea', 'Canada']) {
  const result = evaluateAnswers({ ...emptyAnswers(), regions: [region] });
  assert.ok([...result.results, ...result.alternatives].every(row => row.option.region === region));
}
for (const field of ['business', 'it', 'computer_engineering', 'software_engineering', 'computer_science', 'other']) {
  const result = evaluateAnswers({ ...emptyAnswers(), field });
  assert.ok([...result.results, ...result.alternatives].every(row => row.option.fields.includes(field)));
}
const turku = OPTIONS.find(option => option.id === 'turku-se-software-engineering');
assert.ok(turku);
assert.equal(turku.tuition.amount, 12000);
assert.equal(turku.tuition.currency, 'EUR');
const low = evaluateAnswers({ ...emptyAnswers(), field: 'software_engineering', exam: 'IELTS', score: '5.5' }, [turku]);
assert.equal(low.results.length, 0);
assert.equal(low.alternatives.length, 1);
assert.equal(low.alternatives[0].outcome, 'unknown');
assert.ok(low.alternatives[0].reasons.some(reason => reason.code === 'LANGUAGE_BELOW_PUBLISHED_THRESHOLD'));
assert.equal(evaluateAnswers({ ...emptyAnswers(), grade: '4' }, [turku]).results[0].academicStatus, 'unknown');
assert.equal(evaluateAnswers({ ...emptyAnswers(), budget: '12000', currency: 'UZS' }, [turku]).results[0].budgetStatus, 'unknown');
for (const score of ['Infinity', '-1', '9.5', '6.1']) assert.equal(validateAnswers({ ...emptyAnswers(), exam: 'IELTS', score }).score, 'score_invalid');
for (const budget of ['Infinity', '-1', 'not a number']) assert.equal(validateAnswers({ ...emptyAnswers(), budget }).budget, 'budget_invalid');
assert.equal(validateAnswers({ ...emptyAnswers(), grade: '5.1', scale: '5' }).grade, 'grade_invalid');
assert.equal(validateAnswers({ ...emptyAnswers(), examDate: '2026-02-31' }).examDate, 'examDate_invalid');
assert.deepEqual(validateAnswers({ ...emptyAnswers(), exam: 'not_taken' }), {});
const profiles = [blank,
  { ...emptyAnswers(), exam: 'IELTS', score: '5.5', budget: '0', currency: 'EUR' },
  { ...emptyAnswers(), exam: 'IELTS', score: '6.5', grade: '4', scale: '5', budget: '50000', currency: 'USD', examDate: '2026-09-01' },
  { ...emptyAnswers(), exam: 'TOEFL', score: '80', budget: '12000', currency: 'UZS', scholarship: 'required', startYear: '2028', language: 'Korean' },
];
for (const copy of Object.values(admissionCopy)) {
  for (const profile of profiles) {
    for (const option of OPTIONS) {
      const result = evaluateAnswers(profile, [option]);
      for (const row of [...result.results, ...result.alternatives]) for (const reason of row.reasons) assert.ok(copy.reasons[reason.code], 'Missing reason ' + reason.code);
    }
  }
}
console.log('Real catalogue checks passed: ' + OPTIONS.length + ' programmes, sourced units, strict filters, distinct institutions, honest unknowns and translated explanations.');
