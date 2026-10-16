import { hasGpaData } from './matching.js';

export const CATALOG_PAGE_SIZE = 24;
const byGpaGap = (gpa) => (a, b) => {
  const aHasGpa = hasGpaData(a), bHasGpa = hasGpaData(b);
  if (!aHasGpa || !bHasGpa) return aHasGpa === bHasGpa ? 0 : aHasGpa ? -1 : 1;
  return (gpa - b.min_gpa) - (gpa - a.min_gpa);
};

// Filter the complete fetched collection before paging. Unknown data semantics
// match the original catalog; this module does not change admission scoring.
export function selectCatalogResults(universities, filters, searchQuery) {
  const query = searchQuery.toLowerCase();
  const filtered = universities.filter(uni => {
    if (query && ![uni.name, uni.country, uni.city].some(value => value?.toLowerCase().includes(query))) return false;
    if (filters.budget && uni.tuition_min > filters.budget) return false;
    if (filters.ielts > 0 && uni.required_ielts && uni.required_ielts > filters.ielts) return false;
    if (filters.region && uni.region !== filters.region) return false;
    if (filters.country && uni.country !== filters.country) return false;
    if (filters.languages?.length > 0 && !filters.languages.includes(uni.language)) return false;
    if (filters.degree && !uni.degree_levels?.includes(filters.degree)) return false;
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
