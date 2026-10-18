const VALID_GRADE_SCALES = new Set(['4', '5', '100']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** @typedef {{status: 'met' | 'unmet' | 'unknown', codes: string[], sourceKeys: string[]}} RequirementResult */

/** @param {unknown} value */
function numeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

/** @param {unknown} value @returns {string|null} */
function normalizedText(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

/**
 * Parse an exact YYYY-MM-DD value without accepting calendar rollover.
 * @param {unknown} value
 * @returns {{year: number, month: number, day: number}|null}
 */
function parseDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isFinite(date.getTime())
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

/** @param {{year:number,month:number,day:number}} date */
function dateNumber(date) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

/** @param {{year:number,month:number,day:number}} date @param {number} years */
function addCalendarYears(date, years) {
  const year = date.year + years;
  const lastDay = new Date(Date.UTC(year, date.month, 0)).getUTCDate();
  return { year, month: date.month, day: Math.min(date.day, lastDay) };
}

/** @param {unknown} rule @returns {string[]} */
function collectSourceKeys(rule) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return [];
  const node = /** @type {Record<string, any>} */ (rule);
  const keys = [];
  if (typeof node.sourceKey === 'string' && node.sourceKey.trim()) keys.push(node.sourceKey.trim());
  if (Array.isArray(node.children)) {
    for (const child of node.children) keys.push(...collectSourceKeys(child));
  }
  return [...new Set(keys)];
}

/** @param {string} status @param {string[]} codes @param {string[]} sourceKeys @returns {RequirementResult} */
function result(status, codes, sourceKeys) {
  return { status: /** @type {'met'|'unmet'|'unknown'} */ (status), codes: [...new Set(codes)], sourceKeys };
}

/**
 * Evaluate one conservative, normalized requirement rule against guest answers.
 * The evaluator never estimates, converts grading scales, or uses the current
 * clock to determine whether an exam remains valid.
 * @param {unknown} rule
 * @param {unknown} answers
 * @returns {RequirementResult}
 */
export function evaluateRequirement(rule, answers) {
  const sourceKeys = collectSourceKeys(rule);
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    return result('unknown', ['REQUIREMENT_UNKNOWN'], sourceKeys);
  }

  const node = /** @type {Record<string, any>} */ (rule);
  if (node.verified !== true || node.applicable !== true) {
    return result('unknown', ['REQUIREMENT_UNKNOWN'], sourceKeys);
  }

  const answer = answers && typeof answers === 'object' && !Array.isArray(answers)
    ? /** @type {Record<string, any>} */ (answers)
    : {};
  const scopeResult = evaluateScope(node.scope, answer);
  if (scopeResult) return result('unknown', [scopeResult], sourceKeys);

  switch (node.type) {
    case 'unknown':
      return result('unknown', ['REQUIREMENT_UNKNOWN'], sourceKeys);
    case 'all':
    case 'any':
      return evaluateGroup(node, answer, sourceKeys);
    case 'grade':
      return evaluateGrade(node, answer, sourceKeys);
    case 'ielts':
      return evaluateIelts(node, answer, sourceKeys);
    default:
      return result('unknown', ['REQUIREMENT_UNKNOWN'], sourceKeys);
  }
}

/**
 * @param {unknown} scope
 * @param {Record<string, any>} answers
 * @returns {string|null}
 */
function evaluateScope(scope, answers) {
  if (scope === undefined || scope === null) return null;
  if (typeof scope !== 'object' || Array.isArray(scope)) return 'REQUIREMENT_SCOPE_UNKNOWN';

  const constraints = /** @type {Record<string, unknown>} */ (scope);
  for (const key of ['schoolCountry', 'credential']) {
    if (Object.hasOwn(constraints, key)) {
      const required = normalizedText(constraints[key]);
      const supplied = normalizedText(answers[key]);
      if (required === null || supplied === null || required !== supplied) return 'REQUIREMENT_SCOPE_UNKNOWN';
    }
  }

  if (Object.hasOwn(constraints, 'intakeYear')) {
    const requiredYear = numeric(constraints.intakeYear);
    const suppliedYear = numeric(answers.startYear);
    if (
      requiredYear === null
      || !Number.isInteger(requiredYear)
      || suppliedYear === null
      || !Number.isInteger(suppliedYear)
      || requiredYear !== suppliedYear
    ) return 'REQUIREMENT_SCOPE_UNKNOWN';
  }

  return null;
}

/** @param {Record<string, any>} node @param {Record<string, any>} answers @param {string[]} sourceKeys @returns {RequirementResult} */
function evaluateGrade(node, answers, sourceKeys) {
  if (typeof node.scale !== 'string' || !VALID_GRADE_SCALES.has(node.scale)) {
    return result('unknown', ['GRADE_SCALE_UNKNOWN'], sourceKeys);
  }
  if (answers.scale !== node.scale) {
    return result('unknown', ['GRADE_SCALE_UNKNOWN'], sourceKeys);
  }

  const grade = numeric(answers.grade);
  const minimum = numeric(node.minimum);
  const maximum = Number(node.scale);
  if (
    grade === null
    || minimum === null
    || grade < 0
    || grade > maximum
    || minimum < 0
    || minimum > maximum
  ) return result('unknown', ['GRADE_DATA_UNKNOWN'], sourceKeys);

  return grade >= minimum
    ? result('met', ['GRADE_THRESHOLD_MET'], sourceKeys)
    : result('unmet', ['GRADE_THRESHOLD_BELOW'], sourceKeys);
}

/** @param {Record<string, any>} node @param {Record<string, any>} answers @param {string[]} sourceKeys @returns {RequirementResult} */
function evaluateIelts(node, answers, sourceKeys) {
  if (answers.exam !== 'IELTS') return result('unknown', ['EXAM_UNKNOWN'], sourceKeys);
  if (node.requiresDate !== undefined && typeof node.requiresDate !== 'boolean') {
    return result('unknown', ['EXAM_DATE_UNKNOWN'], sourceKeys);
  }

  const score = numeric(answers.score);
  const minimum = numeric(node.minimum);
  if (
    score === null
    || score < 0
    || score > 9
    || Math.round(score * 2) !== score * 2
    || minimum === null
    || minimum < 0
    || minimum > 9
  ) return result('unknown', ['EXAM_UNKNOWN'], sourceKeys);

  const codes = [];
  const below = score < minimum;
  codes.push(below ? 'IELTS_THRESHOLD_BELOW' : 'IELTS_THRESHOLD_MET');

  if (
    node.sections !== undefined
    && node.sections !== null
    && (typeof node.sections !== 'object' || Array.isArray(node.sections))
  ) return result('unknown', ['LANGUAGE_SECTIONS_UNKNOWN'], sourceKeys);
  const sectionKeys = node.sections ? Object.keys(node.sections) : [];
  if (sectionKeys.length > 0) {
    if (below) return result('unmet', codes, sourceKeys);
    return result('unknown', ['LANGUAGE_SECTIONS_UNKNOWN', ...codes], sourceKeys);
  }

  let hasDateUnknown = false;
  if (node.requiresDate === true && !answers.examDate) {
    if (below) return result('unmet', codes, sourceKeys);
    hasDateUnknown = true;
    codes.push('EXAM_DATE_UNKNOWN');
  }

  if (node.validityYears !== undefined && node.validityYears !== null) {
    const validityYears = numeric(node.validityYears);
    const examDate = parseDate(answers.examDate);
    const referenceDate = parseDate(node.referenceDate);
    if (
      validityYears === null
      || !Number.isInteger(validityYears)
      || validityYears < 0
      || !examDate
      || !referenceDate
    ) {
      const dateCode = answers.examDate && !examDate ? 'EXAM_DATE_INVALID' : 'EXAM_DATE_UNKNOWN';
      return result('unknown', [...codes, dateCode], sourceKeys);
    }

    if (dateNumber(examDate) > dateNumber(referenceDate)) {
      return result('unknown', [...codes, 'EXAM_DATE_INVALID'], sourceKeys);
    }

    const expiry = addCalendarYears(examDate, validityYears);
    if (dateNumber(referenceDate) > dateNumber(expiry)) {
      return result('unmet', [...codes, 'EXAM_EXPIRED'], sourceKeys);
    }
  }

  if (hasDateUnknown) return result('unknown', codes, sourceKeys);
  return result(below ? 'unmet' : 'met', codes, sourceKeys);
}

/** @param {Record<string, any>} node @param {Record<string, any>} answers @param {string[]} sourceKeys @returns {RequirementResult} */
function evaluateGroup(node, answers, sourceKeys) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return result('unknown', ['REQUIREMENT_UNKNOWN'], sourceKeys);
  }

  const children = node.children.map((child) => evaluateRequirement(child, answers));
  const codes = children.flatMap((child) => child.codes);
  const hasUnknown = children.some((child) => child.status === 'unknown');
  if (node.type === 'all') {
    if (children.some((child) => child.status === 'unmet')) return result('unmet', codes, sourceKeys);
    if (hasUnknown || node.complete !== true) return result('unknown', [...codes, 'REQUIREMENT_UNKNOWN'], sourceKeys);
    return result('met', codes, sourceKeys);
  }

  if (children.some((child) => child.status === 'met')) return result('met', codes, sourceKeys);
  if (hasUnknown || node.complete !== true) return result('unknown', [...codes, 'REQUIREMENT_UNKNOWN'], sourceKeys);
  return result('unmet', codes, sourceKeys);
}
