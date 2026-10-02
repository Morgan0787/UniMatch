/**
 * check-matching.mjs
 *
 * Standalone assertions for src/lib/matching.js.
 *
 * This repo has no test runner, and src/lib/** is excluded from both ESLint
 * (eslint.config.js ignores) and TypeScript (jsconfig.json exclude), so this
 * file is the only automated guard on the admission-chance scoring. Run it:
 *
 *   node scripts/check-matching.mjs
 *
 * Must resolve under bare Node: relative imports only, no `@/` alias.
 */

import assert from 'node:assert/strict';
import { US_GPA_HOLISTIC_NOTE } from '../src/lib/usGenericInfo.js';
import { VERDICT, calculateChance, describeMissingChanceData, hasGpaData } from '../src/lib/matching.js';

// A College Scorecard row: no published GPA cutoff, no published IELTS band.
const US_NO_GPA = { country: 'United States', min_gpa: null, required_ielts: null };
const US_WITH_GPA = { country: 'United States', min_gpa: 3.5, required_ielts: null };
const GERMANY = { country: 'Germany', min_gpa: 3.5, required_ielts: 7.0 };
const KOREA_TOPIK = { country: 'South Korea', topikLevel: 'TOPIK 4', min_gpa: 3.0, required_ielts: null };

const failures = [];

function test(name, run) {
  try {
    run();
    console.log(`  pass  ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  FAIL  ${name}`);
  }
}

// Contract on the public string surface. Every other assertion in this file
// compares through `VERDICT.*`, so a rename of any value here would leave them
// all green while `ChanceIndicator` — which keys its config off these literals
// rather than importing them — stopped matching and fell back to the neutral
// "unknown" badge. `src/lib/**` and `ChanceIndicator.jsx` are both excluded
// from ESLint and tsc, so these four assertions are the only gate on the
// spelling of these strings. Numbered `V` to leave the 1-11 behaviour
// assertions untouched.
console.log('VERDICT string surface');

test('V1. VERDICT.HIGH is the literal "high"', () => {
  assert.equal(VERDICT.HIGH, 'high');
});

test('V2. VERDICT.MEDIUM is the literal "medium"', () => {
  assert.equal(VERDICT.MEDIUM, 'medium');
});

test('V3. VERDICT.LOW is the literal "low"', () => {
  assert.equal(VERDICT.LOW, 'low');
});

test('V4. VERDICT.UNKNOWN is the literal "unknown"', () => {
  assert.equal(VERDICT.UNKNOWN, 'unknown');
});

console.log('calculateChance');

test('1. US row with min_gpa null returns UNKNOWN, not a fabricated chance', () => {
  assert.equal(calculateChance(US_NO_GPA, 3.9), VERDICT.UNKNOWN);
});

test('2. a strong IELTS does not rescue a US row with min_gpa null', () => {
  assert.equal(calculateChance(US_NO_GPA, 4.0, 7.5), VERDICT.UNKNOWN);
});

test('3. US row WITH a published min_gpa still scores HIGH (no over-correction)', () => {
  assert.equal(calculateChance(US_WITH_GPA, 3.9), VERDICT.HIGH);
});

test('4. GPA well below the cutoff on an IELTS-required row is LOW', () => {
  assert.equal(calculateChance(GERMANY, 3.2), VERDICT.LOW);
});

// Fixture 5 needs a userIelts to be reachable: with no userIelts the row scores
// 40.2 GPA points + 0 IELTS = 40.2, which is LOW, not the MEDIUM the brief
// specifies. 6.5 is the lowest band that lands the total in [50, 80).
test('5. GPA inside the tolerance band with a near-miss IELTS is MEDIUM', () => {
  assert.equal(calculateChance(GERMANY, 3.45, 6.5), VERDICT.MEDIUM);
});

test('6. Korean row with topikLevel keeps scoring (50 GPA + 30 TOPIK + 20 IELTS)', () => {
  assert.equal(calculateChance(KOREA_TOPIK, 3.5, undefined, 'TOPIK 5'), VERDICT.HIGH);
});

test('7. a student without a GPA gets UNKNOWN, not the old fabricated medium', () => {
  assert.equal(calculateChance(US_NO_GPA, 0), VERDICT.UNKNOWN);
  assert.equal(calculateChance(US_NO_GPA, null), VERDICT.UNKNOWN);
  assert.equal(calculateChance(US_NO_GPA, undefined), VERDICT.UNKNOWN);
});

console.log('hasGpaData');

test('8. hasGpaData is false for null/undefined and true for a real cutoff', () => {
  assert.equal(hasGpaData({ min_gpa: null }), false);
  assert.equal(hasGpaData({ min_gpa: undefined }), false);
  assert.equal(hasGpaData({ min_gpa: 3.5 }), true);
});

console.log('describeMissingChanceData');

test('9. a US row with no min_gpa reuses the shared holistic note verbatim', () => {
  const missing = describeMissingChanceData(US_NO_GPA);
  assert.equal(missing.code, 'us-holistic');
  assert.equal(missing.note, US_GPA_HOLISTIC_NOTE);
});

test('10. a non-US row with no min_gpa gets a no-gpa-published note', () => {
  const missing = describeMissingChanceData({ country: 'Germany', min_gpa: null });
  assert.equal(missing.code, 'no-gpa-published');
  assert.equal(typeof missing.note, 'string');
  assert.ok(missing.note.length > 0, 'note must not be empty');
});

test('11. a row with a published min_gpa needs no explanation', () => {
  assert.equal(describeMissingChanceData({ country: 'Germany', min_gpa: 3.5 }), null);
});

if (failures.length > 0) {
  console.log(`\n${failures.length} assertion group(s) failed:\n`);
  for (const { name, error } of failures) {
    console.log(`  ${name}`);
    console.log(`    ${error.message.split('\n').join('\n    ')}`);
  }
  process.exit(1);
}

console.log('\nAll 15 assertion groups passed.');
