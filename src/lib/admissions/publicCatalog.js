import { institutionIdFromFavorite } from './favoriteKeys.js';

const REGIONS = new Set(['Europe', 'USA', 'South Korea', 'UK', 'Canada']);
const FIELDS = new Set(['business', 'it', 'computer_engineering', 'software_engineering', 'computer_science']);
const DEGREES = new Set(['Bachelor', 'Master', 'PhD']);
const STATUSES = new Set(['current_verified', 'published_unconfirmed', 'historical_reference', 'estimate', 'unknown']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const CURRENCY = /^[A-Z]{3}$/;
const FACT_KEYS = ['name', 'degree', 'field', 'route', 'intake', 'teachingLanguage', 'academicRequirement', 'languageRequirement', 'languageThreshold', 'requirementPolicy', 'tuition', 'scholarships', 'deadline', 'competitiveness'];

/** @param {unknown} value @returns {value is Record<string, any>} */
function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
/** @param {unknown} value */
function text(value, max = 500) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
/** @param {unknown} value */
function validDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
/** @param {unknown} value */
function https(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}
/** @param {unknown} value */
function withinDocumentLimit(value) {
  try { return JSON.stringify(value).length <= 1_000_000; }
  catch { return false; }
}
/** @param {Record<string, any>} sources @param {unknown} key */
function hasSource(sources, key) { return typeof key === 'string' && Object.hasOwn(sources, key); }
/** @param {any} fact @param {Record<string, any>} sources */
function validFact(fact, sources) {
  if (!object(fact) || !STATUSES.has(fact.status) || !object(fact.scope)
    || !Array.isArray(fact.sourceIds) || !fact.sourceIds.every(key => hasSource(sources, key))
    || !(fact.season === null || text(fact.season, 80))
    || !['confirmed', 'unconfirmed', 'not_applicable'].includes(fact.applicability)
    || !(fact.noticeCode === null || ['historical', 'unconfirmed', 'estimate'].includes(fact.noticeCode))
    || (fact.value !== null && fact.status !== 'historical_reference' && fact.sourceIds.length === 0)
    || (fact.status === 'unknown' && fact.value !== null)) return false;
  const scope = fact.scope;
  if (!text(scope.programmeId, 100) || !(scope.route === null || text(scope.route, 120))) return false;
  for (const key of ['studentCategory', 'schoolCountry', 'credential']) if (!(scope[key] === null || text(scope[key], 120))) return false;
  if (!(scope.intakeYear === null || Number.isInteger(scope.intakeYear))) return false;
  if (fact.status === 'historical_reference') {
    return fact.value === null && object(fact.historical) && fact.historical.value != null
      && text(fact.historical.referenceSeason, 80) && validDate(fact.historical.checkedAt)
      && Array.isArray(fact.historical.sourceIds) && fact.historical.sourceIds.length > 0
      && fact.historical.sourceIds.every(key => hasSource(sources, key));
  }
  return fact.historical === null;
}
/** @param {string} key @param {any} value */
function validFactValue(key, value) {
  switch (key) {
    case 'name': case 'teachingLanguage': return text(value, 300);
    case 'degree': return DEGREES.has(value) || (object(value) && DEGREES.has(value.level)
      && (value.award === null || text(value.award, 120)));
    case 'field': return FIELDS.has(value);
    case 'route': return object(value) && ['direct', 'foundation', 'unknown'].includes(value.entryPath) && text(value.text, 500);
    case 'intake': return object(value) && (value.year === null || Number.isInteger(value.year)) && text(value.text, 300);
    case 'academicRequirement': case 'languageRequirement': case 'languageThreshold': return validRule(value, {} , 0, true);
    case 'requirementPolicy': case 'scholarships': return object(value);
    case 'tuition': return object(value) && (value.amount === null || (typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount >= 0))
      && CURRENCY.test(value.currency || '') && ['year', 'semester', 'credit_hour', 'academic_year_9_months', '12_months', null].includes(value.period)
      && (value.feeYear === null || text(value.feeYear, 80)) && (value.label === undefined || text(value.label, 300))
      && Array.isArray(value.includedFees) && value.includedFees.length <= 20 && value.includedFees.every(item => text(item, 200))
      && Array.isArray(value.excludedFees) && value.excludedFees.length <= 20 && value.excludedFees.every(item => text(item, 200));
    case 'deadline': return validDeadline(value);
    case 'competitiveness': return object(value) && ['extremely_selective', 'unknown'].includes(value.category) && text(value.basis, 500);
    default: return false;
  }
}
/** @param {any} value */
function validDeadline(value) {
  if (!object(value)) return false;
  if (validDate(value.date) && text(value.timezone, 100)) return true;
  if (value.date !== null || !(value.timezone === null || text(value.timezone, 100))
    || !Array.isArray(value.entries) || value.entries.length < 1 || value.entries.length > 32) return false;
  return value.entries.every(entry => object(entry)
    && text(entry.label, 200)
    && (entry.date === null || validDate(entry.date))
    && (entry.monthDay === null || (typeof entry.monthDay === 'string' && MONTH_DAY.test(entry.monthDay)
      && validDate(`2020-${entry.monthDay}`)))
    && (entry.time === null || (typeof entry.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)))
    && (entry.timezone === null || text(entry.timezone, 100))
    && (entry.date !== null || entry.monthDay !== null));
}
/** @param {unknown} rule @param {Record<string, any>} sources @param {number} depth */
function validRule(rule, sources, depth = 0, allowMissingSources = false) {
  if (!object(rule) || depth > 8 || !['unknown', 'grade', 'ielts', 'all', 'any'].includes(rule.type)) return false;
  if (['all', 'any'].includes(rule.type)) return Array.isArray(rule.children) && rule.children.length > 0 && rule.children.length <= 30
    && rule.children.every(child => validRule(child, sources, depth + 1, allowMissingSources));
  return typeof rule.sourceKey === 'string' && (allowMissingSources || hasSource(sources, rule.sourceKey));
}
/** @param {unknown} rule @param {string[]} sourceIds */
function ruleSourcesIncluded(rule, sourceIds) {
  if (!object(rule)) return false;
  if (Array.isArray(rule.children)) return rule.children.every(child => ruleSourcesIncluded(child, sourceIds));
  return typeof rule.sourceKey === 'string' && sourceIds.includes(rule.sourceKey);
}
/** @param {unknown} country */
function countryRegion(country) {
  if (typeof country !== 'string') return null;
  const normalized = country.trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
  if (['united states', 'united states of america', 'usa', 'us'].includes(normalized)) return 'USA';
  if (['united kingdom', 'uk', 'great britain', 'britain'].includes(normalized)) return 'UK';
  if (['south korea', 'republic of korea', 'korea south'].includes(normalized)) return 'South Korea';
  if (['canada'].includes(normalized)) return 'Canada';
  return null;
}
/** @param {any} fact @param {Record<string, any>} sources */
function normalizedRule(fact, sources, targetIntakeYear) {
  const value = fact?.value;
  const eligible = fact?.status === 'current_verified' && fact.applicability === 'confirmed'
    && Array.isArray(fact.sourceIds) && fact.sourceIds.length > 0
    && fact.sourceIds.every(key => hasSource(sources, key)) && validRule(value, sources)
    && ruleSourcesIncluded(value, fact.sourceIds)
    && fact.scope.intakeYear === targetIntakeYear
    && fact.scope.studentCategory === null && (fact.scope.route === null || fact.scope.route === 'direct');
  if (!eligible) return { type: 'unknown', verified: false, applicable: false };
  const copy = structuredClone(value);
  let scopeConflict = false;
  const gate = node => {
    if (Array.isArray(node.children)) node.children.forEach(gate);
    node.verified = true;
    node.applicable = true;
    const scope = object(node.scope) ? { ...node.scope } : {};
    for (const key of ['schoolCountry', 'credential', 'intakeYear']) {
      const factScopeKey = key === 'intakeYear' ? 'intakeYear' : key;
      const required = fact.scope[factScopeKey];
      if (required !== null && Object.hasOwn(scope, key) && scope[key] !== required) scopeConflict = true;
      if (required !== null) scope[key] = required;
    }
    if (Object.keys(scope).length) node.scope = scope;
  };
  gate(copy);
  return scopeConflict ? { type: 'unknown', verified: false, applicable: false } : copy;
}

/** A published overall-score reference is not an executable eligibility rule.
 * The survey explores bachelor entry after school; other applicant/route scopes
 * cannot be inferred. Historical references retain their own season.
 * @param {any} fact @param {Record<string, any>} sources @param {number} targetIntakeYear
 */
function publishedLanguageReference(fact, sources, targetIntakeYear) {
  if (!fact || !['current_verified', 'published_unconfirmed', 'historical_reference'].includes(fact.status)
    || fact.applicability === 'not_applicable') return null;
  const historical = fact.status === 'historical_reference';
  const value = historical ? fact.historical?.value : fact.value;
  const sourceIds = historical ? fact.historical?.sourceIds : fact.sourceIds;
  if (value?.type !== 'ielts' || !validRule(value, sources) || !Array.isArray(sourceIds)
    || !sourceIds.length || !ruleSourcesIncluded(value, sourceIds)
    || !sourceIds.every(key => hasSource(sources, key))
    || typeof value.minimum !== 'number' || !Number.isFinite(value.minimum) || value.minimum < 0 || value.minimum > 9
    || (value.scope != null && !object(value.scope))) return null;
  const scopes = [fact.scope, value.scope || {}];
  if (value.scope?.programmeId != null && value.scope.programmeId !== fact.scope.programmeId) return null;
  if (scopes.some(scope => (scope.studentCategory != null && scope.studentCategory !== 'international_freshman')
    || (scope.route != null && scope.route !== 'direct'))) return null;
  for (const key of ['schoolCountry', 'credential', 'intakeYear']) {
    if (fact.scope[key] != null && value.scope?.[key] != null && fact.scope[key] !== value.scope[key]) return null;
  }
  if (!historical && scopes.some(scope => scope.intakeYear != null && scope.intakeYear !== targetIntakeYear)) return null;
  if (fact.status === 'current_verified' && (fact.applicability !== 'confirmed' || fact.scope.intakeYear !== targetIntakeYear)) return null;
  return {
    minimum: value.minimum, sectionsRequired: object(value.sections) && Object.keys(value.sections).length > 0,
    sourceKey: value.sourceKey, status: fact.status,
    season: historical ? fact.historical.referenceSeason : fact.season,
    scopes: structuredClone(scopes),
  };
}
/** @param {any} row */
function parseRow(row) {
  const cat = row?.catalog;
  if (cat === undefined || cat === null) return { ignored: true };
  if (!object(cat) || !withinDocumentLimit(cat)) return { error: 'invalid_catalog' };
  const fail = code => ({ error: code });
  if (!object(row) || !UUID.test(row.id) || !text(row.name, 200) || !text(row.country, 100)
    || !(row.city === null || text(row.city, 100)) || !(row.region === null || text(row.region, 100))
    || !(row.website === null || https(row.website))) return fail('invalid_institution');
  if (cat.schemaVersion !== 1 || cat.state !== 'published' || !SLUG.test(cat.institutionId || '')
    || !/^[a-f0-9]{64}$/.test(cat.revision || '') || !Number.isInteger(cat.targetIntakeYear)
    || typeof cat.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(cat.reviewedAt)
    || !Number.isFinite(Date.parse(cat.reviewedAt)) || !REGIONS.has(cat.surveyRegion)
    || (countryRegion(row.country) !== null && countryRegion(row.country) !== cat.surveyRegion)
    || !Array.isArray(cat.legacyFavoriteKeys) || cat.legacyFavoriteKeys.length > 20
    || !cat.legacyFavoriteKeys.every(key => UUID.test(key)) || !Array.isArray(cat.programmes) || cat.programmes.length > 50
    || !object(cat.sources) || Object.keys(cat.sources).length > 100) return fail('invalid_catalog');
  if (cat.legacyFavoriteKeys.some(key => {
    const frozenInstitutionId = institutionIdFromFavorite(key);
    return frozenInstitutionId !== null && frozenInstitutionId !== cat.institutionId;
  })) return fail('invalid_favorite_alias_mapping');
  const sources = cat.sources;
  for (const [key, source] of Object.entries(sources)) {
    if (!SOURCE_ID.test(key) || !object(source) || source.key !== key || !https(source.url) || !text(source.title, 300)
      || !validDate(source.checkedAt) || !text(source.scope, 300)) return fail('invalid_source');
  }
  if (cat.media !== null && !validMedia(cat.media, cat.programmes)) return fail('invalid_media');
  const programmes = [];
  for (const rawProgramme of cat.programmes) {
    const p = structuredClone(rawProgramme);
    if (!object(p) || !SLUG.test(p.id || '')) return fail('invalid_programme');
    for (const key of FACT_KEYS) {
      const fact = p[key];
      if (key === 'requirementPolicy' && fact === null) continue;
      if (object(fact) && Array.isArray(fact.sourceIds)
        && fact.sourceIds.some(sourceId => !hasSource(sources, sourceId))) return fail('missing_source');
      if (!validFact(fact, sources)) return fail('invalid_programme');
      if (fact.scope.programmeId !== p.id) return fail('invalid_fact_scope');
      if (fact.value !== null && !validFactValue(key, fact.value)) return fail('invalid_fact_value');
      if (fact.status === 'historical_reference' && !validFactValue(key, fact.historical.value)) return fail('invalid_historical_value');
    }
    const f = Object.fromEntries(FACT_KEYS.map(key => [key, p[key]]));
    if (!object(p.discovery) || !['explore', 'ambitious_only', 'unreviewed'].includes(p.discovery.use) || !text(p.discovery.basis, 500)) return fail('invalid_discovery');
    const degreeLevel = typeof f.degree.value === 'string' ? f.degree.value : f.degree.value?.level;
    const degreeAward = object(f.degree.value) ? f.degree.value.award : null;
    const identityOK = f.name.status === 'current_verified' && f.name.value && f.name.sourceIds.length
      && f.degree.status === 'current_verified' && DEGREES.has(degreeLevel)
      && ['current_verified', 'published_unconfirmed'].includes(f.field.status) && FIELDS.has(f.field.value)
      && text(p.routeSourceKey, 100) && hasSource(sources, p.routeSourceKey);
    const rulesValid = ['academicRequirement', 'languageRequirement', 'languageThreshold'].every(key =>
      (f[key].value === null || (validRule(f[key].value, sources) && ruleSourcesIncluded(f[key].value, f[key].sourceIds))));
    if (!identityOK || !rulesValid) return fail('invalid_programme');
    if (p.costReferences !== undefined && (!Array.isArray(p.costReferences) || p.costReferences.length > 20
      || !p.costReferences.every(fact => validFact(fact, sources) && fact.scope.programmeId === p.id
        && (fact.value !== null ? validFactValue('tuition', fact.value)
          : fact.status === 'unknown' || (fact.status === 'historical_reference' && validFactValue('tuition', fact.historical.value)))))) return fail('invalid_cost_references');
    if (p.location !== undefined && (!validFact(p.location, sources) || p.location.scope.programmeId !== p.id
      || (p.location.value !== null && (!object(p.location.value) || !text(p.location.value.country, 100)
        || !REGIONS.has(p.location.value.region) || !(p.location.value.campus === null || text(p.location.value.campus, 200))
        || (countryRegion(p.location.value.country) !== null && countryRegion(p.location.value.country) !== p.location.value.region))))) return fail('invalid_programme_location');
    if (p.publicNotes !== undefined && (!Array.isArray(p.publicNotes) || p.publicNotes.length > 30
      || !p.publicNotes.every(fact => validFact(fact, sources) && fact.scope.programmeId === p.id
        && (fact.value === null || text(fact.value, 2000))
        && (fact.status !== 'historical_reference' || text(fact.historical.value, 2000))))) return fail('invalid_public_notes');
    f.costReferences = p.costReferences ? structuredClone(p.costReferences) : [];
    f.publicNotes = p.publicNotes ? structuredClone(p.publicNotes) : [];
    f.location = p.location ? structuredClone(p.location) : null;
    programmes.push({ id: p.id, ...Object.fromEntries(FACT_KEYS.map(key => [key, p[key]])),
      costReferences: f.costReferences, publicNotes: f.publicNotes, location: f.location,
      discovery: { use: p.discovery.use, basis: p.discovery.basis },
      routeSourceKey: p.routeSourceKey, facts: f });
  }
  return { row, cat, sources, programmes, institutionId: cat.institutionId };
}
/** @param {any} media @param {any[]} programmes */
function validMedia(media, programmes) {
  if (!object(media) || !(media.homepage === null || https(media.homepage)) || !Array.isArray(media.programLinks)
    || media.programLinks.length > 50 || !media.programLinks.every(link => object(link) && programmes.some(p => p.id === link.programId) && https(link.url))) return false;
  if (media.image === null) return true;
  const image = media.image;
  return object(image) && https(image.url) && Number.isInteger(image.width) && image.width > 0
    && Number.isInteger(image.height) && image.height > 0 && https(image.sourcePage) && text(image.title, 300)
    && text(image.creator, 200) && object(image.licence) && text(image.licence.id, 100) && https(image.licence.url)
    && text(image.attribution, 500) && text(image.changes, 500) && text(image.rightsNotes, 500)
    && object(image.localized) && ['en', 'ru', 'uz'].every(lang => object(image.localized[lang])
      && text(image.localized[lang].caption, 500) && text(image.localized[lang].scope, 300));
}
/** @param {any} programme @param {any} institution @param {Record<string, any>} sources */
function makeOption(programme, institution, sources, surveyRegion, targetIntakeYear) {
  const f = programme.facts;
  const current = key => f[key].status === 'current_verified' && f[key].applicability === 'confirmed';
  const location = f.location?.status === 'current_verified' && f.location.applicability === 'confirmed' ? f.location.value : null;
  const discovery = programme.discovery;
  const comp = f.competitiveness.value;
  const isExtreme = current('competitiveness') && object(comp) && comp.category === 'extremely_selective'
    && text(comp.basis) && f.competitiveness.sourceIds.length > 0;
  return {
    id: programme.id, liveId: institution.id, institutionId: institution.institutionId,
    university: institution.name, name: f.name.value, field: f.field.value, fields: [f.field.value],
    degree: typeof f.degree.value === 'string' ? f.degree.value : f.degree.value.level,
    degreeAward: object(f.degree.value) ? f.degree.value.award : null,
    region: location?.region || surveyRegion, country: location?.country || institution.country,
    entryPath: f.route.value?.entryPath === 'foundation' ? 'foundation' : current('route') ? f.route.value?.entryPath || 'unknown' : 'unknown',
    intakeYear: current('intake') && Number.isInteger(f.intake.value?.year) ? f.intake.value.year : null,
    intakeText: f.intake.value?.text || '', language: current('teachingLanguage') ? f.teachingLanguage.value : null,
    sources: Object.values(sources), routeSourceKey: programme.routeSourceKey,
    academicRequirement: f.requirementPolicy === null ? normalizedRule(f.academicRequirement, sources, targetIntakeYear)
      : { type: 'unknown', verified: false, applicable: false },
    languageRequirement: normalizedRule(f.languageRequirement, sources, targetIntakeYear),
    languageThreshold: normalizedRule(f.languageThreshold, sources, targetIntakeYear),
    publishedLanguageReference: publishedLanguageReference(f.languageThreshold, sources, targetIntakeYear),
    requirementPolicy: null,
    competitiveness: { ...(object(comp) ? comp : {}), category: isExtreme ? 'extremely_selective' : 'unknown' },
    discoveryPolicy: discovery?.use === 'ambitious_only' ? 'ambitious_only' : discovery?.use === 'explore' ? 'explore' : 'unreviewed',
    discoveryBasis: text(discovery?.basis) ? discovery.basis : null,
    fieldVerified: current('field'), languageVerified: current('teachingLanguage'), eligibilityComplete: false,
    tuition: { ...(object(f.tuition.value) ? f.tuition.value : {}), comparisonVerified: false },
    facts: f, media: institution.media,
  };
}

/** @param {any} media */
function publicMedia(media) {
  const copy = structuredClone(media);
  if (copy?.image) copy.image.license = structuredClone(copy.image.licence);
  return copy;
}

/**
 * Validate and adapt the bounded public Supabase projection. No network, fallback data,
 * source lookup, or mutation is performed.
 * @param {unknown} rows
 * @returns {{institutions: any[], options: any[], issues: {id: string, code: string}[], version: string}}
 */
export function adaptPublicCatalog(rows) {
  const institutions = [];
  const options = [];
  const issues = [];
  if (!Array.isArray(rows) || rows.length > 200) return { institutions, options, issues: [{ id: '', code: 'request_bound_exceeded' }], version: 'db-v1:' };
  const parsed = [];
  for (const row of rows) {
    const result = parseRow(row);
    if (result.ignored) continue;
    if (result.error) { issues.push({ id: typeof row?.id === 'string' ? row.id : '', code: result.error }); continue; }
    parsed.push(result);
  }
  const duplicateValues = (keyOf, code) => {
    const groups = new Map();
    for (const item of parsed) {
      const value = keyOf(item);
      if (value == null) continue;
      const list = groups.get(value) || []; list.push(item); groups.set(value, list);
    }
    for (const group of groups.values()) if (group.length > 1) for (const item of group) {
      if (!item.quarantined) issues.push({ id: item.row.id, code });
      item.quarantined = true;
    }
  };
  duplicateValues(item => item.row.id.toLowerCase(), 'duplicate_live_id');
  duplicateValues(item => item.institutionId, 'duplicate_slug');
  const programmeOwners = new Map();
  for (const item of parsed) for (const programme of item.programmes) {
    const owners = programmeOwners.get(programme.id) || []; owners.push(item); programmeOwners.set(programme.id, owners);
  }
  for (const owners of programmeOwners.values()) if (owners.length > 1) for (const item of owners) {
    if (!item.quarantined) issues.push({ id: item.row.id, code: 'duplicate_programme_ids' });
    item.quarantined = true;
  }
  const aliasOwners = new Map();
  for (const item of parsed) for (const alias of item.cat.legacyFavoriteKeys) {
    const owners = aliasOwners.get(alias.toLowerCase()) || []; owners.push(item); aliasOwners.set(alias.toLowerCase(), owners);
  }
  for (const owners of aliasOwners.values()) if (owners.length > 1) for (const item of owners) {
    if (!issues.some(issue => issue.id === item.row.id && issue.code === 'duplicate_favorite_alias')) issues.push({ id: item.row.id, code: 'duplicate_favorite_alias' });
    item.quarantined = true;
  }
  const liveIdOwners = new Map();
  for (const row of rows) if (UUID.test(row?.id || '')) {
    const key = row.id.toLowerCase();
    const owners = liveIdOwners.get(key) || [];
    owners.push(row);
    liveIdOwners.set(key, owners);
  }
  for (const [alias, owners] of aliasOwners) {
    const liveRows = liveIdOwners.get(alias) || [];
    const conflictingRows = liveRows.filter(row => !owners.some(item => item.row === row));
    if (!conflictingRows.length) continue;
    const conflictingItems = parsed.filter(item => conflictingRows.includes(item.row));
    for (const item of [...owners, ...conflictingItems]) {
      if (!issues.some(issue => issue.id === item.row.id && issue.code === 'favorite_alias_live_id_collision')) {
        issues.push({ id: item.row.id, code: 'favorite_alias_live_id_collision' });
      }
      item.quarantined = true;
    }
  }
  for (const item of parsed) {
    if (item.quarantined) continue;
    const { row, cat, sources, programmes } = item;
    const institution = { id: row.id, institutionId: cat.institutionId, name: row.name, country: row.country,
      city: row.city, region: row.region, website: row.website, legacyFavoriteKeys: [...cat.legacyFavoriteKeys],
      media: publicMedia(cat.media), sources: structuredClone(sources), programmes };
    institutions.push(institution);
    for (const programme of programmes) {
      const f = programme.facts;
      const degreeLevel = typeof f.degree.value === 'string' ? f.degree.value : f.degree.value?.level;
      if (f.name.status === 'current_verified' && f.name.value && degreeLevel === 'Bachelor'
        && FIELDS.has(f.field.value) && ['direct', 'unknown'].includes(f.route.value?.entryPath || 'unknown')) {
        options.push(makeOption(programme, institution, sources, cat.surveyRegion, cat.targetIntakeYear));
      }
    }
  }
  const versionParts = parsed.filter(item => !item.quarantined).map(item => `${item.row.id}:${item.cat.revision}`).sort();
  return { institutions, options, issues, version: `db-v1:${versionParts.join(',')}` };
}
