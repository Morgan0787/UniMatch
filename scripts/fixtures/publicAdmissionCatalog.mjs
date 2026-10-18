export const publicCatalogSource = {
  key: 'official_main-2027', url: 'https://example.edu/admissions', title: 'Official admissions',
  checkedAt: '2026-10-01', scope: 'programme admissions',
};
export const publicCatalogScope = {
  programmeId: 'cs-bsc', route: 'direct', studentCategory: null, schoolCountry: null,
  credential: null, intakeYear: 2027,
};

/** @param {any} value @param {string} [status] @param {Record<string, any>} [extra] */
export function publicCatalogFact(value, status = 'current_verified', extra = {}) {
  return {
    value, status, sourceIds: value === null ? [] : [publicCatalogSource.key], scope: { ...publicCatalogScope },
    season: '2027', applicability: 'confirmed', historical: null, noticeCode: null, ...extra,
  };
}

/** @param {{id?: string, slug?: string, alias?: string, programmeId?: string, targetIntakeYear?: number, country?: string, surveyRegion?: string, degreeValue?: any, tuitionValue?: any, deadlineValue?: any, costReferences?: any[], rule?: any, languageFact?: any, policyFact?: any}} [options] */
export function publicAdmissionCatalogRow({
  id = '00000000-0000-4000-8000-000000000001', slug = 'sample-university',
  alias = '10000000-0000-4000-8000-000000000001', programmeId = 'cs-bsc', targetIntakeYear = 2027,
  country = 'Exampleland', surveyRegion = 'Europe', degreeValue = 'Bachelor', tuitionValue,
  deadlineValue = { date: '2027-05-01', timezone: 'Europe/London' }, costReferences,
  rule, languageFact, policyFact = null,
} = {}) {
  const fact = publicCatalogFact;
  const row = {
    id, name: 'Sample University', country, city: 'Capital', region: 'Europe', website: 'https://example.edu',
    catalog: {
      schemaVersion: 1, institutionId: slug, revision: 'a'.repeat(64), state: 'published', targetIntakeYear,
      reviewedAt: '2026-10-01T10:00:00Z', surveyRegion, legacyFavoriteKeys: [alias],
      sources: { [publicCatalogSource.key]: publicCatalogSource }, media: null,
      programmes: [{
        id: programmeId, name: fact('BSc Computer Science'), degree: fact(degreeValue), field: fact('computer_science'),
        route: fact({ entryPath: 'direct', text: 'Direct entry' }), intake: fact({ year: 2027, text: 'Autumn 2027' }),
        teachingLanguage: fact('English'), academicRequirement: fact(rule ?? {
          type: 'grade', minimum: 3, scale: '4', sourceKey: publicCatalogSource.key,
          scope: { schoolCountry: 'Uzbekistan', credential: 'academic_lyceum_diploma', intakeYear: 2027 },
        }),
        languageRequirement: fact({ type: 'unknown', sourceKey: publicCatalogSource.key }),
        languageThreshold: languageFact ?? fact(null), requirementPolicy: policyFact,
        tuition: fact(tuitionValue ?? { amount: 12000, currency: 'EUR', period: 'year', feeYear: '2027', includedFees: [], excludedFees: [] }),
        scholarships: fact(null), deadline: fact(deadlineValue), competitiveness: fact({ category: 'unknown', basis: 'No evidence' }),
        discovery: { use: 'explore', basis: 'Reviewed for exploration' }, routeSourceKey: publicCatalogSource.key,
        ...(costReferences === undefined ? {} : { costReferences }),
      }],
    },
  };
  for (const value of Object.values(row.catalog.programmes[0])) {
    if (value && typeof value === 'object' && value.scope?.programmeId) value.scope.programmeId = programmeId;
  }
  return row;
}
