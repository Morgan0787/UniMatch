import assert from 'node:assert/strict';
import { emptyAnswers } from '../src/lib/admissions/evaluate.js';
import { surveyProfileFields } from '../src/lib/admissions/surveyProfile.js';

const answers = { ...emptyAnswers(), field: 'software_engineering', regions: ['USA', 'Europe', 'South Korea'],
  language: 'Korean', exam: 'IELTS', score: '8.5', grade: '3.75', scale: '4', budget: '4000', currency: 'EUR' };
assert.deepEqual(surveyProfileFields(answers), {
  target_degree: 'Bachelor', gpa: 3.75, english_proficiency: 8.5, interests: ['Software Engineering'],
  preferred_languages: ['Korean'], preferred_countries: ['United States', 'South Korea'],
});
const existing = { target_degree: 'Master', gpa: 3.5, budget_max: 9000, english_proficiency: 7, saved_universities: ['saved'],
  interests: ['Law'], preferred_languages: ['English', 'Korean'], preferred_countries: ['Germany'] };
assert.deepEqual(surveyProfileFields(answers, existing), {
  gpa: 3.75, english_proficiency: 8.5, interests: ['Law', 'Software Engineering'],
  preferred_languages: ['English', 'Korean'], preferred_countries: ['Germany', 'United States', 'South Korea'],
});
assert.deepEqual(surveyProfileFields({ ...emptyAnswers(), exam: 'TOPIK', score: '4' }, existing), { topikLevel: 'TOPIK 4' });
assert.deepEqual(surveyProfileFields({ ...emptyAnswers(), language: 'Polish' }, existing), { preferred_languages: ['English', 'Korean', 'Polish'] });
assert.deepEqual(surveyProfileFields({ ...emptyAnswers(), exam: 'TOEFL', score: '100', grade: '4.5', scale: '5' }, existing), {});
assert.deepEqual(surveyProfileFields(emptyAnswers(), existing), {});
assert.throws(() => surveyProfileFields({ ...answers, score: '15' }), /Invalid survey answers/);
console.log('Survey profile check passed: compatible fields, exact exams, omitted answers and existing preferences.');
