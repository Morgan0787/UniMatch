import { describePublicFact } from './admissions/factPresentation.js';

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

export function comparisonSources(university, fact) {
  const sources = university?.admissionCatalog?.sources || {};
  return fact.sourceIds.map(id => sources[id]).filter(source => {
    try { const url = new URL(source?.url); return url.protocol === 'https:' && !url.username && !url.password; }
    catch { return false; }
  });
}

/** Retain the selected programme, institution UUID and provenance from a survey. */
export function comparisonUniversity(option) {
  return { id: option.institutionId, name: option.university, country: option.country,
    admissionCatalog: { status: 'valid', programmes: [{ id: option.id, ...option.facts }],
      sources: Object.fromEntries(option.sources.map(source => [source.key, source])) } };
}
