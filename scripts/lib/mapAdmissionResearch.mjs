import { createHash } from 'node:crypto';

const FACT_STATUSES = new Set(['current_verified', 'published_unconfirmed', 'historical_reference', 'estimate', 'unknown']);
const APPLICABILITY = new Set(['confirmed', 'unconfirmed', 'not_applicable']);
const NOTICE_CODES = new Set(['historical', 'unconfirmed', 'estimate']);
const CURRENCIES = /^[A-Z]{3}$/;
const SOURCES = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERIODS = new Set(['year', 'semester', 'credit_hour', 'academic_year_9_months', '12_months', null]);
const RULE_TYPES = new Set(['unknown', 'grade', 'ielts', 'all', 'any']);
const FIELD_NAMES = ['name', 'degree', 'field', 'route', 'intake', 'teachingLanguage', 'academicRequirement', 'languageRequirement', 'languageThreshold', 'requirementPolicy', 'tuition', 'scholarships', 'deadline', 'competitiveness'];
const OPERATIONAL_KEYS = new Set([
  'applicable', 'applicability', 'checkedAt', 'complete', 'comparisonVerified', 'evidence', 'limitations',
  'nativePolicyRef', 'notice', 'noticeCode', 'provenanceCarry', 'reason', 'source', 'sourceId', 'sourceIds',
  'sourceKey', 'sourceKeys', 'status', 'usage', 'verified', 'verificationMethod', 'accessStatus',
  'databasePlan', 'dedupEvidence', 'mediaStagingReference', 'actuallyWritten', 'sql', 'query', 'receipt', 'privateKey',
]);
const RULE_KEYS = new Set(['type', 'minimum', 'scale', 'requiresDate', 'validityYears', 'referenceDate', 'sections', 'children', 'sourceKey', 'scope', 'complete', 'verified', 'applicable']);

function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function hasKey(container, key) { return container instanceof Map ? container.has(key) : isObject(container) && Object.hasOwn(container, key); }
function pushIssue(issues, code, programmeId = null, field = null) {
  issues.push({ code, ...(programmeId ? { programmeId } : {}), ...(field ? { field } : {}) });
}
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!isObject(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}
function sourceDictionary(input) {
  if (input?.sources instanceof Map) return input.sources;
  if (isObject(input?.sources)) return input.sources;
  if (input instanceof Map) return input;
  return isObject(input) ? input : {};
}
function normalizeSources(sourceDictionaryInput, keys, issues, programmeId = null, field = null) {
  const sourceMap = new Map();
  for (const key of keys) {
    const raw = sourceDictionaryInput instanceof Map ? sourceDictionaryInput.get(key) : sourceDictionaryInput[key];
    const normalizedKey = typeof raw?.key === 'string' ? raw.key : typeof raw?.id === 'string' ? raw.id : key;
    let validUrl = false;
    try {
      const url = new URL(raw?.url);
      validUrl = url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch { /* handled as an issue below */ }
    if (!SOURCES.test(key) || normalizedKey !== key || !validUrl || typeof raw?.title !== 'string' || !raw.title.trim()
      || typeof raw?.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.checkedAt)
      || typeof raw?.scope !== 'string' || !raw.scope.trim()) {
      pushIssue(issues, 'invalid_or_missing_source', programmeId, field);
      continue;
    }
    sourceMap.set(key, { key, url: raw.url, title: raw.title, checkedAt: raw.checkedAt, scope: raw.scope });
  }
  return sourceMap;
}
function collectRuleSources(value, found = new Set(), depth = 0) {
  if (!isObject(value) || depth > 8) return found;
  if (typeof value.sourceKey === 'string') found.add(value.sourceKey);
  if (Array.isArray(value.children)) for (const child of value.children) collectRuleSources(child, found, depth + 1);
  return found;
}
function cleanSourceIds(ids, sourceMap, issues, programmeId, field) {
  const result = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== 'string' || !hasKey(sourceMap, id)) {
      pushIssue(issues, 'missing_or_invalid_fact_source', programmeId, field);
    } else if (!result.includes(id)) result.push(id);
  }
  return result;
}
function mapNoticeCode(code, issues, programmeId, field) {
  const normalized = {
    historicalReference: 'historical', 'data.historicalReference': 'historical', historical: 'historical',
    currentApplicabilityUnconfirmed: 'unconfirmed', 'data.currentApplicabilityUnconfirmed': 'unconfirmed',
    notConfirmed: 'unconfirmed', 'data.notConfirmed': 'unconfirmed', 'data.subjectMappingNeedsReview': 'unconfirmed', unconfirmed: 'unconfirmed',
    estimate: 'estimate', 'data.estimate': 'estimate',
  }[code];
  if (code == null) return null;
  if (!normalized || !NOTICE_CODES.has(normalized)) {
    pushIssue(issues, 'unsupported_notice_code', programmeId, field);
    return null;
  }
  return normalized;
}
function mapScope(rawScope, programmeId, issues, field) {
  if (rawScope != null && !isObject(rawScope)) pushIssue(issues, 'unsupported_fact_scope', programmeId, field);
  const raw = isObject(rawScope) ? rawScope : {};
  if (raw.programmeId != null && raw.programmeId !== programmeId) {
    pushIssue(issues, 'fact_programme_scope_mismatch', programmeId, field);
  }
  const nullableText = key => {
    if (raw[key] == null) return null;
    if (typeof raw[key] === 'string' && raw[key].trim()) return raw[key];
    pushIssue(issues, 'invalid_fact_scope_value', programmeId, field);
    return null;
  };
  if (raw.intakeYear != null && !Number.isInteger(raw.intakeYear)) pushIssue(issues, 'invalid_fact_scope_value', programmeId, field);
  return {
    programmeId,
    route: nullableText('route'),
    studentCategory: nullableText('studentCategory'),
    schoolCountry: nullableText('schoolCountry'),
    credential: nullableText('credential'),
    intakeYear: Number.isInteger(raw.intakeYear) ? raw.intakeYear : null,
  };
}
function mapStatus(raw, issues, programmeId, field) {
  if (FACT_STATUSES.has(raw)) return raw;
  if (raw != null) pushIssue(issues, 'unsupported_fact_status', programmeId, field);
  return 'unknown';
}
function factTemplate(raw, programmeId, field, sourceMap, issues, overrides = {}) {
  const valueSource = overrides.sourceFact || raw || {};
  const status = mapStatus(overrides.status ?? valueSource.status, issues, programmeId, field);
  const sourceIds = cleanSourceIds(overrides.sourceIds ?? valueSource.sourceIds, sourceMap, issues, programmeId, field);
  const seasonValue = overrides.season !== undefined ? overrides.season : valueSource.season;
  const season = typeof seasonValue === 'string' && seasonValue.trim() ? seasonValue : null;
  if (seasonValue != null && season === null) pushIssue(issues, 'invalid_fact_season', programmeId, field);
  const applicabilityValue = overrides.applicability ?? valueSource.applicability;
  const applicability = APPLICABILITY.has(applicabilityValue) ? applicabilityValue : 'unconfirmed';
  if (applicabilityValue != null && applicability !== applicabilityValue) pushIssue(issues, 'unsupported_fact_applicability', programmeId, field);
  const noticeCode = mapNoticeCode(overrides.noticeCode !== undefined ? overrides.noticeCode : valueSource.noticeCode, issues, programmeId, field);
  return { status, sourceIds, scope: mapScope(overrides.scope !== undefined ? overrides.scope : valueSource.scope, programmeId, issues, field), season, applicability, noticeCode };
}
function normalizeEnvelope(raw, programmeId, field, sourceMap, issues, mapValue) {
  if (!isObject(raw)) {
    pushIssue(issues, 'unsupported_fact_shape', programmeId, field);
    return { value: null, ...factTemplate({}, programmeId, field, sourceMap, issues, { status: 'unknown' }) , historical: null };
  }
  let value = null;
  let history = null;
  const meta = factTemplate(raw, programmeId, field, sourceMap, issues);
  const rawScopeMatches = raw.scope?.programmeId == null || raw.scope.programmeId === programmeId;
  if (meta.status === 'historical_reference') {
    const historical = raw.historical;
    const historicalValue = historical && mapValue(historical.value, true);
    const historicalSourceIds = cleanSourceIds(historical?.sourceIds ?? raw.sourceIds, sourceMap, issues, programmeId, field);
    if (rawScopeMatches && historical && historicalValue?.value != null && historicalSourceIds.length > 0
      && typeof historical.referenceSeason === 'string' && historical.referenceSeason.trim()
      && typeof historical.checkedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(historical.checkedAt)) {
      history = {
        value: historicalValue.value,
        referenceSeason: historical.referenceSeason,
        sourceIds: historicalSourceIds,
        checkedAt: historical.checkedAt,
      };
    } else {
      pushIssue(issues, 'unsupported_historical_fact', programmeId, field);
      meta.status = 'unknown';
      meta.applicability = 'unconfirmed';
      meta.noticeCode = null;
    }
  } else if (meta.status === 'unknown' && raw.value !== null && raw.value !== undefined) {
    pushIssue(issues, 'unknown_fact_value_removed', programmeId, field);
  } else if (raw.value !== null && raw.value !== undefined) {
    const mapped = mapValue(raw.value, false);
    const ruleKeys = field.endsWith('Requirement') || field === 'languageThreshold' ? [...collectRuleSources(raw.value)] : [];
    const ruleSourceIds = cleanSourceIds(ruleKeys, sourceMap, issues, programmeId, field);
    for (const id of ruleSourceIds) if (!meta.sourceIds.includes(id)) meta.sourceIds.push(id);
    const missingRuleSource = ruleKeys.some(id => !hasKey(sourceMap, id));
    if (mapped?.value != null && rawScopeMatches && !missingRuleSource && meta.sourceIds.length > 0) value = mapped.value;
    else {
      pushIssue(issues, mapped?.issue || (missingRuleSource ? 'missing_rule_source' : 'unsupported_fact_value'), programmeId, field);
      meta.noticeCode = meta.noticeCode || (meta.status === 'historical_reference' ? 'historical' : null);
    }
  }
  return { value, ...meta, historical: history };
}
function unknownRuleEnvelope(raw, programmeId, field, sourceMap, issues) {
  const native = isObject(raw?.nativeFacts) ? raw.nativeFacts : {};
  const meta = factTemplate(raw, programmeId, field, sourceMap, issues, {
    sourceFact: native.status ? native : raw,
    status: 'unknown',
    applicability: 'unconfirmed',
    sourceIds: Array.isArray(native.sourceIds) ? native.sourceIds : raw?.sourceIds,
    scope: native.scope || raw?.scope,
  });
  return { value: null, ...meta, historical: null };
}
function unknownFactEnvelope(raw, programmeId, field, sourceMap, issues, { sourceFact = raw, sourceIds, scope } = {}) {
  const meta = factTemplate(raw, programmeId, field, sourceMap, issues, {
    sourceFact,
    status: 'unknown', applicability: 'unconfirmed', noticeCode: null,
    ...(sourceIds !== undefined ? { sourceIds } : {}),
    ...(scope !== undefined ? { scope } : {}),
  });
  return { value: null, ...meta, historical: null };
}
function mapSimple(value) {
  return typeof value === 'string' && value.trim() ? { value } : null;
}
function mapDegree(value) {
  if (typeof value === 'string') {
    if (['Bachelor', 'Master', 'PhD'].includes(value)) return { value: { level: value, award: null } };
    return null;
  }
  if (!isObject(value) || !['Bachelor', 'Master', 'PhD'].includes(value.level)
    || !(value.award === null || (typeof value.award === 'string' && value.award.trim()))) return null;
  return { value: { level: value.level, award: value.award } };
}
function mapRoute(raw, programmeId, field, sourceMap, issues) {
  if (!isObject(raw)) return normalizeEnvelope(null, programmeId, field, sourceMap, issues, mapSimple);
  const rawValue = raw.value;
  const map = value => {
    if (value === null) return { value: null };
    const entryPath = ['direct', 'foundation', 'unknown'].includes(value) ? value : null;
    if (!entryPath) return null;
    const text = { direct: 'Direct entry', foundation: 'Foundation route', unknown: 'Entry route unconfirmed' }[entryPath];
    return { value: { entryPath, text } };
  };
  if (raw.value === 'unknown' && raw.status === 'unknown') {
    pushIssue(issues, 'unknown_route_value_normalized', programmeId, field);
    return normalizeEnvelope({ ...raw, value: null }, programmeId, field, sourceMap, issues, map);
  }
  return normalizeEnvelope(raw, programmeId, field, sourceMap, issues, map);
}
function mapIntakeValue(value) {
  if (value === null) return { value: null };
  if (!isObject(value)) return null;
  const year = Number.isInteger(value.year) ? value.year : null;
  if (value.year != null && year === null) return null;
  let terms = [];
  if (typeof value.text === 'string' && value.text.trim()) terms = [value.text.trim()];
  else {
    const rawTerms = Array.isArray(value.terms) ? value.terms : value.term == null ? [] : [value.term];
    if (!rawTerms.every(term => typeof term === 'string' && term.trim())) return null;
    terms = rawTerms.map(term => term.trim());
  }
  if (!terms.length && year !== null) terms = [String(year)];
  if (!terms.length) return null;
  let text = year !== null && !terms.some(term => term.includes(String(year))) ? `${terms.join(' / ')} ${year}` : terms.join(' / ');
  const approximateStarts = Array.isArray(value.startsApproximate)
    ? value.startsApproximate.filter(item => typeof item === 'string' && item.trim()).map(item => humanize(item))
    : [];
  if (value.startsApproximate === true && !/approximate/i.test(text)) text += ' (approximate)';
  if (approximateStarts.length && !/approximate/i.test(text)) text += `; starts approximately ${approximateStarts.join(', ')}`;
  return { value: { year, text } };
}
function mapMoney(value) {
  if (!isObject(value) || !(value.amount === null || (typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount >= 0))
    || typeof value.currency !== 'string' || !CURRENCIES.test(value.currency)
    || !PERIODS.has(value.period)
    || !(value.feeYear === null || (typeof value.feeYear === 'string' && value.feeYear.trim()))) return null;
  const stringArray = key => Array.isArray(value[key]) ? value[key].filter(item => typeof item === 'string' && item.trim()) : [];
  const result = {
    amount: value.amount, currency: value.currency, period: value.period, feeYear: value.feeYear,
    includedFees: stringArray('includedFees'), excludedFees: stringArray('excludedFees'),
  };
  if (value.category === 'nonresident_undergraduate' && value.scope === 'base_tuition'
    && value.additionalCourseAndMandatoryFees === true) {
    result.label = 'Nonresident undergraduate base tuition; course and mandatory fees are additional.';
  } else if (Number.isFinite(value.minimum) && Number.isFinite(value.maximum) && value.minimum <= value.maximum && typeof value.load === 'string') {
    result.label = `Study-load range ${value.minimum}–${value.maximum} ${value.currency}; ${value.load}. ${stringArray('notes').join('. ')}`;
  } else if (typeof value.label === 'string' && value.label.trim()) result.label = value.label;
  return { value: result };
}
function hasExplicitTuitionAndFeesAlternatives(fact) {
  const value = fact?.historical?.value;
  return isObject(value) && Array.isArray(value.alternatives)
    && value.scope === 'tuition_and_fees_estimate' && value.exactComputerScienceTuition === false
    && Number.isFinite(value.creditLoadMinimumPerSemester) && value.creditLoadMinimumPerSemester > 0
    && typeof value.currency === 'string' && CURRENCIES.test(value.currency)
    && typeof value.feeYear === 'string' && !!value.feeYear.trim();
}
function mapHistoricalCostAlternatives(rawTuition, programmeId, sourceMap, issues) {
  const historical = rawTuition?.historical;
  const value = historical?.value;
  if (!isObject(value) || !Array.isArray(value.alternatives)) return [];
  if (!hasExplicitTuitionAndFeesAlternatives(rawTuition)) {
    pushIssue(issues, 'unsupported_historical_cost_alternatives_scope', programmeId, 'tuition');
    return [];
  }
  const sourceIds = Array.isArray(historical.sourceIds) ? historical.sourceIds : rawTuition.sourceIds;
  const references = [];
  for (const alternative of value.alternatives) {
    if (!isObject(alternative) || typeof alternative.amount !== 'number' || !Number.isFinite(alternative.amount)
      || alternative.amount < 0 || !['academic_year_9_months', '12_months'].includes(alternative.period)) {
      pushIssue(issues, 'unsupported_historical_cost_alternative', programmeId, 'tuition');
      continue;
    }
    const periodLabel = alternative.period === 'academic_year_9_months' ? '9-month academic year' : '12 months';
    const nativeFact = {
      value: null,
      status: 'historical_reference',
      sourceIds,
      scope: rawTuition.scope,
      season: rawTuition.season ?? null,
      applicability: 'unconfirmed',
      noticeCode: 'historical',
      historical: {
        value: {
          amount: alternative.amount,
          currency: value.currency,
          period: alternative.period,
          feeYear: value.feeYear,
          includedFees: ['Tuition', 'Fees'],
          excludedFees: [],
          label: `Estimated tuition-and-fees total (${periodLabel}; minimum ${value.creditLoadMinimumPerSemester} credits per semester; not exact Computer Science tuition).`,
        },
        referenceSeason: historical.referenceSeason,
        sourceIds,
        checkedAt: historical.checkedAt,
      },
    };
    references.push(normalizeEnvelope(nativeFact, programmeId, `costReferences.historicalAlternative.${references.length}`, sourceMap, issues, mapMoney));
  }
  return references;
}
function mapRuleNode(value, sourceMap) {
  if (!isObject(value) || !RULE_TYPES.has(value.type)) return null;
  if (['all', 'any'].includes(value.type)) {
    if (!Array.isArray(value.children) || value.children.length === 0 || value.children.length > 30) return null;
    const children = value.children.map(child => mapRuleNode(child, sourceMap));
    if (children.some(child => !child)) return null;
    const group = { type: value.type, children, ...(value.complete === false ? { complete: false } : {}) };
    if (isObject(value.scope)) group.scope = mapRuleScope(value.scope);
    return group;
  }
  const sourceKey = typeof value.sourceKey === 'string' && hasKey(sourceMap, value.sourceKey) ? value.sourceKey : null;
  if (!sourceKey) return null;
  const node = { type: value.type, sourceKey };
  if (value.type === 'grade') {
    if (!Number.isFinite(value.minimum) || !['4', '5', '100'].includes(String(value.scale))) return null;
    node.minimum = value.minimum; node.scale = String(value.scale);
  } else if (value.type === 'ielts') {
    if (!Number.isFinite(value.minimum)) return null;
    node.minimum = value.minimum;
    if (value.requiresDate === true || value.requiresDate === false) node.requiresDate = value.requiresDate;
    if (isObject(value.sections)) {
      const sections = Object.fromEntries(Object.entries(value.sections).filter(([, minimum]) => Number.isFinite(minimum)));
      if (Object.keys(sections).length !== Object.keys(value.sections).length) return null;
      node.sections = sections;
    }
    if (Number.isInteger(value.validityYears) && value.validityYears >= 0) node.validityYears = value.validityYears;
    if (typeof value.referenceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.referenceDate)) node.referenceDate = value.referenceDate;
  }
  if (isObject(value.scope)) node.scope = mapRuleScope(value.scope);
  return node;
}
function mapRuleScope(scope) {
  const result = {};
  for (const key of ['schoolCountry', 'credential', 'intakeYear']) {
    if (typeof scope[key] === 'string' && scope[key].trim()) result[key] = scope[key];
    else if (Number.isInteger(scope[key])) result[key] = scope[key];
  }
  return result;
}
function gateRule(rule, enabled) {
  if (!isObject(rule)) return rule;
  const copy = { ...rule, verified: enabled, applicable: enabled };
  if (Array.isArray(rule.children)) copy.children = rule.children.map(child => gateRule(child, enabled));
  return copy;
}
function mapScholarships(value) {
  if (value === null) return { value: null };
  if (!isObject(value)) return null;
  const allowed = ['name', 'award', 'amount', 'currency', 'period', 'feeYear', 'coverage', 'eligibility', 'deadline', 'renewable'];
  const result = {};
  for (const key of allowed) {
    const item = value[key];
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') result[key] = item;
  }
  return Object.keys(result).length ? { value: result } : null;
}
function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
function validMonthDay(value) { return typeof value === 'string' && /^\d{2}-\d{2}$/.test(value) && validDate(`2020-${value}`); }
function mapDeadlineValue(value) {
  if (!isObject(value)) return null;
  if (validDate(value.date) && typeof value.timezone === 'string' && value.timezone.trim()) return { value: { date: value.date, timezone: value.timezone } };
  if (value.date !== null && value.date !== undefined) return null;
  const timezoneDefault = typeof value.timezone === 'string' ? value.timezone : null;
  const entries = [];
  const add = (label, date, monthDay = null, time = null, timezone = timezoneDefault) => {
    if (!label || !(validDate(date) || validMonthDay(monthDay))) return false;
    entries.push({ label, date: validDate(date) ? date : null, monthDay: validMonthDay(monthDay) ? monthDay : null,
      time: typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null, timezone });
    return true;
  };
  if (Array.isArray(value.entries)) {
    for (const entry of value.entries) {
      if (!isObject(entry) || !add(entry.label, entry.date, entry.monthDay, entry.time, entry.timezone)) return null;
    }
  } else if (Array.isArray(value.recurring)) {
    for (const item of value.recurring) {
      const timezone = isObject(item) && Object.hasOwn(item, 'timezone') ? item.timezone : timezoneDefault;
      if (!isObject(item) || !add(item.term || item.label, item.date, item.monthDay, item.time, timezone)) return null;
    }
  } else {
    const walk = (record, prefix, inheritedTime = null, inheritedZone = timezoneDefault) => {
      for (const [key, child] of Object.entries(record)) {
        if (['timezone', 'year'].includes(key)) continue;
        const label = prefix ? `${prefix} ${humanize(key)}` : humanize(key);
        if (isObject(child)) {
          const timezone = Object.hasOwn(child, 'timezone') ? child.timezone : inheritedZone;
          walk(child, label, child.time ?? inheritedTime, timezone);
          continue;
        }
        if (typeof child === 'string' && (validDate(child) || validMonthDay(child))) {
          const monthDay = validMonthDay(child) ? child : null;
          const date = validDate(child) ? child : null;
          const time = /^(opens?|from|starts?)$/i.test(key) ? null : inheritedTime;
          if (!add(label, date, monthDay, time, inheritedZone)) return false;
        }
      }
      return true;
    };
    if (!walk(value, '')) return null;
  }
  if (!entries.length || entries.length > 32) return null;
  return { value: { date: null, timezone: timezoneDefault, entries } };
}
function humanize(key) {
  return String(key).replace(/(IELTS|TOEFL|GPA|SAT|ACT|CEFR|DET|PTE)(?=[a-z])/g, '$1 ').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
function nativeText(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    if (/^see_credential$/i.test(text)) return 'Needs confirmation; see credential information';
    if (/^[a-z\d]+(?:_[a-z\d]+)+$/i.test(text)) return humanize(text);
    return text;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(item => nativeText(item, depth + 1)).filter(Boolean).join('; ');
  if (!isObject(value)) return '';
  if (value.type === 'all' || value.type === 'any') {
    const children = (Array.isArray(value.children) ? value.children : []).map(child => nativeText(child, depth + 1)).filter(Boolean);
    return children.length ? `${value.type === 'all' ? 'All of' : 'Any of'}: ${children.join('; ')}` : '';
  }
  if (value.type === 'ielts' && Number.isFinite(value.minimum)) {
    const sections = isObject(value.sections) ? Object.entries(value.sections).map(([key, minimum]) => `${humanize(key)} ${minimum}`).join(', ') : '';
    const validity = Number.isFinite(value.validityYears) ? `; valid for ${value.validityYears} years${value.referenceDate ? ` as of ${value.referenceDate}` : ''}` : '';
    const alternatives = Array.isArray(value.alternatives) ? value.alternatives.map(item => nativeText(item, depth + 1)).filter(Boolean) : [];
    return `IELTS overall minimum ${value.minimum}${sections ? `; section minima: ${sections}` : ''}${validity}${alternatives.length ? `; alternatives: ${alternatives.join('; ')}` : ''}`;
  }
  const parts = [];
  for (const [key, child] of Object.entries(value)) {
    if (OPERATIONAL_KEYS.has(key) || ['type', 'children'].includes(key)) continue;
    if (key === 'alternatives' && Array.isArray(child)) {
      const alternatives = child.map(item => nativeText(item, depth + 1)).filter(Boolean);
      if (alternatives.length) parts.push(`Alternatives: ${alternatives.join('; ')}`);
      continue;
    }
    const rendered = nativeText(child, depth + 1);
    if (rendered) parts.push(`${humanize(key)}: ${rendered}`);
  }
  return parts.join('; ');
}
function makeNote(rawFact, programmeId, field, sourceMap, issues, label = null) {
  if (!isObject(rawFact) || !FACT_STATUSES.has(rawFact.status) || !Array.isArray(rawFact.sourceIds) || !isObject(rawFact.scope)) {
    pushIssue(issues, 'unsupported_public_note_fact', programmeId, field);
    return null;
  }
  if (rawFact.status === 'unknown') return null;
  const content = rawFact?.status === 'historical_reference' ? rawFact.historical?.value : rawFact?.value;
  const render = value => {
    const detail = nativeText(value);
    if (field === 'scholarships' && isObject(value) && value.guaranteedAmount === null) {
      return `${detail}${detail ? '; ' : ''}Guaranteed amount not stated`;
    }
    return detail;
  };
  const detail = render(content);
  const text = detail && label ? `${label}: ${detail}` : detail;
  if (!text) {
    if (content != null) pushIssue(issues, 'native_fact_has_no_public_text', programmeId, field);
    return null;
  }
  if (text.length > 2000) {
    pushIssue(issues, 'public_note_exceeds_limit', programmeId, field);
    return null;
  }
  const note = normalizeEnvelope(rawFact, programmeId, `publicNotes.${field}`, sourceMap, issues, value => {
    const rendered = render(value);
    return rendered ? mapSimple(label ? `${label}: ${rendered}` : rendered) : null;
  });
  return rawFact.status === 'historical_reference' ? (note.historical ? note : null) : (note.value !== null ? note : null);
}
function sourceKeysFromFact(fact) {
  const keys = new Set(Array.isArray(fact?.sourceIds) ? fact.sourceIds.filter(id => typeof id === 'string') : []);
  if (fact?.status === 'historical_reference') for (const id of fact.historical?.sourceIds || []) if (typeof id === 'string') keys.add(id);
  return keys;
}
function mapProgramme(raw, identity, sourceMap, issues) {
  if (!isObject(raw) || !SLUG.test(raw.id || '')) {
    pushIssue(issues, 'invalid_programme_identity');
    return null;
  }
  const id = raw.id;
  const facts = {};
  facts.name = normalizeEnvelope(raw.name, id, 'name', sourceMap, issues, mapSimple);
  facts.degree = normalizeEnvelope(raw.degree, id, 'degree', sourceMap, issues, mapDegree);
  facts.field = normalizeEnvelope(raw.field, id, 'field', sourceMap, issues, value => mapSimple(value));
  facts.route = mapRoute(raw.route, id, 'route', sourceMap, issues);
  facts.intake = normalizeEnvelope(raw.intake, id, 'intake', sourceMap, issues, mapIntakeValue);
  facts.teachingLanguage = normalizeEnvelope(raw.teachingLanguage, id, 'teachingLanguage', sourceMap, issues, mapSimple);

  const academicRequirement = unknownRuleEnvelope(raw.academicRequirement, id, 'academicRequirement', sourceMap, issues);
  const languageRequirement = unknownRuleEnvelope(raw.languageRequirement, id, 'languageRequirement', sourceMap, issues);
  const thresholdRaw = raw.languageThreshold;
  const thresholdRule = isObject(thresholdRaw?.value) ? mapRuleNode(thresholdRaw.value, sourceMap) : null;
  let languageThreshold;
  if (thresholdRule) {
    const enabled = thresholdRaw.status === 'current_verified' && thresholdRaw.applicability === 'confirmed'
      && thresholdRaw.scope?.intakeYear === identity.targetIntakeYear;
    languageThreshold = normalizeEnvelope(thresholdRaw, id, 'languageThreshold', sourceMap, issues,
      () => ({ value: gateRule(thresholdRule, enabled) }));
  } else {
    if (thresholdRaw?.value != null) pushIssue(issues, 'unsupported_fact_value', id, 'languageThreshold');
    languageThreshold = unknownFactEnvelope(thresholdRaw, id, 'languageThreshold', sourceMap, issues);
  }
  facts.academicRequirement = academicRequirement;
  facts.languageRequirement = languageRequirement;
  facts.languageThreshold = languageThreshold;
  facts.requirementPolicy = null;
  const historicalCostReferences = mapHistoricalCostAlternatives(raw.tuition, id, sourceMap, issues);
  facts.tuition = hasExplicitTuitionAndFeesAlternatives(raw.tuition)
    ? unknownFactEnvelope(raw.tuition, id, 'tuition', sourceMap, issues)
    : normalizeEnvelope(raw.tuition, id, 'tuition', sourceMap, issues, mapMoney);
  facts.scholarships = normalizeEnvelope(raw.scholarships, id, 'scholarships', sourceMap, issues, mapScholarships);
  facts.deadline = normalizeEnvelope(raw.deadline, id, 'deadline', sourceMap, issues, mapDeadlineValue);
  facts.competitiveness = normalizeEnvelope(raw.competitiveness, id, 'competitiveness', sourceMap, issues, value => {
    if (!isObject(value) || typeof value.basis !== 'string' || !value.basis.trim()) return null;
    const category = value.highlySelective === true ? 'extremely_selective' : value.category;
    if (!['extremely_selective', 'unknown'].includes(category)) return null;
    return { value: { category, basis: value.basis } };
  });

  const output = { id, ...Object.fromEntries(FIELD_NAMES.map(key => [key, facts[key]])), routeSourceKey: raw.routeSourceKey };
  const costReferences = [];
  if (Array.isArray(raw.costReferences)) {
    raw.costReferences.forEach((fact, index) => costReferences.push(normalizeEnvelope(fact, id, `costReferences.${index}`, sourceMap, issues, mapMoney)));
  } else if (raw.costReferences != null) pushIssue(issues, 'invalid_cost_references', id, 'costReferences');
  costReferences.push(...historicalCostReferences);
  if (costReferences.length) output.costReferences = costReferences;

  const notes = [];
  for (const [key, label] of [['academicRequirement', 'Academic requirement'], ['languageRequirement', 'Language requirement']]) {
    const rawRequirement = raw[key];
    const fact = isObject(rawRequirement?.nativeFacts) ? rawRequirement.nativeFacts
      : (isObject(rawRequirement) && rawRequirement.value != null ? rawRequirement : null);
    if (isObject(fact)) {
      const note = makeNote(fact, id, key, sourceMap, issues, label);
      if (note && !notes.some(existing => JSON.stringify(existing) === JSON.stringify(note))) notes.push(note);
    }
  }
  if (isObject(thresholdRaw) && thresholdRaw.value != null && !thresholdRule) {
    const note = makeNote(thresholdRaw, id, 'languageThreshold', sourceMap, issues, 'Language threshold');
    if (note && !notes.some(existing => JSON.stringify(existing) === JSON.stringify(note))) notes.push(note);
  }
  if (isObject(raw.scholarships) && (raw.scholarships.value != null || raw.scholarships.historical?.value != null)) {
    const note = makeNote(raw.scholarships, id, 'scholarships', sourceMap, issues, 'Scholarship conditions');
    if (note && !notes.some(existing => JSON.stringify(existing) === JSON.stringify(note))) notes.push(note);
  }
  for (const [key, label] of [
    ['credential', 'Credential information'],
    ['applicationFee', 'Application fee quote'],
    ['preparatoryAlternatives', 'Preparatory alternative'],
  ]) {
    const rawFact = raw[key];
    if (rawFact == null) continue;
    const note = makeNote(rawFact, id, key, sourceMap, issues, label);
    if (note && !notes.some(existing => JSON.stringify(existing) === JSON.stringify(note))) notes.push(note);
    if (!note && !(key === 'credential' && rawFact?.value?.nativePolicyRef)) {
      pushIssue(issues, `unsupported_${key}_shape`, id, key);
    }
  }
  if (notes.length) output.publicNotes = notes.slice(0, 30);

  if (raw.nativePolicyRef != null || raw.credential?.value?.nativePolicyRef != null) pushIssue(issues, 'unsupported_native_policy_ref', id, 'requirementPolicy');

  if (isObject(raw.campus)) {
    const location = normalizeEnvelope(raw.campus, id, 'location', sourceMap, issues, value => typeof value === 'string' && value.trim()
      ? { value: { country: identity.country, region: identity.surveyRegion, campus: value } } : null);
    output.location = location;
  }
  const discovery = isObject(raw.discovery) ? raw.discovery : {};
  output.discovery = {
    use: ['explore', 'ambitious_only', 'unreviewed'].includes(discovery.use) ? discovery.use : 'unreviewed',
    basis: typeof discovery.basis === 'string' && discovery.basis.trim() ? discovery.basis : 'Discovery policy is unreviewed.',
  };

  const idSources = new Set([...(raw.routeSourceKey ? [raw.routeSourceKey] : [])]);
  for (const fact of [...Object.values(facts), ...costReferences, ...notes, ...(output.location ? [output.location] : [])]) {
    if (!isObject(fact)) continue;
    for (const idKey of fact.sourceIds || []) idSources.add(idKey);
    if (fact.value) collectRuleSources(fact.value, idSources);
    if (fact.historical?.value) collectRuleSources(fact.historical.value, idSources);
  }
  for (const key of idSources) if (!hasKey(sourceMap, key)) pushIssue(issues, 'missing_programme_source', id, key === raw.routeSourceKey ? 'routeSourceKey' : 'sources');
  output.__sourceKeys = [...idSources];
  return output;
}
function sourceFactNamesMissing(facts) {
  const missing = [];
  for (const name of ['name', 'degree', 'field']) {
    const fact = facts[name];
    if (fact.value == null || fact.sourceIds.length === 0) missing.push(name);
  }
  return missing;
}
function mapMedia(media) {
  if (media == null) return null;
  if (!isObject(media)) return null;
  const image = media.image && isObject(media.image) ? {
    url: media.image.url, width: media.image.width, height: media.image.height, sourcePage: media.image.sourcePage,
    title: media.image.title, creator: media.image.creator,
    licence: isObject(media.image.licence) ? { id: media.image.licence.id, url: media.image.licence.url } : null,
    attribution: media.image.attribution, changes: media.image.changes, rightsNotes: media.image.rightsNotes,
    localized: Object.fromEntries(['en', 'ru', 'uz'].map(lang => [lang, { caption: media.image.localized?.[lang]?.caption, scope: media.image.localized?.[lang]?.scope }])),
  } : null;
  return {
    homepage: typeof media.homepage === 'string' ? media.homepage : null,
    programLinks: Array.isArray(media.programLinks) ? media.programLinks.map(link => ({ programId: link.programId, url: link.url })) : [],
    image,
  };
}

/**
 * Map one local DATA-05 institution proposal to an explicit public catalogue row.
 * `researchSources` may be `{sources,targetIntakeYear,checkedAt}` or a source map
 * decorated with those two metadata fields. The function performs no I/O.
 * @param {any} institution
 * @param {any} researchSources
 * @param {{id:string,name:string,country:string,city:string|null,region:string|null,website:string|null,surveyRegion:string}} identity
 * @param {{media?:any}} options
 * @returns {{row:any|null,issues:any[]}}
 */
export function mapData05Institution(institution, researchSources, identity, { media = null } = {}) {
  const issues = [];
  if (!isObject(institution) || !Array.isArray(institution.programmes) || !isObject(identity)) {
    return { row: null, issues: [{ code: 'invalid_mapper_input' }] };
  }
  const sourceDict = sourceDictionary(researchSources);
  const targetIntakeYear = institution.targetIntakeYear ?? researchSources?.targetIntakeYear;
  const checkedAt = institution.checkedAt ?? researchSources?.checkedAt;
  if (!Number.isInteger(targetIntakeYear)) pushIssue(issues, 'missing_target_intake_year');
  if (typeof checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) pushIssue(issues, 'missing_review_date');
  if (!UUID.test(identity.id || '') || !SLUG.test(institution.institutionId || '') || !identity.name || !identity.country
    || !['Europe', 'USA', 'South Korea', 'UK', 'Canada'].includes(identity.surveyRegion)
    || !(identity.city === null || typeof identity.city === 'string') || !(identity.region === null || typeof identity.region === 'string')
    || !(identity.website === null || typeof identity.website === 'string')) {
    pushIssue(issues, 'invalid_canonical_identity');
    return { row: null, issues };
  }
  if (!Number.isInteger(targetIntakeYear) || typeof checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) return { row: null, issues };
  const identityForMapping = { ...identity, targetIntakeYear };

  // The catalog requires a timestamp while the research package records only a day.
  // Normalize that known precision explicitly to the start of that UTC date.
  const reviewedAt = typeof institution.reviewedAt === 'string' ? institution.reviewedAt : `${checkedAt}T00:00:00Z`;
  if (!institution.reviewedAt) pushIssue(issues, 'review_date_normalized_to_utc_day');
  const stagedProgrammes = [];
  for (const raw of institution.programmes) {
    const programme = mapProgramme(raw, identityForMapping, sourceDict, issues);
    if (!programme) continue;
    const missingIdentity = sourceFactNamesMissing(programme);
    if (missingIdentity.length || typeof programme.routeSourceKey !== 'string' || !hasKey(sourceDict, programme.routeSourceKey)) {
      pushIssue(issues, 'programme_identity_or_route_source_missing', programme.id, missingIdentity.join(',') || 'routeSourceKey');
      continue;
    }
    delete programme.__sourceKeys;
    stagedProgrammes.push(programme);
  }
  const sourceKeys = new Set();
  for (const programme of stagedProgrammes) {
    sourceKeys.add(programme.routeSourceKey);
    for (const fact of [...FIELD_NAMES.map(key => programme[key]), ...(programme.costReferences || []), ...(programme.publicNotes || []), ...(programme.location ? [programme.location] : [])]) {
      if (!isObject(fact)) continue;
      for (const key of fact.sourceIds || []) sourceKeys.add(key);
      if (fact.value) collectRuleSources(fact.value, sourceKeys);
      if (fact.historical?.value) collectRuleSources(fact.historical.value, sourceKeys);
    }
  }
  const normalizedSources = normalizeSources(sourceDict, [...sourceKeys], issues);
  const absent = [...sourceKeys].filter(key => !normalizedSources.has(key));
  if (absent.length) return { row: null, issues };

  const catalog = {
    schemaVersion: 1,
    institutionId: institution.institutionId,
    revision: '',
    state: 'published',
    targetIntakeYear,
    reviewedAt,
    surveyRegion: identity.surveyRegion,
    legacyFavoriteKeys: Array.isArray(identity.legacyFavoriteKeys) ? identity.legacyFavoriteKeys.filter(key => UUID.test(key)) : [],
    programmes: stagedProgrammes,
    sources: Object.fromEntries([...normalizedSources.entries()].sort(([a], [b]) => a.localeCompare(b))),
    media: mapMedia(media),
  };
  catalog.revision = createHash('sha256').update(stableStringify({ ...catalog, revision: undefined })).digest('hex');
  const row = {
    id: identity.id,
    name: identity.name,
    country: identity.country,
    city: identity.city,
    region: identity.region,
    website: identity.website,
    catalog,
  };
  return { row, issues };
}
