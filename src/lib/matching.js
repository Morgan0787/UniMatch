/**
 * matching.js
 *
 * Pure, framework-free admission-chance scoring. Every surface that ranks a
 * university against a student's GPA / IELTS / TOPIK now shares this one
 * implementation, so the verdict cannot drift between them: UniversityCard,
 * UniversityDetailModal, ComparisonModal, Search, Profile and Recommendations
 * all import it.
 *
 * `src/pages/Recommendations.jsx` keeps its own `calculateMatchScore` (a
 * weighted 0-100 blend across nine terms, not a verdict) but now returns null
 * under the same two conditions this module returns UNKNOWN, so a student with
 * no GPA sees "Not enough data" everywhere instead of a percentage here and an
 * unknown verdict everywhere else.
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
      score += 20;
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
      score += 40;
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
