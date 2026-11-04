import { describePublicFact } from './admissions/factPresentation.js';
import { groupPublicSources } from './admissions/sourcePresentation.js';
import { catalogValue } from './catalogCopy.js';

export const COMPARISON_INSTITUTION_FIELDS = ['country', 'city', 'website'];

export const COMPARISON_FIELDS = [
  ['degree', 'degree'], ['teachingLanguage', 'text'], ['tuition', 'tuition'],
  ['intake', 'intake'], ['deadline', 'deadline'],
  ['academicRequirement', 'rule'], ['languageRequirement', 'rule'],
];

/** Compare the validated programme facts used by university cards. */
export function comparisonProgrammes(university) {
  const catalog = university?.admissionCatalog;
  return catalog?.status === 'valid' && Array.isArray(catalog.programmes) ? catalog.programmes : [];
}

export function comparisonFact(programme, key, kind, language = 'en') {
  const fact = programme?.facts?.[key] ?? programme?.[key];
  const display = describePublicFact(fact, language, kind);
  const scoped = describePublicFact(fact, language, kind, { includeScope: true });
  return { ...display, detail: scoped.notice !== display.notice ? scoped.notice : '' };
}

export function comparisonSources(university, fact, label = '') {
  const sources = university?.admissionCatalog?.sources || {};
  return groupPublicSources([{ fact, label }], sources);
}

export function comparisonProgrammeSources(university, programme, labels) {
  if (!programme) return [];
  const facts = programme.facts || programme;
  return groupPublicSources([
    { fact: facts.name, label: labels.programme },
    ...COMPARISON_FIELDS.map(([key]) => ({ fact: facts[key], label: labels[key] })),
    ...(programme.costReferences || []).map(fact => ({ fact, label: labels.tuition })),
    ...(programme.publicNotes || []).map(fact => ({ fact, label: labels.scope })),
  ], university?.admissionCatalog?.sources || {});
}

/** General university fields remain visible even when no programme is validated. */
export function comparisonInstitutionValue(university, key, language = 'en') {
  if (key === 'country') return typeof university?.country === 'string' && university.country.trim()
    ? catalogValue(university.country, language) : '';
  if (key === 'city') return typeof university?.city === 'string' && university.city.trim() ? university.city : '';
  if (key === 'website') {
    try {
      const url = new URL(university?.website);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  return '';
}

/** Retain the selected programme, institution UUID and provenance from a survey. */
export function comparisonUniversity(option, institution = null) {
  return { id: option.institutionId, name: option.university, country: institution?.country || option.country,
    city: institution?.city || null, website: institution?.website || null,
    admissionCatalog: { status: 'valid', programmes: [{ id: option.id, ...option.facts }],
      sources: Object.fromEntries(option.sources.map(source => [source.key, source])) } };
}
