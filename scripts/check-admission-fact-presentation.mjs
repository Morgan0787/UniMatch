import assert from 'node:assert/strict';
import { describePublicFact } from '../src/lib/admissions/factPresentation.js';

const fact = (value, extra = {}) => ({ status: 'current_verified', value, applicability: 'confirmed', sourceIds: ['official'], ...extra });

const tuition = describePublicFact(fact({ amount: 12500, currency: 'USD', period: 'semester', feeYear: '2026–27' }), 'en', 'tuition');
assert.equal(tuition.value, '12500 USD / semester (2026–27)');
assert.deepEqual(tuition.sourceIds, ['official']);
assert.equal(describePublicFact(fact({ amount: 12345.6789, currency: 'EUR', period: 'credit_hour', feeYear: '2026' }), 'en', 'tuition').value, '12345.6789 EUR / credit hour (2026)');
assert.equal(describePublicFact(fact({ amount: 12000, currency: 'USD', period: 'academic_year_9_months' }), 'en', 'tuition').value, '12000 USD / 9-month academic year');
assert.equal(describePublicFact(fact({ amount: 12000, currency: 'USD', period: '12_months' }), 'en', 'tuition').value, '12000 USD / 12 months');
assert.equal(describePublicFact(fact({ amount: null, currency: 'USD', period: null, feeYear: '2026–27' }), 'en', 'tuition').value, 'Amount unknown USD / period unknown (2026–27)');
assert.equal(describePublicFact(fact({ amount: 9, currency: 'EUR', period: null }), 'ru', 'tuition').value, '9 EUR / период неизвестен');
assert.match(describePublicFact(fact({ amount: 396.3, currency: 'USD', period: 'credit_hour', label: 'Nonresident undergraduate base tuition; course and mandatory fees are additional.' }), 'en', 'tuition').value, /396.3 USD \/ credit hour.*fees are additional/);

assert.equal(describePublicFact(fact({ level: 'Master', award: 'Master of Science' }), 'en', 'degree').value, 'Master of Science');
assert.equal(describePublicFact(fact({ level: 'Master', award: null }), 'en', 'degree').value, 'Master');

const rule = describePublicFact(fact({
  type: 'all', children: [
    { type: 'grade', minimum: 3.5, scale: '4' },
    { type: 'any', children: [{ type: 'ielts', minimum: 6.5 }, { type: 'ielts', minimum: 7, requiresDate: true }] },
  ],
}), 'en', 'rule');
assert.equal(rule.value, 'minimum 3.5 on the original 4-point scale and (IELTS minimum 6.5 or IELTS minimum 7; test date validity also applies)');
assert.ok(rule.value.includes('original 4-point scale'));
assert.ok(rule.value.includes('IELTS minimum 6.5 or IELTS minimum 7'));
assert.ok(rule.value.includes('test date validity also applies'));
const detailedIelts = describePublicFact(fact({
  type: 'ielts', minimum: 6.5, sections: { Writing: 6, Speaking: 6.5 }, validityYears: 2, referenceDate: '2027-01-01',
}), 'en', 'rule');
assert.equal(detailedIelts.value, 'IELTS minimum 6.5; Writing minimum 6; Speaking minimum 6.5; valid for 2 years as of 2027-01-01');
assert.ok(describePublicFact(fact({ type: 'ielts', minimum: 6.5, sections: { Writing: 6 } }), 'ru', 'rule').value.includes('минимум 6 по разделу «Письмо»'));
assert.ok(describePublicFact(fact({ type: 'ielts', minimum: 6.5, validityYears: 2, referenceDate: '2027-01-01' }), 'uz', 'rule').value.includes('amal muddati 2 yil'));
const scopedRule = describePublicFact(fact({
  type: 'grade', minimum: 3, scale: '5', scope: { credential: 'Academic lyceum diploma', schoolCountry: 'Uzbekistan', intakeYear: 2027 },
}), 'en', 'rule');
assert.ok(scopedRule.value.includes('credential: Academic lyceum diploma'));
assert.ok(scopedRule.value.includes('school country: Uzbekistan'));
assert.ok(scopedRule.value.includes('intake year: 2027'));

const deadline = describePublicFact(fact({ date: '2027-02-01', timezone: 'Europe/Helsinki' }), 'ru', 'deadline');
assert.equal(deadline.value, '2027-02-01 (Europe/Helsinki)');
const rounds = describePublicFact(fact({ date: null, timezone: null, entries: [
  { label: 'Autumn round', date: '2027-03-01', monthDay: null, time: '16:00', timezone: 'Europe/Helsinki' },
  { label: 'Spring round', date: null, monthDay: '10-15', time: null, timezone: null },
] }), 'en', 'deadline');
assert.equal(rounds.value, 'Autumn round: 2027-03-01 16:00 (Europe/Helsinki); Spring round: 10-15 (timezone unknown)');
assert.ok(!rounds.value.includes('2026-10-15'));

const historical = describePublicFact({
  status: 'historical_reference', value: null, applicability: 'unconfirmed', sourceIds: [],
  historical: { value: { amount: 9000, currency: 'EUR', period: 'year', feeYear: '2025–26' }, referenceSeason: '2025–26', sourceIds: ['archive'] },
}, 'en', 'tuition');
assert.equal(historical.value, '9000 EUR / year (2025–26)');
assert.match(historical.notice, /Historical reference for 2025–26; current applicability is unconfirmed/);
assert.deepEqual(historical.sourceIds, ['archive']);

const unknown = describePublicFact(fact(null), 'uz', 'tuition');
assert.equal(unknown.value, 'Noma’lum');
assert.match(unknown.notice, /hali tasdiqlanishi kerak/);
assert.notEqual(unknown.value, 'Free');
assert.notEqual(unknown.value, '[object Object]');
const scopedFact = { ...fact(null), scope: { studentCategory: 'international', route: 'direct', credential: 'academic_lyceum_diploma' } };
assert.ok(!describePublicFact(scopedFact, 'ru').notice.includes('Область'));
const unknownScoped = describePublicFact(scopedFact, 'ru', 'text', { includeScope: true });
assert.ok(unknownScoped.notice.includes('Иностранные абитуриенты'));
assert.ok(unknownScoped.notice.includes('Прямое поступление'));
assert.ok(unknownScoped.notice.includes('Диплом академического лицея'));
assert.ok(!unknownScoped.notice.includes('academic_lyceum_diploma'));

const published = describePublicFact({ ...fact(6.5), status: 'published_unconfirmed', applicability: 'unconfirmed' }, 'ru');
assert.equal(published.value, '6.5');
assert.match(published.notice, /применимость к этому набору не подтверждена/i);

console.log('Admission fact presentation checks passed.');
