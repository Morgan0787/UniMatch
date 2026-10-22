import { hasGpaData } from './matching.js';
import { describePublicFact } from './admissions/factPresentation.js';

export const CATALOG_PAGE_SIZE = 24;
const byGpaGap = (gpa) => (a, b) => {
  if (!Number.isFinite(gpa)) return 0;
  const aHasGpa = hasGpaData(a), bHasGpa = hasGpaData(b);
  if (!aHasGpa || !bHasGpa) return aHasGpa === bHasGpa ? 0 : aHasGpa ? -1 : 1;
  return (gpa - b.min_gpa) - (gpa - a.min_gpa);
};

const factValue = (programme, key) => {
  const fact = programme?.facts?.[key] ?? programme?.[key];
  if (key === 'degree') return confirmedFactValue(fact);
  if (fact && typeof fact === 'object') {
    const display = describePublicFact(fact, 'en').value;
    return display === 'Unknown' ? null : display;
  }
  return typeof fact === 'string' ? fact : null;
};

const confirmedFactValue = (fact) => fact?.status === 'current_verified' && fact.applicability === 'confirmed' ? fact.value : null;
const canonicalProgrammes = (uni) => uni.admissionCatalog?.status !== 'invalid' && Array.isArray(uni.admissionCatalog?.programmes) ? uni.admissionCatalog.programmes : [];
const programmeText = (uni) => canonicalProgrammes(uni).flatMap(programme => [
  factValue(programme, 'name'), factValue(programme, 'field'), factValue(programme, 'degree'),
]).flatMap(value => {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return [value.name, value.label, value.level, value.award].filter(Boolean);
  return [];
});

const canonicalLanguages = (uni) => canonicalProgrammes(uni).map(programme => confirmedFactValue(programme?.facts?.teachingLanguage ?? programme?.teachingLanguage)).filter(value => typeof value === 'string');
const normalizeDegree = (value) => {
  if (value && typeof value === 'object') value = value.level;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
  if (['bachelor', 'bachelors', 'bachelor degree', 'undergraduate'].includes(normalized)) return 'Bachelor';
  if (['master', 'masters', 'master degree', 'graduate'].includes(normalized)) return 'Master';
  if (['phd', 'ph.d.', 'doctorate', 'doctoral'].includes(normalized)) return 'PhD';
  return null;
};
const canonicalDegrees = (uni) => canonicalProgrammes(uni).map(programme => {
  const value = factValue(programme, 'degree');
  return normalizeDegree(value);
}).filter(Boolean);

// Filter the complete fetched collection before paging. Unknown data semantics
// match the original catalog; this module does not change admission scoring.
export function selectCatalogResults(universities, filters, searchQuery) {
  const query = searchQuery.toLowerCase();
  const filtered = universities.filter(uni => {
    if (query && ![uni.name, uni.country, uni.city, ...(Array.isArray(uni.notable_programs) ? uni.notable_programs : []), ...programmeText(uni)].some(value => typeof value === 'string' && value.toLowerCase().includes(query))) return false;
    if (filters.budget != null && uni.tuition_min != null && uni.tuition_min > filters.budget) return false;
    if (filters.ielts > 0 && uni.required_ielts && uni.required_ielts > filters.ielts) return false;
    if (filters.region && uni.region !== filters.region) return false;
    if (filters.country && uni.country !== filters.country) return false;
    if (filters.languages?.length > 0 && ![...(Array.isArray(uni.language) ? uni.language : [uni.language]), ...canonicalLanguages(uni)].some(language => filters.languages.includes(language))) return false;
    if (filters.degree && ![...(Array.isArray(uni.degree_levels) ? uni.degree_levels : []).map(normalizeDegree), ...canonicalDegrees(uni)].includes(normalizeDegree(filters.degree))) return false;
    if (filters.scholarshipsOnly && !uni.scholarships_available) return false;
    return true;
  });
  const defaultView = !query && !filters.region && !filters.country && !filters.languages?.length && !filters.degree && !filters.scholarshipsOnly;
  if (!defaultView) return [...filtered].sort(byGpaGap(filters.gpa));
  const countries = new Map();
  for (const uni of filtered) {
    if (!countries.has(uni.country)) countries.set(uni.country, []);
    countries.get(uni.country).push(uni);
  }
  const groups = [...countries.values()].map(rows => [...rows].sort(byGpaGap(filters.gpa)));
  const balanced = [];
  // Stable interleaving keeps four leading options per country without
  // reshuffling them when a dialog, filter sheet or comparison opens.
  for (let index = 0; index < 4; index++) {
    for (const rows of groups) if (rows[index]) balanced.push(rows[index]);
  }
  const remaining = groups.flatMap(rows => rows.slice(4)).sort(byGpaGap(filters.gpa));
  return [...balanced, ...remaining];
}

export function getCatalogPage(results, requestedPage, pageSize = CATALOG_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, pages));
  const offset = (page - 1) * pageSize;
  return { page, pages, rows: results.slice(offset, offset + pageSize), start: results.length ? offset + 1 : 0, end: Math.min(offset + pageSize, results.length) };
}
