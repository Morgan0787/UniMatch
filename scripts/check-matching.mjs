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
import {
  VERDICT,
  calculateChance,
  calculateMatchScore,
  describeMissingChanceData,
  hasCostData,
  hasGpaData,
} from '../src/lib/matching.js';

// A College Scorecard row: no published GPA cutoff, no published IELTS band.
const US_NO_GPA = { country: 'United States', min_gpa: null, required_ielts: null };
const US_WITH_GPA = { country: 'United States', min_gpa: 3.5, required_ielts: null };
const GERMANY = { country: 'Germany', min_gpa: 3.5, required_ielts: 7.0 };
// Standard branch with a published GPA cutoff and no published IELTS band.
const GERMANY_NO_IELTS = { country: 'Germany', min_gpa: 3.5, required_ielts: null };
const KOREA_TOPIK = { country: 'South Korea', topikLevel: 'TOPIK 4', min_gpa: 3.0, required_ielts: null };

// --- calculateMatchScore fixtures -----------------------------------------
//
// `calculateMatchScore` blends ten weighted terms against a `maxScore` that is
// fixed at 110 (25 GPA + 20 IELTS + 18 budget + 20 country + 10 degree + 7
// ranking + 5 international students + 5 acceptance rate) while the two 5-point
// bonuses sit outside that total. So its ratio is not bounded by construction
// and needs the `Math.min(100, ...)` clamp, pinned in M10.
//
// Every expected percentage below is that exact term sum over 110, rounded, so
// a changed weight, band or bonus cannot pass unnoticed. `maxScore` is fixed at
// 110 on every path — no term is ever skipped from the denominator, only from
// the numerator, which is why a missing dimension always lowers the percentage.
//
// ALL_KNOWN is the reference row: it earns every term it is able to earn.
//    25 GPA           3.8 - 3.0 = 0.8 >= 0.5
//  + 20 IELTS         7.5 >= 6.5 + 0.5
//  + 18 budget        10,000 + 10,000 = 20,000 <= 30,000 * 0.8
//  + 10 country       preferred, default 50% weight -> 20 * 50 / 100
//  + 10 degree        target_degree is in degree_levels
//  +  7 ranking       20 <= 50
//  +  5 intl students 30 >= 20
//  +  5 acceptance    65 is inside the 60-80 sweet spot
//  +  5 scholarship bonus + 5 international-support bonus
//  = 110 / 110 -> 100
const ALL_KNOWN = {
  country: 'Germany',
  min_gpa: 3.0,
  required_ielts: 6.5,
  tuition_min: 10000,
  living_cost_estimate: 10000,
  degree_levels: ["Bachelor's"],
  ranking: 20,
  international_students_percent: 30,
  acceptance_rate: 65,
  scholarships_available: true,
  international_support: { international_office: true, orientation_program: true },
};

const STRONG_STUDENT = {
  gpa: 3.8,
  english_proficiency: 7.5,
  budget_max: 30000,
  target_degree: "Bachelor's",
  preferred_countries: ['Germany'],
};

// A row that clears the published 3.0 cutoff and the 6.5 band but is mid-table,
// mid-table on diversity, and publishes no international-support object.
//   25 + 20 + 18 + 10 + 10 + 5 (ranking 80 <= 100) + 3 (12% >= 10)
//     + 5 (acceptance 65) + 5 (scholarship) + 0 = 101 -> 92
const GOOD_MATCH = { ...ALL_KNOWN, ranking: 80, international_students_percent: 12, international_support: null };

// A row the student misses on every axis: below the cutoff by 0.8, 2.0 below the
// published IELTS band, over budget by 2.5x, wrong degree, unranked tail.
//   0 GPA + 0 IELTS + 0 budget + 10 country (preferred) + 5 degree
//     + 1 (ranking 500) + 2 (3% intl) + 2 (acceptance 12) = 20 -> 18
const NO_MATCH = {
  ...ALL_KNOWN,
  min_gpa: 3.8,
  required_ielts: 7.5,
  tuition_min: 30000,
  living_cost_estimate: 20000,
  degree_levels: ["Master's"],
  ranking: 500,
  international_students_percent: 3,
  acceptance_rate: 12,
  scholarships_available: false,
  international_support: null,
};
const WEAK_STUDENT = {
  gpa: 3.0,
  english_proficiency: 5.5,
  budget_max: 20000,
  target_degree: "Bachelor's",
  preferred_countries: ['Germany'],
};

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

console.log('calculateMatchScore');

test('M1. a university that publishes no min_gpa scores null, while the same row with a cutoff scores', () => {
  assert.equal(calculateMatchScore({ ...ALL_KNOWN, min_gpa: null }, STRONG_STUDENT), null);
  assert.equal(calculateMatchScore({ ...ALL_KNOWN, min_gpa: undefined }, STRONG_STUDENT), null);
  // Control on this exact fixture: the row and the student are scorable, so M1
  // discriminates on the missing cutoff rather than on a fixture that can never
  // score. Same university, same profile, only `min_gpa` supplied -> 110/110.
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT), 100);
});

test('M2. a student who has not given a GPA scores null, and a GPA of 0 counts as no GPA', () => {
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, gpa: undefined }), null);
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, gpa: null }), null);
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, gpa: 0 }), null);
  // Control on this exact fixture: the university publishes its cutoff, so the
  // university-side guard cannot fire and M2 fails only for the student side.
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT), 100);
});

// Nine of the ten terms contribute on this row (the international-support bonus
// is the tenth and earns nothing, the row publishes no support object):
// 25 + 20 + 18 + 10 + 10 + 5 (ranking 80 <= 100) + 3 (12% >= 10)
//   + 5 (acceptance 65) + 5 (scholarship) = 101 of 110 -> 91.8 -> 92.
// `null` is not an option here and 0 is not: the assertion names the exact
// number the terms produce.
test('M3. a row the student genuinely matches scores 92 (101 of 110)', () => {
  assert.equal(calculateMatchScore(GOOD_MATCH, STRONG_STUDENT), 92);
});

test('M4. a row the student genuinely does not match scores 18 (20 of 110)', () => {
  assert.equal(calculateMatchScore(NO_MATCH, WEAK_STUDENT), 18);
});

// The audit's case. Same row and student as M1's control, which scores 100 with
// the full 20 for IELTS. With no published band there is nothing to compare 7.5
// against, so the term earns 0 and the total is 110 - 20 = 90 of 110.
//   correct:                      90 / 110 = 81.8 -> 82
//   unknown band restored to 20: 110 / 110 = 100.0 -> 100
// 82 and 100 are eighteen points apart, so this pins the award itself rather
// than a floor that both behaviours clear.
test('M5. an unpublishped IELTS requirement earns 0 for that term, not a full award (90 of 110, 82)', () => {
  assert.equal(calculateMatchScore({ ...ALL_KNOWN, required_ielts: null }, STRONG_STUDENT), 82);
  assert.equal(calculateMatchScore({ ...ALL_KNOWN, required_ielts: undefined }, STRONG_STUDENT), 82);
});

// The symmetry M5's comment above used to be violated by: an unknown *student*
// score used to earn 10 while an unknown *requirement* earned 20, so missing
// data on our side outscored missing data on theirs. Both now earn 0, taking
// ALL_KNOWN from 110 to the same 90 of 110 that M5 reaches.
// `english_proficiency: null` is a third route to the same 0 that is worth
// pinning: `null !== undefined` so it enters the comparison branch, and then no
// comparison against a required band is true, so nothing is added.
test('M6. an unknown student IELTS earns 0 too, so an unknown never outscores an unknown (90 of 110, 82)', () => {
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, english_proficiency: undefined }), 82);
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, english_proficiency: null }), 82);
  // A known shortfall must not be worth less than an unknown. 5.5 against the
  // published 6.5 is 1.0 below, below even the -0.5 band, so it earns 0 — the
  // same 0 the unknown above earns.
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, english_proficiency: 5.5 }), 82);
});

// Budget fixtures sit in France so the country term is the reduced 5 * 50 / 100
// = 2.5, which keeps this group's numbers clear of the 82 the IELTS groups use.
// With both cost inputs known the row takes the full 18, and with no budget_max
// it takes the neutral 9, so the two expectations differ by exactly the budget
// term.
//   both cost inputs known, budget 30,000: 25 + 20 + 18 + 2.5 + 10 + 7 + 5 + 5
//     + 5 + 5 = 102.5 -> 93.2 -> 93
//   no budget_max:                        25 + 20 +  9 + 2.5 + 10 + 7 + 5 + 5
//     + 5 + 5 =  93.5 -> 85.0 -> 85
//   tuition unknown:                      25 + 20 +  0 + 2.5 + 10 + 7 + 5 + 5
//     + 5 + 5 =  84.5 -> 76.8 -> 77
const FRENCH = { ...ALL_KNOWN, country: 'France', tuition_min: null, living_cost_estimate: 10000 };
const FRENCH_PAID = { ...ALL_KNOWN, country: 'France', tuition_min: 10000, living_cost_estimate: 10000 };

test('M7. unknown cost data earns 0 for the budget term instead of scoring against a defaulted total (77)', () => {
  assert.equal(calculateMatchScore(FRENCH, { ...STRONG_STUDENT, preferred_countries: [] }), 77);
  assert.equal(
    calculateMatchScore({ ...ALL_KNOWN, country: 'France', tuition_min: 10000, living_cost_estimate: null },
      { ...STRONG_STUDENT, preferred_countries: [] }),
    77,
  );
  // Control: with both cost inputs present the same row takes the full 18 and
  // reads 93. The old `(tuition_min || 0) + (living_cost_estimate || 8000)`
  // made the two rows above identical to this one — a defaulted 0 + 10,000 or
  // 10,000 + 8,000 total is still under the 24,000 threshold, so all three read
  // 93 and a missing cost was worth full marks.
  assert.equal(calculateMatchScore(FRENCH_PAID, { ...STRONG_STUDENT, preferred_countries: [] }), 93);
});

test('M8. an unknown student budget earns half credit (9 of 18), not a full award and not zero (85)', () => {
  const noBudget = { ...STRONG_STUDENT, budget_max: undefined, preferred_countries: [] };
  assert.equal(calculateMatchScore(FRENCH_PAID, noBudget), 85);
  assert.equal(calculateMatchScore(FRENCH_PAID, { ...STRONG_STUDENT, preferred_countries: [] }), 93);
});

// ranking, acceptance_rate and international_students_percent absent. Each
// awards 2 of its own term rather than nothing, which lowers the percentage
// instead of inflating it — the opposite of the GPA/IELTS/cost rules, and
// deliberately so: these are small preferences, not admission requirements.
//   0 GPA + 0 IELTS + 0 budget + 2.5 country (not preferred, 50% weight) + 5
//     degree + 2 ranking + 2 intl + 2 acceptance = 13.5 -> 12.3 -> 12
// The three are asserted together on purpose: a single 1-2 point term out of
// 110 is under 2% and the rounding absorbs it, so no percentage assertion can
// isolate one of them. Moving all three to 0 gives 11.5 -> 10 and to 5 gives
// 16.5 -> 15, both off this number.
test('M9. absent ranking, acceptance rate and international-student share earn minimal credit (12)', () => {
  const absent = {
    ...NO_MATCH,
    ranking: null,
    international_students_percent: null,
    acceptance_rate: null,
  };
  assert.equal(calculateMatchScore(absent, { ...WEAK_STUDENT, preferred_countries: [] }), 12);
  // Control: the same row with all three published scores 1 + 5 + 4 = 10 of
  // those terms instead of 2 + 2 + 2, so 17.5 -> 15.9 -> 16. The fixture does
  // discriminate.
  assert.equal(
    calculateMatchScore({ ...absent, ranking: 500, international_students_percent: 30, acceptance_rate: 55 },
      { ...WEAK_STUDENT, preferred_countries: [] }),
    16,
  );
});

// The pre-existing overflow: maxScore is 110 and the bonuses can add 10, so a
// fully-matching row on a fully-weighted country reaches 120 / 110 = 109.1.
// 109 is a renderable percentage, so the clamp is load-bearing, not cosmetic.
//   clamped:   min(100, round(120 / 110 * 100)) = min(100, 109) = 100
//   unclamped:                                            109
test('M10. the score never exceeds 100 even when every term and both bonuses apply (109 raw, clamped to 100)', () => {
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT, { Germany: 100 }), 100);
  // Same fixture at the default weight is exactly 110/110, so this assertion
  // cannot pass on the clamp's account alone.
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT), 100);
});

// Country term = 20 * weight / 100 for a preferred country, 5 * weight / 100
// otherwise, against a default weight of 50 when the caller supplies none.
//   preferred, weight 40:  25 + 20 + 18 +  8 + 10 + 7 + 5 + 5 + 10 = 108 -> 98
//   not preferred, 40:     25 + 20 + 18 +  2 + 10 + 7 + 5 + 5 + 10 = 102 -> 93
//   preferred, no weight:                                            110 -> 100
// 98, 93 and 100 are three different numbers, so the weight and the
// preferred/non-preferred split are both pinned by exact value. Weights above 50
// cannot be told apart from each other: 60 already reaches 112/110 = 102 and
// clamps, which is what M10 pins.
test('M11. countryWeights scales the country term, and an unweighted country falls back to 50%', () => {
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT, { Germany: 40 }), 98);
  assert.equal(calculateMatchScore(ALL_KNOWN, STRONG_STUDENT, {}), 100);
  assert.equal(calculateMatchScore(ALL_KNOWN, { ...STRONG_STUDENT, preferred_countries: [] }, { Germany: 40 }), 93);
});

test('M12. hasCostData is false when either cost input is missing and true when both are present', () => {
  assert.equal(hasCostData({ tuition_min: null, living_cost_estimate: 10000 }), false);
  assert.equal(hasCostData({ tuition_min: 10000, living_cost_estimate: null }), false);
  assert.equal(hasCostData({ tuition_min: undefined, living_cost_estimate: undefined }), false);
  assert.equal(hasCostData({ tuition_min: 0, living_cost_estimate: 0 }), true);
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
