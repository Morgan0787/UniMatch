/**
 * check-matching.mjs
 *
 * Standalone assertions for src/lib/matching.js.
 *
 * This repo has no test runner, and ESLint applies no rules to src/lib/**
 * (its config globs never match those paths), so this file is the only
 * automated guard on the admission-chance scoring. TypeScript does check
 * src/lib/** via imports, but it reports types, not behaviour. Run it:
 *
 *   npm run check:matching
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
// Standard branch with a published GPA cutoff and no published IELTS band.
const GERMANY_NO_IELTS = { country: 'Germany', min_gpa: 3.5, required_ielts: null };
const KOREA_TOPIK = { country: 'South Korea', topikLevel: 'TOPIK 4', min_gpa: 3.0, required_ielts: null };

const failures = [];
let total = 0;

function test(name, run) {
  total++;
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
// "unknown" badge. ESLint applies no rules to either path, and nothing pins the
// label strings `ChanceIndicator` looks up, so these four assertions are the only
// gate on the spelling of these strings. Numbered `V` to leave the 1-14
// behaviour assertions untouched.
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

// "No over-correction" means the row is scorable, never that it is confident:
// 3.9 - 3.5 = 0.4 earns the full 60 GPA points, but the row publishes no IELTS
// band, so the language term earns 0 (assertions 6 and 7 pin that) and 60 is
// MEDIUM. While the unknown band still collected a full award this was
// 60 + 40 = 100 and HIGH — the null band was buying a confident verdict.
test('3. US row WITH a published min_gpa is scorable, not UNKNOWN (60 GPA + 0 unverified IELTS = 60, MEDIUM)', () => {
  assert.equal(calculateChance(US_WITH_GPA, 3.9), VERDICT.MEDIUM);
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

// Band-straddling fixture for the Korean branch. Both sides of the language
// comparison are unusable in different ways: the university publishes no IELTS
// band, and the student holds exactly the TOPIK level the university asks for,
// which awards 25 rather than 30. The GPA term is unambiguous: 3.9 - 3.0 = 0.9
// is well past the +0.3 tolerance, so the full 50.
//   correct:            50 (GPA) + 25 (TOPIK exact) + 0 (unverified IELTS) = 75 -> MEDIUM
//   unknown band restored:                             50 + 25 + 20      = 95 -> HIGH
// 75 and 95 sit on opposite sides of the `>= 80` bar, so this pins the award
// rather than enforcing a floor that both behaviours clear.
test('6. Korean row with no published IELTS band earns no language credit (50 + 25 + 0 = 75, MEDIUM)', () => {
  assert.equal(calculateChance(KOREA_TOPIK, 3.9, undefined, 'TOPIK 4'), VERDICT.MEDIUM);
});

// Band-straddling fixture for the standard branch. The student holds a strong
// 7.5 IELTS and clears the published 3.5 cutoff by 0.4, so the GPA term earns
// the full 60 — but the university publishes no band, so there is nothing to
// clear and the language term earns 0.
//   correct:            60 (GPA) + 0 (unverified IELTS) = 60 -> MEDIUM
//   unknown band restored:      60 + 40                  = 100 -> HIGH
// The strong student score cannot rescue it: this term is a comparison, and a
// comparison needs something on the other side of it.
test('7. Standard row with no published IELTS band earns no language credit even from a strong student IELTS (60 + 0 = 60, MEDIUM)', () => {
  assert.equal(calculateChance(GERMANY_NO_IELTS, 3.9, 7.5), VERDICT.MEDIUM);
});

// Keeps the coverage the old assertion 6 gave: a Korean row whose TOPIK level
// clears the requirement by one level still reaches HIGH (50 + 30 + 0 = 80).
// This pins the TOPIK award only, and deliberately says nothing about the
// language term — 80 sits exactly on the `>= 80` boundary, so the restored
// unknown-band award (100) would return HIGH too. Assertions 6 and 7 carry that
// pin; this one cannot.
test('8. Korean row one TOPIK level above the requirement is still HIGH (50 + 30 + 0 = 80)', () => {
  assert.equal(calculateChance(KOREA_TOPIK, 3.5, undefined, 'TOPIK 5'), VERDICT.HIGH);
});

// Pins the `!userGpa` guard on its own. This fixture publishes a 3.5 cutoff, so
// the second guard in `calculateChance` (`!hasGpaData`) cannot fire: with the
// first guard deleted these rows score 0.33 * 60 = 19.8 GPA points plus 40 for
// the published 7.0 band they clear, i.e. 59.8 -> MEDIUM, and this assertion
// fails. The previous version of this test used a university whose min_gpa was
// also null, so that second guard answered instead and deleting the first guard
// left every group in this file green.
test('9. a student with no GPA gets UNKNOWN even when the university does publish a cutoff', () => {
  assert.equal(calculateChance(GERMANY, undefined, 7.5), VERDICT.UNKNOWN);
  assert.equal(calculateChance(GERMANY, null, 7.5), VERDICT.UNKNOWN);
  assert.equal(calculateChance(GERMANY, 0, 7.5), VERDICT.UNKNOWN);
});

// Control on assertion 9's fixture: the row is scorable when the student has a
// GPA, so 9 fails because the student side is missing and not because this
// fixture can never be scored. 3.9 - 3.5 = 0.4 earns the full 60 GPA points and
// 7.5 clears the published 7.0 band for 40, so the total is 100 -> HIGH.
test('10. the same fixture with a real student GPA is scorable, so 9 discriminates on the GPA', () => {
  assert.notEqual(calculateChance(GERMANY, 3.9, 7.5), VERDICT.UNKNOWN);
  assert.equal(calculateChance(GERMANY, 3.9, 7.5), VERDICT.HIGH);
});

console.log('hasGpaData');

test('11. hasGpaData is false for null/undefined and true for a real cutoff', () => {
  assert.equal(hasGpaData({ min_gpa: null }), false);
  assert.equal(hasGpaData({ min_gpa: undefined }), false);
  assert.equal(hasGpaData({ min_gpa: 3.5 }), true);
});

console.log('describeMissingChanceData');

test('12. a US row with no min_gpa reuses the shared holistic note verbatim', () => {
  const missing = describeMissingChanceData(US_NO_GPA);
  assert.equal(missing.code, 'us-holistic');
  assert.equal(missing.note, US_GPA_HOLISTIC_NOTE);
});

test('13. a non-US row with no min_gpa gets a no-gpa-published note', () => {
  const missing = describeMissingChanceData({ country: 'Germany', min_gpa: null });
  assert.equal(missing.code, 'no-gpa-published');
  assert.equal(typeof missing.note, 'string');
  assert.ok(missing.note.length > 0, 'note must not be empty');
});

test('14. a row with a published min_gpa needs no explanation', () => {
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

// Counted by the harness above, so this line cannot drift out of step with the
// assertions actually run.
console.log(`\nAll ${total} assertion groups passed.`);
