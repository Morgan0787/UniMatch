import { hasGpaData } from './matching.js';
import { describePublicFact } from './admissions/factPresentation.js';
import { getUniversityPhoto } from './admissions/presentation.js';
import { toUsd } from './tuitionCurrency.js';

export const CATALOG_PAGE_SIZE = 24;
const byGpaGap = (gpa) => (a, b) => {
  if (!Number.isFinite(gpa)) return 0;
  const aHasGpa = hasGpaData(a), bHasGpa = hasGpaData(b);
  if (!aHasGpa || !bHasGpa) return aHasGpa === bHasGpa ? 0 : aHasGpa ? -1 : 1;
  return (gpa - b.min_gpa) - (gpa - a.min_gpa);
};

// Browse presentation only: apply after filtering, preserving the existing
// order within each group. Photos never enter admission scores or survey ranks.
const prioritizePhotos = (rows) => {
  const withPhotos = [], withoutPhotos = [];
  for (const row of rows) (getUniversityPhoto(row) ? withPhotos : withoutPhotos).push(row);
  return [...withPhotos, ...withoutPhotos];
};

export const getCatalogueProgrammeFact = (programme, key) => programme?.facts?.[key] ?? programme?.[key];

const factValue = (programme, key) => {
  const fact = getCatalogueProgrammeFact(programme, key);
  if (key === 'degree') return confirmedFactValue(fact);
  if (fact && typeof fact === 'object') {
    const display = describePublicFact(fact, 'en').value;
    return display === 'Unknown' ? null : display;
  }
  return typeof fact === 'string' ? fact : null;
};

const confirmedFactValue = (fact) => fact?.status === 'current_verified' && fact.applicability === 'confirmed' ? fact.value : null;
const canonicalProgrammes = (uni) => uni.admissionCatalog?.status !== 'invalid' && Array.isArray(uni.admissionCatalog?.programmes) ? uni.admissionCatalog.programmes : [];
const programmeText = (programme) => [
  factValue(programme, 'name'), factValue(programme, 'field'), factValue(programme, 'degree'),
].flatMap(value => {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return [value.name, value.label, value.level, value.award].filter(Boolean);
  return [];
});

const programmeLanguage = (programme) => confirmedFactValue(getCatalogueProgrammeFact(programme, 'teachingLanguage'));
const normalizeDegree = (value) => {
  if (value && typeof value === 'object') value = value.level;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
  if (['bachelor', 'bachelors', 'bachelor degree', 'undergraduate'].includes(normalized)) return 'Bachelor';
  if (['master', 'masters', 'master degree', 'graduate'].includes(normalized)) return 'Master';
  if (['phd', 'ph.d.', 'doctorate', 'doctoral'].includes(normalized)) return 'PhD';
  return null;
};
const programmeDegree = (programme) => normalizeDegree(factValue(programme, 'degree'));
const matchesText = (value, query) => typeof value === 'string' && value.toLowerCase().includes(query);
const matchesInstitution = (university, query) => [university.name, university.country, university.city].some(value => matchesText(value, query));

// Filter the complete fetched collection before paging. The Browse/SEO callers
// receive original university rows, independent of the programme preview.
export function selectCatalogResults(universities, filters, searchQuery) {
  const query = searchQuery.toLowerCase();
  const filtered = universities.filter(uni => {
    if (query && !matchesInstitution(uni, query) && ![...(Array.isArray(uni.notable_programs) ? uni.notable_programs : []), ...canonicalProgrammes(uni).flatMap(programmeText)].some(value => matchesText(value, query))) return false;
    if (filters.ielts > 0 && uni.required_ielts && uni.required_ielts > filters.ielts) return false;
    if (filters.region && uni.region !== filters.region) return false;
    if (filters.country && uni.country !== filters.country) return false;
    if (filters.languages?.length > 0 && ![...(Array.isArray(uni.language) ? uni.language : [uni.language]), ...canonicalProgrammes(uni).map(programmeLanguage).filter(value => typeof value === 'string')].some(language => filters.languages.includes(language))) return false;
    if (filters.degree && ![...(Array.isArray(uni.degree_levels) ? uni.degree_levels : []).map(normalizeDegree), ...canonicalProgrammes(uni).map(programmeDegree).filter(Boolean)].includes(normalizeDegree(filters.degree))) return false;
    if (filters.scholarshipsOnly && !uni.scholarships_available) return false;
    return true;
  });
  const defaultView = !query && !filters.region && !filters.country && !filters.languages?.length && !filters.degree && !filters.scholarshipsOnly;
  if (!defaultView) return prioritizePhotos([...filtered].sort(byGpaGap(filters.gpa)));
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
  return prioritizePhotos([...balanced, ...remaining]);
}

/** Use the same validated programme location at the point where tuition is shown. */
export function getCatalogueProgrammeLocation(programme) {
  const value = confirmedFactValue(getCatalogueProgrammeFact(programme, 'location'));
  return typeof value?.country === 'string' && value.country ? value : null;
}

function feeStartYear(season) {
  const match = /^(\d{4})(?:\s*[/–-]\s*(\d{2}|\d{4}))?$/.exec(typeof season === 'string' ? season.trim() : '');
  if (!match) return null;
  const year = Number(match[1]);
  const end = match[2];
  if (!end) return year;
  return Number(end) === (end.length === 2 ? (year + 1) % 100 : year + 1) ? year : null;
}

/** @param {number} budget @param {number} currentYear */
function assessProgrammeBudget(programme, catalog, budget, currentYear) {
  const fact = getCatalogueProgrammeFact(programme, 'tuition');
  const value = confirmedFactValue(fact);
  const scope = fact?.scope;
  const targetYear = catalog?.targetIntakeYear;
  const programmeRoute = confirmedFactValue(getCatalogueProgrammeFact(programme, 'route'))?.entryPath;
  const programmeIntake = confirmedFactValue(getCatalogueProgrammeFact(programme, 'intake'))?.year;
  if (!programme) return { group: 'unknown', reason: 'noProgramme' };
  // Search does not ask for an applicant category or credential. Price evidence
  // specific to one of those categories cannot establish fit in this view.
  if (catalog?.status !== 'valid' || !Number.isFinite(value?.amount) || value.amount < 0 || !scope || scope.programmeId !== programme.id
    || !Number.isInteger(targetYear) || targetYear < currentYear || scope.intakeYear !== targetYear
    || (Number.isInteger(programmeIntake) && programmeIntake !== targetYear)
    || feeStartYear(value.feeYear) !== targetYear || (fact.season != null && feeStartYear(fact.season) !== targetYear)
    || scope.studentCategory != null || scope.schoolCountry != null || scope.credential != null
    || (scope.route != null && scope.route !== programmeRoute)
    || !fact.sourceIds?.length || !fact.sourceIds.every(id => Object.hasOwn(catalog.sources || {}, id))) {
    return { group: 'unknown', reason: 'unconfirmedTuition' };
  }
  if (!['year', '12_months'].includes(value.period)) return { group: 'unknown', reason: 'nonAnnualTuition' };
  const amountUsd = toUsd(value.amount, value.currency);
  if (amountUsd == null) return { group: 'unknown', reason: 'unavailableExchangeRate' };
  return { group: Math.round(amountUsd) <= Math.round(budget) ? 'within' : 'above', reason: null };
}

/** One card per institution. Programme filters must agree on a single preview before claiming budget fit. */
export function selectCatalogSearchResults(universities, filters, searchQuery, currentYear = new Date().getUTCFullYear()) {
  const query = searchQuery.toLowerCase();
  const matches = selectCatalogResults(universities, filters, searchQuery);
  const hasBudget = Number.isFinite(filters.budget) && filters.budget >= 0;
  const requestedDegree = normalizeDegree(filters.degree);
  return matches.flatMap(university => {
    const programmes = canonicalProgrammes(university);
    const matchesQuery = query ? programmes.filter(programme => programmeText(programme).some(value => matchesText(value, query))) : [];
    const candidates = (!query || (matchesQuery.length === 0 && matchesInstitution(university, query)) ? programmes : matchesQuery)
      .filter(programme => (!filters.languages?.length || filters.languages.includes(programmeLanguage(programme)))
        && (!filters.degree || (requestedDegree && programmeDegree(programme) === requestedDegree)));
    if (!hasBudget) return [{ university, programme: candidates[0] ?? programmes[0] ?? null, budget: null }];
    if (programmes.length && !candidates.length) return [];
    if (!candidates.length) return [{ university, programme: null, budget: assessProgrammeBudget(null, null, filters.budget, currentYear) }];
    const options = candidates.map(programme => ({ university, programme, budget: assessProgrammeBudget(programme, university.admissionCatalog, filters.budget, currentYear) }));
    const representative = options.find(option => option.budget.group === 'within')
      ?? options.find(option => option.budget.group === 'unknown');
    return representative ? [representative] : [];
  });
}

export function getCatalogPage(results, requestedPage, pageSize = CATALOG_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, pages));
  const offset = (page - 1) * pageSize;
  return { page, pages, rows: results.slice(offset, offset + pageSize), start: results.length ? offset + 1 : 0, end: Math.min(offset + pageSize, results.length) };
}
