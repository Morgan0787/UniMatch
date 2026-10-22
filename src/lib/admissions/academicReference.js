const SCALES = new Set(['4', '5', '100']);

/** @param {unknown} value */
function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
/** @param {unknown} value */
function normalizedText(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}
/** @param {unknown} value */
function number(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Pull independently comparable grade thresholds from published academic facts.
 * `all` nodes are mandatory, so a supported grade remains useful beside an
 * unknown sibling. An `any` is comparable only when it is a complete set of
 * native-scale representations of the same threshold and scope.
 * @param {any} fact
 * @param {Record<string, any>} sources
 * @param {number} targetIntakeYear
 */
export function publishedAcademicReference(fact, sources, targetIntakeYear) {
  if (!object(fact) || !object(sources) || !object(fact.scope)
    || !['current_verified', 'published_unconfirmed', 'historical_reference'].includes(fact.status)
    || fact.applicability === 'not_applicable') return null;

  const historical = fact.status === 'historical_reference';
  const value = historical ? fact.historical?.value : fact.value;
  const sourceIds = historical ? fact.historical?.sourceIds : fact.sourceIds;
  const season = historical ? fact.historical?.referenceSeason : fact.season;
  if (!Array.isArray(sourceIds) || sourceIds.length === 0
    || !sourceIds.every(id => typeof id === 'string' && Object.hasOwn(sources, id)
      && object(sources[id]) && sources[id].key === id)
    || !object(value) || !scopeAllowed(fact.scope)
    || (fact.scope.intakeYear != null && !historical && fact.scope.intakeYear !== targetIntakeYear)) return null;

  const allowedSources = new Set(sourceIds);
  /** @param {any} node */
  const validGrade = node => object(node) && node.type === 'grade'
    && typeof node.sourceKey === 'string' && allowedSources.has(node.sourceKey)
    && Object.hasOwn(sources, node.sourceKey)
    && SCALES.has(node.scale) && typeof node.minimum === 'number'
    && Number.isFinite(node.minimum) && node.minimum >= 0 && node.minimum <= Number(node.scale)
    && (node.scope === undefined || object(node.scope));

  /** @param {any} node @param {any[]} out @param {any} inheritedScope */
  const extract = (node, out, inheritedScope = fact.scope) => {
    if (!object(node)) return;
    const nodeScope = node.scope == null ? {} : node.scope;
    if (!object(nodeScope)) return;
    const scopeAtNode = mergeScope(inheritedScope, nodeScope);
    if (!scopeAtNode || !scopeAllowed(scopeAtNode)
      || (!historical && scopeAtNode.intakeYear != null && scopeAtNode.intakeYear !== targetIntakeYear)) return;
    if (validGrade(node)) {
      out.push({ minimum: node.minimum, scale: node.scale, sourceKey: node.sourceKey, scope: scopeAtNode });
      return;
    }
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    if (node.type === 'all') {
      for (const child of node.children) extract(child, out, scopeAtNode);
      return;
    }
    if (node.type !== 'any' || node.complete !== true || !node.children.every(validGrade)) return;
    const alternatives = node.children.map(child => ({
      child,
      scope: child.scope == null || object(child.scope) ? mergeScope(scopeAtNode, child.scope || {}) : null,
    }));
    if (alternatives.some(item => !item.scope || !scopeAllowed(item.scope)
      || (!historical && item.scope.intakeYear != null && item.scope.intakeYear !== targetIntakeYear))) return;
    const first = alternatives[0];
    const sourceKey = first.child.sourceKey;
    const scaleSet = new Set();
    for (const { child, scope } of alternatives) {
      if (child.sourceKey !== sourceKey || !sameComparisonScope(first.scope, scope) || scaleSet.has(child.scale)) return;
      scaleSet.add(child.scale);
    }
    for (const { child, scope } of alternatives) out.push({ minimum: child.minimum, scale: child.scale, sourceKey, scope });
  };

  const conditions = [];
  extract(value, conditions);
  if (!conditions.length) return null;
  return { status: fact.status, season: typeof season === 'string' ? season : null, conditions };
}

/**
 * Compare only on the exact submitted native scale. Scoped references require
 * explicit matching country and credential; no score conversion is attempted.
 * @param {any} reference
 * @param {Record<string, any>} answers
 */
export function comparePublishedAcademic(reference, answers) {
  if (!object(reference) || !Array.isArray(reference.conditions) || !object(answers)) return [];
  const grade = number(answers.grade);
  if (grade === null || !SCALES.has(answers.scale) || grade < 0 || grade > Number(answers.scale)) return [];
  const intakeYear = number(answers.startYear);
  const comparisons = [];
  for (const condition of reference.conditions) {
    if (!object(condition) || !SCALES.has(condition.scale) || condition.scale !== answers.scale
      || !Number.isFinite(condition.minimum) || condition.minimum < 0 || condition.minimum > Number(condition.scale)
      || !object(condition.scope) || !scopeAllowed(condition.scope)) continue;
    let matches = true;
    for (const key of ['schoolCountry', 'credential']) {
      if (condition.scope[key] != null && normalizedText(condition.scope[key]) !== normalizedText(answers[key])) matches = false;
    }
    if (reference.status !== 'historical_reference' && condition.scope.intakeYear != null
      && (intakeYear === null || intakeYear !== condition.scope.intakeYear)) matches = false;
    if (!matches) continue;
    comparisons.push({
      below: grade < condition.minimum,
      sourceKey: condition.sourceKey,
      status: reference.status,
      minimum: condition.minimum,
      scale: condition.scale,
      season: reference.season,
    });
  }
  return comparisons;
}

/** @param {any} scope */
function scopeAllowed(scope) {
  return object(scope)
    && (scope.route == null || scope.route === 'direct')
    && (scope.studentCategory == null || scope.studentCategory === 'international_freshman')
    && (scope.programmeId == null || (typeof scope.programmeId === 'string' && scope.programmeId.trim() !== ''))
    && (scope.intakeYear == null || Number.isInteger(scope.intakeYear))
    && ['schoolCountry', 'credential'].every(key => scope[key] == null
      || (typeof scope[key] === 'string' && scope[key].trim() !== ''));
}

/** @param {any} factScope @param {any} nodeScope */
function mergeScope(factScope, nodeScope) {
  const result = { ...factScope };
  for (const [key, value] of Object.entries(nodeScope)) {
    if (value == null) continue;
    if (result[key] != null && result[key] !== value) return null;
    result[key] = value;
  }
  return result;
}

/** @param {any} left @param {any} right */
function sameComparisonScope(left, right) {
  return ['schoolCountry', 'credential', 'intakeYear', 'route', 'studentCategory', 'programmeId']
    .every(key => (left[key] ?? null) === (right[key] ?? null));
}
