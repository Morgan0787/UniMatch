/** Canonical labels only; no fuzzy qualification recognition or grade conversion. */
function canonicalCredential(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[’‘]/g, "'");
  const aliases = {
    'certificate of complete general secondary education': 'certificate_complete_general_secondary',
    'academic lyceum diploma': 'academic_lyceum_diploma',
    'professional college diploma': 'professional_college_diploma',
  };
  return aliases[text] || text.replace(/\s+/g, '_');
}

/**
 * Native routes include subject tests, university-assessed equivalences and
 * qualification categories absent from the short survey. Keep those unknown.
 * Known grade shortfalls remain visible inside incomplete AND/OR rules.
 * @param {any} option @param {Record<string, any>} answers
 */
export function academicContext(option, answers) {
  const policy = option.requirementPolicy;
  if (!policy) return { rule: option.academicRequirement, answers, blockedByCredential: false };
  const credential = canonicalCredential(answers.credential);
  const normalized = { ...answers, credential };
  const routes = Array.isArray(policy.routes) ? policy.routes : [];
  const countrySpecific = /Uzbekistan/i.test(policy.applicantCategory || '');
  const countryKnown = String(answers.schoolCountry || '').trim().toLowerCase() === 'uzbekistan';
  const scopeUnknown = countrySpecific && !countryKnown;
  const matching = routes.filter(route => !route.credentials || route.credentials.includes(credential));
  const direct = matching.filter(route => route.path === 'direct');
  const blockedByCredential = countryKnown && credential !== '' && direct.length === 0
    && matching.some(route => route.path === 'foundation' && route.credentials?.includes(credential));
  const unknown = sourceKey => ({ type: 'unknown', verified: false, applicable: false, sourceKey });
  if (scopeUnknown || (countrySpecific && !direct.length)) return { rule: unknown(option.routeSourceKey), answers: normalized, blockedByCredential };
  // A normalized country/credential rule is more precise than the native
  // route's general label. Do not discard its applicability gates.
  const hasCredentialScope = rule => rule && (rule.scope?.credential || rule.children?.some(hasCredentialScope));
  if (hasCredentialScope(option.academicRequirement)) {
    return { rule: option.academicRequirement, answers: normalized, blockedByCredential };
  }

  const compile = (native, sourceKey) => {
    if (!native || typeof native !== 'object') return unknown(sourceKey);
    const rules = native.rules || native.alternatives;
    if (['all', 'any'].includes(native.operator) && Array.isArray(rules)) {
      return { type: native.operator, children: rules.map(child => compile(child, sourceKey)), complete: true, verified: true, applicable: true, sourceKey };
    }
    const scale = native.scaleMaximum;
    if (['GPA', 'country_average', 'percent', 'published_gpa'].includes(native.kind)
      && ['4', '5', '100'].includes(String(scale)) && Number.isFinite(native.minimum)) {
      const grade = { type: 'grade', minimum: native.minimum, scale: String(scale), verified: true, applicable: true, sourceKey };
      // A country minimum is not all programme/subject conditions.
      return native.additional?.length ? { type: 'all', complete: false, verified: true, applicable: true, children: [grade, unknown(sourceKey)], sourceKey } : grade;
    }
    return unknown(sourceKey);
  };
  const verifiedDirect = direct.filter(route => route.evidence?.status === 'verified');
  if (!verifiedDirect.length) return { rule: option.academicRequirement, answers: normalized, blockedByCredential };
  const routeRules = verifiedDirect.map(route => compile(route.academic, route.evidence.sourceKeys?.[0] || option.routeSourceKey));
  const routeRule = routeRules.length === 1 ? routeRules[0] : { type: 'any', complete: true, verified: true, applicable: true, children: routeRules };
  return {
    rule: { type: 'all', complete: false, verified: true, applicable: true, children: [routeRule, unknown(option.routeSourceKey)], sourceKey: option.routeSourceKey },
    answers: normalized, blockedByCredential,
  };
}
