const FIELDS = new Set(['business', 'it', 'computer_engineering', 'software_engineering', 'computer_science']);
const REGIONS = new Set(['UK', 'USA', 'Europe', 'South Korea', 'Canada']);

/** Preserve unsupported or unsourced comparisons as unknown. */
function sourcedRule(rule, sources) {
  if (!rule || typeof rule !== 'object') return { type: 'unknown', verified: false, applicable: false };
  const copy = { ...rule };
  if (Array.isArray(rule.children)) copy.children = rule.children.map(child => sourcedRule(child, sources));
  if (['grade', 'ielts'].includes(rule.type) && !sources.has(rule.sourceKey)) {
    copy.verified = false; copy.applicable = false;
  }
  return copy;
}

/**
 * Project DATA-03 into the app without changing research-owned facts/policies.
 * Numeric rules are copied only with their provenance. Native policies remain
 * attached and are interpreted conservatively for the supplied credential.
 * @param {any} data
 */
export function adaptResearchPackage(data) {
  const issues = [];
  const options = [];
  if (!data || !Array.isArray(data.programmes) || !data.sources || !data.requirementPolicies) {
    return { options, issues: ['invalid_package'], version: 'unavailable' };
  }
  for (const row of data.programmes) {
    const policy = data.requirementPolicies[row.requirementPolicyId];
    if (!row.id || !row.institutionId || !FIELDS.has(row.field) || !REGIONS.has(row.region)
      || row.evidence?.identity?.status !== 'verified' || !policy) {
      issues.push(`incomplete_identity_or_policy:${row.id}`); continue;
    }
    const sourceKeys = new Set();
    const collect = value => {
      if (!value || typeof value !== 'object') return;
      if (typeof value.sourceKey === 'string') sourceKeys.add(value.sourceKey);
      if (typeof value.source === 'string') sourceKeys.add(value.source);
      for (const key of value.sourceKeys || []) sourceKeys.add(key);
      for (const [key, child] of Object.entries(value)) if (!['sourceKey', 'sourceKeys', 'source'].includes(key)) collect(child);
    };
    collect(row); collect(policy); sourceKeys.add(row.routeSourceKey);
    const sources = [...sourceKeys].map(key => data.sources[key]).filter(source => source
      && typeof source.url === 'string' && source.url.startsWith('https://')
      && source.scope && source.checkedAt && source.title);
    const available = new Set(sources.map(source => source.key));
    if (!available.has(row.routeSourceKey) || row.evidence.identity.sourceKeys.some(key => !available.has(key))) {
      issues.push(`missing_source:${row.id}`); continue;
    }
    const highlySelective = row.competitiveness?.category === 'extremely_selective'
      && row.competitiveness.basis && row.competitiveness.sourceKeys?.some(key => available.has(key));
    const curated = row.discovery?.use === 'conditional_exploration_only';
    const discoveryPolicy = highlySelective || row.discovery?.use === 'ambitious_only' ? 'ambitious_only' : curated ? 'explore' : 'unreviewed';
    options.push({
      ...row, sources,
      fields: [row.field],
      discoveryPolicy,
      discoveryBasis: row.discovery?.basis || (curated ? data.discoveryPolicy?.incompleteProfile : null),
      competitiveness: { ...row.competitiveness, category: highlySelective ? 'extremely_selective' : 'unknown' },
      fieldVerified: row.evidence.field?.status === 'verified',
      languageVerified: row.evidence.language?.status === 'verified',
      languageThreshold: sourcedRule(row.languageThreshold, available),
      academicRequirement: sourcedRule(row.academicRequirement, available),
      languageRequirement: sourcedRule(row.languageRequirement, available),
      requirementPolicy: policy,
      // Current DATA-03 does not establish personalised current-year fees.
      tuition: row.tuition ? { ...row.tuition, comparisonVerified: row.tuition.comparisonVerified === true
        && row.evidence.tuition?.status === 'verified' && row.tuition.periodStatus !== 'inferred_from_annual_course_fee_context' } : null,
      eligibilityComplete: false,
    });
  }
  return { options, issues, version: `${data.task}:${data.schemaVersion}:${data.checkedAt}` };
}
