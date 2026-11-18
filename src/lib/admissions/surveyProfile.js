import { validateAnswers } from './evaluate.js';

export const SURVEY_PROFILE_RETURN = '/AdmissionsSurvey?saveProfile=1';
export const SURVEY_PROFILE_INTENT = 'unimatch:admissions-profile-intent';

const interests = {
  business: 'Business',
  it: 'Information Technology',
  computer_engineering: 'Computer Engineering',
  software_engineering: 'Software Engineering',
  computer_science: 'Computer Science',
};
const countries = { USA: 'United States', UK: 'United Kingdom', 'South Korea': 'South Korea', Canada: 'Canada' };
const teachingLanguages = new Set(['English', 'Korean', 'German', 'Polish', 'Italian', 'French', 'Spanish']);
const addSelections = (existing, additions) => [...new Set([...(Array.isArray(existing) ? existing : []), ...additions])];

/** Transfer answers that have an equivalent stored profile field. */
export function surveyProfileFields(answers, profile = null) {
  if (Object.keys(validateAnswers(answers)).length) throw new Error('Invalid survey answers');
  const fields = /** @type {Record<string, string|number|string[]>} */ ({});
  if (!profile?.target_degree) fields.target_degree = 'Bachelor';
  if (answers.scale === '4' && Number(answers.grade) >= 1) fields.gpa = Number(answers.grade);
  if (answers.exam === 'IELTS' && Number(answers.score) > 0) fields.english_proficiency = Number(answers.score);
  if (answers.exam === 'TOPIK' && Number(answers.score) > 0) fields.topikLevel = `TOPIK ${Number(answers.score)}`;
  if (Object.hasOwn(interests, answers.field)) fields.interests = addSelections(profile?.interests, [interests[answers.field]]);
  if (teachingLanguages.has(answers.language)) {
    fields.preferred_languages = addSelections(profile?.preferred_languages, [answers.language]);
  }
  const destinations = answers.regions.filter(region => Object.hasOwn(countries, region)).map(region => countries[region]);
  if (destinations.length) fields.preferred_countries = addSelections(profile?.preferred_countries, destinations);
  return fields;
}
