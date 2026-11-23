import { createClient } from '@supabase/supabase-js';
import { loadPublicCatalog } from '../src/lib/admissions/catalog.js';
import { describePublicFact, normalizeIntakeText } from '../src/lib/admissions/factPresentation.js';
import { loadUniversityCatalog } from '../src/lib/catalogRepository.js';
import { normalizeUniversity } from '../src/lib/normalizeUniversity.js';
import { selectCatalogResults } from '../src/lib/catalogResults.js';
import { DEFAULT_FILTERS } from '../src/lib/catalogState.js';
import { canonicalCountry } from '../src/lib/universityGeography.js';

const DEFAULT_TABLE = 'universities';
const FETCH_TIMEOUT_MS = 15_000;
const SAFE_TABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\\\u0000-\u001f]/.test(value)) return null;
  if (!/^https:\/\//i.test(value)) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password
      || parsed.hostname === 'http' || parsed.hostname === 'https' || parsed.pathname.startsWith('//')) return null;
    // Allow Internet Archive snapshots (/web/<timestamp>/https://...) while rejecting accidental double schemes like https://https://.
    const rest = value.slice(value.indexOf('://') + 3);
    const isArchiveSnapshot = parsed.hostname === 'web.archive.org' && /^\/web\/\d+(?:[a-z_]+)?\/https?:\/\//i.test(parsed.pathname);
    if (!isArchiveSnapshot && /https?:\/\//i.test(rest)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function normalizeWebsiteUrl(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/^(https?:\/\/)+/i, 'https://');
  return safeHttpsUrl(cleaned);
}

function isCurrentVerified(fact) {
  return isObject(fact) && fact.status === 'current_verified' && fact.applicability === 'confirmed'
    && Array.isArray(fact.sourceIds) && fact.sourceIds.length > 0;
}

function factValue(fact) {
  return isCurrentVerified(fact) ? fact.value : null;
}

function hasBroadProgrammeScope(fact, programmeId, intakeYear) {
  const scope = fact?.scope;
  return isCurrentVerified(fact) && isObject(scope) && scope.programmeId === programmeId
    && (scope.route === null || scope.route === 'direct')
    && scope.studentCategory === null && scope.schoolCountry === null && scope.credential === null
    && Number.isInteger(intakeYear) && scope.intakeYear === intakeYear;
}

function citedSourcesFor(facts, sources, { requireCurrent = true } = {}) {
  const byUrl = new Map();
  for (const fact of facts) {
    if (!isObject(fact)) continue;
    if (requireCurrent && !isCurrentVerified(fact)) continue;
    const ids = [
      ...(Array.isArray(fact.sourceIds) ? fact.sourceIds : []),
      ...(fact.status === 'historical_reference' && Array.isArray(fact.historical?.sourceIds) ? fact.historical.sourceIds : []),
    ];
    for (const sourceId of ids) {
      if (typeof sourceId !== 'string' || !isObject(sources) || !Object.hasOwn(sources, sourceId)) continue;
      const source = sources[sourceId];
      if (!isObject(source)) continue;
      const url = safeHttpsUrl(source.url);
      const title = safeText(source.title);
      const checkedAt = safeText(source.checkedAt);
      if (!url || !title || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt || '')) continue;
      const parsedDate = new Date(`${checkedAt}T00:00:00Z`);
      if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== checkedAt) continue;
      byUrl.set(url, { url, title, checkedAt });
    }
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

function projectDescriptiveFact(fact, kind, sources, { includeScope = true } = {}) {
  if (!isObject(fact) || fact.status === 'unknown') return null;
  const resolvedSources = citedSourcesFor([fact], sources, { requireCurrent: false });
  if (!resolvedSources.length) return null;
  const described = describePublicFact(fact, 'en', kind, { includeScope });
  if (!described.value || described.value === 'Unknown') return null;
  return {
    value: described.value,
    notice: described.notice || '',
    status: fact.status,
    sources: resolvedSources,
  };
}

function projectProgramme(programme, institution, sources, targetIntakeYear) {
  if (!isObject(programme) || !isObject(programme.facts)) return null;
  const facts = programme.facts;
  const nameFact = facts.name;
  const degreeFact = facts.degree;
  const name = safeText(factValue(nameFact));
  const rawDegree = factValue(degreeFact);
  const degree = safeText(typeof rawDegree === 'string' ? rawDegree : rawDegree?.level);
  if (!name || !degree) return null;
  const identitySources = citedSourcesFor([nameFact, degreeFact], sources);
  if (identitySources.length === 0
    || citedSourcesFor([nameFact], sources).length === 0
    || citedSourcesFor([degreeFact], sources).length === 0) return null;

  const fieldFact = facts.field;
  const fieldSources = citedSourcesFor([fieldFact], sources);
  const field = fieldSources.length ? safeText(factValue(fieldFact)) : null;
  const intakeFact = facts.intake;
  const rawIntake = factValue(intakeFact);
  const intakeSources = isObject(rawIntake) && hasBroadProgrammeScope(intakeFact, programme.id, targetIntakeYear)
    && (rawIntake.year === null || rawIntake.year === targetIntakeYear)
    ? citedSourcesFor([intakeFact], sources) : [];
  const intakeText = intakeSources.length ? safeText(normalizeIntakeText(rawIntake.text)) : null;
  const intakeYearsInText = intakeText?.match(/\b(?:19|20|21)\d{2}\b/g) || [];
  const intakeTextMatchesScope = intakeYearsInText.every(year => Number(year) === targetIntakeYear);
  const intake = intakeText && intakeTextMatchesScope ? { year: targetIntakeYear, text: intakeText } : null;
  const teachingLanguageFact = facts.teachingLanguage;
  const teachingLanguageSources = hasBroadProgrammeScope(teachingLanguageFact, programme.id, targetIntakeYear)
    ? citedSourcesFor([teachingLanguageFact], sources) : [];
  const teachingLanguage = teachingLanguageSources.length ? safeText(factValue(teachingLanguageFact)) : null;
  const locationFact = programme.location;
  const locationValue = factValue(locationFact);
  const verifiedLocation = isObject(locationValue) && citedSourcesFor([locationFact], sources).length
    ? locationValue : null;
  const country = canonicalCountry(safeText(verifiedLocation?.country) || safeText(institution.country));
  const campus = safeText(verifiedLocation?.campus);

  const tuition = projectDescriptiveFact(facts.tuition, 'tuition', sources);
  const tuitionScope = facts.tuition?.scope;
  const deadline = projectDescriptiveFact(facts.deadline, 'deadline', sources);
  const academicRequirement = facts.requirementPolicy === null
    ? projectDescriptiveFact(facts.academicRequirement, 'rule', sources)
    : null;
  const languageSourceFact = facts.languageThreshold && facts.languageThreshold.status !== 'unknown'
    ? facts.languageThreshold
    : facts.languageRequirement;
  const languageRequirement = projectDescriptiveFact(languageSourceFact, 'rule', sources);

  const includedFacts = [nameFact, degreeFact];
  if (field) includedFacts.push(fieldFact);
  if (verifiedLocation) includedFacts.push(locationFact);
  if (teachingLanguage) includedFacts.push(teachingLanguageFact);
  if (intake) includedFacts.push(intakeFact);
  if (tuition) includedFacts.push(facts.tuition);
  if (deadline) includedFacts.push(facts.deadline);
  if (academicRequirement) includedFacts.push(facts.academicRequirement);
  if (languageRequirement) includedFacts.push(languageSourceFact);

  return {
    name,
    degree,
    field,
    country,
    campus,
    teachingLanguage,
    teachingLanguageYear: teachingLanguage ? targetIntakeYear : null,
    intake,
    tuition: tuition ? {
      value: tuition.value, notice: tuition.notice, status: tuition.status,
      generalAudience: !!tuitionScope && [tuitionScope.studentCategory, tuitionScope.schoolCountry, tuitionScope.credential, tuitionScope.route]
        .every(value => value == null),
    } : null,
    deadline: deadline ? { value: deadline.value, notice: deadline.notice } : null,
    academicRequirement: academicRequirement ? { value: academicRequirement.value, notice: academicRequirement.notice } : null,
    languageRequirement: languageRequirement ? { value: languageRequirement.value, notice: languageRequirement.notice } : null,
    evidenceSources: [
      ...(teachingLanguage ? teachingLanguageSources.map(source => ({ url: source.url, fact: 'teaching language' })) : []),
      ...(intake ? intakeSources.map(source => ({ url: source.url, fact: 'intake' })) : []),
      ...(tuition ? tuition.sources.map(source => ({ url: source.url, fact: 'tuition' })) : []),
      ...(deadline ? deadline.sources.map(source => ({ url: source.url, fact: 'deadline' })) : []),
      ...(academicRequirement ? academicRequirement.sources.map(source => ({ url: source.url, fact: 'academic requirement' })) : []),
      ...(languageRequirement ? languageRequirement.sources.map(source => ({ url: source.url, fact: 'language requirement' })) : []),
    ],
    sources: citedSourcesFor(includedFacts, sources, { requireCurrent: false }),
  };
}

/** Convert an adapted public catalog into the grounded SEO feed. */
export function projectSeoInstitutions(adapted) {
  if (!isObject(adapted) || !Array.isArray(adapted.institutions)) return [];
  const output = [];

  for (const institution of adapted.institutions) {
    if (!isObject(institution) || typeof institution.id !== 'string'
      || typeof institution.institutionId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(institution.institutionId)
      || !Array.isArray(institution.programmes)) continue;

    const programmes = institution.programmes
      .map(programme => projectProgramme(programme, institution, institution.sources, institution.targetIntakeYear))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name) || a.degree.localeCompare(b.degree));
    if (programmes.length === 0) continue;

    output.push({
      id: institution.id,
      slug: institution.institutionId,
      name: safeText(institution.name),
      country: canonicalCountry(safeText(institution.country)),
      city: safeText(institution.city),
      website: safeHttpsUrl(institution.media?.homepage) || normalizeWebsiteUrl(institution.website),
      programmes,
    });
  }

  return output
    .filter(institution => institution.name && institution.country)
    .sort((a, b) => a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id));
}

function isAllowedPublicKey(key) {
  if (typeof key !== 'string' || key.length < 20 || key.length > 4096) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    return isObject(payload) && payload.role === 'anon';
  } catch {
    return false;
  }
}

export function publicCatalogEnabled(env) {
  if (env.VERCEL_ENV === 'production') return true;
  if (env.SEO_FETCH_PUBLIC_CATALOG === '0') return false;
  return env.VERCEL_ENV === 'preview' || env.SEO_FETCH_PUBLIC_CATALOG === '1';
}

/** Load current public catalog data for static SEO generation, or [] when offline. */
export async function loadSeoInstitutions(env = process.env) {
  if (!publicCatalogEnabled(env)) return [];

  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const table = env.VITE_TABLE_UNIVERSITY || DEFAULT_TABLE;
  if (typeof url !== 'string' || !safeHttpsUrl(url)
    || !isAllowedPublicKey(anonKey) || !SAFE_TABLE_NAME.test(table)) {
    throw new Error('catalog_configuration_invalid');
  }

  const client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const adapted = await loadPublicCatalog(client, { signal: controller.signal, table });
    return projectSeoInstitutions(adapted);
  } catch {
    throw new Error('catalog_load_failed');
  } finally {
    clearTimeout(timeout);
  }
}

function previewImage(row) {
  const image = row?.admissionCatalog?.media?.image;
  if (!image) return null;
  const url = safeHttpsUrl(image.url);
  const sourcePage = safeHttpsUrl(image.sourcePage);
  const licenseUrl = safeHttpsUrl(image.license?.url);
  if (!url || !sourcePage || !licenseUrl || !safeText(image.license?.id)
    || !safeText(image.creator) || !safeText(image.attribution)
    || !Number.isFinite(image.width) || image.width <= 0
    || !Number.isFinite(image.height) || image.height <= 0) return null;
  const localized = {};
  for (const language of ['en', 'ru', 'uz']) {
    const content = image.localized?.[language];
    if (!isObject(content)) continue;
    const caption = safeText(content.caption);
    const title = safeText(content.title);
    if (caption || title) localized[language] = { ...(caption ? { caption } : {}), ...(title ? { title } : {}) };
  }
  return {
    url, sourcePage,
    license: { id: safeText(image.license.id), url: licenseUrl },
    creator: safeText(image.creator), attribution: safeText(image.attribution),
    width: image.width, height: image.height,
    ...(safeText(image.caption) ? { caption: safeText(image.caption) } : {}),
    ...(safeText(image.title) ? { title: safeText(image.title) } : {}),
    ...(Object.keys(localized).length ? { localized } : {}),
  };
}

/** Load a bounded public read, then emit only the first six default Search rows. */
export async function loadSeoCatalogPreview(env = process.env) {
  if (!publicCatalogEnabled(env)) return null;

  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const table = env.VITE_TABLE_UNIVERSITY || DEFAULT_TABLE;
  if (typeof url !== 'string' || !safeHttpsUrl(url)
    || !isAllowedPublicKey(anonKey) || !SAFE_TABLE_NAME.test(table)) {
    throw new Error('catalog_configuration_invalid');
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const data = await loadUniversityCatalog(client, table, { signal: controller.signal });
    const universities = data.map(normalizeUniversity);
    const selected = selectCatalogResults(universities, DEFAULT_FILTERS, '');
    const rows = selected.slice(0, 6).map(row => {
      const image = previewImage(row);
      return {
        id: row.id,
        name: row.name,
        country: row.country,
        city: row.city,
        ...(image ? { admissionCatalog: { status: 'valid', media: { image } } } : {}),
      };
    });
    if (!rows.every(row => typeof row.id === 'string' && row.id.trim() && typeof row.name === 'string' && row.name.trim())) return null;
    return { rows, total: selected.length };
  } catch {
    throw new Error('catalog_preview_load_failed');
  } finally {
    clearTimeout(timeout);
  }
}
