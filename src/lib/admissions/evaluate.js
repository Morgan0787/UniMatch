import { OPTIONS } from './catalog.js';
import { evaluateCandidate } from './candidate.js';
import { selectPreliminaryResults } from './selectResults.js';

const FIELDS = new Set(['', 'business', 'it', 'computer_engineering', 'software_engineering', 'computer_science', 'other']);
const REGIONS = new Set(['Europe', 'USA', 'South Korea', 'UK', 'Canada']);
const EXAMS = new Set(['', 'IELTS', 'TOEFL', 'TOPIK', 'not_taken']);
const CURRENCIES = new Set(['', 'EUR', 'USD', 'UZS', 'KRW', 'GBP', 'CAD']);
const GRADE_SCALES = new Set(['', '4', '5', '100']);

/** @returns {Record<string, string|string[]>} */
export function emptyAnswers() {
  return {
    field: '', regions: [], exam: '', score: '', grade: '', scale: '', budget: '', currency: '',
    scholarship: '', schoolCountry: '', credential: '', startYear: '', language: '', examDate: '',
  };
}

/** @param {unknown} value */
function numeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** @param {Record<string, any>} answers */
export function validateAnswers(answers) {
  const errors = {};
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return { answers: 'answers_invalid' };
  if (typeof answers.field !== 'string' || !FIELDS.has(answers.field)) errors.field = 'field_invalid';
  if (!Array.isArray(answers.regions) || answers.regions.some((region) => typeof region !== 'string' || !REGIONS.has(region))) errors.regions = 'regions_invalid';
  if (typeof answers.exam !== 'string' || !EXAMS.has(answers.exam)) errors.exam = 'exam_invalid';
  for (const key of ['score', 'grade', 'budget']) {
    const value = answers[key];
    if (value !== '' && value != null) {
      const parsed = numeric(value);
      if (parsed === null || parsed < 0) errors[key] = `${key}_invalid`;
      else if (key === 'score' && answers.exam === 'IELTS' && (parsed > 9 || Math.round(parsed * 2) !== parsed * 2)) errors.score = 'score_invalid';
      else if (key === 'score' && answers.exam === 'TOEFL' && parsed > 120) errors.score = 'score_invalid';
      else if (key === 'score' && answers.exam === 'TOPIK' && (!Number.isInteger(parsed) || parsed > 6)) errors.score = 'score_invalid';
      else if (key === 'grade' && (parsed > 100 || (answers.scale && parsed > Number(answers.scale)))) errors.grade = 'grade_invalid';
    }
  }
  if (typeof answers.scale !== 'string' || !GRADE_SCALES.has(answers.scale)) errors.scale = 'scale_invalid';
  if (typeof answers.currency !== 'string' || !CURRENCIES.has(answers.currency)) errors.currency = 'currency_invalid';
  if (!['', 'required', 'preferred', 'not_required'].includes(answers.scholarship)) errors.scholarship = 'scholarship_invalid';
  if (answers.startYear !== '' && answers.startYear != null) {
    const year = numeric(answers.startYear);
    if (year === null || !Number.isInteger(year) || year < 2000 || year > 9999) errors.startYear = 'startYear_invalid';
  }
  if (answers.examDate !== '' && answers.examDate != null) {
    const parsedDate = typeof answers.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(answers.examDate)
      ? new Date(`${answers.examDate}T00:00:00.000Z`)
      : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== answers.examDate) errors.examDate = 'examDate_invalid';
  }
  return errors;
}

/**
 * @param {Record<string, any>} answers
 * @param {any[]} [options] Injectable normalized catalogue for synthetic checks.
 */
export function evaluateAnswers(answers, options = OPTIONS) {
  const errors = validateAnswers(answers);
  if (Object.keys(errors).length) return { results: [], alternatives: [], topCount: 0, mode: 'explore', totalInstitutions: 0, emptyReason: null, errors };
  const rows = (Array.isArray(options) ? options : []).map(option => evaluateCandidate(option, answers));
  const selection = selectPreliminaryResults(rows, answers);
  return { ...selection, emptyReason: selection.results.length || selection.alternatives.length ? null : 'coverage', errors: {} };
}
