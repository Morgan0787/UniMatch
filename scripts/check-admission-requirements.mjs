import assert from 'node:assert/strict';
import { evaluateRequirement } from '../src/lib/admissions/requirements.js';

const answers = {
  exam: 'IELTS',
  score: '6.5',
  examDate: '2025-02-28',
  grade: '3.5',
  scale: '4',
  schoolCountry: ' Uzbekistan ',
  credential: 'Secondary school certificate',
  startYear: '2027',
};
const verified = { verified: true, applicable: true };

// Grade thresholds compare only matching original scales and exact numerical values.
{
  const grade = { ...verified, type: 'grade', minimum: 3.5, scale: '4', sourceKey: 'fixture-grade' };
  assert.deepEqual(evaluateRequirement(grade, answers), {
    status: 'met', codes: ['GRADE_THRESHOLD_MET'], sourceKeys: ['fixture-grade'],
  });
  assert.equal(evaluateRequirement({ ...grade, minimum: 3.6 }, answers).status, 'unmet');
  assert.equal(evaluateRequirement({ ...grade, scale: '5' }, answers).codes[0], 'GRADE_SCALE_UNKNOWN');
  assert.equal(evaluateRequirement(grade, { ...answers, grade: '' }).codes[0], 'GRADE_DATA_UNKNOWN');
  assert.equal(evaluateRequirement({ ...grade, verified: false }, answers).status, 'unknown');
}

// Missing or mismatched scope answers stay unknown; matching is trimmed, case-insensitive, and exact.
{
  const scoped = {
    ...verified,
    type: 'grade',
    minimum: 3,
    scale: '4',
    sourceKey: 'fixture-scope',
    scope: { schoolCountry: 'Uzbekistan', credential: 'secondary school certificate', intakeYear: 2027 },
  };
  assert.equal(evaluateRequirement(scoped, answers).status, 'met');
  assert.equal(evaluateRequirement(scoped, { ...answers, schoolCountry: '' }).codes[0], 'REQUIREMENT_SCOPE_UNKNOWN');
  assert.equal(evaluateRequirement(scoped, { ...answers, schoolCountry: 'U.S.' }).status, 'unknown');
  assert.equal(evaluateRequirement(scoped, { ...answers, startYear: '' }).status, 'unknown');
}

// IELTS totals are conservative when section evidence or a required date is missing.
{
  const ielts = { ...verified, type: 'ielts', minimum: 6, sourceKey: 'fixture-ielts' };
  assert.equal(evaluateRequirement(ielts, answers).status, 'met');
  assert.equal(evaluateRequirement({ ...ielts, minimum: 7 }, answers).status, 'unmet');
  assert.equal(evaluateRequirement({ ...ielts, sections: { listening: 5 } }, answers).codes[0], 'LANGUAGE_SECTIONS_UNKNOWN');
  assert.equal(evaluateRequirement({ ...ielts, sections: { listening: 5 }, minimum: 7 }, answers).status, 'unmet');
  assert.equal(evaluateRequirement(ielts, { ...answers, exam: '' }).codes[0], 'EXAM_UNKNOWN');
  assert.equal(evaluateRequirement({ ...ielts, requiresDate: true }, { ...answers, examDate: '' }).codes.includes('EXAM_DATE_UNKNOWN'), true);
  assert.equal(evaluateRequirement({ ...ielts, requiresDate: true, minimum: 7 }, { ...answers, examDate: '' }).status, 'unmet');
}

// Exam validity uses its explicit reference date and calendar-year boundary, never wall-clock time.
{
  const valid = {
    ...verified,
    type: 'ielts',
    minimum: 6,
    validityYears: 2,
    referenceDate: '2027-02-28',
  };
  assert.equal(evaluateRequirement(valid, answers).status, 'met');
  assert.equal(evaluateRequirement({ ...valid, referenceDate: '2027-03-01' }, answers).codes.includes('EXAM_EXPIRED'), true);
  assert.equal(evaluateRequirement({ ...valid, referenceDate: '' }, answers).status, 'unknown');
  assert.equal(evaluateRequirement(valid, { ...answers, examDate: '2025-02-30' }).codes.includes('EXAM_DATE_INVALID'), true);
  assert.equal(evaluateRequirement(valid, { ...answers, examDate: '2028-01-01' }).status, 'unknown');
}

// An IELTS failure plus an unknown waiver is unknown overall, never a mandatory refusal.
{
  const alternateRoute = {
    ...verified,
    type: 'any',
    complete: true,
    sourceKey: 'fixture-alternative-routes',
    children: [
      { ...verified, type: 'ielts', minimum: 7, sourceKey: 'fixture-ielts' },
      { ...verified, type: 'unknown', sourceKey: 'fixture-waiver' },
    ],
  };
  const result = evaluateRequirement(alternateRoute, answers);
  assert.equal(result.status, 'unknown');
  assert.deepEqual(result.sourceKeys, ['fixture-alternative-routes', 'fixture-ielts', 'fixture-waiver']);
  assert.equal('probability' in result, false);
}

// OR can only report unmet when every declared path is known to fail and the group is complete.
{
  const alternatives = {
    ...verified,
    type: 'any',
    complete: true,
    children: [
      { ...verified, type: 'ielts', minimum: 7 },
      { ...verified, type: 'ielts', minimum: 8 },
    ],
  };
  assert.equal(evaluateRequirement(alternatives, answers).status, 'unmet');
  assert.equal(evaluateRequirement({ ...alternatives, complete: false }, answers).status, 'unknown');
  assert.equal(evaluateRequirement({ ...alternatives, children: [] }, answers).status, 'unknown');
}

// ALL retains a known failure even when another requirement is unknown; incomplete all-met lists stay unknown.
{
  const requirements = {
    ...verified,
    type: 'all',
    complete: true,
    children: [
      { ...verified, type: 'grade', minimum: 3, scale: '4' },
      { ...verified, type: 'ielts', minimum: 7 },
    ],
  };
  assert.equal(evaluateRequirement(requirements, answers).status, 'unmet');
  assert.equal(evaluateRequirement({ ...requirements, children: [requirements.children[0]], complete: false }, answers).status, 'unknown');
  assert.equal(evaluateRequirement({ ...requirements, children: [] }, answers).status, 'unknown');
}

console.log('Admission requirement evaluator checks passed.');
