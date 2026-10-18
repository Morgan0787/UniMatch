const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const FIELD = new Set(['business', 'it', 'computer_engineering', 'software_engineering', 'computer_science']);
const REGIONS = new Set(['UK', 'USA', 'Europe', 'South Korea', 'Canada']);
const PERIODS = new Set(['year', 'semester', 'credit_hour', 'academic_year_9_months', '12_months', null]);
const STATUSES = new Set(['current_verified', 'published_unconfirmed', 'historical_reference', 'estimate', 'unknown']);

function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function issue(issues, code, programmeId = null, field = null) {
  issues.push({ code, ...(programmeId ? { programmeId } : {}), ...(field ? { field } : {}) });
}
function copyStrings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; }
function statusFor(evidence, { seasonal = false, inferredIsUnknown = false } = {}) {
  if (!evidence || evidence.status === 'not_checked' || evidence.status === 'missing') return 'unknown';
  if (evidence.status === 'verified') return 'current_verified';
  if (evidence.status === 'inferred' || evidence.status === 'partial' || evidence.status === 'unconfirmed') {
    return inferredIsUnknown ? 'unknown' : 'published_unconfirmed';
  }
  return seasonal ? 'unknown' : 'published_unconfirmed';
}
function scopeFor(evidence, programmeId, intakeYear, rule = null) {
  const raw = object(rule?.scope) ? rule.scope : {};
  return {
    programmeId,
    route: typeof raw.route === 'string' ? raw.route : null,
    studentCategory: typeof raw.studentCategory === 'string' ? raw.studentCategory : null,
    schoolCountry: typeof raw.schoolCountry === 'string' ? raw.schoolCountry : null,
    credential: typeof raw.credential === 'string' ? raw.credential : null,
    intakeYear: Number.isInteger(raw.intakeYear) ? raw.intakeYear
      : (rule ? null : Number.isInteger(intakeYear) ? intakeYear : null),
    evidenceScope: typeof evidence?.scope === 'string' ? evidence.scope : null,
    evidenceCheckedAt: typeof evidence?.checkedAt === 'string' ? evidence.checkedAt : null,
  };
}
function fact(value, evidence, programmeId, intakeYear, options = {}) {
  const sourceIds = copyStrings(evidence?.sourceKeys);
  const season = options.season ?? null;
  let status = options.status || statusFor(evidence, options);
  if (value !== null && sourceIds.length === 0) status = 'unknown';
  return {
    value: status === 'unknown' ? null : value,
    status: STATUSES.has(status) ? status : 'unknown',
    sourceIds: [...new Set(sourceIds)],
    scope: scopeFor(evidence, programmeId, intakeYear, options.rule),
    season,
    applicability: options.applicability || (evidence?.status === 'verified' ? 'confirmed' : 'unconfirmed'),
    historical: options.historical || null,
    noticeCode: options.noticeCode || null,
  };
}
function dateValid(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function publicRule(raw, depth = 0) {
  if (!object(raw) || depth > 8) return null;
  if (raw.type === 'all' || raw.type === 'any') {
    if (!Array.isArray(raw.children) || !raw.children.length || raw.children.length > 30) return null;
    const children = raw.children.map(child => publicRule(child, depth + 1));
    if (children.some(child => child === null)) return null;
    return { type: raw.type, children, ...(raw.complete === false ? { complete: false } : {}), ...(object(raw.scope) ? { scope: publicRuleScope(raw.scope) } : {}) };
  }
  if (raw.type === 'unknown') return typeof raw.sourceKey === 'string' ? { type: 'unknown', sourceKey: raw.sourceKey } : null;
  if (!['grade', 'ielts'].includes(raw.type) || typeof raw.sourceKey !== 'string') return null;
  const result = { type: raw.type, sourceKey: raw.sourceKey };
  if (Number.isFinite(raw.minimum)) result.minimum = raw.minimum;
  if (raw.type === 'grade' && ['4', '5', '100'].includes(String(raw.scale))) result.scale = String(raw.scale);
  if (raw.type === 'ielts') {
    if (raw.requiresDate === true || raw.requiresDate === false) result.requiresDate = raw.requiresDate;
    if (Number.isInteger(raw.validityYears)) result.validityYears = raw.validityYears;
    if (dateValid(raw.referenceDate)) result.referenceDate = raw.referenceDate;
    if (object(raw.sections)) {
      const sections = {};
      for (const key of ['listening', 'reading', 'writing', 'speaking']) if (Number.isFinite(raw.sections[key])) sections[key] = raw.sections[key];
      result.sections = sections;
    }
  }
  if (object(raw.scope)) result.scope = publicRuleScope(raw.scope);
  return result;
}
function publicRuleScope(raw) {
  const scope = {};
  for (const key of ['schoolCountry', 'credential', 'route', 'studentCategory']) if (typeof raw[key] === 'string') scope[key] = raw[key];
  if (Number.isInteger(raw.intakeYear)) scope.intakeYear = raw.intakeYear;
  return scope;
}
const HIDDEN_POLICY_KEYS = new Set(['source', 'sourceKey', 'sourceKeys', 'sourceIds', 'evidence', 'checkedAt',
  'status', 'verified', 'applicable', 'verificationMethod', 'reviewerNotes']);
function humanLabel(key) {
  return String(key).replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    .replace(/\bIeltsmin\b/gi, 'IELTS minimum').replace(/\bIelts\b/gi, 'IELTS')
    .replace(/\bCefr\b/gi, 'CEFR').replace(/\bGpa\b/gi, 'GPA').replace(/\bSat\b/gi, 'SAT')
    .replace(/\bAct\b/gi, 'ACT').replace(/\bToefl\b/gi, 'TOEFL').replace(/\bIb\b/gi, 'IB');
}
function renderPolicyNode(value, key = '', depth = 0) {
  if (depth > 8 || value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(item => renderPolicyNode(item, '', depth + 1)).filter(Boolean).join('; ');
  if (!object(value)) return '';
  const operator = typeof value.operator === 'string' ? value.operator.toLowerCase() : '';
  const group = ['all', 'and'].includes(operator) ? 'All of' : ['any', 'or'].includes(operator) ? 'Any of' : '';
  const parts = [];
  if (typeof value.kind === 'string') parts.push(`${humanLabel(value.kind)} condition`);
  else if (typeof value.type === 'string') parts.push(`${humanLabel(value.type)} condition`);
  for (const [childKey, child] of Object.entries(value)) {
    if (HIDDEN_POLICY_KEYS.has(childKey) || ['kind', 'type'].includes(childKey)) continue;
    if (childKey === 'operator') {
      if (!group && !['all', 'any', 'and', 'or'].includes(operator)) parts.push(`${humanLabel(childKey)}: ${renderPolicyNode(child, '', depth + 1)}`);
      continue;
    }
    const rendered = renderPolicyNode(child, childKey, depth + 1);
    if (rendered) parts.push(`${humanLabel(childKey)}: ${rendered}`);
  }
  return `${group ? `${group}: ` : ''}${parts.join('; ')}`;
}
function collectPolicySources(value, result = new Set(), depth = 0) {
  if (depth > 8 || !object(value)) return result;
  for (const [key, child] of Object.entries(value)) {
    if (['sourceKey', 'source'].includes(key) && typeof child === 'string') result.add(child);
    else if (['sourceKeys', 'sourceIds'].includes(key) && Array.isArray(child)) child.forEach(id => { if (typeof id === 'string') result.add(id); });
    else if (object(child)) collectPolicySources(child, result, depth + 1);
    else if (Array.isArray(child)) child.forEach(item => collectPolicySources(item, result, depth + 1));
  }
  return result;
}
function unsupportedPolicyNode(value, path = 'requirementPolicy', depth = 0) {
  if (depth > 8) return path;
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const unsupported = unsupportedPolicyNode(value[index], `${path}.${index}`, depth + 1);
      if (unsupported) return unsupported;
    }
    return null;
  }
  if (object(value)) {
    for (const [key, child] of Object.entries(value)) {
      const unsupported = unsupportedPolicyNode(child, `${path}.${key}`, depth + 1);
      if (unsupported) return unsupported;
    }
    return null;
  }
  return path;
}
function explicitPolicyIntakeYear(policy, route, programmeId, issues) {
  const candidates = [
    policy?.intakeYear, policy?.scope?.intakeYear, policy?.evidence?.intakeYear, policy?.evidence?.scope?.intakeYear,
    route?.intakeYear, route?.scope?.intakeYear, route?.evidence?.intakeYear, route?.evidence?.scope?.intakeYear,
  ].filter(Number.isInteger);
  const unique = [...new Set(candidates)];
  if (unique.length > 1) issue(issues, 'conflicting_native_policy_intake_year', programmeId, 'requirementPolicy');
  return unique.length === 1 ? unique[0] : null;
}
function makePolicyNotes(policy, programme, targetIntakeYear, issues) {
  if (!object(policy)) return [];
  if (!Array.isArray(policy.routes) || policy.routes.length > 30) {
    issue(issues, 'unsupported_native_policy_route_count', programme.id, 'requirementPolicy');
    return [];
  }
  const notes = [];
  for (const route of policy.routes) {
    if (!object(route)) {
      issue(issues, 'unsupported_native_policy_route', programme.id, 'requirementPolicy');
      continue;
    }
    const fields = [];
    if (typeof policy.applicantCategory === 'string') fields.push(`Applicant category: ${policy.applicantCategory}`);
    if (typeof route.path === 'string') fields.push(`Route: ${humanLabel(route.path)}`);
    if (Array.isArray(route.credentials)) fields.push(`Credentials: ${route.credentials.map(value => typeof value === 'string' ? humanLabel(value) : '').filter(Boolean).join(', ')}`);
    for (const [part, node] of Object.entries(route)) {
      if (['path', 'credentials', 'evidence'].includes(part) || node === null) continue;
      const unsupported = unsupportedPolicyNode(node, `requirementPolicy.routes.${route.path || 'unknown'}.${part}`);
      if (unsupported) {
        issue(issues, 'unsupported_native_policy_node', programme.id, unsupported);
        continue;
      }
      const rendered = renderPolicyNode(node, part);
      if (rendered) fields.push(`${humanLabel(part)}: ${rendered}`);
    }
    if (typeof route.evidence?.scope === 'string') fields.push(`Evidence scope: ${route.evidence.scope}`);
    if (Array.isArray(policy.missing) && policy.missing.length) fields.push(`Unresolved: ${policy.missing.map(value => typeof value === 'string' ? value : '').filter(Boolean).join('; ')}`);
    const text = fields.join('. ');
    if (!text) {
      issue(issues, 'unsupported_native_policy_route_content', programme.id, 'requirementPolicy');
      continue;
    }
    if (text.length > 2000) {
      issue(issues, 'native_policy_note_exceeds_public_limit', programme.id, 'requirementPolicy');
      continue;
    }
    const sourceIds = [...collectPolicySources(route), ...collectPolicySources(policy.evidence)].filter((id, index, all) => all.indexOf(id) === index);
    if (!sourceIds.length) {
      issue(issues, 'native_policy_note_missing_source', programme.id, 'requirementPolicy');
      continue;
    }
    const evidence = route.evidence || policy.evidence || {};
    const intakeYear = explicitPolicyIntakeYear(policy, route, programme.id, issues);
    const explicitTargetMatch = intakeYear !== null && intakeYear === targetIntakeYear && evidence.status === 'verified';
    notes.push(fact(text, { status: evidence.status, sourceKeys: sourceIds, scope: evidence.scope, checkedAt: evidence.checkedAt },
      programme.id, intakeYear, { status: explicitTargetMatch ? 'current_verified' : 'published_unconfirmed',
        applicability: explicitTargetMatch ? 'confirmed' : 'unconfirmed',
        rule: { scope: { route: typeof route.path === 'string' ? route.path : null, intakeYear } } }));
  }
  if (notes.length > 30) {
    issue(issues, 'native_policy_note_count_exceeds_public_limit', programme.id, 'requirementPolicy');
    return [];
  }
  return notes;
}
function sourceRecord(id, raw, issues) {
  let validUrl = false;
  try {
    const parsed = new URL(raw?.url);
    validUrl = parsed.protocol === 'https:' && !!parsed.hostname && !parsed.username && !parsed.password;
  } catch { /* reported below */ }
  if (!SOURCE_ID.test(id) || !object(raw) || raw.key !== id || !validUrl || raw.url.length > 2048
    || typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > 300 || !dateValid(raw.checkedAt)
    || typeof raw.scope !== 'string') {
    issue(issues, 'invalid_or_missing_source', null, id);
    return null;
  }
  if (raw.scope.length > 300) {
    issue(issues, 'source_scope_exceeds_300_characters', null, id);
    return null;
  }
  return { key: id, url: raw.url, title: raw.title, checkedAt: raw.checkedAt, scope: raw.scope };
}
function mapMedia(media) {
  if (media == null || !object(media)) return null;
  const image = object(media.image) ? media.image : null;
  return {
    homepage: typeof media.homepage === 'string' ? media.homepage : null,
    programLinks: Array.isArray(media.programLinks) ? media.programLinks.map(link => object(link)
      ? { programId: link.programId, url: link.url } : null).filter(Boolean) : [],
    image: image ? {
      url: image.url, width: image.width, height: image.height, sourcePage: image.sourcePage,
      title: image.title, creator: image.creator,
      licence: object(image.licence) ? { id: image.licence.id, url: image.licence.url } : null,
      attribution: image.attribution, changes: image.changes, rightsNotes: image.rightsNotes,
      localized: Object.fromEntries(['en', 'ru', 'uz'].map(language => [language, {
        caption: image.localized?.[language]?.caption, scope: image.localized?.[language]?.scope,
      }])),
    } : null,
  };
}
function money(raw, issues, programmeId) {
  if (!object(raw) || !(raw.amount === null || (Number.isFinite(raw.amount) && raw.amount >= 0))
    || typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency) || !PERIODS.has(raw.period)
    || !(raw.feeYear === null || typeof raw.feeYear === 'string')
    || (raw.includedFees != null && !Array.isArray(raw.includedFees))
    || (raw.excludedFees != null && !Array.isArray(raw.excludedFees))) return null;
  if (!Array.isArray(raw.includedFees) || !Array.isArray(raw.excludedFees)) issue(issues, 'fee_inclusion_details_not_recorded', programmeId, 'tuition');
  const labelParts = [raw.scope, raw.stage, raw.qualifier, raw.periodStatus].filter(value => typeof value === 'string' && value.trim());
  return { amount: raw.amount, currency: raw.currency, period: raw.period, feeYear: raw.feeYear,
    includedFees: copyStrings(raw.includedFees), excludedFees: copyStrings(raw.excludedFees),
    ...(typeof raw.label === 'string' ? { label: raw.label } : (labelParts.length ? { label: labelParts.join('; ') } : {})) };
}

/**
 * Project one DATA-03 baseline institution to the public catalogue DTO.
 * This function is deterministic and performs no I/O or identifier allocation.
 * It does not synthesize target years, evidence, sources, or programme facts.
 * @param {any} data DATA-03 package with programmes, sources, and requirementPolicies.
 * @param {string} institutionId DATA-03 institution slug.
 * @param {{id:string,name:string,country:string,city:string|null,region:string|null,website:string|null,legacyFavoriteKeys:string[],surveyRegion:string,revision:string,reviewedAt:string,targetIntakeYear:number}} identity Canonical live identity and explicit review metadata.
 * @param {{media?:any}} [options] Optional reviewed media DTO.
 * @returns {{row:any|null,issues:Array<{code:string,programmeId?:string,field?:string}>}}
 */
export function mapData03Institution(data, institutionId, identity, { media = null } = {}) {
  const issues = [];
  if (!object(data) || !Array.isArray(data.programmes) || !object(data.sources) || !object(data.requirementPolicies)
    || !SLUG.test(institutionId || '') || !object(identity)) {
    return { row: null, issues: [{ code: 'invalid_mapper_input' }] };
  }
  if (!UUID.test(identity.id || '') || typeof identity.name !== 'string' || !identity.name.trim() || identity.name.length > 200
    || typeof identity.country !== 'string' || !identity.country.trim() || identity.country.length > 100
    || !(identity.city === null || (typeof identity.city === 'string' && identity.city.length <= 100))
    || !(identity.region === null || (typeof identity.region === 'string' && identity.region.length <= 100))
    || !(identity.website === null || (typeof identity.website === 'string' && identity.website.length <= 2048))
    || !REGIONS.has(identity.surveyRegion) || !/^[a-f0-9]{64}$/.test(identity.revision || '')
    || !Number.isInteger(identity.targetIntakeYear) || typeof identity.reviewedAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(identity.reviewedAt)
    || !Number.isFinite(Date.parse(identity.reviewedAt))) {
    return { row: null, issues: [{ code: 'invalid_canonical_identity' }] };
  }
  const programmes = [];
  const sourceIds = new Set();
  for (const raw of data.programmes.filter(item => item?.institutionId === institutionId)) {
    const id = raw.id;
    if (!SLUG.test(id || '') || !FIELD.has(raw.field) || !['Bachelor', 'Master', 'PhD'].includes(raw.level)) {
      issue(issues, 'invalid_programme_identity', id || null);
      continue;
    }
    const evidence = raw.evidence || {};
    const choose = (key, value) => fact(value, evidence[key], id, raw.intakeYear);
    const identityEvidence = evidence.identity;
    const name = choose('identity', typeof raw.name === 'string' ? raw.name : null);
    const degree = choose('identity', { level: raw.level, award: typeof raw.degree === 'string' ? raw.degree : null });
    const fieldFact = choose('field', FIELD.has(raw.field) ? raw.field : null);
    const routeEvidence = evidence.entryPath || evidence.route;
    const entryPath = ['direct', 'foundation', 'unknown'].includes(raw.entryPath) ? raw.entryPath : 'unknown';
    const route = fact({ entryPath, text: entryPath === 'direct' ? 'Direct entry' : entryPath === 'foundation' ? 'Foundation route' : 'Entry route unconfirmed' }, routeEvidence, id, raw.intakeYear);
    const intakeValue = { year: Number.isInteger(raw.intakeYear) ? raw.intakeYear : null,
      text: typeof raw.intakeText === 'string' && raw.intakeText.length ? raw.intakeText
        : (Number.isInteger(raw.intakeYear) ? String(raw.intakeYear) : 'Intake year unconfirmed') };
    const intakeStatus = Number.isInteger(raw.intakeYear) ? statusFor(evidence.intake) : 'published_unconfirmed';
    const intake = fact(intakeStatus === 'unknown' ? null : intakeValue, evidence.intake, id, raw.intakeYear, { status: intakeStatus });
    const language = choose('language', typeof raw.language === 'string' ? raw.language : null);
    // Name and degree are nonseasonal identity evidence, even when DATA-03 has no intake year.
    for (const identityFact of [name, degree]) identityFact.scope.intakeYear = null;

    const mapRequirement = (key, rawRule) => {
      const ev = evidence.requirements;
      const value = publicRule(rawRule);
      const evidenceKeys = copyStrings(ev?.sourceKeys);
      if (value) {
        const collect = (node, depth = 0) => {
          if (!object(node) || depth > 8) return;
          if (typeof node.sourceKey === 'string') evidenceKeys.push(node.sourceKey);
          if (Array.isArray(node.children)) node.children.forEach(child => collect(child, depth + 1));
        };
        collect(value);
      }
      const uniqueEvidence = { ...ev, sourceKeys: [...new Set(evidenceKeys)] };
      const rawApplicability = rawRule?.applicable === true && rawRule?.verified === true;
      const factValue = value ? { ...value, verified: false, applicable: false } : null;
      const factResult = fact(factValue, uniqueEvidence, id, raw.intakeYear, {
        rule: rawRule, status: value ? statusFor(uniqueEvidence) : 'unknown', applicability: 'unconfirmed',
      });
      return factResult;
    };
    const academic = mapRequirement('academicRequirement', raw.academicRequirement);
    const languageRequirement = mapRequirement('languageRequirement', raw.languageRequirement);
    const thresholdValue = publicRule(raw.languageThreshold);
    const thresholdEvidence = evidence.language || evidence.requirements;
    const thresholdSourceIds = new Set(copyStrings(thresholdEvidence?.sourceKeys));
    const collectThresholdSource = (node, depth = 0) => {
      if (!object(node) || depth > 8) return;
      if (typeof node.sourceKey === 'string') thresholdSourceIds.add(node.sourceKey);
      if (Array.isArray(node.children)) node.children.forEach(child => collectThresholdSource(child, depth + 1));
    };
    if (thresholdValue) collectThresholdSource(thresholdValue);
    const thresholdEvidenceWithRuleSources = { ...thresholdEvidence, sourceKeys: [...thresholdSourceIds] };
    const languageThreshold = fact(thresholdValue ? { ...thresholdValue, verified: false, applicable: false } : null,
      thresholdEvidenceWithRuleSources, id, raw.intakeYear, { rule: raw.languageThreshold,
        status: raw.languageThreshold?.type ? statusFor(thresholdEvidence) : 'unknown', applicability: 'unconfirmed' });

    let tuition = fact(null, evidence.tuition, id, raw.intakeYear, { status: 'unknown' });
    const parsedMoney = money(raw.tuition, issues, id);
    const tuitionSource = typeof raw.tuition?.source === 'string' ? raw.tuition.source : null;
    if (parsedMoney) {
      if (tuitionSource) tuition.sourceIds = [...new Set([...tuition.sourceIds, tuitionSource])];
      const seasonMatches = Number.isInteger(raw.intakeYear) && typeof parsedMoney.feeYear === 'string'
        && parsedMoney.feeYear.startsWith(`${raw.intakeYear}/`);
      const historical = parsedMoney.feeYear && !seasonMatches;
      if (historical) {
        tuition = fact(null, evidence.tuition, id, raw.intakeYear, { status: 'historical_reference', season: parsedMoney.feeYear,
          historical: { value: parsedMoney, referenceSeason: parsedMoney.feeYear, sourceIds: [...new Set([...copyStrings(evidence.tuition?.sourceKeys), ...(tuitionSource ? [tuitionSource] : [])])], checkedAt: evidence.tuition?.checkedAt || data.checkedAt },
          noticeCode: 'historical' });
      } else {
        const tuitionStatus = raw.tuition.status === 'estimate' ? 'estimate'
          : raw.tuition.status === 'verified' && seasonMatches ? 'current_verified' : 'published_unconfirmed';
        tuition = fact(parsedMoney, evidence.tuition, id, raw.intakeYear, { status: tuitionStatus,
          season: parsedMoney.feeYear, applicability: tuitionStatus === 'current_verified' ? 'confirmed' : 'unconfirmed',
          noticeCode: tuitionStatus === 'estimate' ? 'estimate' : null });
      }
      const isEstimate = raw.tuition.status === 'estimate' || raw.tuition.status === 'verified_general_base_estimate'
        || raw.tuition.status === 'study_load_dependent_range'
        || ['tuition_and_fees_estimate', 'cost_of_attendance'].includes(raw.tuition.scope);
      if (isEstimate) {
        programmes.push({ id, __costReference: fact(parsedMoney, evidence.tuition, id, raw.intakeYear,
          { status: 'estimate', season: parsedMoney.feeYear, noticeCode: 'estimate' }) });
        tuition = fact(null, evidence.tuition, id, raw.intakeYear, { status: 'unknown' });
      }
    } else if (raw.tuition != null) issue(issues, 'unsupported_tuition_shape', id, 'tuition');

    const rawPolicy = data.requirementPolicies[raw.requirementPolicyId];
    if (!rawPolicy) issue(issues, 'missing_requirement_policy', id, 'requirementPolicy');
    // Native policies are displayed as source-backed prose and never enter the evaluator.
    const safeAcademic = object(rawPolicy)
      ? fact(academic.value, { ...evidence.requirements, sourceKeys: academic.sourceIds }, id, raw.intakeYear,
        { rule: raw.academicRequirement, status: academic.value === null ? 'unknown' : 'published_unconfirmed', applicability: 'unconfirmed' })
      : academic;
    const policyNotes = makePolicyNotes(rawPolicy, raw, identity.targetIntakeYear, issues);
    const requirementPolicy = null;
    const scholarship = fact(null, null, id, raw.intakeYear, { status: 'unknown' });
    const deadline = fact(null, evidence.intake, id, raw.intakeYear, { status: 'unknown' });
    const compEvidence = raw.competitiveness;
    const compValue = copyStrings(compEvidence?.sourceKeys).length > 0
      ? { category: 'unknown', basis: typeof compEvidence.basis === 'string' ? compEvidence.basis : 'Selectivity is uncalibrated.' }
      : null;
    const comp = fact(compValue, compEvidence, id, raw.intakeYear,
      { status: compValue ? 'published_unconfirmed' : 'unknown', applicability: 'unconfirmed' });
    const discoveryUse = raw.discovery?.use === 'conditional_exploration_only' ? 'explore'
      : ['ambitious_only', 'unreviewed'].includes(raw.discovery?.use) ? raw.discovery.use : 'unreviewed';
    const discovery = { use: discoveryUse, basis: typeof raw.discovery?.basis === 'string' ? raw.discovery.basis : 'Discovery status is unreviewed.' };
    const output = { id, name, degree, field: fieldFact, route, intake, teachingLanguage: language,
      academicRequirement: safeAcademic, languageRequirement, languageThreshold, requirementPolicy,
      tuition, scholarships: scholarship, deadline, competitiveness: comp, discovery,
      routeSourceKey: typeof raw.routeSourceKey === 'string' ? raw.routeSourceKey : '' };
    if (policyNotes.length) output.publicNotes = policyNotes;

    const costReferences = [];
    for (const reference of raw.publishedCostReferences || []) {
      const value = money(reference, issues, id);
      if (!value || !reference.source || !data.sources[reference.source]) { issue(issues, 'unsupported_published_cost_reference', id, 'publishedCostReferences'); continue; }
      if (reference.scope === 'tuition_and_fees') value.includedFees = ['Tuition', 'Fees'];
      const qualifiers = copyStrings(reference.notes);
      value.label = ['General tuition-and-fees estimate', ...qualifiers].join('; ');
      const evidence = { status: 'verified', sourceKeys: [reference.source], checkedAt: data.sources[reference.source].checkedAt };
      costReferences.push(fact(null, evidence, id, null, { status: 'historical_reference', applicability: 'unconfirmed', season: reference.feeYear,
        historical: { value, referenceSeason: reference.feeYear, sourceIds: [reference.source], checkedAt: evidence.checkedAt }, noticeCode: 'historical' }));
    }
    if (programmes.at(-1)?.id === id && programmes.at(-1)?.__costReference) {
      costReferences.push(programmes.pop().__costReference);
    }
    output.costReferences = costReferences;
    // DATA-03 SUNY/Korea delivery remains attached to its canonical US institution.
    if (identity.country === 'United States' && raw.country === 'South Korea'
      && copyStrings(identityEvidence?.sourceKeys).length > 0) {
      output.location = fact({ country: 'South Korea', region: 'South Korea', campus: null },
        { ...identityEvidence, scope: 'Programme delivery country; campus name not established.' }, id, raw.intakeYear,
        { status: statusFor(identityEvidence), applicability: identityEvidence.status === 'verified' ? 'confirmed' : 'unconfirmed' });
    }
    programmes.push(output);
    for (const factValue of [name, degree, fieldFact, route, intake, language, academic, languageRequirement, languageThreshold, tuition,
      requirementPolicy, comp, ...costReferences, ...policyNotes, ...(output.location ? [output.location] : [])]) {
      for (const sourceId of factValue?.sourceIds || []) sourceIds.add(sourceId);
      const collectRuleSources = (node, depth = 0) => {
        if (!object(node) || depth > 8) return;
        if (typeof node.sourceKey === 'string') sourceIds.add(node.sourceKey);
        if (Array.isArray(node.children)) node.children.forEach(child => collectRuleSources(child, depth + 1));
      };
      if (factValue?.value) collectRuleSources(factValue.value);
      if (factValue?.historical?.value) collectRuleSources(factValue.historical.value);
    }
    if (!identityEvidence || !name.value || !degree.value || !raw.routeSourceKey) issue(issues, 'programme_identity_or_route_evidence_missing', id);
  }
  if (!programmes.length) issue(issues, 'no_programmes_for_institution');
  const normalizedSources = {};
  for (const sourceId of [...sourceIds].sort()) {
    const record = sourceRecord(sourceId, data.sources[sourceId], issues);
    if (record) normalizedSources[sourceId] = record;
  }
  const row = {
    id: identity.id, name: identity.name, country: identity.country, city: identity.city,
    region: identity.region, website: identity.website,
    catalog: {
      schemaVersion: 1, institutionId, revision: identity.revision, state: 'published',
      targetIntakeYear: identity.targetIntakeYear, reviewedAt: identity.reviewedAt,
      surveyRegion: identity.surveyRegion,
      legacyFavoriteKeys: Array.isArray(identity.legacyFavoriteKeys) ? identity.legacyFavoriteKeys.filter(key => UUID.test(key)).slice(0, 20) : [],
      programmes, sources: normalizedSources, media: mapMedia(media),
    },
  };
  return { row, issues };
}
