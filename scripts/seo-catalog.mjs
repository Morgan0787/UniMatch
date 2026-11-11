import { createClient } from '@supabase/supabase-js';
import { loadPublicCatalog } from '../src/lib/admissions/catalog.js';

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
  // Reject URL parsers' permissive interpretation of nested protocol strings.
  if (!/^https:\/\//i.test(value) || /https?:\/\//i.test(value.slice(value.indexOf('://') + 3))) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password
      || parsed.hostname === 'http' || parsed.hostname === 'https' || parsed.pathname.startsWith('//')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function isCurrentVerified(fact) {
  return isObject(fact) && fact.status === 'current_verified' && fact.applicability === 'confirmed'
    && Array.isArray(fact.sourceIds) && fact.sourceIds.length > 0;
}

function factValue(fact) {
  return isCurrentVerified(fact) ? fact.value : null;
}

function citedSourcesFor(facts, sources) {
  const byUrl = new Map();
  for (const fact of facts) {
    if (!isCurrentVerified(fact)) continue;
    for (const sourceId of fact.sourceIds) {
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

function projectProgramme(programme, institution, sources) {
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
  const locationFact = programme.location;
  const locationValue = factValue(locationFact);
  const verifiedLocation = isObject(locationValue) && citedSourcesFor([locationFact], sources).length
    ? locationValue : null;
  const country = safeText(verifiedLocation?.country) || safeText(institution.country);
  const campus = safeText(verifiedLocation?.campus) || safeText(institution.city);
  const includedFacts = [nameFact, degreeFact];
  if (field) includedFacts.push(fieldFact);
  if (verifiedLocation) includedFacts.push(locationFact);

  return {
    name,
    degree,
    field,
    country,
    campus,
    sources: citedSourcesFor(includedFacts, sources),
  };
}

/** Convert an adapted public catalog into the deliberately small SEO feed. */
export function projectSeoInstitutions(adapted) {
  if (!isObject(adapted) || !Array.isArray(adapted.institutions)) return [];
  const output = [];

  for (const institution of adapted.institutions) {
    if (!isObject(institution) || typeof institution.id !== 'string'
      || typeof institution.institutionId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(institution.institutionId)
      || !Array.isArray(institution.programmes)) continue;

    const programmes = institution.programmes
      .map(programme => projectProgramme(programme, institution, institution.sources))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name) || a.degree.localeCompare(b.degree));
    if (programmes.length === 0) continue;

    output.push({
      id: institution.id,
      slug: institution.institutionId,
      name: safeText(institution.name),
      country: safeText(institution.country),
      city: safeText(institution.city),
      website: safeHttpsUrl(institution.media?.homepage) || safeHttpsUrl(institution.website),
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

function publicCatalogEnabled(env) {
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
