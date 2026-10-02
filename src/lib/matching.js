/**
 * matching.js
 *
 * Pure, framework-free admission-chance scoring. Shared by every surface that
 * ranks a university against a student's GPA / IELTS / TOPIK, so the verdict
 * can never drift between them.
 *
 * NULL SAFETY: most US rows (~1,944 of ~1,968) came from the College Scorecard
 * with `min_gpa = NULL`. The previous inline versions of this function did
 * `userGpa - university.min_gpa`, and `x - null === x - 0`, so every one of
 * those rows scored full GPA marks and reported "High chance" for any realistic
 * GPA. When there is no published cutoff there is nothing to compare against,
 * so the honest answer is VERDICT.UNKNOWN — never a guessed verdict.
 *
 * Per DECISIONS.md, a null US field is an expected data gap, not permission to
 * fill in a plausible value. This module therefore never substitutes a
 * default cutoff.
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
    note: "This university hasn't published a minimum GPA, so there's nothing to compare your grades against yet.",
  };
}