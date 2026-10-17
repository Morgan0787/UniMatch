import { evaluateRequirement } from './requirements.js';
import { academicContext } from './nativeAcademic.js';

/** @param {unknown} value */
function numberOrNull(value) {
  if (value === '' || value == null || (typeof value !== 'string' && typeof value !== 'number')) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Evaluate only normalized, source-scoped data. An admission decision is never
 * inferred from preference matches, absent values or institution reputation.
 * @param {any} option @param {Record<string, any>} answers
 */
export function evaluateCandidate(option, answers) {
  const reasons = [];
  const add = (code, status = 'unknown', sourceKey = undefined) => {
    if (!reasons.some(reason => reason.code === code)) reasons.push({ code, status, ...(sourceKey ? { sourceKey } : {}) });
  };
  add(answers.field ? option.fieldVerified === false ? 'FIELD_ROUTING_INFERRED' : 'FIELD_MATCH' : 'FIELD_UNSPECIFIED', answers.field && option.fieldVerified !== false ? 'met' : 'unknown');
  add(answers.regions.length ? 'REGION_MATCH' : 'REGION_UNSPECIFIED', answers.regions.length ? 'met' : 'unknown');
  add('PERSONAL_CREDENTIAL_UNKNOWN', 'unknown', option.routeSourceKey);
  const context = academicContext(option, answers);
  const academic = evaluateRequirement(context.rule, context.answers);
  const language = evaluateRequirement(option.languageRequirement, answers);
  add(`ACADEMIC_${academic.status.toUpperCase()}`, academic.status, academic.sourceKeys[0]);
  add(`LANGUAGE_${language.status.toUpperCase()}`, language.status, language.sourceKeys[0]);
  for (const result of [academic, language]) {
    for (const code of result.codes) {
      const status = code.endsWith('_MET') ? 'met' : code.endsWith('_BELOW') || code === 'EXAM_EXPIRED' ? 'unmet' : 'unknown';
      add(code, status, result.sourceKeys.length === 1 ? result.sourceKeys[0] : undefined);
    }
  }

  const threshold = evaluateRequirement(option.languageThreshold, answers);
  if (threshold.codes.includes('IELTS_THRESHOLD_BELOW')) add('LANGUAGE_BELOW_PUBLISHED_THRESHOLD', 'unmet', threshold.sourceKeys[0]);
  if (threshold.codes.includes('IELTS_THRESHOLD_MET')) add('LANGUAGE_THRESHOLD_REACHED', 'met', threshold.sourceKeys[0]);
  if (!answers.exam || answers.exam === 'not_taken') add('LANGUAGE_TEST_UNSPECIFIED');
  else if (answers.exam !== 'IELTS') add('LANGUAGE_SCALE_UNKNOWN');
  else if (numberOrNull(answers.score) === null) add('LANGUAGE_SCORE_MISSING');
  if (answers.exam && answers.exam !== 'not_taken' && language.status === 'unknown') add('EXAM_VALIDITY_UNKNOWN');

  let requiresClarification = (language.status !== 'met' && threshold.codes.includes('IELTS_THRESHOLD_BELOW'))
    || (academic.status !== 'met' && academic.codes.includes('GRADE_THRESHOLD_BELOW'));
  if (option.fieldVerified === false) add('FIELD_ROUTING_INFERRED');
  if (option.languageVerified === false) add('TEACHING_LANGUAGE_UNCONFIRMED');
  if (answers.language && option.language && answers.language !== option.language && option.languageVerified !== false) {
    add('TEACHING_LANGUAGE_MISMATCH', 'unmet', option.languageSourceKey || option.routeSourceKey);
    requiresClarification = true;
  }
  if (answers.startYear && option.intakeYear && Number(answers.startYear) !== option.intakeYear) {
    add('START_YEAR_MISMATCH', 'unmet', option.routeSourceKey);
    requiresClarification = true;
  }
  if (option.notes?.includes('TURKU_PLACES_UNKNOWN')) add('TURKU_PLACES_UNKNOWN', 'unknown', option.routeSourceKey);
  if (option.notes?.includes('ASU_SPRING_CS_INTAKE_UNCONFIRMED')) add('ASU_SPRING_CS_INTAKE_UNCONFIRMED', 'unknown', option.routeSourceKey);
  if (option.competitiveness?.category !== 'known_standard') add('COMPETITIVENESS_UNKNOWN');

  let budgetStatus = 'unknown';
  const budget = numberOrNull(answers.budget);
  const tuition = option.tuition;
  if (budget === null) add('BUDGET_MISSING');
  else if (!answers.currency) add('BUDGET_CURRENCY_UNKNOWN');
  else if (!tuition || tuition.amount == null || tuition.period !== 'year' || tuition.applicable === false) add('TUITION_SCOPE_UNKNOWN', 'unknown', tuition?.source);
  else if (answers.currency !== tuition.currency) add('BUDGET_CURRENCY_MISMATCH');
  else if (budget < tuition.amount) {
    // A dated/base amount is a reason to clarify, not a current affordability verdict.
    if (tuition.comparisonVerified === true) budgetStatus = 'unmet';
    else requiresClarification = true;
    add('BUDGET_BELOW_PUBLISHED_TUITION', tuition.comparisonVerified === true ? 'unmet' : 'unknown', tuition.source);
  } else {
    if (tuition.comparisonVerified === true) budgetStatus = 'met';
    add('BUDGET_COVERS_TUITION_ONLY', tuition.comparisonVerified === true ? 'met' : 'unknown', tuition.source);
  }
  if (answers.scholarship === 'required' || answers.scholarship === 'preferred') add('SCHOLARSHIP_ELIGIBILITY_UNKNOWN');
  const requirementStatus = academic.status === 'unmet' || language.status === 'unmet' ? 'unmet'
    : academic.status === 'met' && language.status === 'met' && option.eligibilityComplete === true ? 'met' : 'unknown';
  add('ADMISSION_ELIGIBILITY_INCOMPLETE');
  const preferenceMatches = Number(Boolean(answers.field) && option.fieldVerified !== false) + Number(answers.regions.length > 0)
    + Number(answers.language && answers.language === option.language && option.languageVerified !== false)
    + Number(answers.startYear && Number(answers.startYear) === option.intakeYear);
  return {
    option, outcome: 'unknown', reasons, requirementStatus,
    academicStatus: academic.status, languageStatus: language.status, budgetStatus, requiresClarification,
    requiresAlternativePath: context.blockedByCredential,
    preferenceMatches,
    topEvidence: academic.status === 'met' && language.status === 'met' && !requiresClarification && budgetStatus === 'met',
  };
}
