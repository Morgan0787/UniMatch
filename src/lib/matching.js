/**
 * matching.js
 *
 * Pure, framework-free admission-chance scoring. Every surface that ranks a
 * university against a student's GPA / IELTS / TOPIK now shares this one
 * implementation, so the verdict cannot drift between them: UniversityCard,
 * UniversityDetailModal, ComparisonModal, Search, Profile and Recommendations
 * all import it.
 *
 * This module also owns the second, older admission-scoring encoding:
 * `calculateMatchScore`, a weighted 0-100 blend that Recommendations renders as
 * "Good match · 72%" next to the verdict above. It lived inside
 * `src/pages/Recommendations.jsx` until it moved here, because a `.jsx` page
 * cannot be loaded by bare Node, which left it with no automated coverage at
 * all — see scripts/check-matching.mjs, which now asserts it.
 *
 * That encoding's country term defaults to a 100% weight, which is the default
 * Recommendations *displays* (`countryWeights[country] || 100`). The two agree
 * on purpose: an untouched country used to score at 50% while the UI showed it
 * at 100%, so the percentage on the card was not the weighting the sliders
 * describe. The `||` is deliberate too, so a slider at 0 falls back the same way
 * in the scorer as in the display.
 *
 * The module also owns `isGpaFit`, the "GPA fit" badge on a Recommendations
 * card. That badge and `calculateMatchScore`'s full GPA band are one judgment at
 * one boundary — the band awards full points at `gpaDiff >= 0`, which is exactly
 * `studentGpa >= min_gpa` — so they share a single predicate here rather than
 * each encoding it, and a card cannot claim a fit the score disagrees with.
 *
 * The two encodings are deliberately NOT reconciled: `calculateChance` is a
 * 100-point verdict scale, `calculateMatchScore` is a percentage-of-maximum
 * scale whose denominator is a fixed 110 while its two 5-point bonuses sit
 * outside that total. Their GPA bands (`+0.3`/`-0.2` at weight 60 versus
 * `+0.5`/`+0.2`/`0`/`-0.2` at weight 25) and IELTS bands (`+0.5`->20, `+0`->16,
 * `-0.5`->8 versus `+0.5`->40, `-0.5`->20, else 0) therefore still disagree.
 * Reconciling them would change what students are shown and is out of scope for
 * a move.
 *
 * What they DO share is the null rule: `calculateMatchScore` returns null under
 * exactly the two conditions `calculateChance` returns UNKNOWN for, so a
 * student with no GPA, or looking at a university that publishes no cutoff, sees
 * "Not enough data" on every surface instead of a percentage on this one.
 *
 * NULL SAFETY: the ~1,944 US rows imported via the College Scorecard API carry
 * `min_gpa = NULL` because that source publishes no GPA cutoff. Per
 * PROJECT_CONTEXT.md ("Database state"): "~1944 US universities imported via
 * College Scorecard API (official govt data, no GPA/IELTS — those fields
 * intentionally null for US records)", alongside ~24 South Korean rows,
 * ~1,968 imported rows in total.
 *
 * The previous inline versions of this function scored with
 * `userGpa - university.min_gpa`, and `x - null === x - 0`, so every one of
 * those rows scored full GPA marks and reported "High chance" for any realistic
 * GPA. When there is no published cutoff there is nothing to compare against,
 * so the honest answer is VERDICT.UNKNOWN — never a guessed verdict.
 *
 * Per DECISIONS.md, a null US field is an expected data gap, not permission to
 * fill in a plausible value. This module therefore never substitutes a
 * default cutoff.
 *
 * `hasGpaData` checks nullishness only: `null`/`undefined` mean "no data",
 * while any present value — including `0` or a junk string such as `'N/A'` —
 * is treated as a real cutoff and scored against. A `min_gpa` of 0 would award
 * full GPA marks through `userGpa - 0 >= 0.3`, the same fabricated-verdict
 * shape as the NULL bug, for a different falsy value. That case is not
 * handled here.
 *
 * The same rule governs the language term when `required_ielts` is NULL: an
 * unevaluable dimension earns 0, in both the Korean branch (where TOPIK has
 * already gated the dimension) and the standard branch. The weights, bands and
 * `>= 80` / `>= 50` cutoffs are unchanged, so a row that clears its GPA cutoff
 * with an unknown IELTS band now lands on MEDIUM rather than HIGH.
 *
 * `calculateMatchScore` below extends the same "unknown earns nothing, never a
 * default" rule to its own unscoreable dimensions (IELTS on either side, cost
 * data), with two exceptions it documents in place: an absent student budget,
 * and absent `ranking` / `acceptance_rate` / `international_students_percent`,
 * each earn a small fixed credit because they are preferences rather than
 * admission requirements.
 *
 * Deliberately imports nothing from React, Supabase, or the `@/` alias so it
 * can be loaded by bare Node (see scripts/check-matching.mjs).
 */

import { US_GPA_HOLISTIC_NOTE } from './usGenericInfo.js';

export const VERDICT = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNKNOWN: 'unknown',
};

export function hasGpaData(university) {
  return university?.min_gpa !== null && university?.min_gpa !== undefined;
}

// The "GPA fit" badge on a Recommendations card. `calculateMatchScore` awards its
// full GPA band at `gpaDiff >= 0`, which is exactly `studentGpa >= min_gpa`, so
// the badge and the score must agree on that boundary; they therefore share this
// one predicate rather than each encoding it. Missing on either side is not a
// fit: there is nothing to compare against, and `0` is what the two scoring
// entry points above already treat as "no GPA".
export function isGpaFit(university, studentGpa) {
  if (!studentGpa) return false;
  if (!hasGpaData(university)) return false;
  return studentGpa >= university.min_gpa;
}

export function calculateChance(university, userGpa, userIelts, userTopik) {
  // No student GPA: no verdict is possible.
  if (!userGpa) return VERDICT.UNKNOWN;
  // No published cutoff: scoring against null would award full GPA marks.
  if (!hasGpaData(university)) return VERDICT.UNKNOWN;

  let score = 0;
  const isKorean = university.country === 'South Korea';

  // GPA score (50% weight for Korean unis with TOPIK, 60% otherwise)
  const gpaWeight = isKorean && university.topikLevel ? 50 : 60;
  const gpaDiff = userGpa - university.min_gpa;
  if (gpaDiff >= 0.3) score += gpaWeight;
  else if (gpaDiff >= -0.2) score += gpaWeight * 0.67;
  else score += gpaWeight * 0.33;

  // Language score (IELTS or TOPIK)
  if (isKorean && university.topikLevel) {
    // TOPIK scoring (30% weight)
    const topikLevels = { 'Not taken': 0, 'TOPIK 1': 1, 'TOPIK 2': 2, 'TOPIK 3': 3, 'TOPIK 4': 4, 'TOPIK 5': 5, 'TOPIK 6': 6 };
    const userLevel = topikLevels[userTopik] || 0;
    const requiredLevel = parseInt(university.topikLevel.split(' ')[1]) || 0;

    if (userLevel === 0) {
      score += 0; // No TOPIK
    } else if (userLevel >= requiredLevel + 1) {
      score += 30;
    } else if (userLevel >= requiredLevel) {
      score += 25;
    } else if (userLevel >= requiredLevel - 1) {
      score += 10;
    } else {
      score += 0;
    }

    // IELTS for Korean unis (20% weight)
    if (university.required_ielts) {
      if (userIelts >= university.required_ielts) score += 20;
      else if (userIelts >= university.required_ielts - 0.5) score += 10;
    } else {
      // No published IELTS band: an unverifiable award, so the term earns 0.
      // We cannot assert the student cleared a bar we cannot see, and we equally
      // cannot assert they failed it — 0 is the absence of an award, not a
      // verdict. TOPIK is a requirement this row does publish and has already
      // gated the language dimension above, so nothing is left unassessed.
      // This also removes an inconsistency: an unknown *student* score earned 10
      // below, so missing data on our side used to outscore missing data on
      // theirs. Both unknowns now earn the same 0.
      score += 0;
    }
  } else {
    // Standard IELTS scoring (40% weight)
    if (university.required_ielts) {
      if (userIelts === 0) {
        score += 0;
      } else if (userIelts >= university.required_ielts) {
        score += 40;
      } else if (userIelts >= university.required_ielts - 0.5) {
        score += 20;
      } else {
        score += 0;
      }
    } else {
      // No published IELTS band, so the full 40 asserted the student cleared a
      // requirement we cannot see. Awarding it here gave ~1,944 College
      // Scorecard rows a confident verdict from absent data. An unevaluable
      // dimension earns nothing: we cannot claim a pass or a fail against an
      // invisible bar, and 0 is the absence of an unverifiable award.
      score += 0;
    }
  }

  if (score >= 80) return VERDICT.HIGH;
  if (score >= 50) return VERDICT.MEDIUM;
  return VERDICT.LOW;
}

/**
 * Explains why a row cannot be scored, so the UI can label the gap instead of
 * showing a guess. Returns null when the row is scorable.
 */
export function describeMissingChanceData(university) {
  if (hasGpaData(university)) return null;
  if (university?.country === 'United States') {
    return { code: 'us-holistic', note: US_GPA_HOLISTIC_NOTE };
  }
  return {
    code: 'no-gpa-published',
    note: "We don't have a published minimum GPA for this university yet, so there's nothing to compare your grades against.",
  };
}

// Both cost inputs must be present before any cost total may be compared to a
// student's budget or printed as a figure. `normalizeUniversity`
// (`apiClient.js`) preserves null for both fields, so an unknown cost arrives
// here as null and has to be refused rather than defaulted — the old
// `(tuition_min || 0) + (living_cost_estimate || 8000)` invented both operands.
export function hasCostData(university) {
  return university.tuition_min !== null
      && university.tuition_min !== undefined
      && university.living_cost_estimate !== null
      && university.living_cost_estimate !== undefined;
}

// Returns a 0-100 match score, or null when the row cannot be scored honestly.
// null is not "0%" and not "we could not find the row": it means either side of
// the GPA comparison is missing — the university publishes no cutoff, or the
// student has not given us their GPA — so there is nothing to compare grades
// against. Returning null is what lets the call site render the shared
// `unknown` state instead of a misleading percentage, and it is the same rule
// `calculateChance` applies above ("no verdict is possible").
export function calculateMatchScore(university, profile, countryWeights = {}) {
    let score = 0;
    let maxScore = 0;

    // GPA Match (25 points)
    maxScore += 25;
    if (profile.gpa && hasGpaData(university)) {
        const gpaDiff = profile.gpa - university.min_gpa;
        if (gpaDiff >= 0.5) score += 25;
        else if (gpaDiff >= 0.2) score += 21;
        else if (gpaDiff >= 0) score += 17;
        else if (gpaDiff >= -0.2) score += 8;
    }
    // Either side missing: this term is unscoreable, so it earns nothing. It must
    // not fall through to `x - null`, which is `x - 0` and handed every all-null
    // US row full GPA marks. The null return below is what actually surfaces the
    // gap to the student.

    // IELTS Match (20 points)
    maxScore += 20;
    if (university.required_ielts && profile.english_proficiency !== undefined) {
        if (profile.english_proficiency === 0) {
            score += 0;
        } else if (profile.english_proficiency >= university.required_ielts + 0.5) {
            score += 20;
        } else if (profile.english_proficiency >= university.required_ielts) {
            score += 16;
        } else if (profile.english_proficiency >= university.required_ielts - 0.5) {
            score += 8;
        }
    } else {
        // Either side of this comparison is missing — the university publishes no
        // IELTS band, or the student has no score — so the term earns 0. It used
        // to hand out 20 for an unknown requirement and 10 for an unknown student
        // score, which made missing data on our side worth more than missing data
        // on theirs, and let a row with no published band collect a full 20
        // points. An unknown must never score better than a known
        // shortfall: a student who publishes 5.5 against a published 7.0 gets 0
        // here too, and neither case is a pass.
        score += 0;
    }

    // Budget Match (18 points)
    maxScore += 18;
    if (!profile.budget_max) {
        // The student has not told us their budget. Neutral credit.
        score += 9;
    } else if (hasCostData(university)) {
        const totalCost = university.tuition_min + university.living_cost_estimate;
        if (totalCost <= profile.budget_max * 0.8) score += 18;
        else if (totalCost <= profile.budget_max) score += 14;
        else if (totalCost <= profile.budget_max * 1.2) score += 7;
    }
    // Budget known but cost unknown: the term is unscoreable, so it earns
    // nothing. The old `(tuition_min || 0) + (living_cost_estimate || 8000)`
    // invented both operands, which made unknown cost score as the cheapest
    // possible cost and take the full 18 points.

    // Country/Region Preference (weighted, up to 20 points)
    maxScore += 20;
    // Default 100% weight, which is the default Recommendations *displays* for a
    // country (`countryWeights[country] || 100`): at 50 an untouched country
    // scored at half weight while the UI showed it at 100, so the percentage on
    // the card was not the weighting the sliders describe. `||` not `??` on
    // purpose, so a slider at 0 falls back the same way here as it does there.
    const countryWeight = countryWeights[university.country] || 100;
    if (profile.preferred_countries?.includes(university.country)) {
        score += (20 * countryWeight) / 100;
    } else {
        score += (5 * countryWeight) / 100;
    }

    // Degree Level Match (10 points)
    maxScore += 10;
    if (profile.target_degree && university.degree_levels?.includes(profile.target_degree)) {
        score += 10;
    } else {
        score += 5;
    }

    // Ranking (7 points) - better ranking = more points
    maxScore += 7;
    if (university.ranking) {
        if (university.ranking <= 50) score += 7;
        else if (university.ranking <= 100) score += 5;
        else if (university.ranking <= 200) score += 3;
        else score += 1;
    } else {
        score += 2;
    }

    // International Students (5 points) - higher % = more diverse
    maxScore += 5;
    if (university.international_students_percent) {
        if (university.international_students_percent >= 20) score += 5;
        else if (university.international_students_percent >= 15) score += 4;
        else if (university.international_students_percent >= 10) score += 3;
        else score += 2;
    } else {
        score += 2;
    }

    // Acceptance Rate (5 points) - balanced scoring
    maxScore += 5;
    if (university.acceptance_rate) {
        if (university.acceptance_rate >= 60 && university.acceptance_rate <= 80) score += 5; // Sweet spot
        else if (university.acceptance_rate >= 50 && university.acceptance_rate < 90) score += 4;
        else score += 2;
    } else {
        score += 2;
    }

    // Bonus: Scholarships (bonus 5 points)
    if (university.scholarships_available) {
        score += 5;
    }

    // Bonus: International Support (bonus 5 points)
    if (university.international_support?.international_office &&
        university.international_support?.orientation_program) {
        score += 5;
    }

    // A missing GPA cutoff *or* a missing student GPA means the number above is
    // not a match score: it is the other 9 terms with the single most
    // admission-relevant term missing. Reporting it as a percentage is how
    // ~1,944 universities with no data came to score 85-90%, and it is how a
    // student who never told us their GPA came to read "Good match · 72%" here
    // while every other surface showed them "Not enough data". Return null and
    // let the caller show the unknown state.
    if (!profile.gpa || !hasGpaData(university)) return null;

    // Pre-existing bug found in passing, unrelated to null safety: maxScore
    // sums to 110 while the two bonuses above can add 10 more, so this ratio
    // could return a percentage above 100.
    return Math.min(100, Math.round((score / maxScore) * 100));
}
